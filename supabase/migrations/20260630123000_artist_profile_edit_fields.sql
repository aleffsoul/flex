alter table public.artists
add column if not exists photo_url text,
add column if not exists spotify_profile text,
add column if not exists instagram_followers bigint not null default 0 check (instagram_followers >= 0),
add column if not exists spotify_followers bigint not null default 0 check (spotify_followers >= 0);
