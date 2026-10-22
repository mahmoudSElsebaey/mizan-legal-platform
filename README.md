# Mizan Legal — ميزان للمحاماة

Bilingual public website and legal-office platform foundation built with Next.js App Router, TypeScript, Tailwind CSS, and Supabase.

> The public website, authentication foundation, and Phase 4 administration implementation are in place. Phase 4 still requires its Supabase migration and CI/runtime acceptance checks before it can be considered complete. Booking, case workspaces, and chat are future phases. Confirm all legal content with the office before production use.

## Requirements
- Node.js 20.9 or newer
- npm
- A Supabase project (needed when testing auth/data integration)

## Local setup
1. Clone this repository.
2. Run npm ci.
3. Copy .env.example to .env.local.
4. Add the Supabase Project URL and publishable key to .env.local.
5. Optionally set NEXT_PUBLIC_SITE_URL to the canonical public origin before deployment; keep it unset for local development.
6. Run npm run dev and open http://localhost:3000. The login page's demo account panel is development-only and appears only when DEMO_SEED_PASSWORD is configured.

On Windows PowerShell:

    Copy-Item .env.example .env.local
    npm install
    npm run dev

The app redirects / to Arabic (/ar). Use /en for English. Public pages include /[locale]/office, /[locale]/lawyer, /[locale]/services, /[locale]/services/[slug], /[locale]/insights, and /[locale]/insights/[slug].

## Environment safety
- Never commit .env.local.
- Never expose a Supabase service_role or secret key in browser code or any NEXT_PUBLIC_* variable.
- A publishable key is designed to be public; the Phase 3 profiles/staff_members tables use RLS.
- Never commit the service-role key. The demo seed script requires it only in your local .env.local and refuses remote seeding unless explicitly allowed.
- Seed demo users only in a dedicated development/staging Supabase project. See docs/PHASE-3-SETUP.md.
- Before testing Phase 4 admin pages, apply `supabase/migrations/20261022000200_phase4_administration.sql` once in the development/staging Supabase SQL Editor, then follow `docs/PHASE-4-SETUP.md`.

## Commands
- npm run dev — local development
- npm run build — production build
- npm run lint — ESLint
- npm run typecheck — TypeScript checks
- npm run seed:demo — create/update five demo users (requires server-only SUPABASE_SERVICE_ROLE_KEY and DEMO_SEED_PASSWORD; see docs/PHASE-3-SETUP.md)

See docs/PHASE-0-ARCHITECTURE.md, docs/DATABASE-ERD.md, docs/SECURITY-PLAN.md, docs/ROADMAP.md, docs/PHASE-1-SETUP.md, docs/PHASE-3-SETUP.md, and docs/PHASE-4-SETUP.md.
