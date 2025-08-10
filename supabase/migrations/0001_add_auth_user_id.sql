-- Add auth_user_id to users_table and related tables, and backfill

-- 1) Add auth_user_id to users_table
alter table if exists public.users_table add column if not exists auth_user_id uuid;

-- 2) Backfill from auth.users via email (best-effort)
update public.users_table u
set auth_user_id = a.id
from auth.users a
where u.auth_user_id is null and lower(u.email) = lower(a.email);

-- 3) Add uniqueness constraint
do $$ begin
  alter table public.users_table add constraint users_table_auth_user_id_unique unique (auth_user_id);
exception when duplicate_table then null; end $$;

-- 4) Add auth_user_id to dependent tables
alter table if exists public.meditation_history add column if not exists auth_user_id uuid;
alter table if exists public.conversation_history add column if not exists auth_user_id uuid;

-- 5) Backfill dependent tables from users_table
update public.meditation_history m
set auth_user_id = u.auth_user_id
from public.users_table u
where m.auth_user_id is null and m.user_id = u.id;

update public.conversation_history c
set auth_user_id = u.auth_user_id
from public.users_table u
where c.auth_user_id is null and c.user_id = u.id;


