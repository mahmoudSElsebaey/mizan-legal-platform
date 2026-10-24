\set ON_ERROR_STOP on

do $$
declare
  access_policy text;
  update_policy text;
  message_function text;
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'conversations'
      and column_name = 'conversation_type'
  ) then
    raise exception 'conversation_type column is missing';
  end if;

  if to_regprocedure('public.list_contactable_staff_recipients()') is null then
    raise exception 'staff recipient directory function is missing';
  end if;

  select qual into access_policy
  from pg_policies
  where schemaname = 'public' and tablename = 'conversations'
    and policyname = 'conversations_read_participants';
  if access_policy is null or position('can_access_conversation' in access_policy) = 0 then
    raise exception 'conversation read policy does not delegate to scoped access function';
  end if;

  select qual into update_policy
  from pg_policies
  where schemaname = 'public' and tablename = 'conversations'
    and policyname = 'participants_close_or_reopen_conversations';
  if update_policy is null or position('conversation_type' in update_policy) = 0 then
    raise exception 'conversation update policy does not distinguish conversation types';
  end if;

  select pg_get_functiondef('public.handle_conversation_message()'::regprocedure) into message_function;
  if position('Only the two staff participants may send messages' in message_function) = 0 then
    raise exception 'private staff message sender validation is missing';
  end if;
  if position('Only the client and assigned lawyer or assistant may send messages' in message_function) = 0 then
    raise exception 'client conversation sender validation is missing';
  end if;
end
$$;

select 'Private staff conversation access controls verified' as result;
