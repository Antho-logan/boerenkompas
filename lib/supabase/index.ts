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
export * from './types';
