# BoerenKompas Environment Variables
# Copy this to .env.local and fill in your Supabase credentials

# ─────────────────────────────────────────────────────────────────
# REQUIRED: Supabase Credentials
# ─────────────────────────────────────────────────────────────────

# Supabase Project URL - Get from Supabase Dashboard > Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

# Supabase Anon Key - Get from Supabase Dashboard > Settings > API > Project API Keys
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Service Role Key (required for exports, public sharing, and dev seeding)
# Get from Supabase Dashboard > Settings > API > Project API Keys
# NEVER expose to client - server-only usage
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# ─────────────────────────────────────────────────────────────────
# REQUIRED: Stripe Billing
# ─────────────────────────────────────────────────────────────────

# Stripe secret key (server-only)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key

# Stripe webhook signing secret
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Stripe price IDs for Pro plan
STRIPE_PRICE_PRO_MONTHLY=price_your_monthly_id
STRIPE_PRICE_PRO_ANNUAL=price_your_annual_id

# Public app URL used for Stripe success/cancel redirects
NEXT_PUBLIC_APP_URL=http://localhost:3001
# APP_URL=http://localhost:3001

# ─────────────────────────────────────────────────────────────────
# OPTIONAL: Development Tools
# ─────────────────────────────────────────────────────────────────

# Secret required for /api/dev/seed endpoint
# Include header: X-DEV-SEED-SECRET: your-random-secret-here
# DEV_SEED_SECRET=your-random-secret-here
