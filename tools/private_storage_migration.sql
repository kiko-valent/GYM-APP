-- Aplicar tras revisar enlaces guardados: los enlaces públicos antiguos dejarán de funcionar.
-- Los archivos permanecen en Storage; no se borran ni se cambian sus rutas.
begin;
update storage.buckets set public=false where id in ('technique-videos','documents');
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Public Access Docs" on storage.objects;
drop policy if exists "Authenticated Upload" on storage.objects;
drop policy if exists "Authenticated Upload Docs" on storage.objects;
drop policy if exists "owner_fitness_files" on storage.objects;
create policy "owner_fitness_files" on storage.objects for all to authenticated
  using(bucket_id in ('technique-videos','documents') and (storage.foldername(name))[1]=auth.uid()::text)
  with check(bucket_id in ('technique-videos','documents') and (storage.foldername(name))[1]=auth.uid()::text);
-- Esta condición restrictive también limita otras políticas permissive que pudieran existir.
-- Se aplica únicamente a los dos buckets de esta aplicación.
drop policy if exists "fitness_files_owner_boundary" on storage.objects;
create policy "fitness_files_owner_boundary" on storage.objects as restrictive for all to public
  using(bucket_id not in ('technique-videos','documents') or (storage.foldername(name))[1]=auth.uid()::text)
  with check(bucket_id not in ('technique-videos','documents') or (storage.foldername(name))[1]=auth.uid()::text);
commit;
