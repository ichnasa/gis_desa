import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Perbaikan icon bawaan Leaflet
// Leaflet searching for icon but in react-vite the images is hashed and the file name changes, this cause leaflet impossible to find the icon image
// That's why we have to explicitly declared the image location
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

// This delete leaflet function that search the icon
// as unknown as (reset type checking to permit deleting private property in runtime since typescript doesnt recognize the object we want to modified) is used so the typescript doesnt show underline error beacuse we are deleting internal property (_getIconUrl)
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
// This give the valid icon image URL
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

// Koordinat tepat Kantor Desa Pekauman Ulu
const KANTOR_DESA_PEKAUMAN: [number, number] = [-3.397991, 114.844238];

export default function PekaumanMap() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // 1. Inisialisasi peta langsung pada Zoom Level 20
    const map = L.map(mapContainerRef.current, {
      center: KANTOR_DESA_PEKAUMAN,
      zoom: 20,                // Setara tampilan ketinggian 72 meter di Google Maps
      minZoom: 14,             // Bisa zoom out hingga pandangan kecamatan
      maxZoom: 20,             // Maksimal zoom 20 (sudah ada file ubin fisiknya)
    });
    mapInstanceRef.current = map;

    // 2. Hubungkan ke file tile lokal di public/tiles/
    L.tileLayer("/tiles/{z}/{x}/{y}.png", {
      minZoom: 14,
      maxZoom: 20,
      attribution: "Satelit Offline &copy; Desa Pekauman Ulu",
    }).addTo(map);

    // 3. Tambahkan marker Kantor Desa
    L.marker(KANTOR_DESA_PEKAUMAN)
      .addTo(map)
      .bindPopup(
        `<b>Kantor Desa Pekauman Ulu</b><br />
         Kec. Martapura Timur, Kab. Banjar<br />
         <small>-3.397991, 114.844238</small>`
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
        borderRadius: "10px",
        border: "1px solid #ccc",
      }}
    />
  );
}
