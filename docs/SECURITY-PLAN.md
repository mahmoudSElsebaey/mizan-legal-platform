# Security and Privacy Plan

**Status:** requirements only. These controls have not yet been implemented or tested.

## Identity and roles
- Supabase Auth is the identity provider, not the authorization policy.
- Never trust role, user ID, client ID, lawyer ID, price, appointment status, or document path supplied by the browser.
- Role changes and staff invitations must use trusted server-side operations authorized for the acting user.
- Apply least privilege and deny access by default.
- UI route guards improve usability but do not replace RLS.

## Row Level Security
- Enable RLS on every table exposed through Supabase APIs.
- Write policies for each operation (SELECT, INSERT, UPDATE, DELETE).
- Validate ownership and assignment using trusted relationships.
- Prevent users from changing protected fields such as roles, owner IDs, assignments, and audit metadata.
- Test permitted and forbidden access using multiple roles.
- Avoid broad policies granting every authenticated user access to all rows.

## Appointments
- Validate service, lawyer, requested interval, office hours, exception dates, and timezone on the server.
- Use database constraints/transactional logic to prevent race-condition double bookings.
- Distinguish requested, approved, confirmed, cancelled, and completed states as required.
- Rate-limit public booking and avoid leaking private client/appointment existence.
- Client-side availability checks are not the final conflict check.

## Documents and confidentiality
- Use private Storage buckets by default.
- Check permission to the related case/document before upload or download.
- Restrict MIME types and file size; use randomized object paths and do not trust filenames.
- Decide whether malware scanning is required before production.
- Separate internal documents/notes from items intentionally shared with clients.
- Avoid permanent public links for confidential documents.

## Messaging
- Every message read/write must verify active conversation membership.
- Users cannot add themselves or unauthorized users to conversations.
- Validate content and attachment permissions server-side.
- Apply rate limits and reasonable message size limits.
- Keep private lawyer notes separate from client-visible messages.

## Secrets and configuration
- Browser-exposed variables may contain only values intended for public use, such as Supabase URL and publishable/anon key.
- Never expose a Supabase service-role/secret key in a NEXT_PUBLIC variable, browser bundle, logs, or repository.
- Never commit .env.local, access tokens, database passwords, or private keys.
- Rotate a secret immediately if exposed.
- Store production secrets in protected hosting environment settings.

## Audit, abuse prevention, and privacy
- Record sensitive actions such as role changes, case assignment changes, appointment status changes, and privileged administrative actions.
- Do not put passwords, tokens, or unnecessary confidential message/document content in audit logs.
- Add rate limiting to authentication, booking, and messaging.
- Minimize personal/legal data collection and define retention, export, correction, and deletion procedures.
- Provide privacy/terms content reviewed by the office before launch.
- Use generic user-facing errors where detailed errors could expose private records.
- Use secure headers, validation, output encoding, and dependency updates.

## Security acceptance checklist for later phases
- Anonymous users cannot access private client/case/message/document data.
- Client A cannot read or modify Client B data.
- Clients cannot change roles or assign lawyers.
- Lawyer A cannot access records assigned only to Lawyer B.
- Non-participants cannot read or send conversation messages.
- Clients cannot access internal-only documents or notes.
- Concurrent requests cannot confirm overlapping bookings for the same constrained resource.
- Public article access is limited to published content.
- Ordinary users cannot alter audit logs.
- Missing, invalid, and expired sessions fail closed.

These are future acceptance criteria, not evidence of current security.
