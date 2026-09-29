import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default icons
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

// Titik Kantor Desa Pekauman Ulu
const KANTOR_DESA: [number, number] = [-3.397991, 114.844238];

// Batas wilayah Desa Pekauman Ulu (format Leaflet: [latitude, longitude])
const VILLAGE_BOUNDARY: [number, number][] = [
  [-3.3952, 114.8428],
  [-3.3956, 114.8445],
  [-3.3965, 114.8458],
  [-3.3975, 114.8464],
  [-3.3988, 114.8468],
  [-3.4005, 114.8465],
  [-3.4018, 114.8455],
  [-3.4012, 114.8442],
  [-3.4000, 114.8432],
  [-3.3988, 114.8423],
  [-3.3975, 114.8418],
  [-3.3962, 114.8420],
  [-3.3952, 114.8428], // Kembali ke titik awal
];

// Lingkar terluar dunia untuk membuat efek "lubang donat" (masking)
const WORLD_OUTER_RING: [number, number][] = [
  [-90, -180],
  [-90, 180],
  [90, 180],
  [90, -180],
];

export default function PekaumanVillageMap() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // 1. Inisialisasi peta berpusat di Kantor Desa
    const map = L.map(mapContainerRef.current, {
      center: KANTOR_DESA,
      zoom: 17,
      minZoom: 14,
      maxZoom: 20,
    });
    mapInstanceRef.current = map;

    // 2. Lapisan Dasar: Citra Satelit Offline
    L.tileLayer("/tiles/{z}/{x}/{y}.png", {
      minZoom: 14,
      maxZoom: 20,
      attribution: "&copy; Desa Pekauman Ulu",
    }).addTo(map);

    // 3. Lapisan Mask Donat: Menggelapkan area di luar desa
    L.polygon([WORLD_OUTER_RING, VILLAGE_BOUNDARY], {
      fillColor: "#0f172a",  // Gelap (slate-900)
      fillOpacity: 0.65,     // 65% redup di luar desa
      stroke: false,         // Tanpa garis luar dunia
      interactive: false,    // Klik & geser mouse tembus ke peta
    }).addTo(map);

    // 4. Garis Batas Desa: Clean & Flat Vector Outline
    L.polyline(VILLAGE_BOUNDARY, {
      color: "#f59e0b",      // Kuning emas / Amber
      weight: 2,             // Tebal garis 3px
      opacity: 0.95,
      dashArray: "6, 8",     // Gaya garis putus-putus batas administratif
    }).addTo(map);

    // 5. Pin Marker Kantor Desa
    L.marker(KANTOR_DESA)
      .addTo(map)
      .bindPopup(
        `<b>Kantor Desa Pekauman Ulu</b><br />
         Kec. Martapura Timur, Kab. Banjar`
      )
      .openPopup();

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  return (
    <div
      ref={mapContainerRef}
      style={{
        width: "100%",
        height: "650px",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
      }}
    />
  );
}
