begin;

-- A conversation can be hidden from one participant without erasing legal correspondence
-- or changing what the other participant can see.
create table if not exists public.conversation_hidden_for_user (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  hidden_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

alter table public.conversation_hidden_for_user enable row level security;

drop policy if exists "users_read_own_hidden_conversations" on public.conversation_hidden_for_user;
create policy "users_read_own_hidden_conversations"
on public.conversation_hidden_for_user for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "users_hide_accessible_conversations" on public.conversation_hidden_for_user;
create policy "users_hide_accessible_conversations"
on public.conversation_hidden_for_user for insert to authenticated
with check (
  user_id = (select auth.uid())
  and (select public.can_access_conversation(conversation_id))
);

drop policy if exists "users_restore_own_hidden_conversations" on public.conversation_hidden_for_user;
create policy "users_restore_own_hidden_conversations"
on public.conversation_hidden_for_user for delete to authenticated
using (user_id = (select auth.uid()));

revoke all on public.conversation_hidden_for_user from anon, authenticated;
grant select, insert, delete on public.conversation_hidden_for_user to authenticated;

-- Notifications are private to their owner; allow deletion only from that user's inbox.
drop policy if exists "notifications_delete_own" on public.notifications;
create policy "notifications_delete_own"
on public.notifications for delete to authenticated
using (user_id = (select auth.uid()));

grant delete on public.notifications to authenticated;

commit;
