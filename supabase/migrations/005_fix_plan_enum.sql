-- ============================================================================
-- Migration: Fix Plan Enum to include pro_advisor
-- ============================================================================
-- 
-- The previous migration (004) only included 4 plans, but the app defines 5:
-- starter, pro, pro_advisor, teams, enterprise
--
-- This migration:
-- 1. Drops the old check constraint
-- 2. Adds a new one with all 5 valid plan values

-- Drop existing check constraint
ALTER TABLE public.tenants 
DROP CONSTRAINT IF EXISTS tenants_plan_check;

-- Add updated check constraint with all 5 plans
ALTER TABLE public.tenants 
ADD CONSTRAINT tenants_plan_check 
CHECK (plan IN ('starter', 'pro', 'pro_advisor', 'teams', 'enterprise'));

-- Update any 'team' values to 'teams' for consistency
UPDATE public.tenants SET plan = 'teams' WHERE plan = 'team';

-- Log the migration
COMMENT ON COLUMN public.tenants.plan IS 'Subscription plan: starter, pro, pro_advisor, teams, enterprise';

