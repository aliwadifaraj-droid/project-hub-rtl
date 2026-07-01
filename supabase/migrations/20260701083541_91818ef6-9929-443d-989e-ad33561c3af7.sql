drop policy if exists "Visitors upload submission images" on storage.objects;
create policy "Visitors upload submission images"
on storage.objects
for insert
to anon
with check (
  bucket_id = 'project-images'
  and (storage.foldername(name))[1] = 'submissions'
);

notify pgrst, 'reload schema';