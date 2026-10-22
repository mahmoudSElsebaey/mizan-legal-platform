-- Phase 8 regression matrix. Runs after the Phase 3-7 CI fixtures on ephemeral PostgreSQL only.
-- These checks complement, but do not replace, live Supabase/Auth/Storage tests.

-- A different client must not read another client's appointment.
select set_config('request.jwt.claim.sub','60000000-0000-4000-8000-000000000003',false);
set role authenticated;
do $$
begin
  if (select count(*) from public.appointments
      where client_id='10000000-0000-4000-8000-000000000001') <> 0 then
    raise exception 'Unrelated client could read another client appointment';
  end if;
end
$$;
reset role;

-- A client may not approve their own appointment; only the lawyer/office can decide.
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',false);
set role authenticated;
do $$
begin
  begin
    update public.appointments set status='approved'
    where client_id='10000000-0000-4000-8000-000000000001' and status='requested';
    if found then
      raise exception 'Client unexpectedly approved their own appointment';
    end if;
  exception when insufficient_privilege then
    null;
  end;
end
$$;
reset role;

-- The assigned lawyer cannot skip the appointment state machine.
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000004',false);
set role authenticated;
do $$
begin
  begin
    update public.appointments set status='completed'
    where client_id='10000000-0000-4000-8000-000000000001' and status='requested';
    if found then
      raise exception 'Lawyer unexpectedly skipped appointment workflow states';
    end if;
  exception when check_violation then
    null;
  end;
end
$$;

-- A lawyer who is not assigned to a case cannot see its confidential workspace.
do $phase8$
begin
  if (select count(*) from public.cases
      where id='60000000-0000-4000-8000-000000000010') <> 0 then
    raise exception 'Unassigned lawyer could read a confidential case';
  end if;

  -- A lawyer who is not a conversation participant cannot read another thread or its messages.
  if (select count(*) from public.conversations
      where id='70000000-0000-4000-8000-000000000010') <> 0 then
    raise exception 'Unrelated lawyer could read another conversation';
  end if;
  if (select count(*) from public.conversation_messages
      where conversation_id='70000000-0000-4000-8000-000000000010') <> 0 then
    raise exception 'Unrelated lawyer could read another conversation messages';
  end if;
end
$phase8$;
reset role;

-- Anonymous callers must not be able to query private appointments or conversations.
set role anon;
do $$
begin
  begin
    perform count(*) from public.appointments;
    raise exception 'Anonymous role unexpectedly queried appointments';
  exception when insufficient_privilege then
    null;
  end;
  begin
    perform count(*) from public.conversations;
    raise exception 'Anonymous role unexpectedly queried conversations';
  exception when insufficient_privilege then
    null;
  end;
end
$$;
reset role;

-- Keep the appointment overlap regression check explicit: an existing active slot
-- blocks a second overlapping slot; the Phase 5 exclusion constraint is the
-- transaction-safe database guard even when independent requests race.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid='public.appointments'::regclass
      and conname='appointments_no_overlapping_active'
      and contype='x'
  ) then
    raise exception 'Missing concurrency-safe appointment exclusion constraint';
  end if;
end
$$;
