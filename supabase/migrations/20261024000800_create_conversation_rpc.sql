begin;

-- Centralize conversation creation in a SECURITY DEFINER RPC. This avoids
-- fragile client-side INSERT RLS checks while preserving strict server-side
-- authorization and the existing RLS policies for reading and messaging.
create or replace function public.create_conversation(
  target_staff_id uuid,
  conversation_subject text
)
returns setof public.conversations
language plpgsql
security definer
set search_path = ''
as $function$
declare
  caller_id uuid := auth.uid();
  caller_role public.staff_role;
  caller_status public.staff_status;
  recipient_role public.staff_role;
  recipient_status public.staff_status;
  new_thread public.conversations%rowtype;
begin
  if caller_id is null then
    raise exception 'Authentication required';
  end if;

  if conversation_subject is null
     or char_length(btrim(conversation_subject)) < 3
     or char_length(btrim(conversation_subject)) > 160 then
    raise exception 'Conversation subject must contain between 3 and 160 characters';
  end if;

  if target_staff_id is null or target_staff_id = caller_id then
    raise exception 'Choose another valid office team member';
  end if;

  select sm.role, sm.status
    into caller_role, caller_status
  from public.staff_members sm
  where sm.profile_id = caller_id;

  if found then
    if caller_status <> 'active' then
      raise exception 'Your staff account is not active';
    end if;

    select sm.role, sm.status
      into recipient_role, recipient_status
    from public.staff_members sm
    where sm.profile_id = target_staff_id;

    if recipient_status is distinct from 'active' or recipient_role is null then
      raise exception 'Recipient must be an active staff member';
    end if;

    insert into public.conversations
      (client_id, staff_id, subject, status, conversation_type, case_id)
    values
      (caller_id, target_staff_id, btrim(conversation_subject), 'open', 'staff', null)
    returning * into new_thread;
  else
    select sm.role, sm.status
      into recipient_role, recipient_status
    from public.staff_members sm
    where sm.profile_id = target_staff_id;

    if recipient_status is distinct from 'active'
       or recipient_role not in ('lawyer', 'assistant') then
      raise exception 'Client conversations can only be started with an active lawyer or assistant';
    end if;

    insert into public.conversations
      (client_id, staff_id, subject, status, conversation_type, case_id)
    values
      (caller_id, target_staff_id, btrim(conversation_subject), 'open', 'client', null)
    returning * into new_thread;
  end if;

  return next new_thread;
  return;
end;
$function$;

revoke all on function public.create_conversation(uuid, text) from public, anon;
grant execute on function public.create_conversation(uuid, text) to authenticated;

commit;
