/**
 * Server-side Security Guards
 * 
 * Centralized authentication and authorization helpers for API routes and server actions.
 * 
 * SECURITY:
 * - All tenant data access MUST use these guards
 * - Never accept tenant_id from client without verification
 * - Always derive tenant from authenticated session
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient, requireUser, getCurrentUser } from './server';
import { requireActiveTenant, getActiveTenantId } from './tenant';
import { assertFeature, assertPlan, handlePlanError, PlanUpgradeRequiredError } from '@/lib/auth/plan';
import type { User } from '@supabase/supabase-js';
import type { TenantWithRole } from './types';
import type { PlanId, FeatureId } from '@/lib/plans';

/**
 * Authentication/Authorization context returned by guards
 */
export interface AuthContext {
    user: User;
    tenant: TenantWithRole;
    tenantId: string;
    role: string;
    isOwner: boolean;
    isAdmin: boolean; // owner or advisor
}

/**
 * Guard options
 */
export interface GuardOptions {
    /** Require specific role(s) */
    requireRole?: 'owner' | 'admin' | ('owner' | 'advisor' | 'staff')[];
    /** Require minimum plan */
    requirePlan?: PlanId;
    /** Require specific feature */
    requireFeature?: FeatureId;
}

/**
 * Standard API error response
 */
export interface ApiError {
    error: string;
    code?: string;
    details?: Record<string, unknown>;
}

function isPermissionError(error: unknown): boolean {
    const err = error as { code?: string; message?: string };
    const code = err?.code;
    const message = err?.message || '';

    if (code === '42501' || code === 'PGRST301') return true;
    if (message.toLowerCase().includes('row-level security')) return true;
    if (message.toLowerCase().includes('permission denied')) return true;
    return false;
}

/**
 * Create a standardized error response
 */
export function apiError(message: string, status: number, code?: string, details?: Record<string, unknown>): NextResponse<ApiError> {
    return NextResponse.json(
        {
            error: message,
            ...(code && { code }),
            ...(details && { details }),
        },
        { status }
    );
}

/**
 * Standard error responses
 */
export const errors = {
    unauthorized: () => apiError('Authentication required', 401, 'UNAUTHORIZED'),
    forbidden: (message = 'Access denied') => apiError(message, 403, 'FORBIDDEN'),
    notFound: (entity = 'Resource') => apiError(`${entity} not found`, 404, 'NOT_FOUND'),
    badRequest: (message: string) => apiError(message, 400, 'BAD_REQUEST'),
    internal: (message = 'Internal server error') => apiError(message, 500, 'INTERNAL_ERROR'),
    planRequired: (error: PlanUpgradeRequiredError) => 
        NextResponse.json(error.toJSON(), { status: 403 }),
};

/**
 * MAIN GUARD: Require authenticated user with active tenant membership
 * 
 * This is the primary security gate for all tenant-scoped operations.
 * 
 * @example
 * // In API route:
 * export async function GET() {
 *     const auth = await requireAuth();
 *     if (auth instanceof NextResponse) return auth; // Error response
 *     const { tenantId, user } = auth;
 *     // ... proceed with tenantId
 * }
 * 
 * @example
 * // With role requirement:
 * const auth = await requireAuth({ requireRole: 'admin' });
 * 
 * @example
 * // With plan requirement:
 * const auth = await requireAuth({ requirePlan: 'pro' });
 */
