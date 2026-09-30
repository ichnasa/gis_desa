import { useEffect, useRef, useState, useMemo } from "react";
import { Search, X, MapPin } from "lucide-react";
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

  // Search state over map
  const [mapSearchText, setMapSearchText] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const searchResults = useMemo(() => {
    if (!mapSearchText.trim()) return [];
    return locations.filter(
      (loc) =>
        loc.name.toLowerCase().includes(mapSearchText.toLowerCase()) ||
        loc.address.toLowerCase().includes(mapSearchText.toLowerCase())
    );
  }, [locations, mapSearchText]);

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

      {/* 2. Floating Search Bar di Peta */}
      <div id="tour-search-bar" className="absolute top-4 left-4 z-[500] w-72 sm:w-80">
        <div className="relative bg-white rounded-lg shadow-sm border border-[#E5E5E5] transition-all">
          <input
            type="text"
            placeholder="Cari lokasi, desa, atau tempat..."
            value={mapSearchText}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            onChange={(e) => setMapSearchText(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm bg-transparent rounded-lg focus:outline-none text-[#171717] placeholder-[#737373]"
          />
          <Search className="w-4 h-4 text-[#737373] absolute left-3 top-2.5" />
          {mapSearchText && (
            <button
              onClick={() => setMapSearchText("")}
              className="absolute right-2.5 top-2.5 text-[#737373] hover:text-[#171717]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Search Dropdown Results */}
          {isSearchFocused && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 mt-1 bg-white border border-[#E5E5E5] rounded-lg shadow-lg overflow-hidden z-[600] divide-y divide-[#E5E5E5]">
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  onMouseDown={() => {
                    if (onSelectLocation) onSelectLocation(result);
                    setMapSearchText("");
                  }}
                  className="p-3 hover:bg-[#F5F5F5] cursor-pointer transition flex items-start gap-2.5"
                >
                  <MapPin className="w-4 h-4 text-[#171717] mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[#171717] truncate">
                      {result.name}
                    </div>
                    <div className="text-xs text-[#737373] truncate">{result.address}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
