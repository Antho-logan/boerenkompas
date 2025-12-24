# BoerenKompas MVP Backend

Complete Supabase backend implementation for the BoerenKompas document management and dossier workflow system.

---

## Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready
3. Go to **Settings > API** and copy:
   - Project URL
   - Anon public key
   - Service Role key (for server-side only)

### 2. Environment Variables

Create `.env.local` **in the same directory as `package.json`** (i.e., inside `/boerenkompas/`):

```bash
# Required: Public vars (exposed to client)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...YOUR_ANON_JWT...

# Required for public export sharing: Server-only (NEVER expose to client)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...YOUR_SERVICE_ROLE_JWT...
```

| Variable | Scope | Required | Purpose |
|----------|-------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | ✅ Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | ✅ Yes | Public anon key (RLS enforced) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | ✅ For exports | Bypasses RLS for public export viewing |

> ⚠️ **Security**: The service role key bypasses RLS. Never expose it in client code, browser console, or Git commits.

### 3. Verify Environment (Env Doctor)

Run the built-in environment doctor to validate your setup:

```bash
npm run doctor:env
```

**Good output looks like:**

```
🏥 BoerenKompas Environment Doctor
==================================================

1. Project Paths
   .env.local path:  /path/to/boerenkompas/.env.local
   package.json:     EXISTS

2. Parent Directory Check
   ✓ No conflicting env/lock files in parent directories

3. Environment File
   ✓ .env.local exists

4. Environment Variables

   NEXT_PUBLIC_SUPABASE_URL:
   ✓ Valid (host: yourproject.supabase.co)

   NEXT_PUBLIC_SUPABASE_ANON_KEY:
   ✓ Valid JWT format
      len=XXX, first6="eyJhbG", last6="...XXX", dots=2

5. Summary
==================================================

✅ CONFIGURATION LOOKS GOOD!
```

### 4. Run Database Migrations

Go to your Supabase Dashboard > SQL Editor and run these files in order:

1. **`supabase/migrations/001_initial_schema.sql`** — Creates tables, indexes, RLS policies, seeds templates
2. **`supabase/migrations/002_storage_setup.sql`** — Creates `documents` storage bucket and policies
3. **`supabase/migrations/003_pilot_safe_hardening.sql`** — Additional security hardening (optional)

### 5. Configure Supabase Auth

1. Go to **Authentication > Providers**
2. Enable **Email** provider
3. (Optional) Enable **Google**, **Microsoft** for social login
4. Go to **URL Configuration** and set:
   - Site URL: `http://localhost:3001`
   - Redirect URLs: `http://localhost:3001/**`

### 6. Install Dependencies & Run

```bash
npm install
npm run dev
```

Visit `http://127.0.0.1:3001/login` to create an account.

---

## Export Sharing

Exports can be shared publicly via a unique token. This allows external parties (auditors, banks, RVO) to view dossier indexes and download linked documents **without logging in**.

### Security Model

- **RLS remains strict**: All tenant data is protected by Row Level Security
- **Public access uses service-role**: The server-side `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS only for the specific export lookup
- **Token = access**: Anyone with the share token can view until expiry
- **Scoped documents**: Only documents embedded in the export's HTML are downloadable; not the entire tenant vault

### Public Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/exports/[token]` | GET | View export HTML (server component) |
| `/api/share/[token]/documents/[docId]/download` | GET | Download a document linked in the export |

### Share Token Format

Tokens are UUIDs generated at export creation:

