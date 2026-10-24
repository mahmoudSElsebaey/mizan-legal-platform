begin;

-- RLS policies must not rely on querying staff_members directly as a client:
-- client sessions can only read their own staff_members row, so recipient checks
-- against other staff rows evaluate false even for valid recipients.
create or replace function public.is_active_staff_member(target_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.staff_members sm
    where sm.profile_id = target_profile_id
      and sm.status = 'active'
  );
$$;

create or replace function public.is_contactable_lawyer_or_assistant(target_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.staff_members sm
    where sm.profile_id = target_profile_id
      and sm.status = 'active'
      and sm.role in ('lawyer', 'assistant')
  );
$$;

revoke all on function public.is_active_staff_member(uuid) from public, anon;
revoke all on function public.is_contactable_lawyer_or_assistant(uuid) from public, anon;
grant execute on function public.is_active_staff_member(uuid) to authenticated;
grant execute on function public.is_contactable_lawyer_or_assistant(uuid) to authenticated;

drop policy if exists "clients_start_conversations" on public.conversations;
create policy "clients_start_conversations"
on public.conversations
for insert
to authenticated
with check (
  status = 'open'
  and (
    (
      conversation_type = 'client'
      and client_id = (select auth.uid())
      and (select public.is_active_staff()) = false
      and (select public.is_contactable_lawyer_or_assistant(staff_id))
    )
    or
    (
      conversation_type = 'staff'
      and client_id = (select auth.uid())
      and staff_id <> (select auth.uid())
      and (select public.is_active_staff())
      and (select public.is_active_staff_member(staff_id))
    )
  )
);

commit;
