import { X, ScanSearch, Pencil, Trash2, Info, Navigation, Move } from "lucide-react";
import type { GisLayer, IdentifiedFeature } from "../types/gis";
import { LOKASI_LAYER_ID } from "../lib/layers";
import { geometryArea, geometryLength, featureCentroid, toUtm50S, formatArea, formatLength } from "../lib/geo";

export interface IdentifyPanelProps {
  identified: IdentifiedFeature;
  layer: GisLayer;
  advanced: boolean;
  onClose: () => void;
  onZoomToFeature: () => void;
  onEditLocation?: (id: string) => void;
  onDeleteLocation?: (id: string) => void;
  // Masuk mode pindah titik (geser di peta); tidak diisi = tombol disembunyikan
  onMoveFeature?: () => void;
}

// Link rute Google Maps: tanpa origin, Google memakai lokasi pengguna saat ini sebagai titik awal
function googleMapsRouteUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

function formatValue(value: unknown, advanced: boolean, unit?: string, format?: "percent"): string {
  // QGIS menampilkan nilai kosong sebagai NULL
  if (value === null || value === undefined || value === "") return advanced ? "NULL" : "–";
  if (typeof value === "number") {
    if (format === "percent" && !advanced) return `${Math.round(value * 100)}%`;
    const text = advanced ? String(value) : value.toLocaleString("id-ID");
    return unit ? `${text} ${unit}` : text;
  }
  return String(value);
}

