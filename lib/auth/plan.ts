/**
 * Server-side Plan Enforcement
 * 
 * SECURITY: This module provides server-side plan checks.
 * UI preview mode (via PlanPreviewSwitcher) does NOT affect these checks.
 * All premium features must call assertPlan() or assertFeature() to enforce entitlements.
 */

import { PlanId, PLAN_ORDER, hasFeature, FeatureId } from '@/lib/plans';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * Error thrown when a plan upgrade is required
 * Consistent error format for API responses
 */
export class PlanUpgradeRequiredError extends Error {
    readonly status = 403;
    readonly code = 'PLAN_UPGRADE_REQUIRED';
    readonly currentPlan: PlanId;
    readonly requiredPlan: PlanId;
    readonly feature?: FeatureId;

    constructor(currentPlan: PlanId, requiredPlan: PlanId, feature?: FeatureId) {
        const featureMsg = feature ? ` for "${feature}"` : '';
        super(`Upgrade required${featureMsg}: This feature requires a ${requiredPlan} plan or higher. Your current plan is ${currentPlan}.`);
        this.name = 'PlanUpgradeRequiredError';
        this.currentPlan = currentPlan;
        this.requiredPlan = requiredPlan;
        this.feature = feature;
    }

    toJSON() {
        return {
            error: this.message,
            code: this.code,
            currentPlan: this.currentPlan,
            requiredPlan: this.requiredPlan,
            feature: this.feature,
        };
    }
}

/**
 * Get the current plan for a tenant from the database
 * Returns 'starter' as fallback
 * 
 * NOTE: This reads the REAL plan from DB, not affected by UI preview mode
 */
export async function getTenantPlan(tenantId: string): Promise<PlanId> {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
        .from('tenants')
        .select('plan')
        .eq('id', tenantId)
        .single();

    if (error || !data) {
        console.warn(`Could not fetch plan for tenant ${tenantId}, falling back to starter`, error);
        return 'starter';
    }

    // Validate that the plan is a known PlanId
    const plan = data.plan as string;
    if (PLAN_ORDER.includes(plan as PlanId)) {
        return plan as PlanId;
    }

    console.warn(`Unknown plan "${plan}" for tenant ${tenantId}, falling back to starter`);
    return 'starter';
}

/**
 * Check if a plan meets the minimum required plan
 * Uses PLAN_ORDER from lib/plans.ts for consistent ordering
 */
export function isPlanSufficient(currentPlan: PlanId, minPlan: PlanId): boolean {
    return PLAN_ORDER.indexOf(currentPlan) >= PLAN_ORDER.indexOf(minPlan);
}

/**
 * Asserts that a tenant has at least the required plan
 * Throws PlanUpgradeRequiredError if the plan is insufficient
 * 
 * @throws PlanUpgradeRequiredError if plan is insufficient
 */
export async function assertPlan(tenantId: string, minPlan: PlanId): Promise<void> {
    const currentPlan = await getTenantPlan(tenantId);

    if (!isPlanSufficient(currentPlan, minPlan)) {
        throw new PlanUpgradeRequiredError(currentPlan, minPlan);
    }
}

/**
 * Asserts that a tenant has access to a specific feature
 * Throws PlanUpgradeRequiredError if the feature is not available
 * 
 * @throws PlanUpgradeRequiredError if feature is not available
 */
export async function assertFeature(tenantId: string, feature: FeatureId): Promise<void> {
    const currentPlan = await getTenantPlan(tenantId);
    const featureValue = hasFeature(currentPlan, feature);

    if (!featureValue) {
        // Find the minimum plan that has this feature
        const minPlan = PLAN_ORDER.find(plan => hasFeature(plan, feature)) || 'enterprise';
        throw new PlanUpgradeRequiredError(currentPlan, minPlan as PlanId, feature);
    }
}

/**
 * Check if a thrown error is a PlanUpgradeRequiredError
 */
type PlanError = PlanUpgradeRequiredError | (Error & { code?: string });

export function isPlanError(error: unknown): error is PlanError {
    return error instanceof PlanUpgradeRequiredError ||
        (error instanceof Error && (error as { code?: string }).code === 'PLAN_UPGRADE_REQUIRED');
}

/**
 * Helper to handle plan errors in API routes
 * Returns a consistent error response format
 */
type PlanErrorBody = {
    error: string;
    code?: string;
    currentPlan?: PlanId;
    requiredPlan?: PlanId;
    feature?: FeatureId;
};

export function handlePlanError(error: unknown): { status: number; body: PlanErrorBody } | null {
    if (isPlanError(error)) {
        return {
            status: 403,
            body: error instanceof PlanUpgradeRequiredError
                ? error.toJSON()
                : {
                    error: error.message,
                    code: 'PLAN_UPGRADE_REQUIRED',
                }
        };
    }
    return null;
}
