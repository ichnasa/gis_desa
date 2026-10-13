import type { Feature, FeatureCollection, Point } from "geojson";

// Kolom template Excel data rumah warga
export const RUMAH_COLUMNS = [
  "No. Rumah",
  "RT",
  "RW",
  "Lingkungan",
  "Longitude",
  "Latitude",
  "UMKM (Opsional)",
  "Kontak UMKM (Opsional)",
] as const;

type ColumnKey = "noRumah" | "rt" | "rw" | "lingkungan" | "lng" | "lat" | "umkm" | "kontakUmkm";

export interface RumahProperties {
  nama: string;
  noRumah: string;
  rt: string;
  rw: string;
  lingkungan: string;
  umkm: string;
  kontakUmkm: string;
  // Hanya ada pada pratinjau import (nomor baris di file Excel)
  barisExcel?: number;
}

export type RowStatus = "ok" | "warning" | "skipped";

export interface ImportRow {
  barisExcel: number;
  noRumah: string;
  rt: string;
  rw: string;
  lingkungan: string;
  lat: number | null;
  lng: number | null;
  umkm: string;
  status: RowStatus;
  message?: string;
}

export interface ImportResult {
  fileName: string;
  sheetName: string;
  rows: ImportRow[];
  data: FeatureCollection<Point, RumahProperties>;
}

// "No. Rumah" -> "norumah", "UMKM (Opsional)" -> "umkmopsional"
function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function matchColumn(header: string): ColumnKey | null {
  if (!header) return null;
  // Cek "kontak" sebelum "umkm" supaya "Kontak UMKM" tidak terbaca sebagai UMKM
  if (header.startsWith("kontak") || header.startsWith("nohp") || header.startsWith("telepon")) return "kontakUmkm";
  if (header.startsWith("umkm") || header.startsWith("usaha")) return "umkm";
  if (header.startsWith("norumah") || header.startsWith("nomorrumah") || header === "no" || header === "nomor") return "noRumah";
  if (header === "rt") return "rt";
  if (header === "rw") return "rw";
  if (header.startsWith("lingkungan") || header === "lingk") return "lingkungan";
  if (["longitude", "long", "lng", "lon", "bujur", "x"].includes(header)) return "lng";
  if (["latitude", "lat", "lintang", "y"].includes(header)) return "lat";
  return null;
}

function toText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

