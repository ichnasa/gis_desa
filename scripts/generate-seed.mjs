// Menghasilkan SQL data awal untuk Supabase dari supabase/seed/ (GeoJSON EPSG:4326 + lokasi.json).
// Pemakaian (sekali, saat database masih kosong):
//   node scripts/generate-seed.mjs | psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -1
import { readFileSync } from "node:fs";

const root = new URL("..", import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), "utf8"));

// String literal SQL; NULL untuk nilai kosong
const lit = (value) => {
  if (value === null || value === undefined || value === "") return "null";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "null";
  return `'${String(value).replaceAll("'", "''")}'`;
};
const geom = (geometry, multi = false) => {
  const g = `extensions.st_setsrid(extensions.st_geomfromgeojson(${lit(JSON.stringify(geometry))}), 4326)`;
  return multi ? `extensions.st_multi(${g})` : g;
};

const out = [];

// Gabungkan banyak baris per INSERT supaya cepat lewat jaringan
function insertRows(table, columns, rows, chunk = 300) {
  for (let i = 0; i < rows.length; i += chunk) {
    const values = rows.slice(i, i + chunk).map((r) => `  (${r.join(", ")})`).join(",\n");
    out.push(`insert into public.${table} (${columns.join(", ")}) values\n${values};`);
  }
}
out.push(`do $$
begin
  if exists (select 1 from public.lokasi) or exists (select 1 from public.batas_desa)
     or exists (select 1 from public.jalan) or exists (select 1 from public.bangunan) then
    raise exception 'Database sudah berisi data, seed dibatalkan supaya data tidak tertimpa';
  end if;
end $$;`);

insertRows(
  "batas_desa",
  ["sumber", "geom"],
  readJson("supabase/seed/layer_aoi.geojson").features.map((f) => [lit("layer_aoi (QGIS)"), geom(f.geometry, true)])
);

insertRows(
  "jalan",
  ["nama", "jenis", "keterangan", "geom"],
  readJson("supabase/seed/layer_jalan.geojson").features.map((f) => {
    const p = f.properties ?? {};
    return [lit(p.nama), lit(p.jenis), lit(p.keterangan), geom(f.geometry)];
  })
);

insertRows(
  "bangunan",
  ["fid", "det_id", "class", "confidence", "area_m2", "perimeter_m", "geom"],
  readJson("supabase/seed/layer_bangunan.geojson").features.map((f) => {
    const p = f.properties ?? {};
    return [lit(p.fid), lit(p.det_id), lit(p.class), lit(p.confidence), lit(p.area_m2), lit(p.perimeter_m), geom(f.geometry, true)];
  })
);

insertRows(
  "lokasi",
  ["id", "name", "category", "address", "rt_rw", "description", "created_at", "geom"],
  readJson("supabase/seed/lokasi.json").map((loc) => [
    lit(loc.id),
    lit(loc.name),
    lit(loc.category),
    lit(loc.address ?? ""),
    lit(loc.rtRw),
    lit(loc.description),
    lit(loc.createdAt),
    geom({ type: "Point", coordinates: [loc.lng, loc.lat] }),
  ])
);

process.stdout.write(out.join("\n") + "\n");
