-- Phase 7 follow-up: harden policies and expose a minimal contact directory.
-- The original Phase 7 migration may already be recorded in Supabase migration history;
-- this migration safely brings that deployed schema to the final policy/grant state.

begin;

create or replace function public.can_access_conversation(target_conversation_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.conversations c
    where c.id = target_conversation_id
      and (
        c.client_id = (select auth.uid())
        or (c.staff_id = (select auth.uid()) and (select public.is_active_staff()))
        or (select public.has_active_staff_role(array['owner','admin']::public.staff_role[]))
      )
  );
$$;
revoke all on function public.can_access_conversation(uuid) from public;
grant execute on function public.can_access_conversation(uuid) to authenticated;

drop policy if exists "conversations_read_participants" on public.conversations;
create policy "conversations_read_participants"
on public.conversations for select to authenticated
using (
  client_id = (select auth.uid())
  or (staff_id = (select auth.uid()) and (select public.is_active_staff()))
  or (select public.has_active_staff_role(array['owner','admin']::public.staff_role[]))
);

drop policy if exists "participants_close_or_reopen_conversations" on public.conversations;
create policy "participants_close_or_reopen_conversations"
on public.conversations for update to authenticated
using (
  client_id = (select auth.uid())
  or (staff_id = (select auth.uid()) and (select public.is_active_staff()))
  or (select public.has_active_staff_role(array['owner','admin']::public.staff_role[]))
)
with check (
  client_id = (select auth.uid())
  or (staff_id = (select auth.uid()) and (select public.is_active_staff()))
  or (select public.has_active_staff_role(array['owner','admin']::public.staff_role[]))
);

-- Only return names and roles for the contact picker; never expose profile email addresses.
create or replace function public.list_contactable_staff()
returns table(profile_id uuid, full_name text, role public.staff_role)
language sql stable security definer set search_path = ''
as $contact$
  select p.id, p.full_name, sm.role
  from public.profiles p
  join public.staff_members sm on sm.profile_id = p.id
  where sm.status = 'active' and sm.role in ('lawyer','assistant')
  order by p.full_name asc
  limit 100;
$contact$;
revoke all on function public.list_contactable_staff() from public, anon;
grant execute on function public.list_contactable_staff() to authenticated;

-- Permit caller-supplied UUIDs for deterministic fixtures; RLS still controls row access.
grant insert (id,client_id,staff_id,case_id,subject,status) on public.conversations to authenticated;
grant insert (id,conversation_id,sender_id,body) on public.conversation_messages to authenticated;

commit;
