drop policy if exists "Authenticated users can read artists" on public.artists;
create policy "Authenticated users can read artists"
on public.artists for select
to authenticated
using (true);

drop policy if exists "Authenticated users can update artists" on public.artists;
create policy "Authenticated users can update artists"
on public.artists for update
to authenticated
using (true)
with check (owner_id = auth.uid());

drop policy if exists "Authenticated users can delete artists" on public.artists;
create policy "Authenticated users can delete artists"
on public.artists for delete
to authenticated
using (true);

drop policy if exists "Authenticated users can read songs" on public.songs;
create policy "Authenticated users can read songs"
on public.songs for select
to authenticated
using (true);

drop policy if exists "Authenticated users can update songs" on public.songs;
create policy "Authenticated users can update songs"
on public.songs for update
to authenticated
using (true)
with check (owner_id = auth.uid());

drop policy if exists "Authenticated users can delete songs" on public.songs;
create policy "Authenticated users can delete songs"
on public.songs for delete
to authenticated
using (true);

drop policy if exists "Authenticated users can read streams" on public.song_streams;
create policy "Authenticated users can read streams"
on public.song_streams for select
to authenticated
using (true);

drop policy if exists "Authenticated users can update streams" on public.song_streams;
create policy "Authenticated users can update streams"
on public.song_streams for update
to authenticated
using (true)
with check (owner_id = auth.uid());

drop policy if exists "Authenticated users can delete streams" on public.song_streams;
create policy "Authenticated users can delete streams"
on public.song_streams for delete
to authenticated
using (true);

drop policy if exists "Authenticated users can read releases" on public.releases;
create policy "Authenticated users can read releases"
on public.releases for select
to authenticated
using (true);

drop policy if exists "Authenticated users can update releases" on public.releases;
create policy "Authenticated users can update releases"
on public.releases for update
to authenticated
using (true)
with check (owner_id = auth.uid());

drop policy if exists "Authenticated users can delete releases" on public.releases;
create policy "Authenticated users can delete releases"
on public.releases for delete
to authenticated
using (true);
