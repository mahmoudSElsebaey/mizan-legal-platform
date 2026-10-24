-- Repair conversation message privileges for the current client insert shape.
-- Column-level grants preserve server-owned fields; RLS still restricts messages to participants.
begin;

alter table public.conversation_messages
  add column if not exists attachments jsonb not null default '[]'::jsonb,
  add column if not exists edited_at timestamptz,
  add column if not exists deleted_at timestamptz;

grant select on public.conversation_messages to authenticated;
grant insert (conversation_id, sender_id, body, attachments)
  on public.conversation_messages to authenticated;
grant update (body, attachments, edited_at, deleted_at)
  on public.conversation_messages to authenticated;

drop policy if exists "messages_update_own" on public.conversation_messages;
create policy "messages_update_own"
on public.conversation_messages for update to authenticated
using (
  sender_id = (select auth.uid())
  and (select public.can_access_conversation(conversation_id))
  and deleted_at is null
)
with check (
  sender_id = (select auth.uid())
  and (select public.can_access_conversation(conversation_id))
);

commit;
