# Phase 5 — Appointments

## Included on main

- Weekly lawyer availability, one rule per weekday, in the Africa/Cairo office timezone.
- Date-specific exceptions to close a date or override it with special hours.
- Authenticated client booking requests with an optional published practice area and a short non-confidential message.
- Workflow: requested → approved → confirmed → completed, with cancellation and rejection paths.
- Row-level security for clients, assigned lawyers, and active office owners/admins.
- Database triggers validate an active lawyer, the office-local schedule/exception, future start time, same-day interval, and a maximum two-hour duration.
- A per-lawyer transaction advisory lock and overlap query prevent concurrent overlapping active appointments. Requested, approved, and confirmed appointments hold the slot.
- Database-level status-transition enforcement, not just UI validation.
- Localized Arabic/English interface with Cairo timezone conversion and display.
- A safe signed-in lawyer directory function exposes only active lawyer IDs and display names.

## Apply the migration once

Use a dedicated development/staging Supabase project, not production. Open SQL Editor and run:

supabase/migrations/20261022000300_phase5_appointments.sql

Run it once only. Do not re-run after success.

## Local checks

From PowerShell in the project directory:

~~~powershell
git switch main
git pull origin main
npm ci
npm run typecheck
npm run lint
npm run build
~~~

GitHub Actions applies all three migrations to an ephemeral PostgreSQL instance and runs SQL smoke checks for appointment availability and overlapping bookings. A green CI run validates compilation and migration behavior in the test database, not your actual Supabase project.

## Runtime acceptance checklist

- [ ] Active lawyer saves weekly hours and a date exception.
- [ ] Client can request a 30-minute slot within the lawyer's availability.
- [ ] A request outside weekly hours or on a closed exception is rejected by the database.
- [ ] Two overlapping active appointments for the same lawyer cannot both be created, including concurrent requests.
- [ ] Client can cancel their own future request but cannot approve/reject another client's appointment.
- [ ] Assigned lawyer can approve/reject a request, confirm an approved appointment, and complete a confirmed appointment.
- [ ] Owner/admin can manage the workflow; unrelated clients cannot read the appointment.
- [ ] Arabic and English pages show Cairo-local date/time correctly.

## Scope notes

- Booking requests hold the selected slot until rejected or cancelled.
- Each appointment is 30 minutes in the UI; the database accepts intervals up to two hours for future flexibility.
- Reminders, calendar sync, payment/deposits, real-time updates, and client/lawyer case workspace belong to later phases.
- The current UI lets each lawyer manage their own availability. Owner/admin cross-lawyer schedule editing is a follow-up enhancement.
