-- ============================================================================
-- Migration: Add Stripe Billing State to Tenants
-- ============================================================================
-- Adds Stripe customer/subscription tracking and billing status fields.
-- Includes idempotent guards and a constrained status enum.

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS plan_status text NOT NULL DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false;

-- Enforce allowed billing status values
ALTER TABLE public.tenants
  DROP CONSTRAINT IF EXISTS tenants_plan_status_check;

ALTER TABLE public.tenants
  ADD CONSTRAINT tenants_plan_status_check
  CHECK (plan_status IN ('inactive', 'active', 'trialing', 'past_due', 'canceled'));

-- Unique identifiers for Stripe records (NULLs allowed)
CREATE UNIQUE INDEX IF NOT EXISTS tenants_stripe_customer_id_key
  ON public.tenants (stripe_customer_id);

CREATE UNIQUE INDEX IF NOT EXISTS tenants_stripe_subscription_id_key
  ON public.tenants (stripe_subscription_id);

-- Column documentation
COMMENT ON COLUMN public.tenants.stripe_customer_id IS 'Stripe customer ID for this tenant';
COMMENT ON COLUMN public.tenants.stripe_subscription_id IS 'Stripe subscription ID for this tenant';
COMMENT ON COLUMN public.tenants.plan_status IS 'Stripe billing status: inactive, active, trialing, past_due, canceled';
COMMENT ON COLUMN public.tenants.current_period_end IS 'End of current Stripe billing period (UTC)';
COMMENT ON COLUMN public.tenants.cancel_at_period_end IS 'Whether the subscription will cancel at period end';
