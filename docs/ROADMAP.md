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

## Phase 3 — Authentication and access control (started; database migration not yet applied or tested)
- [x] Draft initial profiles and staff-members schema migration with RLS policies.
- [x] Document trusted first-owner bootstrap procedure.
- [ ] Apply migration to the intended Supabase development project.
- [ ] Verify Auth profile provisioning and role/RLS allow-deny behavior.
- [ ] Implement sign-in/up and password recovery.
- [ ] Implement safe session handling and protected server routes.
- [ ] Add automated role-based access tests and record actual results.

## Phase 4 — Administration
- Staff/client management, services/practice areas, content/settings.
- Server-side validation and audit trail for privileged changes.

## Phase 5 — Appointments
- Availability rules and exceptions.
- Request/approval/confirmation/cancellation workflow.
- Database-level double-booking protection and tests.

## Phase 6 — Client and lawyer workspaces
- Assigned cases, timelines, internal notes, client-visible updates.
- Secure document metadata and Storage access.
- Permission-aware dashboards and empty states.

## Phase 7 — Conversations and notifications
- Participant-controlled conversations and message policies.
- Optional Realtime updates after authorization rules are proven.
- In-app notifications and abuse controls.

## Phase 8 — Verification and hardening
- Unit/integration/end-to-end tests for critical flows.
- RLS allow/deny matrix and booking concurrency checks.
- Accessibility, performance, dependency, and production-configuration checks.

## Phase 9 — Deployment and handover
- Configure hosting and environment secrets.
- Apply migrations through a controlled workflow.
- Production smoke tests, rollback notes, backup/retention notes, and owner handover guide.

## Approval rules
- Files written do not by themselves prove a phase is complete.
- Report changed files, tests run, and what remains unverified.
- Ask for approval before beginning the next phase.
- Do not deploy or alter production data without explicit authorization.
