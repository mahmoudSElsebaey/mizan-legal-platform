# Proposed Database Model

**Status:** conceptual proposal for review only. No SQL migrations have been created or applied.

## Main entities

| Table | Purpose | Important notes |
|---|---|---|
| profiles | App profile linked to auth.users | Public profile data only |
| staff_members | Staff role and access state | Role managed by owner/admin |
| clients | Client-specific details | Minimize sensitive data |
| lawyer_profiles | Lawyer biography and professional information | Separate public and private staff fields |
| practice_areas | Areas of legal practice | Localized content or translation relation |
| lawyer_practice_areas | Lawyer/practice-area mapping | Unique pair constraint |
| services | Office services | Public display and booking rules |
| availability_rules | Recurring availability windows | Explicit timezone semantics |
| availability_exceptions | Holidays, blocked time, one-off changes | Overrides normal availability |
| appointments | Client requests and confirmed bookings | Status, start/end, assigned lawyer, conflict protection |
| cases | Legal matters/case records | Explicit client and assigned staff relationships |
| case_events | Case timeline entries | Distinguish client-visible updates from internal notes |
| documents | Private file metadata | Owner, case relation, visibility, storage object path |
| conversations | Conversation container | Related client/case where appropriate |
| conversation_participants | Authorized conversation members | Membership enforced by RLS |
| messages | Message content and timestamps | Only active participants can access |
| notifications | In-app notifications | Recipient-specific access |
| articles | Public legal articles/insights | Draft/published state and locale |
| site_settings | Public-facing office configuration | Never store secrets |
| audit_logs | Sensitive administrative/security actions | No passwords, tokens, or secret payloads |

## Relationship sketch

    PROFILES 1---0..1 CLIENTS
    PROFILES 1---0..1 STAFF_MEMBERS
    STAFF_MEMBERS 1---0..1 LAWYER_PROFILES
    LAWYER_PROFILES *---* PRACTICE_AREAS
    CLIENTS 1---* APPOINTMENTS
    STAFF_MEMBERS 1---* APPOINTMENTS (assigned lawyer/staff)
    CLIENTS 1---* CASES
    STAFF_MEMBERS 1---* CASES (assigned staff)
    CASES 1---* CASE_EVENTS
    CASES 1---* DOCUMENTS
    CONVERSATIONS 1---* CONVERSATION_PARTICIPANTS
    PROFILES 1---* CONVERSATION_PARTICIPANTS
    CONVERSATIONS 1---* MESSAGES
    PROFILES 1---* MESSAGES (sender)

## Constraints to resolve in migrations
1. Use UUID primary keys where appropriate and explicit foreign-key deletion behavior.
2. Add timestamps and indexes for common filters and joins.
3. Prevent overlapping confirmed appointments at the database layer, including the assigned lawyer and office-wide resources where applicable.
4. Store actual appointment instants consistently, typically with timestamptz, and define local availability timezone behavior.
5. Separate internal notes from client-visible events with database-enforced visibility.
6. Use private Storage buckets and authorize every upload/download.
7. Prevent users from changing staff roles or assigning themselves to cases.
8. Add uniqueness constraints only where justified by requirements.
9. Avoid collecting highly sensitive legal/identity details unless necessary; define retention/deletion.
10. Decide whether profiles are created by an Auth trigger or trusted server workflow, then test failure behavior.

## RLS policy inventory
- Profiles: users can read/update only allowed fields of their own profile; staff visibility is narrow.
- Staff: only owner/admin can manage role assignments.
- Clients/cases: clients see only their records; lawyers see only assigned/authorized records.
- Appointments: clients see their own; lawyers see assigned appointments; authorized roles manage status/assignment.
- Documents: metadata and Storage permissions must agree; client-visible files differ from internal files.
- Conversations/messages: only active participants can read/send; participants cannot add unauthorized users.
- Articles/settings: public access only to published/approved public fields.
- Audit logs: no client access; staff access restricted to authorized audit roles.

A policy is not implemented until it exists in a migration and is tested against allowed and denied cases.
