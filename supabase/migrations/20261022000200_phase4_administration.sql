-- Phase 4: office administration, managed practice areas, settings, and audit history.
-- Review and apply once in Supabase SQL Editor. Do not re-run after a successful application.

begin;

alter table public.profiles add column email text;
update public.profiles p set email = u.email from auth.users u where u.id = p.id;
create index profiles_email_idx on public.profiles(lower(email));

create or replace function public.sync_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $
begin
  update public.profiles
  set email = new.email,
      full_name = left(coalesce(new.raw_user_meta_data ->> 'full_name', full_name), 120),
      locale = case when new.raw_user_meta_data ->> 'locale' = 'en' then 'en' else locale end
  where id = new.id;
  return new;
end;
$;
revoke all on function public.sync_auth_user_profile() from public, anon, authenticated;
create trigger on_auth_user_updated
after update of email, raw_user_meta_data on auth.users
for each row execute function public.sync_auth_user_profile();

create table public.office_services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  title_ar text not null check (char_length(title_ar) between 2 and 160),
  title_en text not null check (char_length(title_en) between 2 and 160),
  description_ar text not null default '' check (char_length(description_ar) <= 2000),
  description_en text not null default '' check (char_length(description_en) <= 2000),
  is_published boolean not null default false,
  sort_order integer not null default 0 check (sort_order between 0 and 10000),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.office_settings (
  key text primary key check (key ~ '^[a-z][a-z0-9_.-]{1,79}$'),
  value jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  entity_table text not null,
  entity_id text,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_created_at_idx on public.audit_logs(created_at desc);
create index audit_logs_actor_created_at_idx on public.audit_logs(actor_id, created_at desc);

create trigger office_services_set_updated_at before update on public.office_services
for each row execute function public.set_updated_at();
create trigger office_settings_set_updated_at before update on public.office_settings
for each row execute function public.set_updated_at();

-- Append-only audit entries; the trigger function is not executable by API users.
create or replace function public.write_admin_audit_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  before_row jsonb;
  after_row jsonb;
  row_id text;
begin
  if tg_op = 'INSERT' then
    before_row := null;
    after_row := to_jsonb(new);
    row_id := coalesce(after_row ->> 'id', after_row ->> 'profile_id', after_row ->> 'key');
  elsif tg_op = 'UPDATE' then
    before_row := to_jsonb(old);
    after_row := to_jsonb(new);
    row_id := coalesce(after_row ->> 'id', after_row ->> 'profile_id', after_row ->> 'key');
  else
    before_row := to_jsonb(old);
    after_row := null;
    row_id := coalesce(before_row ->> 'id', before_row ->> 'profile_id', before_row ->> 'key');
  end if;

  insert into public.audit_logs(actor_id, action, entity_table, entity_id, old_data, new_data)
  values (auth.uid(), tg_op, tg_table_name, row_id, before_row, after_row);
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function public.write_admin_audit_log() from public, anon, authenticated;

create trigger audit_staff_members
after insert or update or delete on public.staff_members
for each row execute function public.write_admin_audit_log();
create trigger audit_office_services
after insert or update or delete on public.office_services
for each row execute function public.write_admin_audit_log();
create trigger audit_office_settings
after insert or update or delete on public.office_settings
for each row execute function public.write_admin_audit_log();

alter table public.office_services enable row level security;
alter table public.office_settings enable row level security;
alter table public.audit_logs enable row level security;

-- Public visitors can only read published services; active office administrators manage them.
create policy "services_read_published_or_staff"
on public.office_services for select to anon, authenticated
using (is_published or (select public.has_active_staff_role(array['owner','admin']::public.staff_role[])));
create policy "services_manage_admin"
on public.office_services for all to authenticated
using ((select public.has_active_staff_role(array['owner','admin']::public.staff_role[])))
with check ((select public.has_active_staff_role(array['owner','admin']::public.staff_role[])));

-- Settings are private to active office administrators.
create policy "settings_manage_admin"
on public.office_settings for all to authenticated
using ((select public.has_active_staff_role(array['owner','admin']::public.staff_role[])))
with check ((select public.has_active_staff_role(array['owner','admin']::public.staff_role[])));

-- Only active owner/admin users can inspect audit history; there are no client writes.
create policy "audit_read_admin"
on public.audit_logs for select to authenticated
using ((select public.has_active_staff_role(array['owner','admin']::public.staff_role[])));

revoke all on public.office_services, public.office_settings, public.audit_logs from anon, authenticated;
grant select on public.office_services to anon, authenticated;
grant insert, update, delete on public.office_services to authenticated;
grant select, insert, update, delete on public.office_settings to authenticated;
grant select on public.audit_logs to authenticated;
grant usage, select on sequence public.audit_logs_id_seq to authenticated;

-- Existing profile policy exposes only own profile or staff directory. Add the
-- explicit administrative client/staff directory permission for owner/admin.
create policy "profiles_select_admin_directory"
on public.profiles for select to authenticated
using ((select public.has_active_staff_role(array['owner','admin']::public.staff_role[])));

commit;
