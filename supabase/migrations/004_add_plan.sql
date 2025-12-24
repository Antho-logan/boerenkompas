-- ============================================================================
-- Migration: Add Plan to Tenants
-- ============================================================================

-- Add plan column with default 'starter'
-- We use a text column with a check constraint for simplicity in this MVP
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'starter' 
CHECK (plan IN ('starter', 'pro', 'team', 'enterprise'));

-- Update existing tenants to have 'starter' plan (though default handles it)
UPDATE public.tenants SET plan = 'starter' WHERE plan IS NULL;

-- Log the migration
COMMENT ON COLUMN public.tenants.plan IS 'The subscription plan of the organization (starter, pro, team, enterprise)';

