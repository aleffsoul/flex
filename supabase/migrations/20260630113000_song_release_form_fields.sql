alter table public.songs
add column if not exists song_type text not null default 'Single',
add column if not exists ai_platform text,
add column if not exists lyrics text,
add column if not exists is_instrumental boolean not null default false,
add column if not exists cover_file_name text,
add column if not exists audio_file_name text;
