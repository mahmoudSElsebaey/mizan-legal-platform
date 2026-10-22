# Delivery Roadmap and Approval Gates

Each phase ends with a report of changed files, decisions, tests actually run, known issues, and next steps. Never claim a test, integration, or deployment succeeded unless it was performed.

## Phase 0 — Planning (documentation drafted; final business review pending)
- [x] Confirm repository and initial product direction.
- [x] Draft architecture and proposed folder structure.
- [x] Draft conceptual database model.
- [x] Define role and confidentiality principles.
- [x] Define security and privacy requirements.
- [x] Define delivery phases and acceptance gates.
- [ ] Review assumptions and unresolved business decisions with the owner.
- [ ] Deliver final Phase 0 report and obtain explicit approval.

**Exit gate:** no application scaffold, schema migration, or feature implementation until Phase 0 is reviewed and explicitly approved.

## Phase 1 — Foundation and design system (implemented; local checks pending)
- Scaffold Next.js App Router + TypeScript.
- Configure linting, formatting, tests, and environment validation.
- Add Arabic/English locale routing and RTL/LTR.
- Implement temporary identity, typography, spacing, accessible primitives, and responsive shell.
- Add Supabase client/server helpers without committing credentials.
- Verify build and baseline checks.

## Phase 2 — Public website (implementation started; validation pending)
- [x] Responsive bilingual homepage and office page.
- [x] Practice area directory and localized detail pages.
- [x] Lawyer profile page with explicit placeholders for unverified credentials.
- [x] Legal insights listing and educational article pages.
- [x] SEO metadata, sitemap, and robots route.
- [ ] Add/verify route-level loading, error, and not-found states.
- [ ] Run typecheck, lint, and production build locally.
- [ ] Review content and replace placeholder office details before launch.

## Phase 3 — Authentication and access control (implementation in progress; runtime checks pending)
- [x] Draft and apply the profiles/staff-members migration in the intended Supabase project (user confirmed success).
- [x] Confirm both tables have RLS enabled and policies are present.
- [x] Document the trusted first-owner bootstrap procedure.
- [x] Implement localized sign-in, registration, password recovery, and password update screens.
- [x] Add the Supabase Auth callback handler for confirmation/recovery links.
- [x] Add a server-protected account dashboard and sign-out control.
- [x] Add localized homepage links to sign-in and registration.
- [x] Add a repeatable, guarded seed script for five demo roles.
- [x] Add bilingual click-to-fill demo accounts to the development login page only.
- [ ] Verify profile trigger behavior and role/RLS allow-deny behavior with real test accounts.
- [ ] Run typecheck, lint, and production build locally; fix any issues.
- [ ] Add automated role-based access tests and record actual results.

## Phase 4 — Administration (implementation committed; user-confirmed runtime checks passed)
- [x] Add a guarded owner/admin workspace with role-aware navigation.
- [x] Manage registered account names/languages and staff roles/statuses with server-side Zod validation.
- [x] Enforce role assignment limits again through Supabase RLS; protect the acting administrator's own staff assignment.
- [x] Create, edit, publish/unpublish, and delete bilingual practice-area records.
- [x] Store office profile settings and display the public contact fields on the homepage.
- [x] Add database-triggered audit entries for profile, staff assignment, practice-area, and office-setting changes.
- [x] Add a CI workflow for typecheck, lint, and production build.
- [x] Apply the Phase 4 migration to the intended development Supabase project (user confirmed success).
- [x] Run and pass CI typecheck, lint, production build, migration, and SQL smoke checks.
- [x] Exercise owner/admin/lawyer/assistant/client allow-deny paths using separate test accounts (user confirmed success).
- [x] Verify service publishing, settings display, and audit log behavior against Supabase (user confirmed success).

**Exit gate:** do not mark Phase 4 complete until the migration is applied and runtime + CI checks pass.

## Phase 5 — Appointments (implemented; migration and user runtime checks completed)
- [x] Weekly availability rules and date-specific exceptions.
- [x] Request/approval/confirmation/cancellation workflow with database-enforced state transitions.
- [x] Database-level overlap protection and CI smoke tests.
- [x] Apply the Phase 5 migration to the intended development Supabase project (user confirmed).
- [x] Pass CI typecheck, lint, production build, all migrations, and appointment smoke checks (commit 784e581).
- [x] Run the booking runtime acceptance checks (user confirmed the appointment flow works).

## Phase 6 — Client and lawyer workspaces (implementation committed; CI and live Supabase acceptance pending)
- [x] Add case records and owner/admin assignment to active lawyers/assistants.
- [x] Add timelines with database-enforced internal-note vs client-visible update policies.
- [x] Add private document metadata and a private Storage bucket with authorized reads/uploads.
- [x] Add bilingual case workspace UI, status updates, upload validation, and signed downloads.
- [x] Add CI migration and RLS smoke tests for case/client isolation.
- [ ] Pass GitHub CI after Phase 6 changes.
- [ ] Verify the Phase 6 migration is applied to the connected Supabase project.
- [ ] Complete the live runtime acceptance checklist in docs/PHASE-6-CASE-WORKSPACES.md.

## Phase 7 — Conversations and notifications (accepted; CI and user-reported live checks passed)
- [x] Add client-started conversations with active lawyer/assistant participants and optional case association at the database layer.
- [x] Add participant-scoped conversation/message RLS, suspended-staff access denial, immutable messages, and database rate limiting.
- [x] Add in-app notifications for new messages and conversation status changes; users can mark their own notifications as read.
- [x] Add bilingual conversation list/thread UI and dashboard links.
- [x] Add CI migration and smoke tests for participant isolation, notification delivery, sender identity, and suspended staff.
- [x] Pass GitHub CI after Phase 7 changes (run 39829457800, commit 54fe723).
- [x] Apply the Phase 7 and security-hardening migrations to the connected Supabase project through the controlled workflow.
- [x] Complete the live runtime acceptance checklist; user confirmed all five grouped checks passed on 2026-10-22.
- [ ] Realtime delivery remains deferred; new messages appear through normal refresh/navigation.

## Phase 8 — Verification and hardening (automated regression matrix passing; live and audit checks pending)
- [x] Extend CI with cross-feature RLS deny checks for unrelated clients/lawyers, anonymous access, appointment status transitions, and the appointment overlap exclusion constraint.
- [x] Run the full migration chain and Phase 3–8 SQL regression scripts in CI.
- [x] Pass typecheck, lint, and production build on commit b06c0ac.
- [ ] Verify two genuinely concurrent booking requests against the connected Supabase project.
- [ ] Complete keyboard, focus, accessible-name, contrast, and mobile checks on the critical flows.
- [ ] Run and review a dependency vulnerability audit; resolve any high/critical findings.
- [ ] Review production environment, auth redirects, private Storage policies, backups/retention, and performance with realistic data.
- [ ] Publish the Phase 8 report with evidence and explicitly list anything not verified.

## Phase 9 — Deployment and handover
- Configure hosting and environment secrets.
- Apply migrations through a controlled workflow.
- Production smoke tests, rollback notes, backup/retention notes, and owner handover guide.

## Approval rules
- Files written do not by themselves prove a phase is complete.
- Report changed files, tests run, and what remains unverified.
- Ask for approval before beginning the next phase.
- Do not deploy or alter production data without explicit authorization.
