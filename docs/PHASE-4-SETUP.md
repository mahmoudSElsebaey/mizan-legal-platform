# Phase 4 — Administration Setup and Verification

**Status:** complete for this delivery checkpoint. The user confirmed the Phase 4 migration succeeded and the runtime acceptance checks passed; GitHub Actions CI also passed on the current main commit at the time of verification.

## Included

- Owner/admin-only administration navigation.
- Account directory with profile name/language maintenance and staff role/status assignment.
- Server-side Zod validation and fresh authenticated-user/role checks in every server action.
- Role changes still pass through Supabase RLS. Admins can assign only lawyers/assistants; owners can assign all roles. The acting user's own staff assignment is protected in the UI and action.
- Bilingual practice-area CRUD, publish/unpublish, and public listing/detail pages backed by published database rows.
- Office profile settings for Arabic/English name, public email, phone, and address; contact details are read on the public homepage.
- Database-triggered audit history for profile, staff assignment, practice-area, and office-setting changes.
- GitHub Actions workflow `.github/workflows/ci.yml` for typecheck, lint, and production build.

## Apply the database migration

1. Confirm you are using a dedicated development/staging Supabase project, not production.
2. Open Supabase Dashboard → SQL Editor.
3. Open `supabase/migrations/20261022000200_phase4_administration.sql` from the repository's `main` branch.
4. Review the SQL and run it **once only**. It adds the `office_services`, `office_settings`, and `audit_logs` tables, adds a profile email field and sync trigger, adds the admin profile policy, and seeds the four initial practice areas.
5. Verify that all three tables exist, RLS is enabled on them, and the migration completed without errors.

Do not re-run this migration after a successful application; it is not an idempotent migration.

## Local checks

From PowerShell in the project directory:

```powershell
git switch main
git pull origin main
npm ci
npm run typecheck
npm run lint
npm run build
```

If any command fails, stop and fix the reported issue before marking Phase 4 complete. The GitHub Actions CI workflow should also pass on the latest commit. CI uses placeholder public Supabase values only for compilation and does not access a real database.

## Runtime acceptance checklist

Use separate test accounts. Never test privileged actions using production data.

- [ ] Unauthenticated visitors cannot open any dashboard or admin route; they are redirected to login.
- [ ] Client, lawyer, assistant, pending, and suspended accounts cannot access the admin routes or invoke admin server actions.
- [ ] Active admin can read the account directory and assign/update only lawyer/assistant roles.
- [ ] Active admin cannot promote a user to admin/owner, and cannot change their own staff assignment.
- [ ] Active owner can assign roles and statuses, but cannot change their own staff assignment from this UI.
- [ ] Profile name/language edits are saved and appear on refresh; attempts to edit another profile as a non-admin are denied by RLS.
- [ ] Service create/edit/publish/unpublish/delete works; only published services appear on the public services page and homepage.
- [ ] Unpublishing a service prevents its detail page from being publicly accessible.
- [ ] Office email/phone/address saved in settings appear in the homepage contact section.
- [ ] Each profile, staff, service, and settings mutation creates an audit entry; only active owner/admin can read the log.
- [ ] Arabic RTL and English LTR layouts work at mobile and desktop widths.
- [ ] CI typecheck, lint, and production build all pass.

## Known scope boundaries

This phase does not create Supabase Auth users on behalf of administrators; a person must register first. Appointment booking, case files, document storage, client/lawyer workspaces, conversations, and notifications belong to later phases. The public office name/logo and detailed office/lawyer copy remain temporary branding/content and need the office owner's verified information before launch.
