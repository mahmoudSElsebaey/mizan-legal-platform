-- Phase 7: participant-controlled conversations, immutable messages, and in-app notifications.
-- Apply through the controlled migration workflow or once in the intended Supabase project.

begin;

create type public.conversation_status as enum ('open','closed');

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete restrict,
  staff_id uuid not null references public.profiles(id) on delete restrict,
  case_id uuid references public.cases(id) on delete set null,
  subject text not null check (char_length(subject) between 3 and 160),
  status public.conversation_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  constraint conversations_not_self check (client_id <> staff_id)
);

create index conversations_client_last_message_idx on public.conversations(client_id,last_message_at desc);
create index conversations_staff_last_message_idx on public.conversations(staff_id,last_message_at desc);
create index conversations_case_idx on public.conversations(case_id) where case_id is not null;

create table public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete restrict,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index conversation_messages_thread_created_idx on public.conversation_messages(conversation_id,created_at asc);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('new_message','conversation_closed','conversation_reopened')),
  title text not null check (char_length(title) between 1 and 160),
  body text not null default '' check (char_length(body) <= 240),
  href text not null check (href ~ '^/(ar|en)/dashboard/conversations(/[0-9a-fA-F-]{36})?$'),
  conversation_id uuid references public.conversations(id) on delete cascade,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index notifications_user_unread_created_idx on public.notifications(user_id,created_at desc) where read_at is null;
create index notifications_conversation_idx on public.notifications(conversation_id,created_at desc);

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

create or replace function public.validate_conversation_participants()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.staff_members sm
    where sm.profile_id = new.staff_id
      and sm.status = 'active'
      and sm.role in ('lawyer','assistant')
  ) then
    raise exception 'Conversation recipient must be an active lawyer or assistant';
  end if;
  if exists (select 1 from public.staff_members sm where sm.profile_id = new.client_id) then
    raise exception 'Staff accounts cannot start client conversations as clients';
  end if;
  if new.case_id is not null and not exists (
    select 1 from public.cases c
    where c.id = new.case_id
      and c.client_id = new.client_id
      and c.assigned_staff_id = new.staff_id
  ) then
    raise exception 'Linked case must belong to this client and assigned staff member';
  end if;
  return new;
end;
$$;
revoke all on function public.validate_conversation_participants() from public, anon, authenticated;
create trigger conversations_validate_participants
before insert or update of client_id,staff_id,case_id on public.conversations
for each row execute function public.validate_conversation_participants();
create trigger conversations_set_updated_at before update on public.conversations
for each row execute function public.set_updated_at();

create or replace function public.handle_conversation_message()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  thread public.conversations%rowtype;
  recipient uuid;
  recent_count integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(new.sender_id::text, 71));
  select count(*) into recent_count
  from public.conversation_messages m
  where m.sender_id = new.sender_id
    and m.created_at > now() - interval '1 minute';
  if recent_count >= 20 then
    raise exception 'Message rate limit exceeded. Please wait before sending more messages';
  end if;

  select * into thread from public.conversations where id = new.conversation_id for update;
  if not found or thread.status <> 'open' then
    raise exception 'Conversation is unavailable or closed';
  end if;
  if new.sender_id = thread.client_id then
    recipient := thread.staff_id;
  elsif new.sender_id = thread.staff_id then
    recipient := thread.client_id;
  elsif (select public.has_active_staff_role(array['owner','admin']::public.staff_role[])) then
    recipient := thread.client_id;
  else
    raise exception 'Sender is not a participant in this conversation';
  end if;

  update public.conversations
    set last_message_at = new.created_at, updated_at = new.created_at
    where id = thread.id;

  insert into public.notifications(user_id,kind,title,body,href,conversation_id)
  values (
    recipient,
    'new_message',
    case when recipient = thread.client_id then 'New message from the office' else 'New client message' end,
    left(new.body,240),
    '/ar/dashboard/conversations/' || thread.id::text,
    thread.id
  );
  return new;
end;
$$;
revoke all on function public.handle_conversation_message() from public, anon, authenticated;
create trigger conversation_messages_notify
after insert on public.conversation_messages
for each row execute function public.handle_conversation_message();

create or replace function public.notify_conversation_status()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  recipient uuid;
  notification_kind text;
begin
  if new.status is not distinct from old.status then return new; end if;
  if new.status = 'closed' then
    notification_kind := 'conversation_closed';
  else
    notification_kind := 'conversation_reopened';
  end if;
  if auth.uid() = new.client_id then
    recipient := new.staff_id;
  else
    recipient := new.client_id;
  end if;
  insert into public.notifications(user_id,kind,title,body,href,conversation_id)
  values (
    recipient, notification_kind,
    case when new.status = 'closed' then 'Conversation closed' else 'Conversation reopened' end,
    left(new.subject,240),
    '/ar/dashboard/conversations/' || new.id::text,
    new.id
  );
  return new;
end;
$$;
revoke all on function public.notify_conversation_status() from public, anon, authenticated;
create trigger conversations_notify_status
after update of status on public.conversations
for each row execute function public.notify_conversation_status();

alter table public.conversations enable row level security;
alter table public.conversation_messages enable row level security;
alter table public.notifications enable row level security;

create policy "conversations_read_participants"
on public.conversations for select to authenticated
using (client_id = (select auth.uid()) or (staff_id = (select auth.uid()) and (select public.is_active_staff())) or (select public.has_active_staff_role(array['owner','admin']::public.staff_role[])));

create policy "clients_start_conversations"
on public.conversations for insert to authenticated
with check (
  client_id = (select auth.uid())
  and status = 'open'
  and (select public.is_active_staff()) = false
);

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

create policy "messages_read_conversation_participants"
on public.conversation_messages for select to authenticated
using ((select public.can_access_conversation(conversation_id)));

create policy "participants_send_messages"
on public.conversation_messages for insert to authenticated
with check (
  sender_id = (select auth.uid())
  and (select public.can_access_conversation(conversation_id))
);

create policy "notifications_read_own"
on public.notifications for select to authenticated
using (user_id = (select auth.uid()));

create policy "notifications_mark_own_read"
on public.notifications for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

revoke all on public.conversations,public.conversation_messages,public.notifications from anon,authenticated;
grant select on public.conversations,public.conversation_messages,public.notifications to authenticated;
grant insert (id,client_id,staff_id,case_id,subject,status) on public.conversations to authenticated;
grant update (status) on public.conversations to authenticated;
grant insert (id,conversation_id,sender_id,body) on public.conversation_messages to authenticated;
grant update (read_at) on public.notifications to authenticated;

-- Expose only the minimal contact directory needed to start a conversation.
-- Client accounts do not receive blanket SELECT access to profile emails.
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

commit;
