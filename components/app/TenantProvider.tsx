"use client";

/**
 * TenantProvider - Client-side tenant context
 * 
 * SECURITY: Active tenant is now SERVER-AUTHORITATIVE.
 * - NO client-side cookie writes
 * - Tenant switching calls POST /api/tenant/active (server validates membership)
 * - Active tenant is read from server on initial load
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { PlanId } from '@/lib/plans';
import { getPlanPreview, setPlanPreview as savePlanPreview, clearPlanPreview as removePlanPreview } from '@/lib/plan-preview';

// Legacy type compatibility
export type Role = 'owner' | 'advisor' | 'staff' | 'viewer';

export interface Tenant {
    id: string;
    name: string;
    plan: PlanId;
    logoUrl?: string;
    kvk?: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
}

interface TenantContextType {
    tenant: Tenant | null;
    effectivePlan: PlanId;
    tenants: Tenant[];
    user: User | null;
    role: Role;
    isLoading: boolean;
    switchTenant: (tenantId: string) => Promise<void>;
    refreshTenants: () => Promise<void>;
    setPreviewPlan: (plan: PlanId) => void;
    clearPreviewPlan: () => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [activeTenantId, setActiveTenantId] = useState<string | null>(null);
    const [tenantRoles, setTenantRoles] = useState<Record<string, Role>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [previewPlan, setPreviewPlanState] = useState<PlanId | null>(null);

    const supabase = createClient();

    // Load preview plan on mount
    useEffect(() => {
        const saved = getPlanPreview();
        if (saved) setPreviewPlanState(saved);
    }, []);

    const setPreviewPlan = (plan: PlanId) => {
        savePlanPreview(plan);
        setPreviewPlanState(plan);
    };

    const clearPreviewPlan = () => {
        removePlanPreview();
        setPreviewPlanState(null);
    };

    const loadTenants = useCallback(async () => {
        // Skip if Supabase not configured
        if (!isSupabaseConfigured()) {
            setIsLoading(false);
            return;
        }

        try {
            // Get current user
            const { data: { user: authUser } } = await supabase.auth.getUser();

            if (!authUser) {
                setUser(null);
                setTenants([]);
                setActiveTenantId(null);
                setIsLoading(false);
                return;
            }

            // Set user
            setUser({
                id: authUser.id,
                email: authUser.email || '',
                name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Gebruiker',
                avatarUrl: authUser.user_metadata?.avatar_url,
            });

            // Get tenants user is member of (including plan from DB if column exists)
            // First try with plan column, fall back without if migration not run
            let memberships: { role: string; tenants: unknown }[] | null = null;
            let fetchError = null;

            // Try with plan column first
            const result = await supabase
                .from('tenant_members')
                .select(`
          role,
          tenants (
            id,
            name,
            plan,
            created_at
          )
        `)
                .eq('user_id', authUser.id);

            if (result.error) {
                // If error (likely missing plan column), try without plan
                console.warn('Plan column not found, falling back:', result.error.message);
                const fallback = await supabase
                    .from('tenant_members')
                    .select(`
              role,
              tenants (
                id,
                name,
                created_at
              )
            `)
                    .eq('user_id', authUser.id);

                memberships = fallback.data;
                fetchError = fallback.error;
            } else {
                memberships = result.data;
            }

            if (fetchError) {
                console.error('Error fetching tenants:', fetchError);
                setTenants([]);
                setIsLoading(false);
                return;
            }

            // Transform to legacy format with real plan from DB (or fallback to starter)
            const roles: Record<string, Role> = {};
            const tenantList: Tenant[] = (memberships || []).map((m) => {
                const t = m.tenants as unknown as { id: string; name: string; created_at: string; plan?: string };
                roles[t.id] = m.role as Role;
                return {
                    id: t.id,
                    name: t.name,
                    plan: (t.plan as PlanId) || 'starter',
                };
            });

            setTenants(tenantList);
            setTenantRoles(roles);

            // Get active tenant from server (httpOnly cookie or user_settings)
            if (tenantList.length > 0) {
                try {
                    const response = await fetch('/api/tenant/active');
                    if (response.ok) {
                        const data = await response.json();
                        if (data.tenantId && tenantList.find(t => t.id === data.tenantId)) {
                            setActiveTenantId(data.tenantId);
                        } else {
                            // Default to first tenant
                            setActiveTenantId(tenantList[0].id);
                        }
                    } else {
                        // Default to first tenant
                        setActiveTenantId(tenantList[0].id);
                    }
                } catch {
                    // Default to first tenant
                    setActiveTenantId(tenantList[0].id);
                }
            }
        } catch (e) {
            console.error("Failed to init auth", e);
        } finally {
            setIsLoading(false);
        }
    }, [supabase]);

    // Initial load
    useEffect(() => {
        loadTenants();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                loadTenants();
            } else {
                setUser(null);
                setTenants([]);
                setActiveTenantId(null);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [loadTenants, supabase.auth]);

    /**
     * Switch active tenant - SERVER AUTHORITATIVE
     * Calls server endpoint which validates membership and sets httpOnly cookie
     */
    const switchTenant = async (id: string) => {
        if (!tenants.find(t => t.id === id)) {
            console.error('Cannot switch to tenant user is not a member of');
            return;
        }

        try {
            const response = await fetch('/api/tenant/active', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId: id }),
            });

            if (response.ok) {
                setActiveTenantId(id);
                // Reload page to ensure all server components use new tenant
                window.location.reload();
            } else {
                console.error('Failed to switch tenant');
            }
        } catch (error) {
            console.error('Error switching tenant:', error);
        }
    };

    const refreshTenants = async () => {
        await loadTenants();
    };

    const currentTenant = tenants.find(t => t.id === activeTenantId) || null;
    const currentRole = activeTenantId ? (tenantRoles[activeTenantId] || 'staff') : 'staff';
    const effectivePlan = previewPlan || currentTenant?.plan || 'starter';

    return (
        <TenantContext.Provider value={{
            tenant: currentTenant,
            effectivePlan,
            tenants,
            user,
            role: currentRole,
            isLoading,
            switchTenant,
            refreshTenants,
            setPreviewPlan,
            clearPreviewPlan,
        }}>
            {children}
        </TenantContext.Provider>
    );
}

export function useTenant() {
    const context = useContext(TenantContext);
    if (context === undefined) {
        throw new Error('useTenant must be used within a TenantProvider');
    }
    return context;
}
