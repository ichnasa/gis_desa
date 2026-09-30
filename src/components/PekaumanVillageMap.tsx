import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { GisLocation, GisDrawMode } from "../types/gis";

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

function createSimpleMarker() {
  return L.divIcon({
    className: "monochrome-gis-marker",
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
        <div style="
          background-color: #FFFFFF;
          border: 2px solid #171717;
          width: 28px;
          height: 28px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span style="transform: rotate(45deg); font-size: 11px;">📍</span>
        </div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -32],
  });
}

export interface PekaumanVillageMapProps {
  locations?: GisLocation[];
  selectedLocation?: GisLocation | null;
  activeDrawMode?: GisDrawMode;
  onAddLocation?: (loc: GisLocation) => void;
  onDeleteLocation?: (id: string) => void;
  onSelectLocation?: (loc: GisLocation | null) => void;
  onStartEditLocation?: (loc: GisLocation) => void;
  onRequestNewPoint?: (coords: { lat: number; lng: number }) => void;
  onModeChange?: (mode: GisDrawMode) => void;
}

export default function PekaumanVillageMap({
  locations = [],
  selectedLocation,
  activeDrawMode = "select",
  onDeleteLocation,
  onSelectLocation,
  onStartEditLocation,
  onRequestNewPoint,
  onModeChange,
}: PekaumanVillageMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);

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

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerGroupRef.current = markersGroup;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const markersGroup = markersLayerGroupRef.current;
    if (!markersGroup) return;
    markersGroup.clearLayers();

    locations.forEach((loc) => {
      const pinIcon = createSimpleMarker();
      const marker = L.marker([loc.lat, loc.lng], { icon: pinIcon });
      marker.on("click", () => {
        if (activeDrawMode === "eraser") {
          if (onDeleteLocation) onDeleteLocation(loc.id);
        } else {
          if (onSelectLocation) onSelectLocation(loc);
        }
      });
      marker.on("dblclick", (e) => {
        L.DomEvent.stop(e);
        if (onStartEditLocation) onStartEditLocation(loc);
      });
      markersGroup.addLayer(marker);
    });
  }, [locations, onSelectLocation]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedLocation) return;
    map.flyTo([selectedLocation.lat, selectedLocation.lng], 19, { duration: 1.0 });
  }, [selectedLocation]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const container = mapContainerRef.current;
    if (!map || !container) return;

    if (activeDrawMode === "marker") {
      container.style.cursor = "crosshair";
    } else if (activeDrawMode === "eraser") {
      container.style.cursor = "not-allowed";
    } else {
      container.style.cursor = "";
    }

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (activeDrawMode === "marker") {
        if (onRequestNewPoint) {
          onRequestNewPoint({ lat: e.latlng.lat, lng: e.latlng.lng });
        }
        if (onModeChange) onModeChange("select");
      }
    };

    map.on("click", handleMapClick);
    return () => {
      map.off("click", handleMapClick);
    };
  }, [activeDrawMode, onRequestNewPoint, onModeChange]);

  return (
    <div className="relative w-full h-full flex-1 overflow-hidden select-none bg-[#F5F5F5]">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
    </div>
  );
}
