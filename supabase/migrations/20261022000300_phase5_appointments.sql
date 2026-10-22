-- Phase 5: appointment availability, booking workflow, and overlap protection.
-- Apply once in the intended development/staging Supabase project.

begin;

create type public.appointment_status as enum ('requested','approved','confirmed','cancelled','rejected','completed');

create table public.lawyer_availability (
  id uuid primary key default gen_random_uuid(),
  lawyer_id uuid not null references public.profiles(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  is_available boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint lawyer_availability_valid_time check (end_time > start_time),
  constraint lawyer_availability_one_rule_per_day unique (lawyer_id, weekday)
);

create table public.lawyer_availability_exceptions (
  id uuid primary key default gen_random_uuid(),
  lawyer_id uuid not null references public.profiles(id) on delete cascade,
  exception_date date not null,
  is_available boolean not null default false,
  start_time time,
  end_time time,
  note text not null default '' check (char_length(note) <= 240),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint lawyer_exception_unique_date unique (lawyer_id, exception_date),
  constraint lawyer_exception_valid_time check (
    (is_available = false and start_time is null and end_time is null)
    or (is_available = true and start_time is not null and end_time is not null and end_time > start_time)
  )
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete restrict,
  lawyer_id uuid not null references public.profiles(id) on delete restrict,
  service_id uuid references public.office_services(id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.appointment_status not null default 'requested',
  client_message text not null default '' check (char_length(client_message) <= 1200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  decided_at timestamptz,
  constraint appointment_valid_time check (ends_at > starts_at and ends_at - starts_at <= interval '2 hours')
);

-- The exclusion constraint is the final concurrency-safe guard; the trigger below
-- adds schedule validation and a friendlier overlap message.
create extension if not exists btree_gist;
alter table public.appointments
  add constraint appointments_no_overlapping_active
  exclude using gist (
    lawyer_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  )
  where (status in ('requested','approved','confirmed'));

create index appointments_client_start_idx on public.appointments(client_id, starts_at desc);
create index appointments_lawyer_start_idx on public.appointments(lawyer_id, starts_at);
create index appointments_status_start_idx on public.appointments(status, starts_at);
create index lawyer_availability_exception_date_idx on public.lawyer_availability_exceptions(lawyer_id, exception_date);

create trigger lawyer_availability_set_updated_at before update on public.lawyer_availability
for each row execute function public.set_updated_at();
create trigger appointments_set_updated_at before update on public.appointments
for each row execute function public.set_updated_at();

-- A per-lawyer advisory lock closes concurrent double-booking races.
create or replace function public.guard_appointment_booking()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  local_start timestamp;
  local_end timestamp;
  local_day date;
  local_weekday smallint;
  exception_row public.lawyer_availability_exceptions%rowtype;
  weekly_row public.lawyer_availability%rowtype;
begin
  -- Status-only transitions do not revalidate a historical appointment's
  -- original schedule. This allows completion after the meeting time.
  if tg_op = 'UPDATE'
     and new.lawyer_id = old.lawyer_id
     and new.starts_at = old.starts_at
     and new.ends_at = old.ends_at then
    if new.status in ('cancelled','rejected','completed') then
      return new;
    end if;
    perform pg_advisory_xact_lock(hashtextextended(new.lawyer_id::text, 0));
    if exists (
      select 1 from public.appointments a
      where a.lawyer_id = new.lawyer_id
        and a.id is distinct from new.id
        and a.status in ('requested','approved','confirmed')
        and tstzrange(a.starts_at, a.ends_at, '[)') && tstzrange(new.starts_at, new.ends_at, '[)')
    ) then
      raise exception 'Lawyer already has an appointment at that time' using errcode = '23P01';
    end if;
    return new;
  end if;

  if new.starts_at <= now() then
    raise exception 'Appointment must be in the future' using errcode = '22007';
  end if;
  if not exists (
    select 1 from public.staff_members sm
    where sm.profile_id = new.lawyer_id and sm.role = 'lawyer' and sm.status = 'active'
  ) then
    raise exception 'Selected lawyer is not active' using errcode = '23514';
  end if;

  if new.service_id is not null and not exists (
    select 1 from public.office_services s where s.id = new.service_id and s.is_published
  ) then
    raise exception 'Selected service is not published' using errcode = '23514';
  end if;

  local_start := new.starts_at at time zone 'Africa/Cairo';
  local_end := new.ends_at at time zone 'Africa/Cairo';
  local_day := local_start::date;
  local_weekday := extract(dow from local_start)::smallint;
  if local_start::date <> local_end::date then
    raise exception 'Appointments must start and end on the same office-local date' using errcode = '23514';
  end if;

  select * into exception_row from public.lawyer_availability_exceptions e
  where e.lawyer_id = new.lawyer_id and e.exception_date = local_day;
  if found then
    if not exception_row.is_available
       or local_start::time < exception_row.start_time
       or local_end::time > exception_row.end_time then
      raise exception 'Appointment is outside exception availability' using errcode = '23514';
    end if;
  else
    select * into weekly_row from public.lawyer_availability a
    where a.lawyer_id = new.lawyer_id and a.weekday = local_weekday;
    if not found or not weekly_row.is_available
       or local_start::time < weekly_row.start_time
       or local_end::time > weekly_row.end_time then
      raise exception 'Appointment is outside weekly availability' using errcode = '23514';
    end if;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(new.lawyer_id::text, 0));
  if exists (
    select 1 from public.appointments a
    where a.lawyer_id = new.lawyer_id
      and a.id is distinct from new.id
      and a.status in ('requested','approved','confirmed')
      and tstzrange(a.starts_at, a.ends_at, '[)') && tstzrange(new.starts_at, new.ends_at, '[)')
  ) then
    raise exception 'Lawyer already has an appointment at that time' using errcode = '23P01';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_appointment_booking() from public, anon, authenticated;
create trigger appointments_guard_booking
before insert or update of lawyer_id, starts_at, ends_at, status on public.appointments
for each row execute function public.guard_appointment_booking();

-- Expose only active lawyer IDs and display names to signed-in booking clients.
create or replace function public.get_active_lawyer_directory()
returns table (profile_id uuid, full_name text)
language sql stable security definer set search_path = ''
as $
  select p.id, p.full_name
  from public.profiles p
  join public.staff_members sm on sm.profile_id = p.id
  where sm.role = 'lawyer' and sm.status = 'active'
  order by p.full_name;
$;
revoke all on function public.get_active_lawyer_directory() from public, anon;
grant execute on function public.get_active_lawyer_directory() to authenticated;

alter table public.lawyer_availability enable row level security;
alter table public.lawyer_availability_exceptions enable row level security;
alter table public.appointments enable row level security;

create policy "availability_read_authenticated"
on public.lawyer_availability for select to authenticated using (true);
create policy "availability_manage_own_or_admin"
on public.lawyer_availability for all to authenticated
using (
  (lawyer_id = (select auth.uid()) and (select public.has_active_staff_role(array['lawyer']::public.staff_role[])))
  or (select public.has_active_staff_role(array['owner','admin']::public.staff_role[]))
)
with check (
  (lawyer_id = (select auth.uid()) and (select public.has_active_staff_role(array['lawyer']::public.staff_role[])))
  or (select public.has_active_staff_role(array['owner','admin']::public.staff_role[]))
);

create policy "exceptions_read_owner_or_admin_or_lawyer"
on public.lawyer_availability_exceptions for select to authenticated
using (
  (lawyer_id = (select auth.uid()) and (select public.has_active_staff_role(array['lawyer']::public.staff_role[])))
  or (select public.has_active_staff_role(array['owner','admin']::public.staff_role[]))
);
create policy "exceptions_manage_own_or_admin"
on public.lawyer_availability_exceptions for all to authenticated
using (
  (lawyer_id = (select auth.uid()) and (select public.has_active_staff_role(array['lawyer']::public.staff_role[])))
  or (select public.has_active_staff_role(array['owner','admin']::public.staff_role[]))
)
with check (
  (lawyer_id = (select auth.uid()) and (select public.has_active_staff_role(array['lawyer']::public.staff_role[])))
  or (select public.has_active_staff_role(array['owner','admin']::public.staff_role[]))
);

create policy "appointments_read_participants_or_admin"
on public.appointments for select to authenticated
using (
  client_id = (select auth.uid())
  or (lawyer_id = (select auth.uid()) and (select public.has_active_staff_role(array['lawyer']::public.staff_role[])))
  or (select public.has_active_staff_role(array['owner','admin']::public.staff_role[]))
);
create policy "appointments_client_request"
on public.appointments for insert to authenticated
with check (client_id = (select auth.uid()) and status = 'requested');
create policy "appointments_update_participant"
on public.appointments for update to authenticated
using (
  (client_id = (select auth.uid()) and status in ('requested','approved','confirmed'))
  or (lawyer_id = (select auth.uid()) and (select public.has_active_staff_role(array['lawyer']::public.staff_role[])))
  or (select public.has_active_staff_role(array['owner','admin']::public.staff_role[]))
)
with check (
  (client_id = (select auth.uid()) and status = 'cancelled')
  or (lawyer_id = (select auth.uid()) and (select public.has_active_staff_role(array['lawyer']::public.staff_role[])))
  or (select public.has_active_staff_role(array['owner','admin']::public.staff_role[]))
);

revoke all on public.lawyer_availability, public.lawyer_availability_exceptions, public.appointments from anon, authenticated;
grant select, insert, update, delete on public.lawyer_availability to authenticated;
grant select, insert, update, delete on public.lawyer_availability_exceptions to authenticated;
grant select, insert on public.appointments to authenticated;
grant update (status) on public.appointments to authenticated;


-- Enforce the state machine at the database boundary as well as in server actions.
create or replace function public.guard_appointment_status_transition()
returns trigger language plpgsql security definer set search_path = ''
as $
declare
  is_office_admin boolean;
  is_assigned_lawyer boolean;
begin
  if new.status = old.status or (select auth.uid()) is null then
    return new;
  end if;

  if old.client_id = (select auth.uid()) then
    if new.status <> 'cancelled'
       or old.status not in ('requested','approved','confirmed')
       or old.starts_at <= now() then
      raise exception 'Client may only cancel their own future appointment' using errcode = '42501';
    end if;
    return new;
  end if;

  is_office_admin := (select public.has_active_staff_role(array['owner','admin']::public.staff_role[]));
  is_assigned_lawyer := new.lawyer_id = (select auth.uid())
    and (select public.has_active_staff_role(array['lawyer']::public.staff_role[]));

  if not is_office_admin and not is_assigned_lawyer then
    raise exception 'Not authorized to update this appointment' using errcode = '42501';
  end if;

  if not (
    (old.status = 'requested' and new.status in ('approved','rejected','cancelled'))
    or (old.status = 'approved' and new.status in ('confirmed','cancelled'))
    or (old.status = 'confirmed' and new.status in ('completed','cancelled'))
  ) then
    raise exception 'Invalid appointment status transition' using errcode = '23514';
  end if;
  return new;
end;
$;
revoke all on function public.guard_appointment_status_transition() from public, anon, authenticated;
create trigger appointments_guard_status_transition
before update of status on public.appointments
for each row execute function public.guard_appointment_status_transition();

commit;
