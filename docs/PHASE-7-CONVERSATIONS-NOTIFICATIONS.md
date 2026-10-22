# Phase 7 — Conversations and notifications

## Scope
- Authenticated clients can start a private conversation with an active lawyer or assistant.
- The client and assigned staff member can exchange plain-text messages; active office owners/admins can access threads for office oversight.
- Messages are immutable through the Data API. Message length is limited to 4,000 characters and the database enforces a per-sender rate limit of 20 messages per rolling minute.
- New-message and conversation-status changes create in-app notifications for the other participant.
- Users can view their own notifications and mark their own notifications as read.
- Conversations and messages use RLS; suspended staff lose participant access. Clients cannot read another client's threads or notifications.
- The contact picker uses a narrowly scoped SECURITY DEFINER function that returns only active lawyer/assistant IDs, names, and roles, not profile email addresses.
- Arabic and English routes are supported. Realtime delivery is intentionally not enabled yet; the inbox refreshes through normal page navigation/revalidation.

## Migration
Apply **supabase/migrations/20261022000500_phase7_conversations_notifications.sql** once in the intended development/staging Supabase project. Prefer the controlled migration workflow described in **SUPABASE-MIGRATION-AUTOMATION.md**. Committing the migration does not apply it to Supabase by itself.

## UI
- **/ar/dashboard/conversations** and **/en/dashboard/conversations**: conversation list, client start form, recent notifications.
- **/ar/dashboard/conversations/<conversation-uuid>** and **/en/dashboard/conversations/<conversation-uuid>**: message thread and open/close controls.
- Dashboard navigation includes Conversations & notifications.

## CI verification
The CI workflow applies Phase 7 after Phase 6 and runs **scripts/ci-phase7-smoke-test.sql**. It checks:
- client starts a thread with an active lawyer;
- message delivery creates a notification for the intended other participant;
- clients cannot spoof another sender identity;
- unrelated clients cannot read a thread, its messages, or notifications;
- suspended staff cannot read a thread or its messages.

## Live acceptance checklist
Use separate test accounts in the development/staging Supabase project:
1. As a client, start a conversation with an active lawyer/assistant and send a message.
2. As the selected staff member, open the thread and reply. Verify both accounts receive an in-app notification.
3. As a second client, verify the first client's thread and notifications are not visible.
4. Mark notifications as read and confirm the unread count changes after refresh.
5. Close a thread, verify sending is blocked, then reopen it and send again.
6. Repeat in Arabic and English and check mobile layout.
7. Suspend the assigned staff test account and confirm it can no longer open the thread.

## Known limitations
- No Realtime/WebSocket updates yet; refresh or navigate to see new messages.
- No email, SMS, push, attachments, typing indicators, message edits/deletes, or automated legal advice.
- Owner/admin oversight access is broad and should be reviewed against the firm's final confidentiality policy before production.
- Live acceptance requires real Supabase test accounts; CI's PostgreSQL shim does not replace live RLS/runtime verification.