-- Phase 5 database smoke tests, run only against the ephemeral CI database.
insert into auth.users (id, email, raw_user_meta_data) values
  ('10000000-0000-4000-8000-000000000004', 'lawyer-ci@example.test', '{"full_name":"CI Lawyer","locale":"en"}'::jsonb);

insert into public.staff_members (profile_id, role, status)
values ('10000000-0000-4000-8000-000000000004', 'lawyer', 'active');

do $$
declare
  booking_day date := current_date + 7;
  booking_weekday smallint;
  booking_start timestamptz;
begin
  booking_weekday := extract(dow from booking_day)::smallint;
  booking_start := (booking_day + time '09:00') at time zone 'Africa/Cairo';

  insert into public.lawyer_availability (lawyer_id, weekday, start_time, end_time, is_available)
  values ('10000000-0000-4000-8000-000000000004', booking_weekday, '09:00', '12:00', true);

  insert into public.appointments (client_id, lawyer_id, starts_at, ends_at, status)
  values (
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000004',
    booking_start, booking_start + interval '30 minutes', 'requested'
  );

  begin
    insert into public.appointments (client_id, lawyer_id, starts_at, ends_at, status)
    values (
      '10000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000004',
      booking_start + interval '15 minutes',
      booking_start + interval '45 minutes',
      'requested'
    );
    raise exception 'Overlapping appointment was unexpectedly accepted';
  exception when exclusion_violation then
    null;
  end;

  begin
    insert into public.appointments (client_id, lawyer_id, starts_at, ends_at, status)
    values (
      '10000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000004',
      (booking_day + time '13:00') at time zone 'Africa/Cairo',
      (booking_day + time '13:30') at time zone 'Africa/Cairo',
      'requested'
    );
    raise exception 'Out-of-hours appointment was unexpectedly accepted';
  exception when check_violation then
    null;
  end;
end
$$;
