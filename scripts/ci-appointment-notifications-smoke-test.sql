-- Appointment notification smoke test; runs after the notification migration.
do $$
declare
  client_id uuid := '10000000-0000-4000-8000-000000000001';
  lawyer_id uuid := '10000000-0000-4000-8000-000000000004';
  booking_day date := current_date + 7;
  booking_weekday smallint;
  booking_start timestamptz;
  appointment_id uuid;
begin
  booking_weekday := extract(dow from booking_day)::smallint;
  booking_start := (booking_day + time '10:00') at time zone 'Africa/Cairo';

  insert into public.appointments (client_id, lawyer_id, starts_at, ends_at, status)
  values (client_id, lawyer_id, booking_start, booking_start + interval '30 minutes', 'requested')
  returning id into appointment_id;

  if not exists (
    select 1 from public.notifications
    where user_id = lawyer_id
      and kind = 'appointment_requested'
      and href = '/en/dashboard/appointments'
  ) then
    raise exception 'New appointment request did not notify the assigned lawyer';
  end if;

  update public.appointments set status = 'approved' where id = appointment_id;

  if not exists (
    select 1 from public.notifications
    where user_id = client_id
      and kind = 'appointment_approved'
      and href = '/ar/dashboard/appointments'
  ) then
    raise exception 'Appointment status change did not notify the client';
  end if;
end
$$;
