-- Phase 6 security smoke tests. Runs only in the ephemeral PostgreSQL CI database.
insert into auth.users (id,email,raw_user_meta_data) values
 ('60000000-0000-4000-8000-000000000001','case-lawyer@example.test','{"full_name":"Case Lawyer","locale":"en"}'),
 ('60000000-0000-4000-8000-000000000002','case-client@example.test','{"full_name":"Case Client","locale":"en"}'),
 ('60000000-0000-4000-8000-000000000003','other-client@example.test','{"full_name":"Other Client","locale":"en"}')
on conflict (id) do nothing;

insert into public.staff_members(profile_id,role,status)
values ('60000000-0000-4000-8000-000000000001','lawyer','active')
on conflict (profile_id) do update set role='lawyer',status='active';

-- The existing CI owner creates a case for the existing CI client and assigns the lawyer above.
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',false);
set role authenticated;
insert into public.cases(id,case_number,title,practice_area,description,status,client_id,assigned_staff_id,created_by)
values (
 '60000000-0000-4000-8000-000000000010','MZN-CI-0001','Confidential CI case','civil','Client-safe summary','open',
 '60000000-0000-4000-8000-000000000002','60000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000003'
);
reset role;

select set_config('request.jwt.claim.sub','60000000-0000-4000-8000-000000000001',false);
set role authenticated;
insert into public.case_events(case_id,author_id,title,body,is_client_visible)
values
 ('60000000-0000-4000-8000-000000000010','60000000-0000-4000-8000-000000000001','Client update','A visible update',true),
 ('60000000-0000-4000-8000-000000000010','60000000-0000-4000-8000-000000000001','Internal note','Confidential staff note',false);
insert into public.case_documents(case_id,uploaded_by,original_name,storage_path,mime_type,size_bytes,is_client_visible)
values
 ('60000000-0000-4000-8000-000000000010','60000000-0000-4000-8000-000000000001','client.pdf','60000000-0000-4000-8000-000000000010/client.pdf','application/pdf',100,true),
 ('60000000-0000-4000-8000-000000000010','60000000-0000-4000-8000-000000000001','internal.pdf','60000000-0000-4000-8000-000000000010/internal.pdf','application/pdf',100,false);
reset role;

-- The case client can see their case, client-visible events and documents only.
select set_config('request.jwt.claim.sub','60000000-0000-4000-8000-000000000002',false);
set role authenticated;
do $
begin
 if (select count(*) from public.cases where id='60000000-0000-4000-8000-000000000010') <> 1 then
   raise exception 'Case client could not read their own case';
 end if;
 if (select count(*) from public.case_events where case_id='60000000-0000-4000-8000-000000000010') <> 1 then
   raise exception 'Client could read internal notes or could not read visible updates';
 end if;
 if (select count(*) from public.case_documents where case_id='60000000-0000-4000-8000-000000000010') <> 1 then
   raise exception 'Client could read internal documents or could not read visible documents';
 end if;
end
$$;
reset role;

-- A different client must not be able to read or alter the case.
select set_config('request.jwt.claim.sub','60000000-0000-4000-8000-000000000003',false);
set role authenticated;
do $$
begin
 if (select count(*) from public.cases where id='60000000-0000-4000-8000-000000000010') <> 0 then
   raise exception 'Unrelated client could read another client case';
 end if;
 if (select count(*) from public.case_events where case_id='60000000-0000-4000-8000-000000000010') <> 0 then
   raise exception 'Unrelated client could read case events';
 end if;
 if (select count(*) from public.case_documents where case_id='60000000-0000-4000-8000-000000000010') <> 0 then
   raise exception 'Unrelated client could read case documents';
 end if;
end
$$;
reset role;

-- The assigned lawyer can see the internal timeline and both document metadata rows.
select set_config('request.jwt.claim.sub','60000000-0000-4000-8000-000000000001',false);
set role authenticated;
do $$
begin
 if (select count(*) from public.case_events where case_id='60000000-0000-4000-8000-000000000010') <> 2 then
   raise exception 'Assigned lawyer could not read all case events';
 end if;
 if (select count(*) from public.case_documents where case_id='60000000-0000-4000-8000-000000000010') <> 2 then
   raise exception 'Assigned lawyer could not read all case documents';
 end if;
end
$$;
reset role;
