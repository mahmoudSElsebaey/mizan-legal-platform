-- Appointment notifications for clients and assigned lawyers.
-- Safe to apply after Phase 7 notifications and Phase 5 appointments.

begin;

alter table public.notifications
  drop constraint if exists notifications_kind_check;
alter table public.notifications
  add constraint notifications_kind_check
  check (kind in (
    'new_message',
    'conversation_closed',
    'conversation_reopened',
    'appointment_requested',
    'appointment_approved',
    'appointment_confirmed',
    'appointment_cancelled',
    'appointment_rejected',
    'appointment_completed'
  ));

alter table public.notifications
  drop constraint if exists notifications_href_check;
alter table public.notifications
  add constraint notifications_href_check
  check (href ~ '^/(ar|en)/dashboard/(conversations(/[0-9a-fA-F-]{36})?|appointments)$');

create or replace function public.notify_appointment_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  recipient uuid;
  recipient_locale text := 'ar';
  notification_kind text;
  title_ar text;
  title_en text;
  body_text text;
begin
  if tg_op = 'INSERT' then
    recipient := new.lawyer_id;
    notification_kind := 'appointment_requested';
    title_ar := 'طلب موعد جديد';
    title_en := 'New appointment request';
  else
    if new.status is not distinct from old.status then
      return new;
    end if;

    -- Notify the other participant who did not perform the status change.
    if (select auth.uid()) = new.client_id then
      recipient := new.lawyer_id;
    else
      recipient := new.client_id;
    end if;

    case new.status
      when 'approved' then
        notification_kind := 'appointment_approved';
        title_ar := 'تمت الموافقة على طلب الموعد';
        title_en := 'Appointment approved';
      when 'confirmed' then
        notification_kind := 'appointment_confirmed';
        title_ar := 'تم تأكيد الموعد';
        title_en := 'Appointment confirmed';
      when 'cancelled' then
        notification_kind := 'appointment_cancelled';
        title_ar := 'تم إلغاء الموعد';
        title_en := 'Appointment cancelled';
      when 'rejected' then
        notification_kind := 'appointment_rejected';
        title_ar := 'تم رفض طلب الموعد';
        title_en := 'Appointment request rejected';
      when 'completed' then
        notification_kind := 'appointment_completed';
        title_ar := 'تم إكمال الموعد';
        title_en := 'Appointment completed';
      else
        return new;
    end case;
  end if;

  select coalesce(p.locale, 'ar') into recipient_locale
  from public.profiles p
  where p.id = recipient;

  body_text := ' ' || to_char(new.starts_at at time zone 'Africa/Cairo', 'YYYY-MM-DD HH24:MI');
  insert into public.notifications(user_id, kind, title, body, href, conversation_id)
  values (
    recipient,
    notification_kind,
    case when recipient_locale = 'en' then title_en else title_ar end,
    case when recipient_locale = 'en'
      then 'Appointment time: ' || ltrim(body_text)
      else 'موعد: ' || ltrim(body_text)
    end,
    case when recipient_locale = 'en' then '/en/dashboard/appointments' else '/ar/dashboard/appointments' end,
    null
  );

  return new;
end;
$$;

revoke all on function public.notify_appointment_changes() from public, anon, authenticated;

drop trigger if exists appointments_notify_on_insert on public.appointments;
create trigger appointments_notify_on_insert
after insert on public.appointments
for each row execute function public.notify_appointment_changes();

drop trigger if exists appointments_notify_on_status_change on public.appointments;
create trigger appointments_notify_on_status_change
after update of status on public.appointments
for each row execute function public.notify_appointment_changes();

commit;
