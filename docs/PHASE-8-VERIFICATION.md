# Phase 8 — Verification and hardening

**Status:** automated CI regression checks pass on `main` at commit `b06c0ac44198fa08633787a5ae9a2165fa72d317`. Phase 8 is **not complete** until the live, accessibility, dependency-audit, and production-configuration checks below have evidence.

## Automated checks now in CI

GitHub Actions run: https://github.com/mahmoudSElsebaey/mizan-legal-platform/actions/runs/39834107883

- TypeScript type check, ESLint, and production build.
- Fresh PostgreSQL test database: apply Phase 3–7 migrations in order and execute their SQL smoke tests.
- New `scripts/ci-phase8-hardening-smoke-test.sql` regression matrix:
  - unrelated client cannot read another client's appointment;
  - client cannot approve their own appointment;
  - assigned lawyer cannot skip the appointment state machine;
  - unassigned lawyer cannot read a confidential case or another conversation/messages;
  - anonymous role cannot query private appointments or conversations;
  - the named appointment exclusion constraint exists as the database-level overlap guard.

The PostgreSQL CI environment uses a lightweight Supabase Auth/Storage shim. Passing CI does **not** prove the actual connected Supabase project's policies, auth flows, Storage behavior, or real concurrent request behavior.

## Required before Phase 8 can be accepted

- [ ] **Live booking concurrency:** in the development/staging Supabase project, submit two overlapping requests for the same lawyer at nearly the same time. Confirm no more than one active booking is committed. Capture the result without exposing credentials or client data.
- [ ] **RLS/runtime matrix:** use separate client, unrelated client, assigned lawyer, unassigned lawyer, owner/admin, and signed-out sessions to verify appointments, cases, documents, conversations, and notifications.
- [ ] **Accessibility:** keyboard-only navigation; visible focus; logical heading order; labeled inputs and error messages; accessible dialog/menu names; contrast; browser zoom; Arabic RTL and English LTR on mobile.
- [ ] **Performance:** inspect production build and browser performance on the main public pages and authenticated dashboard using representative, non-sensitive data. Record measured results rather than estimates.
- [ ] **Dependency audit:** run `npm audit`, review production and development findings, fix high/critical issues or document a justified exception.
- [ ] **Production configuration:** verify auth callback/redirect allowlists, canonical site URL, HTTPS, server-only secrets, private Storage bucket and policies, backups/retention, error handling, and rollback notes.

## Known limitations

- CI does not launch a real browser or run automated end-to-end tests.
- The exclusion-constraint regression confirms the database guard exists and the existing smoke test rejects an overlapping slot sequentially; it does not simulate two genuinely concurrent network requests.
- No claim is made that accessibility, performance under load, dependency audit, or production readiness has passed until those checks are actually run.

## Acceptance gate

Keep Phase 8 in progress until all required checks have evidence, issues are fixed or explicitly accepted, and the owner approves moving to Phase 9.
