import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createServiceSupabaseClient } from '@/lib/supabase/service';
import { errors, handleApiError } from '@/lib/supabase/guards';

// Stripe webhooks require the raw request body (do not use request.json).
// Ensure this route runs on the Node.js runtime for signature verification.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

type PlanStatus = 'inactive' | 'active' | 'trialing' | 'past_due' | 'canceled';

type TenantUpdate = {
    stripe_customer_id?: string | null;
    stripe_subscription_id?: string | null;
    plan_status?: PlanStatus;
    current_period_end?: string | null;
    cancel_at_period_end?: boolean;
    plan?: 'starter' | 'pro' | 'pro_advisor' | 'teams' | 'enterprise';
};

function mapStripeStatus(status?: Stripe.Subscription.Status | null): PlanStatus {
    switch (status) {
        case 'active':
            return 'active';
        case 'trialing':
            return 'trialing';
        case 'past_due':
            return 'past_due';
        case 'canceled':
            return 'canceled';
        default:
            return 'inactive';
    }
}

function toIsoFromUnixSeconds(timestamp?: number | null): string | null {
    if (!timestamp) return null;
    return new Date(timestamp * 1000).toISOString();
}

function normalizeStripeId(
    value?: string | Stripe.Customer | Stripe.Subscription | Stripe.DeletedCustomer | null
): string | null {
    if (!value) return null;
    if (typeof value === 'string') return value;
    return value.id || null;
}

async function updateTenantByCustomerId(
    supabase: ReturnType<typeof createServiceSupabaseClient>,
    customerId: string,
    updates: TenantUpdate
): Promise<boolean> {
    const { data, error } = await supabase
        .from('tenants')
        .update(updates)
        .eq('stripe_customer_id', customerId)
        .select('id');

    if (error) {
        console.error('Failed to update tenant by customer id', error);
        return false;
    }

    return (data || []).length > 0;
}

async function updateTenantBySubscriptionId(
    supabase: ReturnType<typeof createServiceSupabaseClient>,
    subscriptionId: string,
    updates: TenantUpdate
): Promise<boolean> {
    const { data, error } = await supabase
        .from('tenants')
        .update(updates)
        .eq('stripe_subscription_id', subscriptionId)
        .select('id');

    if (error) {
        console.error('Failed to update tenant by subscription id', error);
        return false;
    }

    return (data || []).length > 0;
}

async function updateTenantById(
    supabase: ReturnType<typeof createServiceSupabaseClient>,
    tenantId: string,
    updates: TenantUpdate
): Promise<boolean> {
    const { error } = await supabase
        .from('tenants')
        .update(updates)
        .eq('id', tenantId);

    if (error) {
        console.error('Failed to update tenant by id', error);
        return false;
    }

    return true;
}

async function resolveTenantIdFromCustomer(customerId: string): Promise<string | null> {
    try {
        const customer = await stripe.customers.retrieve(customerId);
        if (customer.deleted) return null;
        const tenantId = customer.metadata?.tenant_id;
        return tenantId || null;
    } catch (error) {
        console.error('Failed to resolve tenant from Stripe customer', error);
        return null;
    }
}

function buildTenantUpdatesFromSubscription(subscription: Stripe.Subscription): TenantUpdate {
    const planStatus = mapStripeStatus(subscription.status);
    const updates: TenantUpdate = {
        stripe_customer_id: normalizeStripeId(subscription.customer),
        stripe_subscription_id: subscription.id,
        plan_status: planStatus,
        current_period_end: toIsoFromUnixSeconds(subscription.current_period_end),
        cancel_at_period_end: subscription.cancel_at_period_end,
    };

    if (planStatus === 'active' || planStatus === 'trialing') {
        updates.plan = 'pro';
    }

    if (planStatus === 'canceled') {
        updates.plan = 'starter';
    }

    return updates;
}

export async function POST(request: NextRequest) {
    if (!webhookSecret) {
        console.error('Missing STRIPE_WEBHOOK_SECRET');
        return errors.internal();
    }

    const signature = request.headers.get('stripe-signature');
    if (!signature) {
        return errors.badRequest('Missing Stripe signature');
    }

    let event: Stripe.Event;

    try {
        const payload = await request.text();
        event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
        console.error('Stripe webhook signature verification failed', error);
        return errors.badRequest('Invalid Stripe signature');
    }

    try {
        const supabase = createServiceSupabaseClient();

        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const customerId = normalizeStripeId(session.customer);
                const subscriptionId = normalizeStripeId(session.subscription);

                if (!customerId) break;

                let subscription: Stripe.Subscription | null = null;
                if (subscriptionId) {
                    subscription = await stripe.subscriptions.retrieve(subscriptionId);
                }

                const updates: TenantUpdate = subscription
                    ? buildTenantUpdatesFromSubscription(subscription)
                    : {
                          stripe_customer_id: customerId,
                          stripe_subscription_id: subscriptionId,
                      };

                let updated = await updateTenantByCustomerId(supabase, customerId, updates);

                if (!updated) {
                    const tenantId = await resolveTenantIdFromCustomer(customerId);
                    if (tenantId) {
                        updated = await updateTenantById(supabase, tenantId, updates);
                    }
                }

                if (!updated) {
                    console.error('No tenant updated for checkout.session.completed', {
                        customerId,
                        subscriptionId,
                    });
                }
                break;
            }

            case 'customer.subscription.created':
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = normalizeStripeId(subscription.customer);

                if (!customerId) break;

                const updates = buildTenantUpdatesFromSubscription(subscription);
                const updated = await updateTenantByCustomerId(supabase, customerId, updates);

                if (!updated) {
                    console.error('No tenant updated for subscription event', {
                        eventType: event.type,
                        customerId,
                        subscriptionId: subscription.id,
                    });
                }
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice;
                const customerId = normalizeStripeId(invoice.customer);
                const subscriptionId = normalizeStripeId(invoice.subscription as string | Stripe.Subscription | null);

                const updates: TenantUpdate = {
                    stripe_customer_id: customerId || undefined,
                    stripe_subscription_id: subscriptionId || undefined,
                    plan_status: 'past_due',
                };

                let updated = false;
                if (customerId) {
                    updated = await updateTenantByCustomerId(supabase, customerId, updates);
                }

                if (!updated && subscriptionId) {
                    updated = await updateTenantBySubscriptionId(supabase, subscriptionId, updates);
                }

                if (!updated) {
                    console.error('No tenant updated for invoice.payment_failed', {
                        customerId,
                        subscriptionId,
                    });
                }
                break;
            }

            default:
                break;
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        return handleApiError(error);
    }
}