```
/exports/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

### Expiry Behavior

- Exports are valid for **30 days** from creation by default
- After expiry, both the HTML view and document downloads return **404 Not Found**
- There is no distinction between "invalid token" vs "expired" vs "revoked" — all return 404 for security

### Tokenized Download Links

When an export is generated, document download links are embedded with the share token:

```html
<a href="/api/share/TOKEN/documents/DOC_ID/download">Document.pdf</a>
```

> ⚠️ **Note**: Older exports created before token embedding may have broken download links. **Regenerate the export** to embed new tokenized links.

### How Public Download Works

1. User clicks download link in shared export
2. Server validates token → checks expiry → verifies docId is in export's HTML
3. Server uses service-role to generate signed URL (15 min validity)
4. User is redirected to Supabase Storage signed URL

---

## Downloads

### Authenticated Downloads

For logged-in users viewing their own documents:

```
GET /api/documents/[id]/download
```

Returns a 302 redirect to a Supabase Storage signed URL (15 min validity).

### Public Export Downloads

For unauthenticated viewers of shared exports:

```
GET /api/share/[token]/documents/[docId]/download
```

Validation flow:
1. Token format validation (UUID regex)
2. Export lookup via service-role
3. Expiry check (must be in future)
4. Document ID must exist in export's `index_html` (`data-doc-id` attribute)
5. Document must belong to export's tenant
6. Returns 302 redirect to signed URL

---

## Upload Behavior

### Rollback on Failure

The upload handler (`POST /api/documents/upload`) implements orphan cleanup:

1. File uploads to Supabase Storage
2. Document record inserted in DB
3. **If DB insert fails**: Storage object is deleted automatically

```typescript
// Simplified flow
const { error: uploadError } = await supabase.storage.upload(storagePath, file);
if (uploadError) return error;

try {
  await createDocument({ ... });
} catch (error) {
  // Cleanup: delete uploaded file if DB insert fails
  await supabase.storage.remove([storagePath]);
  throw error;
}
```

This prevents orphaned files in storage without a corresponding DB record.

---

## API Endpoints

### Documents

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/documents` | GET | List documents |
| `/api/documents/upload` | POST | Upload file (multipart) |
| `/api/documents/[id]` | GET | Get document |
| `/api/documents/[id]` | PATCH | Update document |
| `/api/documents/[id]` | DELETE | Delete document |
| `/api/documents/[id]/download` | GET | Download (signed URL redirect) |

### Dossier

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/dossier/templates` | GET | List templates |
| `/api/dossier/check` | GET | Get requirements with status |
| `/api/dossier/generate-missing-items` | POST | Generate tasks for missing items |

### Tasks

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tasks` | GET | List open tasks |
| `/api/tasks` | POST | Create task |
| `/api/tasks/[id]` | PATCH | Update task |
| `/api/tasks/[id]` | DELETE | Delete task |

### Exports

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/exports` | GET | List exports (auth required) |
| `/api/exports` | POST | Create export (auth required) |
| `/api/exports/[id]` | GET | Get export by ID (auth required) |
| `/api/exports/[id]` | DELETE | Delete export (auth required) |

### Audit

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/audit` | GET | Get audit log |

---

## Troubleshooting

### Service Role Key Issues

**Symptom**: Public export pages return 404 or "Not found"

**Checks**:
1. Verify `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`
2. Ensure it's the service role key (not anon key) from Supabase Dashboard > Settings > API
3. Restart `npm run dev` after adding the key
4. Run `npm run doctor:env` — the doctor only checks public keys; manually verify service key exists

