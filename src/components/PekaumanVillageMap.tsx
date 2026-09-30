import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default icons
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

const defaultIconProto = L.Icon.Default.prototype;
if ("_getIconUrl" in defaultIconProto) {
  Reflect.deleteProperty(defaultIconProto, "_getIconUrl");
}
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

export const KANTOR_DESA: [number, number] = [-3.397991, 114.844238];

export const VILLAGE_BOUNDARY: [number, number][] = [
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
  [-3.3952, 114.8428],
];

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

    const tileBounds = L.latLngBounds([-3.425, 114.83], [-3.385, 114.88]);

    const map = L.map(mapContainerRef.current, {
      center: KANTOR_DESA,
      zoom: 17,
      minZoom: 14,
      maxZoom: 20,
      maxBounds: tileBounds,
      maxBoundsViscosity: 0.9,
      zoomControl: false,
    });
    mapInstanceRef.current = map;

    L.control.scale({ metric: true, imperial: false, position: "bottomleft" }).addTo(map);

    L.tileLayer("/tiles/{z}/{x}/{y}.png", {
      minZoom: 14,
      maxZoom: 20,
      bounds: tileBounds,
      attribution: "Citra Satelit &copy; Desa Pekauman Ulu",
    }).addTo(map);

    L.polygon([WORLD_OUTER_RING, VILLAGE_BOUNDARY], {
      fillColor: "#F5F5F5",
      fillOpacity: 0.8,
      stroke: false,
      interactive: false,
    }).addTo(map);

    L.polyline(VILLAGE_BOUNDARY, {
      color: "#171717",
      weight: 2,
      opacity: 0.85,
      dashArray: "6, 6",
    }).addTo(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  return (
    <div className="relative w-full h-full flex-1 overflow-hidden select-none bg-[#F5F5F5]">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
    </div>
  );
}
