# Outlook and Gmail sending

Each LMS user connects their own mailbox under **Tools → My email accounts**.
Email forms retain To, CC, subject and message. Choose a connected mailbox and
click **Send Email**, or use the existing **Email app (open draft)** option.
PDF attachments are limited to 2 MB total. Generated secure PDF links remain in
the message; PDFs generated in the current session are also offered as attachments.
Ticket and selected-repair PDF downloads can be attached with the file selector.
The activity log is per user. Accepted means provider acceptance, not confirmed
delivery. Sending/Unknown must be checked in Sent Items before a new send request.

## Activation (administrator)

1. Apply `supabase/migrations/20261013042122_connected_email.sql`.
2. Configure Vercel **server-only** environment variables below and redeploy.
   Never put secrets in `supabase-config.js`, source control, or chat.
3. Register both providers' redirect URL exactly as:
   `https://lmsimports.vercel.app/api/email?action=callback`
4. Each user signs in with their own Microsoft/Google credentials in the provider
   window. LMS never asks for or stores mailbox passwords.

Common environment variables:

- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (existing backend settings).
- `EMAIL_APP_ORIGIN=https://lmsimports.vercel.app`
- `EMAIL_TOKEN_KEY`: a cryptographically random 32-byte key encoded in base64,
  stored as a sensitive Vercel environment variable. Retain securely; replacing
  it requires users to reconnect their mailboxes. Do not reuse another secret.

### Microsoft Entra

Register a **Web** application supporting work/school accounts and personal
Microsoft accounts if both are needed. Configure the redirect URL above as Web,
not SPA. Add delegated Graph permissions `User.Read` and `Mail.Send`; the flow
also requests `offline_access`. Create a client secret and configure:

- `EMAIL_MICROSOFT_CLIENT_ID`
- `EMAIL_MICROSOFT_CLIENT_SECRET`

An organization's consent policy may require administrator approval. Only
delegated sending from the connected user's own account is supported; no
organization-wide application Mail.Send permission is needed.

### Google Cloud

Enable Gmail API. Configure Google Auth Platform branding, audience, support
email and authorized domains; create an OAuth **Web application** client with
the redirect URL above. Request `openid`, `email`, and
`https://www.googleapis.com/auth/gmail.send`. Configure:

- `EMAIL_GOOGLE_CLIENT_ID`
- `EMAIL_GOOGLE_CLIENT_SECRET`

Add intended users as test users while in Testing. Gmail send is a sensitive
scope: complete the applicable Google verification/publishing process before
broad production use. External apps in Testing have refresh-token limitations;
do not treat a successful test-user connection as production approval.

## Security and verification

Encrypted refresh tokens are bound to user/provider with AES-256-GCM. Database
tables have RLS enabled with no browser grants; authenticated API handlers scope
every query to the verified Supabase user. OAuth uses a short-lived secure
HttpOnly SameSite cookie, state and PKCE. Only the callback is unauthenticated.
Disconnect deletes LMS's stored credential; users can also revoke the app in
Microsoft/Google account permissions. No inbox-reading permissions are requested.

Before activation, test with designated accounts: connect/cancel/reconnect both
providers; send a user-approved test email with a PDF; verify Sent Items and LMS
activity; retry the same request and verify one message; verify another LMS user
cannot see the account or log; disconnect and verify sending is blocked. Never
use a customer as a test recipient without explicit authorization.

Documentation:
- https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow
- https://learn.microsoft.com/en-us/graph/api/user-sendmail
- https://developers.google.com/identity/protocols/oauth2/web-server
- https://developers.google.com/workspace/gmail/api/auth/scopes
- https://developers.google.com/workspace/gmail/api/guides/sending
