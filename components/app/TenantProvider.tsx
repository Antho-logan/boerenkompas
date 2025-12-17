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

// Legacy type compatibility
export type Role = 'owner' | 'advisor' | 'staff' | 'viewer';

export interface Tenant {
    id: string;
    name: string;
    plan: 'start' | 'pro' | 'plus';
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
    tenants: Tenant[];
    user: User | null;
    role: Role;
    isLoading: boolean;
    switchTenant: (tenantId: string) => Promise<void>;
    refreshTenants: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [activeTenantId, setActiveTenantId] = useState<string | null>(null);
    const [tenantRoles, setTenantRoles] = useState<Record<string, Role>>({});
    const [isLoading, setIsLoading] = useState(true);

    const supabase = createClient();

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

            // Get tenants user is member of
            const { data: memberships, error } = await supabase
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

            if (error) {
                console.error('Error fetching tenants:', error);
                setTenants([]);
                setIsLoading(false);
                return;
            }

            // Transform to legacy format
            const roles: Record<string, Role> = {};
            const tenantList: Tenant[] = (memberships || []).map((m) => {
                const t = m.tenants as unknown as { id: string; name: string; created_at: string };
                roles[t.id] = m.role as Role;
                return {
                    id: t.id,
                    name: t.name,
                    plan: 'start' as const,
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

    return (
        <TenantContext.Provider value={{
            tenant: currentTenant,
            tenants,
            user,
            role: currentRole,
            isLoading,
            switchTenant,
            refreshTenants,
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
