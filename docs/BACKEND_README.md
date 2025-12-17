# BoerenKompas MVP Backend

Complete Supabase backend implementation for the BoerenKompas document management and dossier workflow system.

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 15 App Router + TypeScript
- **Backend**: Supabase (Auth + Postgres + Storage)
- **Styling**: TailwindCSS + shadcn/ui

### Key Features (MVP)
- ✅ Multi-tenant document vault
- ✅ Deterministic dossier templates & requirements
- ✅ Missing items generator (creates tasks)
- ✅ Deadline calendar (tasks with due dates)
- ✅ Export v1 (HTML index, no ZIP)
- ✅ Tenant member/advisor management
- ✅ Audit logging

### Non-Features (Intentionally Excluded)
- ❌ AI/OCR extraction (MVP works without)
- ❌ Compliance scoring
- ❌ ZIP exports
- ❌ Rules → Tasks automation
- ❌ VDM export

---

## Quick Start

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready
3. Go to **Settings > API** and copy:
   - Project URL
   - Anon public key

### 2. Configure Environment

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Run Database Migrations

Go to your Supabase Dashboard > SQL Editor and run these files in order:

1. **`supabase/migrations/001_initial_schema.sql`**
   - Creates all tables, indexes, RLS policies
   - Seeds dossier templates and requirements

2. **`supabase/migrations/002_storage_setup.sql`**
   - Creates the `documents` storage bucket
   - Sets up storage policies

### 4. Configure Supabase Auth

1. Go to **Authentication > Providers**
2. Enable **Email** provider
3. (Optional) Enable **Google**, **Microsoft** for social login
4. Go to **URL Configuration** and set:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/**`

### 5. Install Dependencies & Run

```bash
npm install
npm run dev
```

Visit `http://localhost:3000/login` to create an account.

---

## Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `tenants` | Organizations/farms |
| `tenant_members` | User ↔ Tenant memberships with roles |
| `tenant_profile` | Business details (20 fields) |
| `documents` | Uploaded files metadata |
| `dossier_templates` | Predefined requirement sets |
| `dossier_requirements` | Individual requirements per template |
| `document_links` | Links documents to requirements |
| `tasks` | From missing items or manual |
| `exports` | Generated dossier indexes |
| `audit_log` | Activity tracking |

### Roles

- **owner**: Full access, can manage members
- **advisor**: Can manage documents, links, tasks
- **staff**: Read + update document status

### RLS Policies

All tables have Row Level Security enabled:
- Users can only see tenants they're members of
- Operations are restricted by role (owner/advisor/staff)
- Audit logging is tenant-scoped

---

## API Endpoints

### Documents
- `GET /api/documents` - List documents
- `POST /api/documents/upload` - Upload file
- `GET /api/documents/[id]` - Get document
- `PATCH /api/documents/[id]` - Update document
- `DELETE /api/documents/[id]` - Delete document
- `GET /api/documents/[id]/download` - Download (signed URL)

### Dossier
- `GET /api/dossier/templates` - List templates
- `GET /api/dossier/check?templateId=...` - Get requirements with status
- `POST /api/dossier/generate-missing-items` - Generate tasks

### Tasks
- `GET /api/tasks` - List open tasks
- `POST /api/tasks` - Create task
- `PATCH /api/tasks/[id]` - Update task
- `DELETE /api/tasks/[id]` - Delete task

### Exports
- `GET /api/exports` - List exports
- `POST /api/exports` - Create export
- `GET /api/exports/[id]` - Get export
- `DELETE /api/exports/[id]` - Delete export

### Audit
- `GET /api/audit` - Get audit log

---

## Verify Installation

### 1. Authentication
- [ ] Can sign up with email
- [ ] Can log in
- [ ] Redirected to onboarding if no tenants
- [ ] Can create a tenant (onboarding)
- [ ] Redirected to dashboard after onboarding

### 2. Documents
- [ ] Can see documents list (empty initially)
- [ ] Can upload a document
- [ ] Document appears in list
- [ ] Can update document status
- [ ] Can download document (signed URL)

### 3. Dossier Check
- [ ] Can see templates dropdown
- [ ] Can see requirements list
- [ ] Can click "Genereer missende items"
- [ ] Tasks are created

### 4. Calendar
- [ ] Can see calendar view
- [ ] Tasks from missing items appear
- [ ] Can mark task as done

### 5. Export Center
- [ ] Can see templates to export
- [ ] Can generate an export
- [ ] Can view export HTML
- [ ] Export shows disclaimer

### 6. Audit Log
- [ ] Can see audit events
- [ ] Upload actions are logged

---

## Commit Checklist

Files to commit:

### New Files
- [ ] `middleware.ts`
- [ ] `lib/supabase/` (all files)
- [ ] `app/api/` (all route handlers)
- [ ] `app/login/page.tsx`
- [ ] `app/onboarding/page.tsx`
- [ ] `supabase/migrations/001_initial_schema.sql`
- [ ] `supabase/migrations/002_storage_setup.sql`
- [ ] `docs/env.example.md`
- [ ] `docs/BACKEND_README.md`

### Modified Files
- [ ] `package.json` (added @supabase/supabase-js, @supabase/ssr)
- [ ] `components/app/TenantProvider.tsx`
- [ ] `app/(app)/dashboard/documents/page.tsx`
- [ ] `app/(app)/dashboard/ai/compliance-check/page.tsx`
- [ ] `app/(app)/dashboard/calendar/page.tsx`
- [ ] `app/(app)/dashboard/exports/page.tsx`
- [ ] `app/(app)/dashboard/audit/page.tsx`

---

## Troubleshooting

### "No active tenant" error
- Check that the user has at least one tenant_member row
- Verify the `bk_active_tenant` cookie is set

### Storage upload fails
- Verify the `documents` bucket exists
- Check storage policies are applied
- Ensure file size < 50MB and correct MIME type

### RLS policy errors
- Ensure user is authenticated
- Check tenant_members table has the user
- Verify the helper functions are created

---

## Legal Disclaimer

BoerenKompas is a **dossier-workflow tool**. It does not guarantee compliance 
with any regulations. Users are responsible for verifying their own 
regulatory obligations with appropriate authorities.

The software is provided "as is" without warranty of any kind.
