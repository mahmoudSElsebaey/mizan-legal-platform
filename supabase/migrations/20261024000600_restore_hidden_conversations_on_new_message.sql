begin;

-- Hiding a conversation is per-user, not a deletion of legal correspondence.
-- Any new message makes the conversation visible to both participants again.
create or replace function public.restore_conversation_visibility_on_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.conversation_hidden_for_user
  where conversation_id = new.conversation_id;

  return new;
end;
$$;

drop trigger if exists conversation_message_restore_visibility on public.conversation_messages;
create trigger conversation_message_restore_visibility
after insert on public.conversation_messages
for each row
execute function public.restore_conversation_visibility_on_message();

commit;