// Terima angka Excel maupun teks "114,846357" (koma desimal)
function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const text = toText(value);
  if (!text) return null;
  const normalized = text.includes(".") ? text.replace(/,/g, "") : text.replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export interface VillageBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export async function parseRumahFile(file: File, village: VillageBounds | null): Promise<ImportResult> {
  // Dimuat saat dibutuhkan saja supaya bundle awal tetap kecil
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(await file.arrayBuffer());
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("File tidak berisi sheet.");
  const table = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], {
    header: 1,
    raw: true,
    defval: "",
    blankrows: true,
  });

  // Baris header = baris pertama yang punya kolom Longitude & Latitude
  const headerIndex = table.findIndex((row) => {
    const keys = row.map((cell) => matchColumn(normalizeHeader(cell)));
    return keys.includes("lat") && keys.includes("lng");
  });
  if (headerIndex < 0) {
    throw new Error(
      `Kolom "Longitude" dan "Latitude" tidak ditemukan di sheet "${sheetName}". Gunakan template agar format kolom sesuai.`
    );
  }

  const columnIndex: Partial<Record<ColumnKey, number>> = {};
  table[headerIndex].forEach((cell, i) => {
    const key = matchColumn(normalizeHeader(cell));
    if (key && columnIndex[key] === undefined) columnIndex[key] = i;
  });
  const cell = (row: unknown[], key: ColumnKey) => (columnIndex[key] === undefined ? "" : row[columnIndex[key]!]);

  // Toleransi ~1 km di sekitar batas desa
  const PAD = 0.01;
  const isNearVillage = (lat: number, lng: number) =>
    !village ||
    (lat >= village.minLat - PAD && lat <= village.maxLat + PAD && lng >= village.minLng - PAD && lng <= village.maxLng + PAD);

  // Prefix unik per import supaya ID fitur tidak bentrok saat data ditambahkan ke import sebelumnya
  const batch = Date.now().toString(36);
  const rows: ImportRow[] = [];
  const features: Feature<Point, RumahProperties>[] = [];
  const seenKeys = new Map<string, number>();

  table.slice(headerIndex + 1).forEach((raw, offset) => {
    if (raw.every((v) => toText(v) === "")) return;
    const barisExcel = headerIndex + offset + 2;

    const noRumah = toText(cell(raw, "noRumah"));
    const rt = toText(cell(raw, "rt"));
    const rw = toText(cell(raw, "rw"));
    const lingkungan = toText(cell(raw, "lingkungan"));
    const umkm = toText(cell(raw, "umkm"));
    const kontakUmkm = toText(cell(raw, "kontakUmkm"));
    let lat = toNumber(cell(raw, "lat"));
    let lng = toNumber(cell(raw, "lng"));

    const row: ImportRow = { barisExcel, noRumah, rt, rw, lingkungan, lat, lng, umkm, status: "ok" };
    rows.push(row);
    const warnings: string[] = [];

    if (lat === null || lng === null) {
      row.status = "skipped";
      row.message = toText(cell(raw, "lat")) || toText(cell(raw, "lng")) ? "Koordinat bukan angka" : "Koordinat kosong";
      return;
    }

    // Longitude & Latitude tertukar (lintang desa ~ -3, bujur ~ 114)
    if (Math.abs(lat) > 90 && Math.abs(lng) <= 90) {
      [lat, lng] = [lng, lat];
      row.lat = lat;
      row.lng = lng;
      warnings.push("Longitude/Latitude tertukar, sudah diperbaiki");
    }
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      row.status = "skipped";
      row.message = "Koordinat di luar jangkauan";
      return;
    }
    // Titik jauh dari desa hampir pasti salah ketik, dan tidak bisa dilihat karena peta dibatasi ke area desa
    if (!isNearVillage(lat, lng)) {
      row.status = "skipped";
      row.message = "Di luar area desa (cek kembali koordinat)";
      return;
    }
    if (!noRumah) warnings.push("No. Rumah kosong");

    const key = `${lingkungan}|${rw}|${rt}|${noRumah}`;
    if (noRumah && seenKeys.has(key)) warnings.push(`Duplikat dengan baris ${seenKeys.get(key)}`);
    else if (noRumah) seenKeys.set(key, barisExcel);

    if (warnings.length > 0) {
      row.status = "warning";
      row.message = warnings.join("; ");
    }

    features.push({
      type: "Feature",
      id: `rumah-${batch}-${barisExcel}`,
      properties: {
        nama: noRumah ? `Rumah No. ${noRumah}` : `Rumah (baris ${barisExcel})`,
        noRumah,
        rt,
        rw,
        lingkungan,
        umkm,
        kontakUmkm,
        barisExcel,
      },
      geometry: { type: "Point", coordinates: [lng, lat] },
    });
  });

  return { fileName: file.name, sheetName, rows, data: { type: "FeatureCollection", features } };
}

export async function downloadRumahTemplate() {
  const XLSX = await import("xlsx");
  const sheet = XLSX.utils.aoa_to_sheet([
    [...RUMAH_COLUMNS],
    [1, 1, 1, 1, 114.846357, -3.401051, "", ""],
    [2, 1, 1, 1, 114.846275, -3.400888, "Warung Sembako", "0812xxxxxxx"],
  ]);
  sheet["!cols"] = RUMAH_COLUMNS.map((c) => ({ wch: Math.max(10, c.length + 2) }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Data Rumah");
  XLSX.writeFile(workbook, "template_data_rumah.xlsx");
}
