# Phase 0 — Product and Architecture Plan

## 1. Working identity
- Temporary product name: **Mizan Legal**
- Brand direction: confident, calm, discreet, modern, accessible.
- Logo direction: simple geometric balance/monogram mark; temporary SVG until a final identity is approved.
- Proposed palette: Midnight Ink #14263D, Deep Teal #176B67, Warm Ivory #F7F4ED, Muted Brass #B99A62, Slate Gray #657184, White #FFFFFF, Soft Rose #B85C62 for selected error/destructive states.
- Check contrast during implementation; avoid small brass text on light backgrounds.

## 2. Product areas
### Public website
Home, office profile, practice areas, services, lawyer profiles, articles/insights, contact information, FAQs, and appointment request. Include accessible navigation, metadata, sitemap, and search-friendly content. Do not publish invented credentials or legal claims as real facts.

### Authentication
Sign up/sign in, sign out, password reset, session handling, and protected routes. Staff access must be provisioned by an authorized owner/admin; users must not grant themselves staff roles.

### Client portal
Profile, appointment requests/status, explicitly linked cases, client-shared documents, permitted conversations, notifications, and visible case updates.

### Lawyer workspace
Assigned appointments/cases, case timeline, client-visible updates, separate private/internal notes, secure documents, client conversations, and availability management.

### Owner/admin workspace
Manage staff, clients, practice areas, services, appointment statuses, content, and site settings. Role changes and privileged actions must be authorized and logged.

## 3. Application architecture
- Next.js App Router with TypeScript.
- Server Components by default; Client Components only for interactive UI.
- Server Actions/Route Handlers for validated mutations and integrations.
- Supabase Postgres as system of record, Supabase Auth for identity, Storage for private documents, and optionally Realtime after authorization is proven.
- Zod validation at trusted server boundaries.
- Reusable permission helpers for UI, backed by database RLS as the actual security boundary.
- No separate Express server planned for the first iteration.
- Database migrations are the source of truth for schema and RLS changes.

## 4. Proposed repository layout
    src/
      app/[locale]/
        (public)/
        (auth)/
        (client-portal)/
        (lawyer-workspace)/
        (dashboard)/
      app/api/
      components/{ui,layout,shared}/
      features/{appointments,cases,conversations,documents,lawyers,services}/
      lib/{supabase,auth,permissions,validations,services,i18n}/
      types/
    supabase/{migrations,seed.sql}
    tests/
    docs/

This is a proposal, not an existing implementation.

## 5. Localization and accessibility
- Support Arabic and English from the beginning, including locale-aware routing and RTL/LTR.
- Avoid hard-coded user-facing strings; organize translation dictionaries by feature.
- Prefer logical CSS properties over left/right-specific styling.
- Ensure keyboard navigation, visible focus states, form labels, useful validation messages, responsive layouts, and sufficient contrast.
- Format dates/times by locale and the configured office timezone.

## 6. Decisions to confirm
- Real office name, logo, address, phone, email, lawyers, and practice areas are not yet provided; use clearly marked placeholders.
- Decide whether appointments require staff approval or can be auto-confirmed.
- Define which staff roles may access client contact data, case files, internal notes, and audit events.
- Define retention/deletion rules for messages, case documents, and inactive accounts.
- Confirm production domain, office timezone, and privacy/legal notices.
- Confirm the Supabase project is dedicated to this application and identify its environment.

## 7. Supabase project reference
The supplied dashboard URL identifies project reference lxjifpbfmmwuvvohzdvx. This does not grant the assistant direct dashboard/database access. Project configuration, secrets, schema, and RLS must be inspected or applied through an authorized workflow. Do not put secret keys or database passwords in this repository or chat.
