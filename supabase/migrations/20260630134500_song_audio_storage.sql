alter table public.songs
add column if not exists audio_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'song-audio',
  'song-audio',
  true,
  52428800,
  array['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp3']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can read song audio" on storage.objects;
create policy "Users can read song audio"
on storage.objects for select
to authenticated
using (bucket_id = 'song-audio');

drop policy if exists "Users can upload their song audio" on storage.objects;
create policy "Users can upload their song audio"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'song-audio'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can update their song audio" on storage.objects;
create policy "Users can update their song audio"
on storage.objects for update
to authenticated
using (
  bucket_id = 'song-audio'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'song-audio'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete their song audio" on storage.objects;
create policy "Users can delete their song audio"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'song-audio'
  and (storage.foldername(name))[1] = auth.uid()::text
);
