# Phase 3 — Authentication and Access Control Setup

**Status:** the identity/access migration was applied successfully to the intended Supabase project. The user confirmed that both tables have RLS enabled and that policies are present. End-to-end Auth flows and allow/deny behavior still require testing.

## Implemented

- `profiles` rows are provisioned by a database trigger when an Auth user is created.
- Staff roles: `owner`, `admin`, `lawyer`, and `assistant`; statuses: `pending`, `active`, and `suspended`.
- RLS policies for profiles and staff assignments, with restricted self-service profile fields and staff role assignment.
- Localized sign-in, registration, password recovery, and password update screens at `/[locale]/login`, `/[locale]/register`, `/[locale]/forgot-password`, and `/[locale]/reset-password`.
- Supabase Auth callback at `/auth/callback`.
- Server-protected account page at `/[locale]/dashboard`, which redirects unauthenticated users to sign-in.

## Required Supabase Auth configuration

In Supabase Dashboard → Authentication → URL Configuration, set the local site URL to `http://localhost:3000` for local development and add these redirect URLs:
- `http://localhost:3000/auth/callback`
- Your deployed app's exact callback URL when deploying (for example, `https://YOUR-DOMAIN/auth/callback`).

Use the real deployment origin instead of the example placeholder. Do not expose a service-role/secret key in browser code or commit it to Git.

## Bootstrap the first owner

1. Pull the latest `main` branch and start the app locally.
2. Open `/ar/register` and register using the intended office owner's email. If email confirmation is enabled, confirm the address first.
3. In Supabase Dashboard → Authentication → Users, verify that the intended user exists.
4. In SQL Editor, replace `owner@example.com` with the exact email of that account and run the following once:

```sql
insert into public.staff_members (profile_id, role, status)
select id, 'owner'::public.staff_role, 'active'::public.staff_status
from auth.users
where lower(email) = lower('owner@example.com')
on conflict (profile_id) do update
set role = 'owner',
    status = 'active',
    updated_at = now();
```

Only a trusted project owner should run this bootstrap SQL in the Supabase dashboard. Never expose an endpoint that allows a user to promote themselves to staff or owner.

Verify the active owner assignment:

```sql
select u.email, sm.role, sm.status
from public.staff_members sm
join auth.users u on u.id = sm.profile_id
where sm.role = 'owner' and sm.status = 'active';
```

Do not continue unless the result contains only the intended owner account.

## Verification checklist

Database checks already confirmed by the user:
- [x] Tables `profiles` and `staff_members` exist.
- [x] RLS is enabled on both tables.
- [x] Policies are present in `pg_policies`.

Still to test:
- [ ] A new Auth user gets a profile row and no staff role.
- [ ] Anonymous users cannot read profile or staff records.
- [ ] Authenticated users can read/update only their own permitted profile fields.
- [ ] A normal user cannot assign themselves a staff role.
- [ ] Admins can manage only lawyer/assistant roles; owners can manage all staff except changing/deleting their own assignment.
- [ ] Sign-in, email confirmation, password recovery, and password update work with the project's redirect configuration.
- [ ] Unauthenticated access to `/[locale]/dashboard` redirects to sign-in.
- [ ] Run `npm run typecheck`, `npm run lint`, and `npm run build` locally and record the actual outcomes.

Do not mark Phase 3 complete until the remaining checks pass.
