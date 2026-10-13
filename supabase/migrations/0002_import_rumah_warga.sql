-- Import rumah warga dalam satu transaksi (data rumah + kontak UMKM)
-- rows: [{ id, no_rumah, rt, rw, lingkungan, umkm, kontak_umkm, lat, lng }, ...]
-- mode: 'replace' menghapus semua rumah lama dulu, 'append' menambahkan
create or replace function public.import_rumah_warga(rows jsonb, mode text default 'replace')
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  inserted integer;
begin
  if auth.uid() is null then
    raise exception 'Harus masuk sebagai operator untuk mengimport data';
  end if;
  if mode not in ('replace', 'append') then
    raise exception 'Mode import tidak dikenal: %', mode;
  end if;

  if mode = 'replace' then
    delete from public.rumah_warga where true;
  end if;

  insert into public.rumah_warga (id, no_rumah, rt, rw, lingkungan, umkm, geom)
  select
    (r ->> 'id')::uuid,
    coalesce(r ->> 'no_rumah', ''),
    coalesce(r ->> 'rt', ''),
    coalesce(r ->> 'rw', ''),
    coalesce(r ->> 'lingkungan', ''),
    coalesce(r ->> 'umkm', ''),
    extensions.st_setsrid(extensions.st_makepoint((r ->> 'lng')::float8, (r ->> 'lat')::float8), 4326)
  from jsonb_array_elements(rows) as r;
  get diagnostics inserted = row_count;

  insert into public.rumah_warga_kontak (rumah_id, kontak_umkm)
  select (r ->> 'id')::uuid, r ->> 'kontak_umkm'
  from jsonb_array_elements(rows) as r
  where coalesce(r ->> 'kontak_umkm', '') <> '';

  return inserted;
end;
$$;

-- Hanya operator (pengguna login) yang boleh memanggil
revoke execute on function public.import_rumah_warga(jsonb, text) from public, anon;
grant execute on function public.import_rumah_warga(jsonb, text) to authenticated;
