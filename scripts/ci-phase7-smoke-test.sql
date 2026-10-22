-- Phase 7 security smoke tests. Runs only in the ephemeral PostgreSQL CI database.
insert into auth.users (id,email,raw_user_meta_data) values
 ('70000000-0000-4000-8000-000000000001','message-lawyer@example.test','{"full_name":"Message Lawyer","locale":"en"}'),
 ('70000000-0000-4000-8000-000000000002','message-client@example.test','{"full_name":"Message Client","locale":"en"}'),
 ('70000000-0000-4000-8000-000000000003','message-other-client@example.test','{"full_name":"Other Message Client","locale":"en"}')
on conflict (id) do nothing;

insert into public.staff_members(profile_id,role,status)
values ('70000000-0000-4000-8000-000000000001','lawyer','active')
on conflict (profile_id) do update set role='lawyer',status='active';

-- A client may start a thread with an active lawyer.
select set_config('request.jwt.claim.sub','70000000-0000-4000-8000-000000000002',false);
set role authenticated;
insert into public.conversations(id,client_id,staff_id,subject,status)
values ('70000000-0000-4000-8000-000000000010','70000000-0000-4000-8000-000000000002','70000000-0000-4000-8000-000000000001','CI conversation test','open');
insert into public.conversation_messages(id,conversation_id,sender_id,body)
values ('70000000-0000-4000-8000-000000000020','70000000-0000-4000-8000-000000000010','70000000-0000-4000-8000-000000000002','Hello from the client');
do $$
begin
 if (select count(*) from public.conversation_messages where conversation_id='70000000-0000-4000-8000-000000000010') <> 1 then
   raise exception 'Client could not read their own conversation message';
 end if;
 begin
   insert into public.conversation_messages(conversation_id,sender_id,body)
   values ('70000000-0000-4000-8000-000000000010','70000000-0000-4000-8000-000000000003','Spoofed sender');
   raise exception 'Client unexpectedly sent a message as another user';
 exception when insufficient_privilege then
   null;
 end;
end
$$;
reset role;
do $
begin
 if (select count(*) from public.notifications where user_id='70000000-0000-4000-8000-000000000001' and conversation_id='70000000-0000-4000-8000-000000000010' and kind='new_message') <> 1 then
   raise exception 'Sending a message did not notify the intended staff participant';
 end if;
end
$;

-- The assigned active lawyer can reply; the client receives a notification.
select set_config('request.jwt.claim.sub','70000000-0000-4000-8000-000000000001',false);
set role authenticated;
insert into public.conversation_messages(id,conversation_id,sender_id,body)
values ('70000000-0000-4000-8000-000000000021','70000000-0000-4000-8000-000000000010','70000000-0000-4000-8000-000000000001','Hello from the office');
reset role;
do $
begin
 if (select count(*) from public.notifications where user_id='70000000-0000-4000-8000-000000000002' and conversation_id='70000000-0000-4000-8000-000000000010' and kind='new_message') <> 1 then
   raise exception 'Sending a reply did not notify the client participant';
 end if;
end
$;

-- An unrelated client cannot see the thread, its messages, or its notifications.
select set_config('request.jwt.claim.sub','70000000-0000-4000-8000-000000000003',false);
set role authenticated;
do $$
begin
 if (select count(*) from public.conversations where id='70000000-0000-4000-8000-000000000010') <> 0 then
   raise exception 'Unrelated client could read another conversation';
 end if;
 if (select count(*) from public.conversation_messages where conversation_id='70000000-0000-4000-8000-000000000010') <> 0 then
   raise exception 'Unrelated client could read another conversation messages';
 end if;
 if (select count(*) from public.notifications where conversation_id='70000000-0000-4000-8000-000000000010') <> 0 then
   raise exception 'Unrelated client could read another user notifications';
 end if;
end
$$;
reset role;

-- Suspended staff must lose access to the conversation and messages.
reset role;
update public.staff_members set status='suspended' where profile_id='70000000-0000-4000-8000-000000000001';
select set_config('request.jwt.claim.sub','70000000-0000-4000-8000-000000000001',false);
set role authenticated;
do $$
begin
 if (select count(*) from public.conversations where id='70000000-0000-4000-8000-000000000010') <> 0 then
   raise exception 'Suspended staff could still read a conversation';
 end if;
 if (select count(*) from public.conversation_messages where conversation_id='70000000-0000-4000-8000-000000000010') <> 0 then
   raise exception 'Suspended staff could still read conversation messages';
 end if;
end
$$;
reset role;
