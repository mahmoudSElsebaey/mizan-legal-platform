-- Phase 6: confidential case workspaces, timelines, notes, and private documents.
-- Apply through the repository migration workflow or once in the intended Supabase project.

begin;

create type public.case_status as enum ('open','in_progress','waiting_for_client','hearing_scheduled','closed');

create table public.cases (
  id uuid primary key default gen_random_uuid(),
  case_number text not null unique check (case_number ~ '^[A-Z0-9-]{4,40}$'),
  title text not null check (char_length(title) between 3 and 180),
  practice_area text not null default '' check (char_length(practice_area) <= 120),
  description text not null default '' check (char_length(description) <= 4000),
  status public.case_status not null default 'open',
  client_id uuid not null references public.profiles(id) on delete restrict,
  assigned_staff_id uuid not null references public.profiles(id) on delete restrict,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index cases_client_created_idx on public.cases(client_id, created_at desc);
create index cases_staff_updated_idx on public.cases(assigned_staff_id, updated_at desc);
create index cases_status_updated_idx on public.cases(status, updated_at desc);

create table public.case_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete restrict,
  title text not null check (char_length(title) between 2 and 160),
  body text not null check (char_length(body) between 1 and 4000),
  is_client_visible boolean not null default true,
  created_at timestamptz not null default now()
);
create index case_events_case_created_idx on public.case_events(case_id, created_at desc);

create table public.case_documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id) on delete restrict,
  original_name text not null check (char_length(original_name) between 1 and 180),
  storage_path text not null unique check (char_length(storage_path) <= 500),
  mime_type text not null check (mime_type in ('application/pdf','image/jpeg','image/png','text/plain')),
  size_bytes bigint not null check (size_bytes between 1 and 10485760),
  is_client_visible boolean not null default false,
  created_at timestamptz not null default now()
);
create index case_documents_case_created_idx on public.case_documents(case_id, created_at desc);

create or replace function public.can_manage_case(target_case_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.cases c
    where c.id = target_case_id
      and (
        (select public.has_active_staff_role(array['owner','admin']::public.staff_role[]))
        or (
          c.assigned_staff_id = (select auth.uid())
          and (select public.has_active_staff_role(array['lawyer','assistant']::public.staff_role[]))
        )
      )
  );
$$;

create or replace function public.can_access_case(target_case_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.cases c
    where c.id = target_case_id
      and (c.client_id = (select auth.uid()) or (select public.can_manage_case(c.id)))
  );
$$;

revoke all on function public.can_manage_case(uuid) from public;
revoke all on function public.can_access_case(uuid) from public;
grant execute on function public.can_manage_case(uuid) to authenticated;
grant execute on function public.can_access_case(uuid) to authenticated;

create or replace function public.validate_case_assignment()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.staff_members sm
    where sm.profile_id = new.assigned_staff_id
      and sm.status = 'active'
      and sm.role in ('lawyer','assistant')
  ) then
    raise exception 'Case must be assigned to an active lawyer or assistant';
  end if;
  if exists (select 1 from public.staff_members sm where sm.profile_id = new.client_id) then
    raise exception 'A staff account cannot be assigned as the case client';
  end if;
  return new;
end;
$$;
revoke all on function public.validate_case_assignment() from public, anon, authenticated;
create trigger cases_validate_assignment before insert or update
on public.cases for each row execute function public.validate_case_assignment();
create trigger cases_set_updated_at before update on public.cases
for each row execute function public.set_updated_at();

alter table public.cases enable row level security;
alter table public.case_events enable row level security;
alter table public.case_documents enable row level security;

create policy "cases_read_participants"
on public.cases for select to authenticated
using (client_id = (select auth.uid()) or (select public.can_manage_case(id)));

create policy "cases_create_admin"
on public.cases for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (select public.has_active_staff_role(array['owner','admin']::public.staff_role[]))
);

create policy "cases_update_assigned_staff"
on public.cases for update to authenticated
using ((select public.can_manage_case(id)))
with check ((select public.can_manage_case(id)));

create policy "case_events_read_visible_to_participant"
on public.case_events for select to authenticated
using (
  (select public.can_manage_case(case_id))
  or (is_client_visible and exists (
    select 1 from public.cases c where c.id = case_events.case_id and c.client_id = (select auth.uid())
  ))
);

create policy "case_events_create_assigned_staff"
on public.case_events for insert to authenticated
with check (
  author_id = (select auth.uid())
  and (select public.can_manage_case(case_id))
);

create policy "case_documents_read_authorized"
on public.case_documents for select to authenticated
using (
  (select public.can_manage_case(case_id))
  or (is_client_visible and exists (
    select 1 from public.cases c where c.id = case_documents.case_id and c.client_id = (select auth.uid())
  ))
);

create policy "case_documents_create_assigned_staff"
on public.case_documents for insert to authenticated
with check (uploaded_by = (select auth.uid()) and (select public.can_manage_case(case_id)));

revoke all on public.cases, public.case_events, public.case_documents from anon, authenticated;
grant select on public.cases, public.case_events, public.case_documents to authenticated;
grant insert (case_number,title,practice_area,description,status,client_id,assigned_staff_id,created_by) on public.cases to authenticated;
grant update (title,practice_area,description,status) on public.cases to authenticated;
grant insert (case_id,author_id,title,body,is_client_visible) on public.case_events to authenticated;
grant insert (case_id,uploaded_by,original_name,storage_path,mime_type,size_bytes,is_client_visible) on public.case_documents to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('case-files','case-files',false,10485760,array['application/pdf','image/jpeg','image/png','text/plain'])
on conflict (id) do update set public = false, file_size_limit = 10485760,
  allowed_mime_types = array['application/pdf','image/jpeg','image/png','text/plain'];

alter table storage.objects enable row level security;
grant select, insert, update, delete on storage.objects to authenticated;

create policy "case_file_read_authorized"
on storage.objects for select to authenticated
using (
  bucket_id = 'case-files'
  and exists (
    select 1 from public.case_documents d
    where d.storage_path = storage.objects.name
      and (
        (select public.can_manage_case(d.case_id))
        or (
          d.is_client_visible
          and exists (select 1 from public.cases c where c.id = d.case_id and c.client_id = (select auth.uid()))
        )
      )
  )
);

create policy "case_file_upload_assigned_staff"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'case-files'
  and (select public.can_manage_case(((storage.foldername(name))[1])::uuid))
);

create policy "case_file_delete_assigned_staff"
on storage.objects for delete to authenticated
using (
  bucket_id = 'case-files'
  and (select public.can_manage_case(((storage.foldername(name))[1])::uuid))
);

create policy "case_file_update_assigned_staff"
on storage.objects for update to authenticated
using (
  bucket_id = 'case-files'
  and (select public.can_manage_case(((storage.foldername(name))[1])::uuid))
)
with check (
  bucket_id = 'case-files'
  and (select public.can_manage_case(((storage.foldername(name))[1])::uuid))
);

commit;
