-- Supabase > SQL Editor me poora paste karke Run karo.
-- RLS ON hai aur koi policy nahi: browser (anon key) in tables ko chhu nahi sakta.
-- Sirf hamari Next.js API (service-role key, server par) access karti hai.

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
