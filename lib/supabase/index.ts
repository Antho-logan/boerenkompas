/**
 * Supabase Index
 * Re-exports all Supabase utilities
 */

export { createClient } from './client';
export { createServerSupabaseClient, getCurrentUser, requireUser } from './server';
export {
    getActiveTenantId,
    setActiveTenantId,
    getUserTenants,
    getActiveTenant,
    requireActiveTenant,
    createTenantWithOwner,
    getCurrentUserInfo,
} from './tenant';
export {
    requireAuth,
    getAuth,
    handleApiError,
    verifyEntityOwnership,
    apiError,
    errors,
    isErrorResponse,
} from './guards';
export type { AuthContext, GuardOptions, ApiError } from './guards';
export * from './types';
