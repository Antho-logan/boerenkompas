import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createServiceSupabaseClient } from '@/lib/supabase/service';
import { errors, handleApiError, requireAuth } from '@/lib/supabase/guards';

export async function POST(request: NextRequest) {
    try {
        const auth = await requireAuth({ requireRole: 'admin' });
        if (auth instanceof NextResponse) return auth;

        const stripe = getStripe();

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
        const baseUrl = appUrl ? appUrl.replace(/\/$/, '') : null;
        if (!baseUrl) {
            console.error('Missing APP_URL for billing portal');
            return errors.internal();
        }

        const supabase = createServiceSupabaseClient();
        const { data: tenant, error: tenantError } = await supabase
            .from('tenants')
            .select('stripe_customer_id')
            .eq('id', auth.tenantId)
            .single();

        if (tenantError || !tenant) {
            console.error('Failed to load tenant for billing portal', tenantError);
            return errors.internal();
        }

        if (!tenant.stripe_customer_id) {
            return NextResponse.json(
                {
                    error: 'No Stripe customer found for this tenant. Start a checkout to create one.',
                    code: 'MISSING_STRIPE_CUSTOMER',
                },
                { status: 409 }
            );
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: tenant.stripe_customer_id,
            return_url: `${baseUrl}/dashboard/settings/billing`,
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        return handleApiError(error);
    }
}
