# Supabase database migration automation

This repository keeps database changes in `supabase/migrations/`. Vercel deploys the Next.js application, but it does **not** apply these SQL migrations by itself.

## Important: one-time baseline before enabling automation

Phases 3, 4, and 5 were originally applied through the Supabase SQL Editor. SQL Editor execution does not necessarily register those files in Supabase's migration history. Do not enable automatic `db push` until the remote migration history has been checked; otherwise the CLI may try to apply existing schema changes again.

Run these commands from the project directory in PowerShell:

```powershell
npx supabase --version
npx supabase login
npx supabase link --project-ref lxjifpbfmmwuvvohzdvx
npx supabase migration list --linked
```

The link step may ask for the database password. Enter it only in the CLI prompt; never commit it or paste it into chat.

Review the migration list. If the three migrations below are already recorded as applied remotely, do not repair them again. If the database schema has been verified to match the three files, but the remote history does not record them, register the existing migrations as applied:

```powershell
npx supabase migration repair --status applied 20261022000100 20261022000200 20261022000300 --linked
npx supabase migration list --linked
```

**Only run the repair command after confirming the live schema matches those migrations.** Repair changes migration history; it does not run the SQL. If the migration list shows a different state, stop and investigate instead of guessing.

## Configure GitHub Actions secrets

In GitHub, open **Settings → Secrets and variables → Actions** for this repository and add these repository secrets:

- `SUPABASE_ACCESS_TOKEN`: a Supabase personal access token with access to this project.
- `SUPABASE_DB_PASSWORD`: the database password for this Supabase project.

Do not use the publishable key or service-role key for these values. Do not put either secret in source files.

Then open **Settings → Secrets and variables → Actions → Variables** and create this repository variable:

- `SUPABASE_MIGRATIONS_DEPLOY_ENABLED` = `true`

The deployment workflow is deliberately gated by this variable until the one-time migration-history baseline is completed. Leave it unset or set it to `false` until the baseline is verified.

## After setup

1. Add a new, forward-only migration file under `supabase/migrations/`, using a unique timestamp/version prefix, for example `20261023090000_phase6_cases.sql`.
2. Test it locally or in a disposable/staging database first.
3. Commit and push the migration to `main`.
4. GitHub Actions will link the project and run `supabase db push` against the configured Supabase project.
5. Check the **Actions** tab before considering the migration deployed.

The workflow only runs for pushes that change migration/config files on `main`, and is gated until explicitly enabled. A migration failure fails the workflow; it does not mean the schema was successfully deployed.

## Local workflow

For local development, use:

```powershell
npx supabase migration new describe_the_change
# Edit the generated SQL file, then test it in a local/staging database.
npx supabase db push --linked
```

Use `db push` only after the linked project's migration history is correct. Do not edit already-applied migration files to change existing production schema; create a new migration instead.

## Vercel deployment

Vercel builds and hosts the Next.js app and receives the required application environment variables in its project settings. It does not automatically run Supabase migrations just because a new app version is deployed. With this setup, GitHub Actions manages database migrations separately, while Vercel manages the app deployment. This separation is intentional and safer than running schema changes from the app at startup.
