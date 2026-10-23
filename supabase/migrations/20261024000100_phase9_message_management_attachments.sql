begin;

alter table public.conversation_messages
  add column if not exists attachments jsonb not null default '[]'::jsonb,
  add column if not exists edited_at timestamptz,
  add column if not exists deleted_at timestamptz;

alter table public.conversation_messages
  drop constraint if exists conversation_messages_body_check;

alter table public.conversation_messages
  add constraint conversation_messages_body_check
  check (
    deleted_at is not null
    or char_length(body) between 1 and 4000
    or (char_length(body) = 0 and jsonb_array_length(attachments) > 0)
  );

alter table public.conversation_messages
  drop constraint if exists conversation_messages_attachments_check;

alter table public.conversation_messages
  add constraint conversation_messages_attachments_check
  check (jsonb_typeof(attachments) = 'array' and jsonb_array_length(attachments) <= 5);

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

grant insert (id, conversation_id, sender_id, body, attachments)
on public.conversation_messages to authenticated;

grant update (body, attachments, edited_at, deleted_at)
on public.conversation_messages to authenticated;

-- Supabase Storage exists in the hosted project. Guard it for plain-Postgres CI.
do $storage$
begin
  if to_regclass('storage.buckets') is not null and to_regclass('storage.objects') is not null then
    execute $sql$
      insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      values (
        'conversation-attachments',
        'conversation-attachments',
        false,
        10485760,
        array[
          'image/jpeg','image/png','image/webp','image/gif',
          'application/pdf','application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain','text/rtf','application/rtf',
          'application/vnd.oasis.opendocument.text',
          'application/vnd.oasis.opendocument.spreadsheet',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        ]
      )
      on conflict (id) do update
      set public = false, file_size_limit = excluded.file_size_limit,
          allowed_mime_types = excluded.allowed_mime_types
    $sql$;

    execute 'drop policy if exists "conversation_attachments_read_participants" on storage.objects';
    execute 'drop policy if exists "conversation_attachments_upload_participants" on storage.objects';
    execute 'drop policy if exists "conversation_attachments_delete_own" on storage.objects';

    execute $sql$
      create policy "conversation_attachments_read_participants"
      on storage.objects for select to authenticated
      using (
        bucket_id = 'conversation-attachments'
        and public.can_access_conversation(split_part(name, '/', 1)::uuid)
      )
    $sql$;

    execute $sql$
      create policy "conversation_attachments_upload_participants"
      on storage.objects for insert to authenticated
      with check (
        bucket_id = 'conversation-attachments'
        and split_part(name, '/', 2) = (select auth.uid())::text
        and public.can_access_conversation(split_part(name, '/', 1)::uuid)
      )
    $sql$;

    execute $sql$
      create policy "conversation_attachments_delete_own"
      on storage.objects for delete to authenticated
      using (
        bucket_id = 'conversation-attachments'
        and split_part(name, '/', 2) = (select auth.uid())::text
        and public.can_access_conversation(split_part(name, '/', 1)::uuid)
      )
    $sql$;
  end if;
end
$storage$;

commit;
