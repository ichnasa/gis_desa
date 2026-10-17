import { useEffect, useState } from "react";
import type L from "leaflet";
import { mapScale, toUtm50S } from "../lib/geo";

type DisplayCrs = "EPSG:4326" | "EPSG:32750";

export interface StatusBarProps {
  map: L.Map | null;
}

// Status bar bawah ala QGIS: koordinat kursor, skala, zoom, CRS
export default function StatusBar({ map }: StatusBarProps) {
  const [cursor, setCursor] = useState<{ lat: number; lng: number } | null>(null);
  const [view, setView] = useState<{ lat: number; zoom: number } | null>(null);
  const [crs, setCrs] = useState<DisplayCrs>("EPSG:4326");

  useEffect(() => {
    if (!map) return;
    let frame = 0;

    const handleMove = (e: L.LeafletMouseEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setCursor({ lat: e.latlng.lat, lng: e.latlng.lng }));
    };
    const handleOut = () => setCursor(null);
    const handleView = () => setView({ lat: map.getCenter().lat, zoom: map.getZoom() });

    handleView();
    map.on("mousemove", handleMove);
    map.on("mouseout", handleOut);
    map.on("zoomend moveend", handleView);
    return () => {
      cancelAnimationFrame(frame);
      map.off("mousemove", handleMove);
      map.off("mouseout", handleOut);
      map.off("zoomend moveend", handleView);
    };
  }, [map]);

  let coordText = "–";
  if (cursor) {
    if (crs === "EPSG:4326") {
      coordText = `${cursor.lat.toFixed(6)}, ${cursor.lng.toFixed(6)}`;
    } else {
      const utm = toUtm50S(cursor.lat, cursor.lng);
      coordText = `${utm.easting.toFixed(1)} E, ${utm.northing.toFixed(1)} N`;
    }
  }

  return (
    <div className="h-7 flex-shrink-0 flex items-center gap-3 sm:gap-4 px-3 whitespace-nowrap overflow-hidden bg-white border-t border-[#E5E5E5] text-[11px] text-[#737373] select-none">
      <div className="flex items-center gap-1.5 sm:min-w-[230px]">
        <span>Koordinat</span>
        <span className="font-mono text-[#171717]">{coordText}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span>Skala</span>
        <span className="font-mono text-[#171717]">
          {view ? `1:${Math.round(mapScale(view.lat, view.zoom)).toLocaleString("id-ID")}` : "–"}
        </span>
      </div>
      <div className="hidden sm:flex items-center gap-1.5">
        <span>Zoom</span>
        <span className="font-mono text-[#171717]">{view ? view.zoom.toFixed(1) : "–"}</span>
      </div>
      <button
        onClick={() => setCrs((c) => (c === "EPSG:4326" ? "EPSG:32750" : "EPSG:4326"))}
        className="ml-auto px-2 py-0.5 rounded border border-[#E5E5E5] font-mono text-[#171717] hover:bg-[#F5F5F5] transition"
        title={crs === "EPSG:4326" ? "WGS 84 (lat, lng) — klik untuk UTM 50S" : "WGS 84 / UTM zona 50S — klik untuk lat, lng"}
      >
        {crs}
      </button>
    </div>
  );
}
