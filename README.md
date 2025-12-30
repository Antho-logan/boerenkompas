# BoerenKompas

Dutch agricultural compliance & dossier management platform built with Next.js 16, Supabase, and Stripe.

---

## Project Structure

```
BoerenKompas/
└── boerenkompas/          ← App root (run all commands here)
    ├── app/               ← Next.js App Router pages & API routes
    ├── components/        ← React components
    ├── lib/               ← Business logic, Supabase client, utilities
    ├── supabase/
    │   └── migrations/    ← SQL migrations (run in order)
    ├── docs/              ← Additional documentation
    ├── .env.local         ← Your local env vars (git-ignored)
    ├── .env.example       ← Template for .env.local
    └── package.json
```

> **Important**: The Next.js app lives in `/boerenkompas/`. Always `cd boerenkompas` before running commands.

---

## Quick Start (macOS / zsh)

### 1. Install Dependencies

```zsh
cd boerenkompas
npm install
```

### 2. Configure Environment

```zsh
cp .env.example .env.local
```

<<<<<<< HEAD
## Database Migrations

Migrations `004_add_plan.sql` and `005_fix_plan_enum.sql` were previously applied manually in production. The repository migrations are now the source of truth for schema changes.

## Learn More
=======
Edit `.env.local` with your credentials:
>>>>>>> b0318de (chore: sync updates)

| Variable | Required | Where to Get |
|----------|----------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase Dashboard → Settings → API |
| `STRIPE_SECRET_KEY` | For billing | Stripe Dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | For billing | Stripe Dashboard → Webhooks |
| `STRIPE_PRICE_PRO_MONTHLY` | For billing | Stripe Dashboard → Products |
| `STRIPE_PRICE_PRO_ANNUAL` | For billing | Stripe Dashboard → Products |
| `NEXT_PUBLIC_APP_URL` | ✅ | `http://localhost:3001` for local dev |

### 3. Verify Environment

```zsh
npm run doctor:env
```

Expected output:
```
✅ CONFIGURATION LOOKS GOOD!
```

### 4. Run Database Migrations

<<<<<<< HEAD
Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
=======
Go to **Supabase Dashboard → SQL Editor** and run these files in order:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_storage_setup.sql
supabase/migrations/003_pilot_safe_hardening.sql
supabase/migrations/004_add_plan.sql
supabase/migrations/005_fix_plan_enum.sql
supabase/migrations/006_add_stripe_billing_state.sql
```

> **Tip**: Copy-paste each file's contents into the SQL Editor and click "Run".

### 5. Configure Supabase Auth

1. Go to **Authentication → Providers** and enable **Email**
2. Go to **Authentication → URL Configuration** and set:
   - **Site URL**: `http://localhost:3001`
   - **Redirect URLs**: `http://localhost:3001/**`

### 6. Run Development Server

```zsh
npm run dev
```

Open **http://127.0.0.1:3001** in your browser.

---

## Test User Roles

After running, verify the full flow:

| Step | URL | Expected |
|------|-----|----------|
| Sign up | `/login` | Create account with email/password |
| Dashboard | `/dashboard` | See KPIs and navigation |
| Upload | `/dashboard/documents` | Upload a PDF |
| Compliance | `/dashboard/ai/compliance-check` | See dossier requirements |
| Export | `/dashboard/exports` | Generate shareable export |
| Public share | `/exports/[token]` (incognito) | View export without login |

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on port 3001 |
| `npm run dev:3000` | Start dev server on port 3000 |
| `npm run dev:clean` | Clear `.next` cache and start dev |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run doctor:env` | Validate environment variables |
| `npm run kill:port` | Kill process on port 3001 |

---

## Environment Variables Reference

See `.env.example` for all variables with descriptions.

### Required for Core Functionality

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### Required for Stripe Billing

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_ANNUAL=price_...
```

### Optional Development Tools

```bash
DEV_SEED_SECRET=your-random-secret     # Enable /api/dev/seed endpoint
NEXT_PUBLIC_ENABLE_DEMO_LOGIN=true     # Show demo login button
NEXT_PUBLIC_ENABLE_PLAN_PREVIEW=true   # Enable plan preview switcher
```

---

## Troubleshooting

### Port 3001 Already in Use

```zsh
npm run kill:port
npm run dev
```

### Supabase Connection Issues

1. Run `npm run doctor:env` to validate config
2. Check that `.env.local` is in `/boerenkompas/` (same folder as `package.json`)
3. Restart `npm run dev` after changing `.env.local`

### RLS Policy Errors

1. Ensure all migrations ran in order (001 → 006)
2. Check user has `tenant_members` entry
3. Check `bk_active_tenant` cookie is set

### Storage Upload Fails

1. Verify `documents` bucket exists in Supabase Storage
2. Run `002_storage_setup.sql` migration
3. Check file size < 50MB

---

## Additional Documentation

- [`docs/BACKEND_README.md`](./docs/BACKEND_README.md) — Detailed backend architecture
- [`docs/env.example.md`](./docs/env.example.md) — Extended env var documentation
- [`docs/dev-notes.md`](./docs/dev-notes.md) — Development notes and decisions

---

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript
- **Database**: Supabase (Postgres + Auth + Storage)
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Payments**: Stripe
- **Runtime**: Node.js 20+

---

## License

Proprietary. All rights reserved.
>>>>>>> b0318de (chore: sync updates)
