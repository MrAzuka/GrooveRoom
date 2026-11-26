-- supabase/schema.sql
-- Playlist backup, one row per playlist per user.
create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  songs jsonb not null default '[]'::jsonb, -- [{ title, artist, durationMs }], matched on restore
  updated_at timestamptz not null default now(),
  unique (user_id, name) -- same duplicate-name rule as the app
);

alter table public.playlists enable row level security;

create policy "Users read own playlists" on public.playlists
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "Users add own playlists" on public.playlists
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "Users update own playlists" on public.playlists
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "Users delete own playlists" on public.playlists
  for delete to authenticated using ((select auth.uid()) = user_id);