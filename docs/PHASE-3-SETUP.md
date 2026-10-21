# Phase 3 — Authentication and Access Control Setup

**Status:** initial identity/access migration committed; not applied or tested against Supabase yet.

## Scope

This phase establishes:
- A public profile row provisioned for each Supabase Auth user.
- Staff roles: `owner`, `admin`, `lawyer`, and `assistant`.
- Staff statuses: `pending`, `active`, and `suspended`.
- Row Level Security (RLS) on `profiles` and `staff_members`.
- Restricted self-service profile updates and trusted staff-role assignment rules.

This migration does not yet implement sign-in/sign-up UI, password recovery UI, protected application routes, staff invitations, or automated role/RLS tests.

## Before applying

1. Confirm the Supabase dashboard project is the intended development project.
2. Review `supabase/migrations/20261022000100_phase3_identity_access.sql`.
3. Apply the SQL in the Supabase SQL Editor in the development project only.
4. Do not put a service-role/secret key in browser-exposed environment variables or commit it to Git.

Committing a migration file to GitHub does **not** apply it to the Supabase database.

## Bootstrap the first owner

1. Register the intended office-owner account through Supabase Auth after the app's registration flow is available, or create the Auth user through the Supabase dashboard.
2. Confirm the account exists and that its profile row was created by the Auth trigger.
3. In the Supabase SQL Editor, replace `owner@example.com` with the exact email of the intended owner and run:

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

This operation must be performed only by a trusted project owner in the Supabase dashboard. Do not expose an endpoint that allows a user to promote themselves to staff or owner.

Verify that exactly the intended account is an active owner:

```sql
select u.email, sm.role, sm.status
from public.staff_members sm
join auth.users u on u.id = sm.profile_id
where sm.role = 'owner' and sm.status = 'active';
```

## Verification checklist

After applying the migration, verify:
- Tables `profiles` and `staff_members` exist.
- RLS is enabled on both tables.
- A newly created Auth user gets a `profiles` row but no staff role.
- Anonymous users cannot read profile or staff records.
- An authenticated user can read/update only their own allowed profile fields.
- A normal user cannot assign themselves a staff role.
- Only an active owner/admin can manage staff; only an active owner can assign/manage an owner role or delete staff records.

These checks have not been run yet. Record the results before treating Phase 3.1 as complete.
