-- CI smoke tests for the identity/access and administration migrations.
-- Runs only against the ephemeral PostgreSQL service used by GitHub Actions.
insert into auth.users (id, email, raw_user_meta_data) values
  ('10000000-0000-4000-8000-000000000001', 'client-ci@example.test', '{"full_name":"CI Client","locale":"en"}'::jsonb),
  ('10000000-0000-4000-8000-000000000002', 'admin-ci@example.test', '{"full_name":"CI Admin","locale":"en"}'::jsonb),
  ('10000000-0000-4000-8000-000000000003', 'owner-ci@example.test', '{"full_name":"CI Owner","locale":"en"}'::jsonb);

do $$
begin
  if not exists (select 1 from public.profiles where id = '10000000-0000-4000-8000-000000000001' and email = 'client-ci@example.test' and full_name = 'CI Client') then
    raise exception 'Auth trigger failed to provision a profile with email/name';
  end if;
  if exists (select 1 from public.staff_members where profile_id = '10000000-0000-4000-8000-000000000001') then
    raise exception 'A new client unexpectedly received a staff assignment';
  end if;
  if (select count(*) from public.office_services where is_published) <> 4 then
    raise exception 'Expected four initial published practice areas';
  end if;
end
$$;

insert into public.staff_members (profile_id, role, status)
values
  ('10000000-0000-4000-8000-000000000002', 'admin', 'active'),
  ('10000000-0000-4000-8000-000000000003', 'owner', 'active');

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', false);
set role authenticated;
do $$
begin
  insert into public.staff_members (profile_id, role, status, assigned_by)
  values ('10000000-0000-4000-8000-000000000001', 'lawyer', 'active', '10000000-0000-4000-8000-000000000002');

  begin
    update public.staff_members set role = 'owner'
    where profile_id = '10000000-0000-4000-8000-000000000001';
    raise exception 'Admin unexpectedly promoted a lawyer to owner';
  exception when insufficient_privilege then
    null;
  end;
end
$$;
reset role;

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', false);
set role authenticated;
do $$
begin
  begin
    update public.staff_members set role = 'owner'
    where profile_id = '10000000-0000-4000-8000-000000000001';
    raise exception 'Client unexpectedly changed their own staff role';
  exception when insufficient_privilege then
    null;
  end;
end
$$;
reset role;

do $$
begin
  if not exists (
    select 1 from public.audit_logs
    where actor_id = '10000000-0000-4000-8000-000000000002'
      and entity_table = 'staff_members'
      and action = 'INSERT'
  ) then
    raise exception 'Expected staff assignment audit entry was not written';
  end if;
end
$$;
