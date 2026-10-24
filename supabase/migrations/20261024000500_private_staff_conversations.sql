begin;

alter table public.conversations
  add column if not exists conversation_type text not null default 'client'
  check (conversation_type in ('client','staff'));

grant insert (conversation_type) on public.conversations to authenticated;

create index if not exists conversations_type_last_message_idx
  on public.conversations(conversation_type,last_message_at desc);

create or replace function public.can_access_conversation(target_conversation_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.conversations c
    where c.id = target_conversation_id
      and (
        (
          c.conversation_type = 'staff'
          and c.client_id <> c.staff_id
          and c.client_id = (select auth.uid())
          and (select public.is_active_staff())
          and exists (
            select 1 from public.staff_members sm
            where sm.profile_id = c.staff_id and sm.status = 'active'
          )
        )
        or (
          c.conversation_type = 'staff'
          and c.staff_id = (select auth.uid())
          and (select public.is_active_staff())
          and exists (
            select 1 from public.staff_members sm
            where sm.profile_id = c.client_id and sm.status = 'active'
          )
        )
        or (
          c.conversation_type = 'client'
          and (
            c.client_id = (select auth.uid())
            or (c.staff_id = (select auth.uid()) and (select public.is_active_staff()))
            or (select public.has_active_staff_role(array['owner','admin']::public.staff_role[]))
          )
        )
      )
  );
$$;

create or replace function public.validate_conversation_participants()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  client_role public.staff_role;
  staff_role_value public.staff_role;
  client_status public.staff_status;
  staff_status_value public.staff_status;
begin
  if new.conversation_type = 'staff' then
    if new.case_id is not null then
      raise exception 'Staff-only conversations cannot be linked to client cases';
    end if;
    select sm.role, sm.status into client_role, client_status
      from public.staff_members sm where sm.profile_id = new.client_id;
    select sm.role, sm.status into staff_role_value, staff_status
      from public.staff_members sm where sm.profile_id = new.staff_id;
    if new.client_id = new.staff_id
      or client_status is distinct from 'active'
      or staff_status is distinct from 'active'
      or client_role is null
      or staff_role_value is null then
      raise exception 'Staff conversations require two different active staff members';
    end if;
    return new;
  end if;

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

drop trigger if exists conversations_validate_participants on public.conversations;
create trigger conversations_validate_participants
before insert or update on public.conversations
for each row execute function public.validate_conversation_participants();

drop policy if exists "clients_start_conversations" on public.conversations;
create policy "clients_start_conversations"
on public.conversations for insert to authenticated
with check (
  status = 'open'
  and (
    (
      conversation_type = 'client'
      and client_id = (select auth.uid())
      and (select public.is_active_staff()) = false
    )
    or
    (
      conversation_type = 'staff'
      and client_id = (select auth.uid())
      and staff_id <> (select auth.uid())
      and (select public.is_active_staff())
      and exists (
        select 1 from public.staff_members recipient
        where recipient.profile_id = staff_id and recipient.status = 'active'
      )
    )
  )
);

drop policy if exists "conversations_read_participants" on public.conversations;
create policy "conversations_read_participants"
on public.conversations for select to authenticated
using ((select public.can_access_conversation(id)));

drop policy if exists "participants_close_or_reopen_conversations" on public.conversations;
create policy "participants_close_or_reopen_conversations"
on public.conversations for update to authenticated
using (
  (
    conversation_type = 'staff'
    and (client_id = (select auth.uid()) or staff_id = (select auth.uid()))
    and (select public.is_active_staff())
  )
  or
  (
    conversation_type = 'client'
    and (
      client_id = (select auth.uid())
      or (staff_id = (select auth.uid()) and (select public.is_active_staff()))
    )
  )
)
with check (
  (
    conversation_type = 'staff'
    and (client_id = (select auth.uid()) or staff_id = (select auth.uid()))
    and (select public.is_active_staff())
  )
  or
  (
    conversation_type = 'client'
    and (
      client_id = (select auth.uid())
      or (staff_id = (select auth.uid()) and (select public.is_active_staff()))
    )
  )
);

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

  if thread.conversation_type = 'staff' then
    if new.sender_id = thread.client_id then
      recipient := thread.staff_id;
    elsif new.sender_id = thread.staff_id then
      recipient := thread.client_id;
    else
      raise exception 'Only the two staff participants may send messages in this private conversation';
    end if;
  else
    if new.sender_id = thread.client_id then
      recipient := thread.staff_id;
    elsif new.sender_id = thread.staff_id then
      recipient := thread.client_id;
    else
      raise exception 'Only the client and assigned lawyer or assistant may send messages';
    end if;
  end if;

  if not (select public.can_access_conversation(thread.id)) then
    raise exception 'Sender cannot access this conversation';
  end if;

  update public.conversations
    set last_message_at = new.created_at, updated_at = new.created_at
    where id = thread.id;

  insert into public.notifications(user_id,kind,title,body,href,conversation_id)
  values (
    recipient,
    'new_message',
    case when thread.conversation_type = 'staff'
      then 'New private staff message'
      when recipient = thread.client_id then 'New message from the office'
      else 'New client message' end,
    left(new.body,240),
    '/ar/dashboard/conversations/' || thread.id::text,
    thread.id
  );
  return new;
end;
$$;

create or replace function public.list_contactable_staff_recipients()
returns table(profile_id uuid, full_name text, role public.staff_role)
language sql stable security definer set search_path = ''
as $$
  select p.id, p.full_name, sm.role
  from public.profiles p
  join public.staff_members sm on sm.profile_id = p.id
  where sm.status = 'active'
    and sm.profile_id <> (select auth.uid())
    and (select public.is_active_staff())
  order by p.full_name asc
  limit 100;
$$;

revoke all on function public.list_contactable_staff_recipients() from public, anon;
grant execute on function public.list_contactable_staff_recipients() to authenticated;

commit;
