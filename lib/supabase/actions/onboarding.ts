/**
 * Onboarding Server Actions
 * Handles initial tenant creation for new users
 */

'use server';

import { redirect } from 'next/navigation';
import { createTenantWithOwner, getUserTenants } from '@/lib/supabase/tenant';
import { getCurrentUser } from '@/lib/supabase/server';
import { logAuditEvent } from './audit';

/**
 * Check if user needs onboarding (no tenants)
 */
export async function checkOnboardingRequired(): Promise<boolean> {
    const user = await getCurrentUser();
    if (!user) return false;

    const tenants = await getUserTenants();
    return tenants.length === 0;
}

/**
 * Create initial tenant for new user
 */
export async function createInitialTenant(formData: FormData): Promise<void> {
    const name = formData.get('name') as string;

    if (!name || name.trim().length < 2) {
        throw new Error('Bedrijfsnaam is verplicht (minimaal 2 karakters)');
    }

    const tenant = await createTenantWithOwner(name.trim());

    await logAuditEvent({
        action: 'tenant.created',
        entity_type: 'tenant',
        entity_id: tenant.id,
        meta: { name: tenant.name },
    });

    redirect('/dashboard');
}
