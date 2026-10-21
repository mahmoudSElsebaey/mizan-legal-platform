# Phase 1 — Application scaffold

## Included
- Next.js App Router and TypeScript setup
- Tailwind CSS v4 via PostCSS
- Mizan Legal responsive bilingual homepage
- Arabic default route (/ar) and English route (/en)
- Locale metadata and RTL/LTR direction
- Supabase browser/server client helpers and session-refresh middleware foundation
- Zod validation for required public Supabase environment values
- .env.example and .gitignore rules for local environment files

## Not implemented yet
- Authentication forms or protected portal routes
- SQL migrations, tables, RLS policies, or storage buckets
- Appointment availability or booking logic
- Client/lawyer dashboards, case records, messages, or notifications
- Live Supabase connection verification, tests, or deployment

## Validate locally
Run: npm install, npm run typecheck, npm run lint, npm run build. These commands have not yet been executed in this remote repository workflow.

Copy .env.example to .env.local and provide the Supabase Project URL and publishable key. Do not commit local environment files.
