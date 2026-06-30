insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'song-covers',
  'song-covers',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can read song covers" on storage.objects;
create policy "Users can read song covers"
on storage.objects for select
to authenticated
using (bucket_id = 'song-covers');

drop policy if exists "Users can upload their song covers" on storage.objects;
create policy "Users can upload their song covers"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'song-covers'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can update their song covers" on storage.objects;
create policy "Users can update their song covers"
on storage.objects for update
to authenticated
using (
  bucket_id = 'song-covers'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'song-covers'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete their song covers" on storage.objects;
create policy "Users can delete their song covers"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'song-covers'
  and (storage.foldername(name))[1] = auth.uid()::text
);
