-- Regression test: both supported conversation creation flows must work under authenticated RLS.
\set ON_ERROR_STOP on

insert into auth.users (id,email,raw_user_meta_data) values
 ('81000000-0000-4000-8000-000000000001','create-client@example.test','{"full_name":"Creation Client","locale":"en"}'),
 ('81000000-0000-4000-8000-000000000002','create-lawyer@example.test','{"full_name":"Creation Lawyer","locale":"en"}'),
 ('81000000-0000-4000-8000-000000000003','create-owner@example.test','{"full_name":"Creation Owner","locale":"en"}'),
 ('81000000-0000-4000-8000-000000000004','create-assistant@example.test','{"full_name":"Creation Assistant","locale":"en"}')
on conflict (id) do nothing;

insert into public.staff_members(profile_id,role,status)
values
 ('81000000-0000-4000-8000-000000000002','lawyer','active'),
 ('81000000-0000-4000-8000-000000000003','owner','active'),
 ('81000000-0000-4000-8000-000000000004','assistant','active')
on conflict (profile_id) do update set role=excluded.role,status='active';

-- Client -> active lawyer, matching the full-page and floating launcher payloads.
select set_config('request.jwt.claim.sub','81000000-0000-4000-8000-000000000001',false);
set role authenticated;
insert into public.conversations(id,client_id,staff_id,subject,status,conversation_type)
values ('81000000-0000-4000-8000-000000000011','81000000-0000-4000-8000-000000000001','81000000-0000-4000-8000-000000000002','Client creation regression','open','client');

do $$
begin
  if not exists (select 1 from public.conversations where id='81000000-0000-4000-8000-000000000011') then
    raise exception 'Client could not create/read a conversation with an active lawyer';
  end if;
end
$$;
reset role;

-- Active staff -> another active staff member, including owner/admin recipients.
select set_config('request.jwt.claim.sub','81000000-0000-4000-8000-000000000002',false);
set role authenticated;
insert into public.conversations(id,client_id,staff_id,subject,status,conversation_type)
values ('81000000-0000-4000-8000-000000000012','81000000-0000-4000-8000-000000000002','81000000-0000-4000-8000-000000000003','Private staff creation regression','open','staff');

do $$
begin
  if not exists (select 1 from public.conversations where id='81000000-0000-4000-8000-000000000012') then
    raise exception 'Active staff could not create/read a private staff conversation';
  end if;
  if not exists (
    select 1 from public.list_contactable_staff_recipients()
    where profile_id='81000000-0000-4000-8000-000000000003'
  ) then
    raise exception 'The active staff recipient directory did not return the owner';
  end if;
end
$$;
reset role;

-- A different staff member must not be able to see a private thread they did not join.
select set_config('request.jwt.claim.sub','81000000-0000-4000-8000-000000000004',false);
set role authenticated;
do $$
begin
  if exists (select 1 from public.conversations where id='81000000-0000-4000-8000-000000000012') then
    raise exception 'Unrelated staff member could read a private staff conversation';
  end if;
end
$$;
reset role;

select 'Client and private staff conversation creation verified under RLS' as result;
