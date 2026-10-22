-- Minimal auth and Storage schema shims for migration tests in ephemeral PostgreSQL CI.
-- These tables are test-only scaffolding, not a production Supabase replacement.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
end
$$;

create schema auth;
create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  raw_user_meta_data jsonb not null default '{}'::jsonb
);
create function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
grant usage on schema auth to anon, authenticated;
grant select on auth.users to authenticated;

create schema storage;
create table storage.buckets (
  id text primary key,
  name text not null,
  public boolean not null default false,
  file_size_limit bigint,
  allowed_mime_types text[]
);
create table storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text not null references storage.buckets(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique(bucket_id,name)
);
-- Match Supabase Storage's security model: object policies are enforced by RLS.
alter table storage.objects enable row level security;
create function storage.foldername(name text)
returns text[]
language sql immutable
as $$
  select case
    when array_length(string_to_array(name, '/'), 1) > 1
      then (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1)-1]
    else array[]::text[]
  end
$$;
grant usage on schema storage to anon, authenticated;
grant select, insert, update, delete on storage.buckets to authenticated;
grant select, insert, update, delete on storage.objects to authenticated;
