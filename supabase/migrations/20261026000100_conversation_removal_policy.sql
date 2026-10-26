begin;

-- A participant removing a conversation closes that thread for both parties without deleting legal correspondence.
alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications
  add constraint notifications_kind_check
  check (kind in ('new_message','conversation_closed','conversation_reopened','conversation_removed_by_participant'));

-- Let participants see only the minimal removal marker for their own conversation.
drop policy if exists "users_read_own_hidden_conversations" on public.conversation_hidden_for_user;
drop policy if exists "participants_read_conversation_removal_marker" on public.conversation_hidden_for_user;
create policy "participants_read_conversation_removal_marker"
on public.conversation_hidden_for_user for select to authenticated
using (
  user_id = (select auth.uid())
  or (select public.can_access_conversation(conversation_id))
);

create or replace function public.notify_conversation_removed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  thread public.conversations%rowtype;
  recipient uuid;
begin
  select * into thread from public.conversations where id = new.conversation_id;
  if not found then return new; end if;

  if new.user_id = thread.client_id then
    recipient := thread.staff_id;
  elsif new.user_id = thread.staff_id then
    recipient := thread.client_id;
  else
    -- An office administrator who is not a participant cannot end the participants' conversation.
    return new;
  end if;

  insert into public.notifications(user_id, kind, title, body, href, conversation_id)
  values (
    recipient,
    'conversation_removed_by_participant',
    'Conversation ended by the other participant',
    left(thread.subject, 240),
    '/ar/dashboard/conversations/' || thread.id::text,
    thread.id
  );
  return new;
end;
$$;

revoke all on function public.notify_conversation_removed() from public, anon, authenticated;
drop trigger if exists conversation_hidden_notify_other_participant on public.conversation_hidden_for_user;
create trigger conversation_hidden_notify_other_participant
after insert on public.conversation_hidden_for_user
for each row execute function public.notify_conversation_removed();

-- Never allow further messages once either participant has removed the thread.
create or replace function public.prevent_messages_after_conversation_removal()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.conversation_hidden_for_user h
    where h.conversation_id = new.conversation_id
  ) then
    raise exception 'This conversation was removed by a participant. Start a new conversation to continue.';
  end if;
  return new;
end;
$$;

revoke all on function public.prevent_messages_after_conversation_removal() from public, anon, authenticated;
drop trigger if exists conversation_messages_block_after_removal on public.conversation_messages;
create trigger conversation_messages_block_after_removal
before insert on public.conversation_messages
for each row execute function public.prevent_messages_after_conversation_removal();

-- Keep the legacy restore trigger from reopening a conversation that one party removed.
drop trigger if exists conversation_message_restore_visibility on public.conversation_messages;

-- Make the removal marker available through Realtime for an open conversation screen.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'conversation_hidden_for_user'
     ) then
    alter publication supabase_realtime add table public.conversation_hidden_for_user;
  end if;
end $$;

commit;
