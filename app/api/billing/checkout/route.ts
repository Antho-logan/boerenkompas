import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createServiceSupabaseClient } from '@/lib/supabase/service';
import { errors, handleApiError, requireAuth } from '@/lib/supabase/guards';

interface CheckoutBody {
    plan?: string;
    interval?: 'monthly' | 'annual';
}

export async function POST(request: NextRequest) {
    try {
        const auth = await requireAuth({ requireRole: 'admin' });
        if (auth instanceof NextResponse) return auth;

        let body: CheckoutBody = {};
        try {
            body = await request.json();
        } catch {
            return errors.badRequest('Invalid JSON body');
        }

        const { plan, interval } = body;
        if (plan !== 'pro' || (interval !== 'monthly' && interval !== 'annual')) {
            return errors.badRequest('Invalid plan or interval');
        }

        const priceId =
            interval === 'monthly'
                ? process.env.STRIPE_PRICE_PRO_MONTHLY
                : process.env.STRIPE_PRICE_PRO_ANNUAL;

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
        const baseUrl = appUrl ? appUrl.replace(/\/$/, '') : null;

        if (!priceId || !baseUrl) {
            console.error('Stripe checkout misconfigured', {
                hasPriceId: Boolean(priceId),
                hasAppUrl: Boolean(baseUrl),
            });
            return errors.internal();
        }

        const supabase = createServiceSupabaseClient();

        const { data: tenant, error: tenantError } = await supabase
            .from('tenants')
            .select('id, name, stripe_customer_id')
            .eq('id', auth.tenantId)
            .single();

        if (tenantError || !tenant) {
            console.error('Failed to load tenant for billing', tenantError);
            return errors.internal();
        }

        let stripeCustomerId = tenant.stripe_customer_id as string | null;

        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                name: tenant.name || undefined,
                email: auth.user.email || undefined,
                metadata: { tenant_id: tenant.id },
            });

            stripeCustomerId = customer.id;

            const { error: updateError } = await supabase
                .from('tenants')
                .update({ stripe_customer_id: stripeCustomerId })
                .eq('id', tenant.id);

            if (updateError) {
                console.error('Failed to persist stripe_customer_id', updateError);
                return errors.internal();
            }
        }

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            customer: stripeCustomerId,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `${baseUrl}/dashboard/settings/billing?success=1`,
            cancel_url: `${baseUrl}/dashboard/settings/billing?canceled=1`,
        });

        if (!session.url) {
            console.error('Stripe session missing URL', { sessionId: session.id });
            return errors.internal();
        }

        return NextResponse.json({ url: session.url });
    } catch (error) {
        return handleApiError(error);
    }
}
