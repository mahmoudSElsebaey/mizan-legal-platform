# Mizan Legal — ميزان للمحاماة

Bilingual public website and legal-office platform foundation built with Next.js App Router, TypeScript, Tailwind CSS, and Supabase.

> Phase 2 public website routes are implemented with sample educational content and placeholder office details. Authentication, database migrations, RLS policies, booking, client/lawyer portals, and chat are not implemented yet. Confirm all legal content with the office before production use.

## Requirements
- Node.js 20.9 or newer
- npm
- A Supabase project (needed when testing auth/data integration)

## Local setup
1. Clone this repository.
2. Run npm install.
3. Copy .env.example to .env.local.
4. Add the Supabase Project URL and publishable key to .env.local.
5. Optionally set NEXT_PUBLIC_SITE_URL to the canonical public origin before deployment; keep it unset for local development.
6. Run npm run dev and open http://localhost:3000.

On Windows PowerShell:

    Copy-Item .env.example .env.local
    npm install
    npm run dev

The app redirects / to Arabic (/ar). Use /en for English. Public pages include /[locale]/office, /[locale]/lawyer, /[locale]/services, /[locale]/services/[slug], /[locale]/insights, and /[locale]/insights/[slug].

## Environment safety
- Never commit .env.local.
- Never expose a Supabase service_role or secret key in browser code or any NEXT_PUBLIC_* variable.
- A publishable key is designed to be public, but database access must be protected by RLS before real user data is stored.
- These helpers are scaffolding; no database schema or security policy has been applied.

## Commands
- npm run dev — local development
- npm run build — production build
- npm run lint — ESLint
- npm run typecheck — TypeScript checks

See docs/PHASE-0-ARCHITECTURE.md, docs/DATABASE-ERD.md, docs/SECURITY-PLAN.md, docs/ROADMAP.md, and docs/PHASE-1-SETUP.md.
