import type { Feature, FeatureCollection, Point } from "geojson";
import type { GisLocation } from "../types/gis";
import type { RumahProperties } from "./importRumah";
import { getSupabase } from "./supabase";

// Supabase membatasi 1000 baris per permintaan, jadi data besar diambil per halaman
const PAGE_SIZE = 1000;

function friendlyError(action: string, message: string): Error {
  // Proyek Supabase gratis dijeda setelah lama tidak aktif
  if (/fetch|network/i.test(message)) {
    return new Error(`${action}: server tidak dapat dihubungi. Periksa internet, atau proyek Supabase sedang dijeda.`);
  }
  return new Error(`${action}: ${message}`);
}

async function fetchGeoJSON(table: string, columns: string): Promise<FeatureCollection> {
  const features: Feature[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await getSupabase()
      .from(table)
      .select(columns)
      .order("id")
      .range(from, from + PAGE_SIZE - 1)
      .geojson();
    if (error) throw friendlyError(`Gagal memuat ${table}`, error.message);
    const page = data as unknown as FeatureCollection;
    // ID baris dipakai sebagai ID fitur (untuk highlight Identify)
    features.push(...page.features.map((f) => ({ ...f, id: f.properties?.id })));
    if (page.features.length < PAGE_SIZE) break;
  }
  return { type: "FeatureCollection", features };
}

// ===== Layer referensi (hanya baca) =====

export function fetchBatasDesa() {
  return fetchGeoJSON("batas_desa", "id, nama, sumber, geom");
}

export function fetchJalan() {
  return fetchGeoJSON("jalan", "id, nama, jenis, keterangan, geom");
}

export function fetchBangunan() {
  return fetchGeoJSON("bangunan", "id, fid, det_id, class, confidence, area_m2, perimeter_m, geom");
}

// ===== Titik Lokasi =====

const toEwkt = (lat: number, lng: number) => `SRID=4326;POINT(${lng} ${lat})`;

function toLokasiRow(loc: GisLocation) {
  return {
    id: loc.id,
    name: loc.name,
    category: loc.category,
    address: loc.address,
    rt_rw: loc.rtRw || null,
    description: loc.description || null,
    geom: toEwkt(loc.lat, loc.lng),
  };
}

export async function fetchLokasi(): Promise<GisLocation[]> {
  const fc = await fetchGeoJSON("lokasi", "id, name, category, address, rt_rw, description, created_at, geom");
  return fc.features.map((f) => {
    const p = f.properties ?? {};
    const [lng, lat] = (f.geometry as Point).coordinates;
    return {
      id: p.id,
      name: p.name,
      category: p.category,
      address: p.address ?? "",
      rtRw: p.rt_rw ?? undefined,
      description: p.description ?? undefined,
      createdAt: String(p.created_at ?? "").slice(0, 10),
      lat,
      lng,
    };
  });
}

export async function insertLokasi(loc: GisLocation) {
  const { error } = await getSupabase().from("lokasi").insert(toLokasiRow(loc));
  if (error) throw friendlyError("Gagal menyimpan lokasi", error.message);
}

// RLS menolak secara diam-diam (0 baris berubah), mis. saat sesi login sudah habis
function ensureUpdated(action: string, rows: unknown[] | null) {
  if (!rows || rows.length === 0) {
    throw new Error(`${action}: data tidak berubah. Sesi login mungkin sudah habis, silakan masuk ulang.`);
  }
}

export async function updateLokasi(loc: GisLocation) {
  const { data, error } = await getSupabase().from("lokasi").update(toLokasiRow(loc)).eq("id", loc.id).select("id");
  if (error) throw friendlyError("Gagal mengubah lokasi", error.message);
  ensureUpdated("Gagal mengubah lokasi", data);
}

export async function deleteLokasi(id: string) {
  const { error } = await getSupabase().from("lokasi").delete().eq("id", id);
  if (error) throw friendlyError("Gagal menghapus lokasi", error.message);
}

// ===== Rumah Warga =====

export async function fetchRumahWarga(withKontak: boolean): Promise<FeatureCollection<Point, RumahProperties>> {
  const fc = await fetchGeoJSON("rumah_warga", "id, no_rumah, rt, rw, lingkungan, umkm, geom");

  // Kontak UMKM hanya bisa dibaca operator (dijaga RLS)
  const kontak = new Map<string, string>();
  if (withKontak) {
    for (let from = 0; ; from += PAGE_SIZE) {
      const { data, error } = await getSupabase()
        .from("rumah_warga_kontak")
        .select("rumah_id, kontak_umkm")
        .order("rumah_id")
        .range(from, from + PAGE_SIZE - 1);
      if (error) throw friendlyError("Gagal memuat kontak UMKM", error.message);
      data.forEach((row) => kontak.set(row.rumah_id, row.kontak_umkm));
      if (data.length < PAGE_SIZE) break;
    }
  }

  return {
    type: "FeatureCollection",
    features: fc.features.map((f) => {
      const p = f.properties ?? {};
      return {
        type: "Feature",
        id: p.id,
        geometry: f.geometry as Point,
        properties: {
          nama: p.no_rumah ? `Rumah No. ${p.no_rumah}` : "Rumah",
          noRumah: p.no_rumah ?? "",
          rt: p.rt ?? "",
          rw: p.rw ?? "",
          lingkungan: p.lingkungan ?? "",
          umkm: p.umkm ?? "",
          kontakUmkm: kontak.get(p.id) ?? "",
        },
      };
    }),
  };
}

export async function updateRumahPosition(id: string, lat: number, lng: number) {
  const { data, error } = await getSupabase()
    .from("rumah_warga")
    .update({ geom: toEwkt(lat, lng) })
    .eq("id", id)
    .select("id");
  if (error) throw friendlyError("Gagal memindahkan rumah", error.message);
  ensureUpdated("Gagal memindahkan rumah", data);
}

// Import atomik lewat fungsi database: rumah + kontak tersimpan bersama, atau tidak sama sekali
export async function importRumahWarga(
  features: Feature<Point, RumahProperties>[],
  mode: "replace" | "append"
): Promise<number> {
  const rows = features.map((f) => ({
    id: crypto.randomUUID(),
    no_rumah: f.properties.noRumah,
    rt: f.properties.rt,
    rw: f.properties.rw,
    lingkungan: f.properties.lingkungan,
    umkm: f.properties.umkm,
    kontak_umkm: f.properties.kontakUmkm,
    lng: f.geometry.coordinates[0],
    lat: f.geometry.coordinates[1],
  }));
  const { data, error } = await getSupabase().rpc("import_rumah_warga", { rows, mode });
  if (error) throw friendlyError("Gagal menyimpan data rumah", error.message);
  return data as number;
}
