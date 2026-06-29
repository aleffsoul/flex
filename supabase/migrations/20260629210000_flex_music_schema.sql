create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  phone text,
  country text default 'Brasil',
  currency text default 'BRL',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.artists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  genre text,
  avatar text,
  bio text,
  instagram text,
  tiktok text,
  youtube text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.songs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  artist_id uuid not null references public.artists(id) on delete cascade,
  title text not null,
  distributor text,
  release_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.song_streams (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  song_id uuid not null references public.songs(id) on delete cascade,
  month date not null,
  streams bigint not null default 0 check (streams >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (song_id, month)
);

create table if not exists public.releases (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  artist_id uuid references public.artists(id) on delete set null,
  title text not null,
  distributor text,
  release_date date not null,
  status text not null default 'scheduled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists artists_set_updated_at on public.artists;
create trigger artists_set_updated_at
before update on public.artists
for each row execute function public.set_updated_at();

drop trigger if exists songs_set_updated_at on public.songs;
create trigger songs_set_updated_at
before update on public.songs
for each row execute function public.set_updated_at();

drop trigger if exists song_streams_set_updated_at on public.song_streams;
create trigger song_streams_set_updated_at
before update on public.song_streams
for each row execute function public.set_updated_at();

drop trigger if exists releases_set_updated_at on public.releases;
create trigger releases_set_updated_at
before update on public.releases
for each row execute function public.set_updated_at();

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists create_profile_on_signup on auth.users;
create trigger create_profile_on_signup
after insert on auth.users
for each row execute function public.create_profile_for_new_user();

alter table public.profiles enable row level security;
alter table public.artists enable row level security;
alter table public.songs enable row level security;
alter table public.song_streams enable row level security;
alter table public.releases enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
on public.profiles for select
to authenticated
using (id = auth.uid());

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "Users can read their artists" on public.artists;
create policy "Users can read their artists"
on public.artists for select
to authenticated
using (owner_id = auth.uid());

drop policy if exists "Users can insert their artists" on public.artists;
create policy "Users can insert their artists"
on public.artists for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "Users can update their artists" on public.artists;
create policy "Users can update their artists"
on public.artists for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "Users can delete their artists" on public.artists;
create policy "Users can delete their artists"
on public.artists for delete
to authenticated
using (owner_id = auth.uid());

drop policy if exists "Users can read their songs" on public.songs;
create policy "Users can read their songs"
on public.songs for select
to authenticated
using (owner_id = auth.uid());

drop policy if exists "Users can insert their songs" on public.songs;
create policy "Users can insert their songs"
on public.songs for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "Users can update their songs" on public.songs;
create policy "Users can update their songs"
on public.songs for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "Users can delete their songs" on public.songs;
create policy "Users can delete their songs"
on public.songs for delete
to authenticated
using (owner_id = auth.uid());

drop policy if exists "Users can read their streams" on public.song_streams;
create policy "Users can read their streams"
on public.song_streams for select
to authenticated
using (owner_id = auth.uid());

drop policy if exists "Users can insert their streams" on public.song_streams;
create policy "Users can insert their streams"
on public.song_streams for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "Users can update their streams" on public.song_streams;
create policy "Users can update their streams"
on public.song_streams for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "Users can delete their streams" on public.song_streams;
create policy "Users can delete their streams"
on public.song_streams for delete
to authenticated
using (owner_id = auth.uid());

drop policy if exists "Users can read their releases" on public.releases;
create policy "Users can read their releases"
on public.releases for select
to authenticated
using (owner_id = auth.uid());

drop policy if exists "Users can insert their releases" on public.releases;
create policy "Users can insert their releases"
on public.releases for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "Users can update their releases" on public.releases;
create policy "Users can update their releases"
on public.releases for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "Users can delete their releases" on public.releases;
create policy "Users can delete their releases"
on public.releases for delete
to authenticated
using (owner_id = auth.uid());

create index if not exists artists_owner_id_idx on public.artists(owner_id);
create index if not exists songs_owner_artist_idx on public.songs(owner_id, artist_id);
create index if not exists song_streams_owner_song_idx on public.song_streams(owner_id, song_id);
create index if not exists releases_owner_date_idx on public.releases(owner_id, release_date);
