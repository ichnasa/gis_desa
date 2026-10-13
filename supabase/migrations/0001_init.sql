-- Skema awal GIS Desa Pekauman Ulu
-- Jalankan sekali di Supabase Dashboard -> SQL Editor
-- Semua geometri disimpan dalam WGS 84 (EPSG:4326)

create extension if not exists postgis with schema extensions;

-- ===== Kolom audit: siapa & kapan terakhir mengubah =====
create or replace function public.set_updated_audit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

-- ===== Titik Lokasi (fasilitas desa) =====
create table public.lokasi (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  category text not null check (category in ('pemerintahan', 'ibadah', 'pendidikan', 'kesehatan', 'fasilitas', 'ekonomi')),
  address text not null default '',
  rt_rw text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  geom extensions.geometry(Point, 4326) not null
);

-- ===== Rumah Warga (hasil import Excel) =====
create table public.rumah_warga (
  id uuid primary key default gen_random_uuid(),
  no_rumah text not null default '',
  rt text not null default '',
  rw text not null default '',
  lingkungan text not null default '',
  umkm text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  geom extensions.geometry(Point, 4326) not null
);

-- Kontak UMKM = data pribadi: tabel terpisah, hanya operator yang bisa membaca
create table public.rumah_warga_kontak (
  rumah_id uuid primary key references public.rumah_warga (id) on delete cascade,
  kontak_umkm text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

-- ===== Layer referensi (dari QGIS) =====
create table public.batas_desa (
  id bigint generated always as identity primary key,
  nama text not null default 'Desa Pekauman Ulu',
  sumber text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  geom extensions.geometry(MultiPolygon, 4326) not null
);

create table public.jalan (
  id bigint generated always as identity primary key,
  nama text,
  jenis text,
  keterangan text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  geom extensions.geometry(LineString, 4326) not null
);

create table public.bangunan (
  id bigint generated always as identity primary key,
  fid integer,
  det_id text,
  class text,
  confidence real,
  area_m2 real,
  perimeter_m real,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  geom extensions.geometry(MultiPolygon, 4326) not null
);

-- Index spasial
create index lokasi_geom_idx on public.lokasi using gist (geom);
create index rumah_warga_geom_idx on public.rumah_warga using gist (geom);
create index batas_desa_geom_idx on public.batas_desa using gist (geom);
create index jalan_geom_idx on public.jalan using gist (geom);
create index bangunan_geom_idx on public.bangunan using gist (geom);

-- Trigger audit di setiap tabel
create trigger lokasi_audit before insert or update on public.lokasi
  for each row execute function public.set_updated_audit();
create trigger rumah_warga_audit before insert or update on public.rumah_warga
  for each row execute function public.set_updated_audit();
create trigger rumah_warga_kontak_audit before insert or update on public.rumah_warga_kontak
  for each row execute function public.set_updated_audit();
create trigger batas_desa_audit before insert or update on public.batas_desa
  for each row execute function public.set_updated_audit();
create trigger jalan_audit before insert or update on public.jalan
  for each row execute function public.set_updated_audit();
create trigger bangunan_audit before insert or update on public.bangunan
  for each row execute function public.set_updated_audit();

-- ===== Row Level Security =====
-- Publik (anon) hanya boleh membaca layer peta.
-- Pengguna yang login = operator desa (pendaftaran mandiri dimatikan di Dashboard),
-- boleh menambah, mengubah, dan menghapus.
alter table public.lokasi enable row level security;
alter table public.rumah_warga enable row level security;
alter table public.rumah_warga_kontak enable row level security;
alter table public.batas_desa enable row level security;
alter table public.jalan enable row level security;
alter table public.bangunan enable row level security;

create policy "Publik dapat membaca lokasi" on public.lokasi for select to anon, authenticated using (true);
create policy "Publik dapat membaca rumah warga" on public.rumah_warga for select to anon, authenticated using (true);
create policy "Publik dapat membaca batas desa" on public.batas_desa for select to anon, authenticated using (true);
create policy "Publik dapat membaca jalan" on public.jalan for select to anon, authenticated using (true);
create policy "Publik dapat membaca bangunan" on public.bangunan for select to anon, authenticated using (true);

-- Kontak UMKM: hanya operator
create policy "Operator dapat membaca kontak" on public.rumah_warga_kontak for select to authenticated using (true);

create policy "Operator dapat menambah lokasi" on public.lokasi for insert to authenticated with check (true);
create policy "Operator dapat mengubah lokasi" on public.lokasi for update to authenticated using (true) with check (true);
create policy "Operator dapat menghapus lokasi" on public.lokasi for delete to authenticated using (true);

create policy "Operator dapat menambah rumah" on public.rumah_warga for insert to authenticated with check (true);
create policy "Operator dapat mengubah rumah" on public.rumah_warga for update to authenticated using (true) with check (true);
create policy "Operator dapat menghapus rumah" on public.rumah_warga for delete to authenticated using (true);

create policy "Operator dapat menambah kontak" on public.rumah_warga_kontak for insert to authenticated with check (true);
create policy "Operator dapat mengubah kontak" on public.rumah_warga_kontak for update to authenticated using (true) with check (true);
create policy "Operator dapat menghapus kontak" on public.rumah_warga_kontak for delete to authenticated using (true);

create policy "Operator dapat mengubah batas desa" on public.batas_desa for all to authenticated using (true) with check (true);
create policy "Operator dapat mengubah jalan" on public.jalan for all to authenticated using (true) with check (true);
create policy "Operator dapat mengubah bangunan" on public.bangunan for all to authenticated using (true) with check (true);
