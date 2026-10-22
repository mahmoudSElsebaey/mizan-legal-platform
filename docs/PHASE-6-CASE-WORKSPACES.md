# Phase 6 — Client and lawyer workspaces

## Scope
- Private case records assigned by an active owner/admin to an active lawyer or assistant.
- Client-specific case access; assigned staff and active office owner/admin access.
- Case timeline entries with database-enforced separation between client-visible updates and internal notes.
- Private document metadata and a private Supabase Storage bucket.
- Staff-only uploads (PDF, JPG, PNG, TXT; maximum 10 MiB) with randomized object paths.
- Short-lived signed download URLs requested only after RLS authorizes document metadata access.
- Arabic/English dashboard UI, role-aware empty states, status updates, and server-side input validation.

## Database deployment
The migration is `supabase/migrations/20261022000400_phase6_case_workspaces.sql`. The configured GitHub Actions migration workflow applies it on pushes to `main` when enabled. Wait for the **Supabase Database Migrations** workflow to succeed and verify **Apply pending migrations** is green before testing the UI. If the workflow is disabled or fails, do not manually rerun an already-applied migration; inspect `npx supabase migration list --linked` first.

## Local checks
From PowerShell:
```powershell
git switch main
git pull origin main
npm ci
npm run typecheck
npm run lint
npm run build
```

CI also applies all migrations to an ephemeral PostgreSQL instance and runs `scripts/ci-phase6-smoke-test.sql`, which checks client isolation, internal-note visibility, and document metadata visibility.

## Runtime acceptance checklist
- [ ] Owner/admin creates a case for a registered client and assigns an active lawyer/assistant.
- [ ] Assigned lawyer can add an internal note and a client-visible update.
- [ ] Client sees the case and client-visible updates only; internal notes remain hidden.
- [ ] An unrelated client cannot see the case, events, or document metadata.
- [ ] Staff can upload an allowed file under 10 MiB; unsupported/oversized files are rejected.
- [ ] Client can access only documents explicitly marked client-visible.
- [ ] Downloads use short-lived signed URLs; the bucket is not public.
- [ ] Arabic and English pages render correctly and empty/error states are understandable.

## Limitations / production follow-up
- Case creation is currently limited to active owner/admin users.
- Case assignment is set at creation; reassignment UI and a full audit trail for case changes are follow-up work.
- Uploads are staff-only. Client document uploads, malware scanning, retention/deletion policies, legal-hold procedures, and formal production privacy/legal review are not included.
- A passing CI database shim validates SQL/RLS logic in that test environment; it does not replace runtime checks against the actual Supabase project.