**Valid service key format**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS...` (JWT with 3 dot-separated parts)

### Export Token Expired

**Symptom**: Export page that previously worked now returns 404

**Checks**:
1. Exports expire after 30 days
2. Check `expires_at` column in `exports` table
3. Solution: Generate a new export from `/dashboard/exports`

### Export Downloads Not Working

**Symptom**: Clicking document links in shared export returns 404 or fails

**Checks**:
1. Is the export expired? (see above)
2. Is `SUPABASE_SERVICE_ROLE_KEY` configured? (required for public downloads)
3. Was the export generated before tokenized links were implemented?
   - **Solution**: Delete old export and regenerate it
4. Was the document deleted after the export was created?
   - Links to deleted documents will fail

### Download Links Show Old Format

**Symptom**: Export HTML has links like `/api/documents/[id]/download` instead of `/api/share/[token]/documents/[id]/download`

**Cause**: Export was generated before token-based download links were implemented.

**Solution**: 
1. Go to `/dashboard/exports`
2. Delete the old export
3. Generate a new export for the same template

### RLS Policy Errors

**Symptom**: "new row violates row-level security policy" or similar

**Checks**:
1. User is authenticated
2. User has `tenant_members` entry for the tenant
3. `bk_active_tenant` cookie is set correctly
4. Run migrations in order (001, 002, 003)

### Storage Upload Fails

**Symptom**: File upload returns 500 error

**Checks**:
1. `documents` bucket exists in Supabase Storage
2. Storage policies are applied (run `002_storage_setup.sql`)
3. File size is under 50MB
4. MIME type is allowed (PDF, images, Office docs)

---

## Testing End-to-End

### Create and Share an Export

1. **Login** at `/login`
2. **Upload a document** at `/dashboard/documents`
3. **Link document to requirement** at `/dashboard/ai/compliance-check`
4. **Generate export** at `/dashboard/exports`
   - Select template
   - Click "Genereer Export"
5. **Copy share URL** from the exports list (hover over share icon)

### Verify Public Access

1. **Open a private/incognito browser window** (not logged in)
2. **Paste the share URL**: `http://localhost:3001/exports/[token]`
3. **Verify**:
   - Export HTML renders correctly
   - Document links are clickable
   - Clicking a link downloads the file (redirects to signed URL)

### Verify Expiry

1. Manually update `expires_at` in the `exports` table to a past date
2. Refresh the public export URL
3. **Expected**: 404 Not Found

---

## Security Notes

### What the Service Role Key Can Do

The `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS entirely. In BoerenKompas, it's used **only** for:

1. Looking up exports by share token (public view)
2. Verifying documents belong to the export's tenant
3. Generating signed URLs for public document downloads

It is **never** exposed to the client or used for authenticated user operations.

### Token Security

- Share tokens are UUIDs (128-bit random)
- Tokens are not guessable
- Tokens cannot be enumerated (no list endpoint)
- Expired tokens return 404 (no information leak about validity)

### XSS Protection

All user content in export HTML is escaped:

```typescript
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
```

### Document Scope

Public export downloads are scoped:
- Only documents with IDs in the export's `index_html` can be downloaded
- Documents must belong to the export's tenant
- No access to other tenant documents via token manipulation

---

## Quick Verification Checklist

After setup, verify each item:

- [ ] `npm run doctor:env` shows "CONFIGURATION LOOKS GOOD!"
- [ ] Can sign up and log in at `/login`
- [ ] Can upload a document at `/dashboard/documents`
- [ ] Can generate an export at `/dashboard/exports`
- [ ] Export HTML displays in-app (authenticated)
- [ ] Share URL works in incognito window (unauthenticated)
- [ ] Document download works from shared export
- [ ] No console errors or 500s in browser/terminal

---

## Architecture Overview

### Tech Stack

- **Frontend**: Next.js 16 App Router + TypeScript
- **Backend**: Supabase (Auth + Postgres + Storage)
- **Styling**: TailwindCSS + shadcn/ui

### Key Features (MVP)

- ✅ Multi-tenant document vault
- ✅ Deterministic dossier templates & requirements
- ✅ Missing items generator (creates tasks)
- ✅ Deadline calendar (tasks with due dates)
- ✅ Export v1 (HTML index with tokenized download links)
- ✅ Public export sharing via token
- ✅ Tenant member/advisor management
- ✅ Audit logging

### Non-Features (Intentionally Excluded)

- ❌ AI/OCR extraction (MVP works without)
- ❌ Compliance scoring
- ❌ ZIP exports
- ❌ Rules → Tasks automation
- ❌ VDM export

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
| `exports` | Generated dossier indexes (includes `share_token`, `expires_at`) |
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
- **Exception**: Export public viewing uses service-role to bypass RLS

---

## Legal Disclaimer

BoerenKompas is a **dossier-workflow tool**. It does not guarantee compliance 
with any regulations. Users are responsible for verifying their own 
regulatory obligations with appropriate authorities.

The software is provided "as is" without warranty of any kind.
