alter table public.songs
add column if not exists status text not null default 'rascunho',
add column if not exists isrc text,
add column if not exists upc text,
add column if not exists cover_url text;
