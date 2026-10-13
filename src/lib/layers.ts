import type { FeatureCollection, Point } from "geojson";
import type { RumahProperties } from "./importRumah";
import type { GisLayer, GisLocation } from "../types/gis";

export const KANTOR_DESA: [number, number] = [-3.397991, 114.844238];

export const LOKASI_LAYER_ID = "lokasi";
export const BATAS_DESA_LAYER_ID = "batas-desa";
export const BASEMAP_LAYER_ID = "esri-imagery";
export const RUMAH_LAYER_ID = "rumah";

// Urutan array = urutan di Layers Panel: paling atas digambar paling atas (seperti QGIS)
export const INITIAL_LAYERS: GisLayer[] = [
  {
    id: LOKASI_LAYER_ID,
    name: "Titik Lokasi",
    geometryType: "Point",
    render: "points",
    visible: true,
    opacity: 1,
    data: null,
    titleField: "name",
    fields: [
      { name: "name", alias: "Nama" },
      { name: "categoryLabel", alias: "Kategori" },
      { name: "address", alias: "Alamat" },
      { name: "rtRw", alias: "Wilayah" },
      { name: "description", alias: "Keterangan" },
      { name: "id", alias: "ID", advancedOnly: true },
      { name: "category", alias: "Kode Kategori", advancedOnly: true },
      { name: "createdAt", alias: "Dibuat", advancedOnly: true },
    ],
  },
  {
    id: "jalan",
    name: "Jalan",
    geometryType: "LineString",
    render: "vector",
    visible: true,
    opacity: 1,
    data: null,
    style: { strokeColor: "#FACC15", strokeWeight: 3, fillColor: "#FACC15", fillOpacity: 0 },
    titleField: "nama",
    fields: [
      { name: "nama", alias: "Nama Jalan" },
      { name: "jenis", alias: "Jenis" },
      { name: "keterangan", alias: "Keterangan" },
    ],
    source: "Digitasi manual (sumber belum diketahui)",
  },
  {
    id: "bangunan",
    name: "Bangunan",
    geometryType: "Polygon",
    render: "vector",
    visible: true,
    opacity: 1,
    data: null,
    style: { strokeColor: "#FFFFFF", strokeWeight: 1, fillColor: "#FFFFFF", fillOpacity: 0.2 },
    fields: [
      { name: "area_m2", alias: "Luas", unit: "m²" },
      { name: "perimeter_m", alias: "Keliling", unit: "m" },
      { name: "confidence", alias: "Keyakinan Deteksi", format: "percent" },
      { name: "fid", alias: "fid", advancedOnly: true },
      { name: "det_id", alias: "det_id", advancedOnly: true },
      { name: "class", alias: "class", advancedOnly: true },
    ],
    source: "AI Segmentation (TerraLab) dari citra Google Satellite",
  },
  {
    id: BATAS_DESA_LAYER_ID,
    name: "Batas Desa",
    geometryType: "Polygon",
    render: "vector",
    visible: true,
    opacity: 1,
    data: null,
    style: { strokeColor: "#171717", strokeWeight: 2, fillColor: "#171717", fillOpacity: 0, dashArray: "6, 6" },
    source: "Area of Interest (layer_aoi)",
  },
  {
    id: "masking",
    name: "Masking Luar Desa",
    geometryType: "Polygon",
    render: "mask",
    visible: true,
    opacity: 1,
    data: null,
    style: { strokeColor: "#F5F5F5", strokeWeight: 0, fillColor: "#F5F5F5", fillOpacity: 0.8 },
  },
  {
    id: BASEMAP_LAYER_ID,
    name: "Esri World Imagery",
    geometryType: "Raster",
    render: "tile",
    visible: true,
    opacity: 1,
    data: null,
    source: "Esri, Maxar, Earthstar Geographics",
  },
];

// Layer titik rumah warga dari import Excel
export function createRumahLayer(data: FeatureCollection<Point, RumahProperties>): GisLayer {
  return {
    id: RUMAH_LAYER_ID,
    name: "Rumah Warga",
    geometryType: "Point",
    render: "vector",
    visible: true,
    opacity: 1,
    data,
    removable: true,
    style: {
      strokeColor: "#171717",
      strokeWeight: 1.5,
      fillColor: "#FFFFFF",
      fillOpacity: 1,
      radius: 5,
      highlightField: "umkm",
      highlightColor: "#F97316",
    },
    titleField: "nama",
    fields: [
      { name: "noRumah", alias: "No. Rumah" },
      { name: "rt", alias: "RT" },
      { name: "rw", alias: "RW" },
      { name: "lingkungan", alias: "Lingkungan" },
      { name: "umkm", alias: "UMKM" },
      { name: "kontakUmkm", alias: "Kontak UMKM" },
      { name: "nama", alias: "nama", advancedOnly: true },
    ],
    source: "Import Excel (tersimpan di database)",
  };
}

const CATEGORY_LABELS: Record<GisLocation["category"], string> = {
  pemerintahan: "Pemerintahan",
  ibadah: "Tempat Ibadah",
  pendidikan: "Pendidikan",
  kesehatan: "Kesehatan",
  fasilitas: "Fasilitas Umum",
  ekonomi: "Ekonomi / UMKM",
};

export function locationsToFeatureCollection(locations: GisLocation[]): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: locations.map((loc) => ({
      type: "Feature",
      id: loc.id,
      properties: { ...loc, categoryLabel: CATEGORY_LABELS[loc.category] },
      geometry: { type: "Point", coordinates: [loc.lng, loc.lat] },
    })),
  };
}