export async function requireAuth(options?: GuardOptions): Promise<AuthContext | NextResponse<ApiError>> {
    try {
        // 1. Require authenticated user
        const user = await requireUser();

        // 2. Require active tenant (validates membership)
        const tenant = await requireActiveTenant();

        // 3. Build context
        const ctx: AuthContext = {
            user,
            tenant,
            tenantId: tenant.id,
            role: tenant.role,
            isOwner: tenant.role === 'owner',
            isAdmin: tenant.role === 'owner' || tenant.role === 'advisor',
        };

        // 4. Check role requirement
        if (options?.requireRole) {
            const requiredRoles = Array.isArray(options.requireRole) 
                ? options.requireRole 
                : options.requireRole === 'admin' 
                    ? ['owner', 'advisor'] 
                    : [options.requireRole];

            if (!requiredRoles.includes(tenant.role as 'owner' | 'advisor' | 'staff')) {
                return errors.forbidden(`This action requires ${options.requireRole} role`);
            }
        }

        // 5. Check plan requirement
        if (options?.requirePlan) {
            await assertPlan(tenant.id, options.requirePlan);
        }

        // 6. Check feature requirement
        if (options?.requireFeature) {
            await assertFeature(tenant.id, options.requireFeature);
        }

        return ctx;

    } catch (error) {
        // Handle specific error types
        if (error instanceof Error) {
            if (error.message === 'Authentication required') {
                return errors.unauthorized();
            }
            if (error.message.includes('No tenant found')) {
                return apiError('No tenant found. Please complete onboarding.', 404, 'NO_TENANT');
            }
            if (error.message === 'Not a member of this tenant') {
                return errors.forbidden('Not a member of this tenant');
            }
        }

        // Handle plan errors
        const planError = handlePlanError(error);
        if (planError) {
            return NextResponse.json<ApiError>(planError.body, { status: planError.status });
        }

        // Re-throw unknown errors
        throw error;
    }
}

/**
 * Soft auth check - returns null if not authenticated (doesn't error)
 * Useful for optional auth scenarios
 */
export async function getAuth(): Promise<AuthContext | null> {
    try {
        const user = await getCurrentUser();
        if (!user) return null;

        const tenantId = await getActiveTenantId();
        if (!tenantId) return null;

        // Get tenant with role
        const supabase = await createServerSupabaseClient();
        const { data: membership } = await supabase
            .from('tenant_members')
            .select('role, tenants(*)')
            .eq('user_id', user.id)
            .eq('tenant_id', tenantId)
            .single();

        if (!membership) return null;

        const tenant = membership.tenants as unknown as TenantWithRole;
        const role = membership.role;

        return {
            user,
            tenant: { ...tenant, role },
            tenantId,
            role,
            isOwner: role === 'owner',
            isAdmin: role === 'owner' || role === 'advisor',
        };
    } catch {
        return null;
    }
}

/**
 * Verify ownership of a specific entity
 * 
 * @example
 * const isOwner = await verifyEntityOwnership('documents', documentId, tenantId);
 */
export async function verifyEntityOwnership(
    table: 'documents' | 'tasks' | 'exports' | 'document_links',
    entityId: string,
    tenantId: string
): Promise<boolean> {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
        .from(table)
        .select('id')
        .eq('id', entityId)
        .eq('tenant_id', tenantId)
        .single();

    return !error && !!data;
}

/**
 * Handle common errors in API routes with consistent responses
 * 
 * @example
 * export async function GET() {
 *     try {
 *         // ... code
 *     } catch (error) {
 *         return handleApiError(error);
 *     }
 * }
 */
export function handleApiError(error: unknown): NextResponse<ApiError> {
    console.error('API Error:', error);

    // Handle authentication errors
    if (error instanceof Error) {
        if (error.message === 'Authentication required') {
            return errors.unauthorized();
        }
        if (error.message.includes('No tenant found')) {
            return apiError('No tenant found', 404, 'NO_TENANT');
        }
    }

    // Handle plan errors
    const planError = handlePlanError(error);
    if (planError) {
        return NextResponse.json(planError.body, { status: planError.status });
    }

    // Handle permission errors (RLS or insufficient privilege)
    if (isPermissionError(error)) {
        return errors.forbidden();
    }

    // Generic error
    return errors.internal();
}

/**
 * Type guard to check if result is an error response
 */
export function isErrorResponse(result: unknown): result is NextResponse<ApiError> {
    return result instanceof NextResponse;
}

