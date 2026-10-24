DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'conversation_message_restore_visibility'
      AND tgrelid = 'public.conversation_messages'::regclass
      AND NOT tgisinternal
  ) THEN
    RAISE EXCEPTION 'Hidden conversation restoration trigger was not created';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'restore_conversation_visibility_on_message'
  ) THEN
    RAISE EXCEPTION 'Hidden conversation restoration function was not created';
  END IF;
END
$$;
