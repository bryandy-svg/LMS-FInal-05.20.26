-- Mailbox tokens are encrypted by the API; no client role can read them.
create table public.email_accounts (
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('outlook','gmail')),
  email text not null,
  token_cipher text not null,
  connected_at timestamptz not null default now(),
  primary key (user_id, provider)
);
create table public.email_send_log (
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null,
  provider text not null check (provider in ('outlook','gmail')),
  sender text not null,
  recipients jsonb not null,
  subject text not null,
  payload_hash text not null,
  status text not null check (status in ('Sending','Accepted','Rejected','Unknown')),
  created_at timestamptz not null default now(),
  primary key (user_id, request_id)
);
create index email_send_log_user_date on public.email_send_log(user_id, created_at desc);
alter table public.email_accounts enable row level security;
alter table public.email_send_log enable row level security;
revoke all on public.email_accounts, public.email_send_log from public, anon, authenticated;
grant select, insert, update, delete on public.email_accounts, public.email_send_log to service_role;
-- Only the authenticated server API accesses these tables. It derives user_id
-- from Supabase Auth on every request; request bodies cannot choose the owner.
