-- Row Level Security for the tables the browser reads with the anon key.
-- Server code (Drizzle, service role) bypasses RLS, so tables with no policy
-- below are reachable from the server only.

alter table public.users_table enable row level security;
alter table public.meditation_history enable row level security;
alter table public.meditation_favorites enable row level security;
alter table public.meditation_analytics enable row level security;
alter table public.conversation_history enable row level security;
alter table public.audio_segments_cache enable row level security;

-- A signed-in user owns the users_table row that carries their email.
drop policy if exists "users_table_own_row" on public.users_table;
create policy "users_table_own_row" on public.users_table
	for all to authenticated
	using (lower(email) = lower(auth.jwt() ->> 'email'))
	with check (lower(email) = lower(auth.jwt() ->> 'email'));

drop policy if exists "conversation_history_own_rows" on public.conversation_history;
create policy "conversation_history_own_rows" on public.conversation_history
	for all to authenticated
	using (
		user_id in (
			select id from public.users_table
			where lower(email) = lower(auth.jwt() ->> 'email')
		)
	)
	with check (
		user_id in (
			select id from public.users_table
			where lower(email) = lower(auth.jwt() ->> 'email')
		)
	);

drop policy if exists "meditation_history_own_rows" on public.meditation_history;
create policy "meditation_history_own_rows" on public.meditation_history
	for select to authenticated
	using (
		user_id in (
			select id from public.users_table
			where lower(email) = lower(auth.jwt() ->> 'email')
		)
	);

drop policy if exists "meditation_favorites_own_rows" on public.meditation_favorites;
create policy "meditation_favorites_own_rows" on public.meditation_favorites
	for all to authenticated
	using (
		user_id in (
			select id from public.users_table
			where lower(email) = lower(auth.jwt() ->> 'email')
		)
	)
	with check (
		user_id in (
			select id from public.users_table
			where lower(email) = lower(auth.jwt() ->> 'email')
		)
	);
