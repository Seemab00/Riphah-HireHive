-- Paste this script into the Supabase SQL Editor and run it.
-- RLS is enabled with no policies, so browser clients using the anon key cannot access these tables.
-- Only the server-side Next.js API can access these tables using the service-role key.

create table if not exists accounts (
  email text primary key,
  role text not null,
  name text not null default '',
  password_hash text not null,
  must_change_password boolean not null default false,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists records (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists email_outbox (
  id bigserial primary key,
  to_email text not null,
  subject text not null,
  body text not null,
  link text,
  attachment_name text,
  created_at timestamptz not null default now()
);

create table if not exists invites (
  token text primary key,
  email text not null,
  role text not null,
  name text,
  expires_at timestamptz not null,
  used boolean not null default false,
  created_at timestamptz not null default now()
);

alter table accounts enable row level security;
alter table records enable row level security;
alter table email_outbox enable row level security;
alter table invites enable row level security;

-- Company notifications table
create table if not exists company_notifications (
  id uuid primary key default gen_random_uuid(),
  company_email text not null references accounts(email) on delete cascade,
  title text not null,
  message text not null,
  created_at timestamptz not null default now(),
  read boolean not null default false
);

create index if not exists idx_company_notifications_email_date
  on company_notifications (company_email, created_at desc);

alter table company_notifications enable row level security;

create table if not exists admin_notifications (
  id uuid primary key default gen_random_uuid(),
  company_email text not null references accounts(email) on delete cascade,
  company_name text not null,
  team_id integer not null,
  team_title text not null,
  created_at timestamptz not null default now(),
  read boolean not null default false
);

create index if not exists idx_admin_notifications_date
  on admin_notifications (created_at desc);

alter table admin_notifications enable row level security;

-- FYP group documents
create table if not exists fyp_documents (
  id uuid primary key default gen_random_uuid(),
  department text not null,
  phase text not null,
  group_name text not null,
  uploaded_by_email text not null references accounts(email),
  uploaded_by_name text not null,
  file_name text not null,
  storage_path text not null unique,
  mime_type text not null,
  file_size bigint not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_fyp_documents_group
on fyp_documents (department, phase, group_name, created_at desc);

alter table fyp_documents enable row level security;


-- FYP written progress updates
create table if not exists fyp_progress_updates (
  id uuid primary key default gen_random_uuid(),
  department text not null,
  phase text not null,
  group_name text not null,
  posted_by_email text not null references accounts(email),
  posted_by_name text not null,
  title text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_fyp_progress_group
on fyp_progress_updates (department, phase, group_name, created_at desc);

alter table fyp_progress_updates enable row level security;
