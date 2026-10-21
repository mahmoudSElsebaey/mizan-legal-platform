-- Phase 3.1: identity and staff access foundation.
-- Apply manually in Supabase SQL Editor after reviewing this migration.
-- This file is committed to GitHub; committing it does NOT apply it to the database.

begin;

create type public.staff_role as enum ('owner', 'admin', 'lawyer', 'assistant');
create type public.staff_status as enum ('pending', 'active', 'suspended');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 120),
  locale text not null default 'ar' check (locale in ('ar', 'en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.staff_members (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  role public.staff_role not null,
  status public.staff_status not null default 'pending',
  assigned_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index staff_members_role_status_idx
  on public.staff_members (role, status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger staff_members_set_updated_at
before update on public.staff_members
for each row execute function public.set_updated_at();

revoke all on function public.set_updated_at() from public, anon, authenticated;

-- Provision a basic profile for each newly created Auth user.
-- Never copy role or staff status from user-controlled Auth metadata.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, locale)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120),
    case when new.raw_user_meta_data ->> 'locale' = 'en' then 'en' else 'ar' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_auth_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- SECURITY DEFINER helpers avoid recursive RLS evaluation on staff_members.
create or replace function public.has_active_staff_role(allowed_roles public.staff_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.staff_members sm
    where sm.profile_id = (select auth.uid())
      and sm.status = 'active'
      and sm.role = any (allowed_roles)
  );
$$;

create or replace function public.is_active_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.staff_members sm
    where sm.profile_id = (select auth.uid())
      and sm.status = 'active'
  );
$$;

revoke all on function public.has_active_staff_role(public.staff_role[]) from public;
revoke all on function public.is_active_staff() from public;
grant execute on function public.has_active_staff_role(public.staff_role[]) to authenticated;
grant execute on function public.is_active_staff() to authenticated;

alter table public.profiles enable row level security;
alter table public.staff_members enable row level security;

-- Users can read their own profile. Active staff can read profiles belonging to
-- other active staff, but not every client's private profile by default.
create policy "profiles_select_own_or_staff_directory"
on public.profiles for select
to authenticated
using (
  id = (select auth.uid())
  or (
    (select public.is_active_staff())
    and exists (
      select 1
      from public.staff_members sm
      where sm.profile_id = profiles.id
        and sm.status = 'active'
    )
  )
);

-- Limit self-service profile edits to the user's own row.
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

-- Prevent clients from changing IDs or timestamps through the Data API.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, locale) on public.profiles to authenticated;

-- Staff may read the active staff directory; users can always read their own assignment.
create policy "staff_select_self_or_active_staff"
on public.staff_members for select
to authenticated
using (
  profile_id = (select auth.uid())
  or (select public.is_active_staff())
);

-- Owners can assign any staff role. Admins can only assign lawyer/assistant roles.
create policy "staff_insert_owner_admin"
on public.staff_members for insert
to authenticated
with check (
  (
    (select public.has_active_staff_role(array['owner']::public.staff_role[]))
  )
  or (
    role in ('lawyer', 'assistant')
    and (select public.has_active_staff_role(array['admin']::public.staff_role[]))
  )
);

-- Admins may manage only lawyer/assistant rows and cannot promote anyone to admin/owner.
create policy "staff_update_owner_admin"
on public.staff_members for update
to authenticated
using (
  (select public.has_active_staff_role(array['owner']::public.staff_role[]))
  or (
    role in ('lawyer', 'assistant')
    and (select public.has_active_staff_role(array['admin']::public.staff_role[]))
  )
)
with check (
  (select public.has_active_staff_role(array['owner']::public.staff_role[]))
  or (
    role in ('lawyer', 'assistant')
    and (select public.has_active_staff_role(array['admin']::public.staff_role[]))
  )
);

create policy "staff_delete_owner_only"
on public.staff_members for delete
to authenticated
using (
  (select public.has_active_staff_role(array['owner']::public.staff_role[]))
);

revoke all on public.staff_members from anon, authenticated;
grant select on public.staff_members to authenticated;
grant insert (profile_id, role, status, assigned_by) on public.staff_members to authenticated;
grant update (role, status, assigned_by) on public.staff_members to authenticated;
grant delete on public.staff_members to authenticated;

commit;
