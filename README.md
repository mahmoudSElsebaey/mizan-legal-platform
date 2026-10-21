# Mizan Legal

A bilingual (Arabic/English) legal office platform planned with Next.js, TypeScript, Tailwind CSS, and Supabase.

> **Current status: Phase 0 — Planning only.** No application code, database migrations, authentication flows, or deployment have been implemented yet. Phase 1 must not begin until the Phase 0 report is reviewed and explicitly approved.

## Product goals

- Present the law office and its services professionally.
- Support Arabic and English, including RTL/LTR layouts.
- Let prospective clients request and manage appointments.
- Provide authenticated client and lawyer workspaces.
- Organize cases, client-visible documents, and private conversations.
- Provide role-aware administration and an auditable security model.

## Planned stack

- Next.js App Router and TypeScript
- Tailwind CSS and reusable accessible UI components
- Supabase Postgres, Auth, Storage, and optionally Realtime
- Zod for input validation
- Automated tests for critical permissions and booking conflicts

No separate Express API is planned initially; use Next.js server-side code and Supabase where appropriate.

## Project documents

- [Phase 0 architecture and product plan](docs/PHASE-0-ARCHITECTURE.md)
- [Proposed database model](docs/DATABASE-ERD.md)
- [Security and access-control plan](docs/SECURITY-PLAN.md)
- [Delivery roadmap and acceptance gates](docs/ROADMAP.md)

## Environment variables (planned)

Create a local `.env.local` file from these names. Never commit real credentials.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

The publishable/anon key is intended for browser use, but it is not an authorization mechanism by itself. Row Level Security (RLS) and least-privilege policies are required. Never expose a service-role/secret key in client code or commit it to Git.

## Phase gate

The repository currently contains planning documentation only. Do not scaffold the application or create database migrations until the owner approves the Phase 0 report.