export default function IdentifyPanel({
  identified,
  layer,
  advanced,
  onClose,
  onZoomToFeature,
  onEditLocation,
  onDeleteLocation,
  onMoveFeature,
}: IdentifyPanelProps) {
  const { feature } = identified;
  const props = feature.properties ?? {};
  const geom = feature.geometry;

  // Atribut: field yang punya alias dulu, lalu (Mode Lanjutan) field lain apa adanya
  const declared = (layer.fields ?? []).filter((f) => advanced || !f.advancedOnly);
  const declaredNames = new Set((layer.fields ?? []).map((f) => f.name));
  const rows = [
    ...declared.map((f) => ({
      label: advanced ? f.name : f.alias,
      value: formatValue(props[f.name], advanced, f.unit, f.format),
    })),
    ...(advanced
      ? Object.keys(props)
          .filter((k) => !declaredNames.has(k))
          .map((k) => ({ label: k, value: formatValue(props[k], advanced) }))
      : []),
  ];

  // Nilai turunan geometri (bagian "(Derived)" di Identify Results QGIS)
  const derived: { label: string; value: string }[] = [];
  if (geom.type === "Polygon" || geom.type === "MultiPolygon") {
    derived.push({ label: "Luas", value: formatArea(geometryArea(geom)) });
    derived.push({ label: "Keliling", value: formatLength(geometryLength(geom)) });
  } else if (geom.type === "LineString" || geom.type === "MultiLineString") {
    derived.push({ label: "Panjang", value: formatLength(geometryLength(geom)) });
  }
  const center = featureCentroid(feature);
  if (center) {
    const label = geom.type === "Point" ? "Koordinat" : "Titik Tengah";
    derived.push({ label, value: `${center[0].toFixed(6)}, ${center[1].toFixed(6)}` });
    if (advanced) {
      const utm = toUtm50S(center[0], center[1]);
      derived.push({ label: "UTM 50S", value: `${utm.easting.toFixed(2)} E, ${utm.northing.toFixed(2)} N` });
    }
  }
  if (advanced) derived.unshift({ label: "Tipe Geometri", value: geom.type });
  // Mode Sederhana: jangan ulangi ukuran yang sudah ada di atribut (mis. Luas pada bangunan)
  const derivedRows = advanced ? derived : derived.filter((d) => !rows.some((r) => r.label === d.label));

  const titleValue = layer.titleField ? props[layer.titleField] : null;
  const title = titleValue ? String(titleValue) : layer.name;
  const isLokasi = layer.id === LOKASI_LAYER_ID;
  const featureId = String(feature.id ?? props.fid ?? "");

  return (
    <div className="absolute top-4 right-16 z-[500] w-80 max-h-[calc(100%-2rem)] flex flex-col bg-white rounded-lg shadow-md border border-[#E5E5E5] text-[#171717]">
      <div className="flex items-start justify-between gap-2 px-3 py-2.5 border-b border-[#E5E5E5]">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-[#737373]">
            <Info className="w-3 h-3" />
            <span>{advanced ? `Identify · ${layer.name}` : layer.name}</span>
          </div>
          <div className="font-semibold text-sm leading-snug truncate">
            {title}
            {advanced && !titleValue && featureId && <span className="text-[#737373] font-normal"> #{featureId}</span>}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-[#737373] hover:text-[#171717] hover:bg-[#F5F5F5] transition"
          title="Tutup"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="overflow-y-auto">
        {rows.length > 0 && (
          <table className="w-full text-xs">
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-b border-[#F0F0F0] last:border-0">
                  <td className={`px-3 py-1.5 text-[#737373] align-top w-[40%] ${advanced ? "font-mono" : ""}`}>
                    {row.label}
                  </td>
                  <td className="px-3 py-1.5 break-words">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {derivedRows.length > 0 && (
          <>
            <div className="px-3 pt-2.5 pb-1 text-[11px] font-medium uppercase tracking-wide text-[#737373] border-t border-[#E5E5E5]">
              {advanced ? "(Derived)" : "Ukuran"}
            </div>
            <table className="w-full text-xs mb-1">
              <tbody>
                {derivedRows.map((row) => (
                  <tr key={row.label}>
                    <td className="px-3 py-1 text-[#737373] w-[40%]">{row.label}</td>
                    <td className="px-3 py-1 font-mono">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 border-t border-[#E5E5E5]">
        {geom.type === "Point" && (
          <a
            href={googleMapsRouteUrl(geom.coordinates[1], geom.coordinates[0])}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-1.5 py-1.5 px-2.5 text-xs font-semibold rounded transition ${
              isLokasi
                ? "border border-[#E5E5E5] hover:bg-[#F5F5F5]"
                : "bg-[#171717] text-white hover:bg-[#262626]"
            }`}
            title="Buka rute di Google Maps dari lokasi Anda saat ini"
          >
            <Navigation className="w-3.5 h-3.5" />
            Rute Google Maps
          </a>
        )}
        <button
          onClick={onZoomToFeature}
          className="flex items-center gap-1.5 py-1.5 px-2.5 text-xs font-medium border border-[#E5E5E5] rounded hover:bg-[#F5F5F5] transition"
        >
          <ScanSearch className="w-3.5 h-3.5" />
          Zoom ke Fitur
        </button>
        {isLokasi && onEditLocation && (
          <button
            onClick={() => onEditLocation(String(feature.id))}
            className="flex items-center gap-1.5 py-1.5 px-2.5 text-xs font-semibold bg-[#171717] text-white rounded hover:bg-[#262626] transition"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
        )}
        {geom.type === "Point" && onMoveFeature && (
          <button
            onClick={onMoveFeature}
            className="flex items-center gap-1.5 py-1.5 px-2.5 text-xs font-medium border border-[#E5E5E5] rounded hover:bg-[#F5F5F5] transition"
            title="Geser pin untuk memperbaiki koordinat"
          >
            <Move className="w-3.5 h-3.5" />
            Pindahkan
          </button>
        )}
        {isLokasi && onDeleteLocation && (
          <button
            onClick={() => onDeleteLocation(String(feature.id))}
            className="ml-auto flex items-center gap-1.5 py-1.5 px-2.5 text-xs font-semibold text-[#D44C47] border border-[#E5E5E5] rounded hover:bg-[#F5F5F5] transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Hapus
          </button>
        )}
      </div>
    </div>
  );
}
