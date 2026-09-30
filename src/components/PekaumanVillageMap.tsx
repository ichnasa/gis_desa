import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Plus,
  Minus,
  Crosshair,
  Search,
  X,
  Check,
  MapPin,
} from "lucide-react";
import type { GisLocation, GisDrawMode, LayerVisibility, GisCategory, DrawingStyle } from "../types/gis";

// Perbaikan icon bawaan Leaflet
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

const CATEGORY_SVGS: Record<GisCategory, { label: string; svg: string }> = {
  pemerintahan: {
    label: "Pemerintahan",
    svg: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#171717" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" x2="22" y1="22" y2="22"/><line x1="4" x2="4" y1="10"/><line x1="20" x2="20" y1="10"/><polygon points="12 2 20 10 4 10"/><line x1="8" x2="8" y1="14"/><line x1="8" x2="8" y1="18"/><line x1="12" x2="12" y1="14"/><line x1="12" x2="12" y1="18"/><line x1="16" x2="16" y1="14"/><line x1="16" x2="16" y1="18"/></svg>`,
  },
  ibadah: {
    label: "Tempat Ibadah",
    svg: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#171717" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`,
  },
  pendidikan: {
    label: "Pendidikan",
    svg: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#171717" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg>`,
  },
  kesehatan: {
    label: "Kesehatan",
    svg: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#171717" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/></svg>`,
  },
  fasilitas: {
    label: "Fasilitas Umum",
    svg: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#171717" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="3"/><line x1="12" x2="12" y1="22"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/></svg>`,
  },
  ekonomi: {
    label: "Ekonomi / UMKM",
    svg: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#171717" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/></svg>`,
  },
};

function createMonochromeMarkerPin(category: GisCategory, isSelected: boolean = false) {
  const meta = CATEGORY_SVGS[category] || CATEGORY_SVGS.fasilitas;
  const size = isSelected ? 34 : 28;
  const bg = "#FFFFFF";
  const shadow = isSelected ? "0 8px 18px rgba(0,0,0,0.35)" : "0 3px 8px rgba(0,0,0,0.2)";
  const border = isSelected ? "3px solid #171717" : "2px solid #171717";

  return L.divIcon({
    className: "monochrome-gis-marker",
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
        <div style="
          background-color: ${bg};
          border: ${border};
          width: ${size}px;
          height: ${size}px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: ${shadow};
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        ">
          <span style="transform: rotate(45deg); display: flex; align-items: center; justify-content: center;">${meta.svg}</span>
        </div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -32],
  });
}


function calculatePolygonArea(coords: L.LatLng[]): number {
  if (coords.length < 3) return 0;
  const meanLat = coords.reduce((acc, c) => acc + c.lat, 0) / coords.length;
  const latRad = (meanLat * Math.PI) / 180;
  const metersPerDegLat = 111132.92 - 559.82 * Math.cos(2 * latRad);
  const metersPerDegLon = 111412.84 * Math.cos(latRad);

  const pts = coords.map((c) => ({
    x: c.lng * metersPerDegLon,
    y: c.lat * metersPerDegLat,
  }));

  let area = 0;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += pts[i].x * pts[j].y;
    area -= pts[j].x * pts[i].y;
  }
  return Math.abs(area) / 2.0;
}

function calculatePolylineDistance(coords: L.LatLng[]): number {
  let total = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    total += coords[i].distanceTo(coords[i + 1]);
  }
  return total;
}

export interface PekaumanVillageMapProps {
  locations?: GisLocation[];
  selectedLocation?: GisLocation | null;
  activeDrawMode?: GisDrawMode;
  layerVisibility?: LayerVisibility;
  drawingStyle?: DrawingStyle;
  onAddLocation?: (loc: GisLocation) => void;
  onDeleteLocation?: (id: string) => void;
  onSelectLocation?: (loc: GisLocation | null) => void;
  onStartEditLocation?: (loc: GisLocation) => void;
  onRequestNewPoint?: (coords: { lat: number; lng: number }) => void;
  onModeChange?: (mode: GisDrawMode) => void;
  onDrawingStateChange?: (state: {
    isDrawing: boolean;
    pointCount: number;
    measuredResult: string | null;
  }) => void;
  finishDrawingRef?: React.MutableRefObject<(() => void) | null>;
  undoPointRef?: React.MutableRefObject<(() => void) | null>;
  clearAllRef?: React.MutableRefObject<(() => void) | null>;
}

export default function PekaumanVillageMap({
  locations = [],
  selectedLocation,
  activeDrawMode = "select",
  layerVisibility = {
    satelliteLayer: true,
    villageBoundary: true,
    maskOverlay: true,
    pointMarkers: true,
    labels: true,
  },
  drawingStyle = {
    strokeColor: "#FFFFFF",
    fillColor: "#FFFFFF",
    fillOpacity: 0.3,
    strokeWeight: 2.5,
  },
  onAddLocation,
  onDeleteLocation,
  onSelectLocation,
  onStartEditLocation,
  onRequestNewPoint,
  onModeChange,
  onDrawingStateChange,
  finishDrawingRef,
  undoPointRef,
  clearAllRef,
}: PekaumanVillageMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Layer references
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const maskLayerRef = useRef<L.Polygon | null>(null);
  const boundaryLayerRef = useRef<L.Polyline | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const drawnFeaturesGroupRef = useRef<L.FeatureGroup | null>(null);

  // Drawing state
  const [currentDrawPoints, setCurrentDrawPoints] = useState<L.LatLng[]>([]);
  const previewPolylineRef = useRef<L.Polyline | null>(null);
  const previewPolygonRef = useRef<L.Polygon | null>(null);
  const activeVerticesGroupRef = useRef<L.LayerGroup | null>(null);
  const rubberBandLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const markersMapRef = useRef<Map<string, L.Marker>>(new Map());
  // Search state over map
  const [mapSearchText, setMapSearchText] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // HUD & Toast
  const [hudCoords, setHudCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const searchResults = useMemo(() => {
    if (!mapSearchText.trim()) return [];
    return locations.filter(
      (loc) =>
        loc.name.toLowerCase().includes(mapSearchText.toLowerCase()) ||
        loc.address.toLowerCase().includes(mapSearchText.toLowerCase())
    );
  }, [locations, mapSearchText]);

  // Finish Drawing
  const finishDrawing = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map || currentDrawPoints.length === 0) return;

    if (activeDrawMode === "polygon") {
      if (currentDrawPoints.length >= 3) {
        const areaSqM = calculatePolygonArea(currentDrawPoints);
        const areaHa = areaSqM / 10000;
        const areaText =
          areaHa >= 1
            ? `${areaHa.toFixed(2)} Ha (${Math.round(areaSqM).toLocaleString()} m²)`
            : `${Math.round(areaSqM).toLocaleString()} m²`;

        const polygon = L.polygon(currentDrawPoints, {
          color: drawingStyle.strokeColor,
          weight: drawingStyle.strokeWeight,
          fillColor: drawingStyle.fillColor,
          fillOpacity: drawingStyle.fillOpacity,
        });

        const popupDiv = document.createElement("div");
        popupDiv.className = "p-2 min-w-[200px] text-[#171717] font-sans";

        const titleEl = document.createElement("div");
        titleEl.className = "font-semibold text-xs text-[#171717] mb-0.5";
        titleEl.textContent = "Area Poligon";
        popupDiv.appendChild(titleEl);

        const areaEl = document.createElement("div");
        areaEl.className = "text-[#171717] font-bold text-sm mb-1.5";
        areaEl.textContent = areaText;
        popupDiv.appendChild(areaEl);

        const colorInfo = document.createElement("div");
        colorInfo.className = "text-[11px] text-[#737373] mb-2 flex items-center gap-2";
        const outlineSpan = document.createElement("span");
        outlineSpan.textContent = `Outline: ${drawingStyle.strokeColor}`;
        const innerSpan = document.createElement("span");
        innerSpan.textContent = `Inner: ${drawingStyle.fillColor}`;
        colorInfo.appendChild(outlineSpan);
        colorInfo.appendChild(innerSpan);
        popupDiv.appendChild(colorInfo);

        const actDiv = document.createElement("div");
        actDiv.className = "pt-2 border-t border-[#E5E5E5] flex justify-end";
        const delBtn = document.createElement("button");
        delBtn.className = "px-2.5 py-1 text-xs font-medium text-[#D44C47] border border-[#E5E5E5] hover:bg-[#F5F5F5] rounded transition cursor-pointer";
        delBtn.textContent = "Hapus Area";
        delBtn.onclick = (e) => {
          e.stopPropagation();
          map.closePopup();
          polygon.remove();
          showToast("Area poligon berhasil dihapus");
        };
        actDiv.appendChild(delBtn);
        popupDiv.appendChild(actDiv);
        polygon.bindPopup(popupDiv);
        if (drawnFeaturesGroupRef.current) {
          drawnFeaturesGroupRef.current.addLayer(polygon);
        }
        polygon.openPopup();
        showToast("Bentuk area berhasil dibuat");
      }
    } else if (activeDrawMode === "polyline") {
      if (currentDrawPoints.length >= 2) {
        const distM = calculatePolylineDistance(currentDrawPoints);
        const distText =
          distM >= 1000 ? `${(distM / 1000).toFixed(2)} km` : `${Math.round(distM)} meter`;

        const polyline = L.polyline(currentDrawPoints, {
          color: drawingStyle.strokeColor,
          weight: drawingStyle.strokeWeight,
          opacity: 0.95,
        });

        const popupDiv = document.createElement("div");
        popupDiv.className = "p-2 min-w-[200px] text-[#171717] font-sans";

        const titleEl = document.createElement("div");
        titleEl.className = "font-semibold text-xs text-[#171717] mb-0.5";
        titleEl.textContent = "Garis Jalur (Pen Tool)";
        popupDiv.appendChild(titleEl);

        const distEl = document.createElement("div");
        distEl.className = "text-[#171717] font-bold text-sm mb-1.5";
        distEl.textContent = distText;
        popupDiv.appendChild(distEl);

        const colorInfo = document.createElement("div");
        colorInfo.className = "text-[11px] text-[#737373] mb-2";
        colorInfo.textContent = `Warna: ${drawingStyle.strokeColor}`;
        popupDiv.appendChild(colorInfo);

        const actDiv = document.createElement("div");
        actDiv.className = "pt-2 border-t border-[#E5E5E5] flex justify-end";
        const delBtn = document.createElement("button");
        delBtn.className = "px-2.5 py-1 text-xs font-medium text-[#D44C47] border border-[#E5E5E5] hover:bg-[#F5F5F5] rounded transition cursor-pointer";
        delBtn.textContent = "Hapus Garis";
        delBtn.onclick = (e) => {
          e.stopPropagation();
          map.closePopup();
          polyline.remove();
          showToast("Garis jalur berhasil dihapus");
        };
        actDiv.appendChild(delBtn);
        popupDiv.appendChild(actDiv);
        polyline.bindPopup(popupDiv);
        if (drawnFeaturesGroupRef.current) {
          drawnFeaturesGroupRef.current.addLayer(polyline);
        }
        polyline.openPopup();
        showToast("Garis jalur berhasil dibuat");
      }
    }

    if (previewPolylineRef.current) previewPolylineRef.current.remove();
    if (previewPolygonRef.current) previewPolygonRef.current.remove();
    if (activeVerticesGroupRef.current) activeVerticesGroupRef.current.clearLayers();
    if (rubberBandLayerGroupRef.current) rubberBandLayerGroupRef.current.clearLayers();

    setCurrentDrawPoints([]);
    if (onDrawingStateChange) {
      onDrawingStateChange({ isDrawing: false, pointCount: 0, measuredResult: null });
    }
    if (onModeChange) onModeChange("select");
  }, [activeDrawMode, currentDrawPoints, drawingStyle, onDrawingStateChange, onModeChange]);

  const undoLastPoint = useCallback(() => {
    setCurrentDrawPoints((prev) => {
      if (prev.length === 0) return prev;
      const updated = prev.slice(0, prev.length - 1);

      if (previewPolylineRef.current) previewPolylineRef.current.setLatLngs(updated);
      if (previewPolygonRef.current) previewPolygonRef.current.setLatLngs(updated);
      if (rubberBandLayerGroupRef.current) rubberBandLayerGroupRef.current.clearLayers();

      if (onDrawingStateChange) {
        let measured: string | null = null;
        if (updated.length >= 2 && activeDrawMode === "polyline") {
          const d = calculatePolylineDistance(updated);
          measured = d >= 1000 ? `${(d / 1000).toFixed(2)} km` : `${Math.round(d)} m`;
        } else if (updated.length >= 3 && activeDrawMode === "polygon") {
          const a = calculatePolygonArea(updated);
          measured = a >= 10000 ? `${(a / 10000).toFixed(2)} Ha` : `${Math.round(a)} m²`;
        }
        onDrawingStateChange({
          isDrawing: updated.length > 0,
          pointCount: updated.length,
          measuredResult: measured,
        });
      }
      return updated;
    });
  }, [activeDrawMode, onDrawingStateChange]);

  const clearAllDrawings = useCallback(() => {
    if (drawnFeaturesGroupRef.current) drawnFeaturesGroupRef.current.clearLayers();
    if (previewPolylineRef.current) previewPolylineRef.current.remove();
    if (previewPolygonRef.current) previewPolygonRef.current.remove();
    if (activeVerticesGroupRef.current) activeVerticesGroupRef.current.clearLayers();
    if (rubberBandLayerGroupRef.current) rubberBandLayerGroupRef.current.clearLayers();
    setCurrentDrawPoints([]);
    if (onDrawingStateChange) {
      onDrawingStateChange({ isDrawing: false, pointCount: 0, measuredResult: null });
    }
    showToast("Sketsa gambar dibersihkan");
  }, [onDrawingStateChange]);

  useEffect(() => {
    if (finishDrawingRef) finishDrawingRef.current = finishDrawing;
    if (undoPointRef) undoPointRef.current = undoLastPoint;
    if (clearAllRef) clearAllRef.current = clearAllDrawings;
  }, [finishDrawing, undoLastPoint, clearAllDrawings, finishDrawingRef, undoPointRef, clearAllRef]);

  // Live update drawing styles for active previews
  useEffect(() => {
    if (previewPolygonRef.current) {
      previewPolygonRef.current.setStyle({
        color: drawingStyle.strokeColor,
        fillColor: drawingStyle.fillColor,
        fillOpacity: drawingStyle.fillOpacity,
        weight: drawingStyle.strokeWeight,
      });
    }
    if (previewPolylineRef.current) {
      previewPolylineRef.current.setStyle({
        color: drawingStyle.strokeColor,
        weight: drawingStyle.strokeWeight,
      });
    }
  }, [drawingStyle]);

  // 1. Inisialisasi Peta
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

    const tileLayer = L.tileLayer("/tiles/{z}/{x}/{y}.png", {
      minZoom: 14,
      maxZoom: 20,
      bounds: tileBounds,
      attribution: "Citra Satelit &copy; Desa Pekauman Ulu",
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    // Masking monochrome: light gray
    const maskLayer = L.polygon([WORLD_OUTER_RING, VILLAGE_BOUNDARY], {
      fillColor: "#F5F5F5",
      fillOpacity: 0.8,
      stroke: false,
      interactive: false,
    }).addTo(map);
    maskLayerRef.current = maskLayer;

    // Batas desa monochrome: dark charcoal / black
    const boundaryLayer = L.polyline(VILLAGE_BOUNDARY, {
      color: "#171717",
      weight: 2,
      opacity: 0.85,
      dashArray: "6, 6",
    }).addTo(map);
    boundaryLayerRef.current = boundaryLayer;

    const drawnFeaturesGroup = L.featureGroup().addTo(map);
    drawnFeaturesGroupRef.current = drawnFeaturesGroup;

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerGroupRef.current = markersGroup;

    const activeVerticesGroup = L.layerGroup().addTo(map);
    activeVerticesGroupRef.current = activeVerticesGroup;

    const rubberBandGroup = L.layerGroup().addTo(map);
    rubberBandLayerGroupRef.current = rubberBandGroup;

    const handleResize = () => map.invalidateSize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Render Markers
  useEffect(() => {
    const markersGroup = markersLayerGroupRef.current;
    const map = mapInstanceRef.current;
    if (!markersGroup || !map) return;

    markersGroup.clearLayers();

    if (!layerVisibility.pointMarkers) return;

    locations.forEach((loc) => {
      const isSelected = selectedLocation?.id === loc.id;
      const pinIcon = createMonochromeMarkerPin(loc.category, isSelected);
      const marker = L.marker([loc.lat, loc.lng], { icon: pinIcon });
      markersMapRef.current.set(loc.id, marker);

      // Popover Aksi & Informasi Lengkap Titik Lokasi (Bebas innerHTML, 100% textContent)
      const popupDiv = document.createElement("div");
      popupDiv.className = "p-2.5 min-w-[260px] max-w-[320px] text-[#171717] font-sans";

      // Kategori (Diperbesar ke text-xs)
      const categoryRow = document.createElement("div");
      categoryRow.className = "text-xs text-[#737373] font-medium tracking-wide uppercase mb-1";
      categoryRow.textContent = CATEGORY_SVGS[loc.category]?.label || "Lokasi";
      popupDiv.appendChild(categoryRow);

      // Nama Lokasi (Diperbesar ke text-base / 16px font-bold)
      const titleEl = document.createElement("div");
      titleEl.className = "font-bold text-base leading-snug text-[#171717] mb-1.5";
      titleEl.textContent = loc.name;
      popupDiv.appendChild(titleEl);

      // Alamat (Diperbesar ke text-sm / 14px)
      const addressEl = document.createElement("div");
      addressEl.className = "text-sm text-[#525252] mb-1 leading-snug";
      addressEl.textContent = `Alamat: ${loc.address || "-"}`;
      popupDiv.appendChild(addressEl);

      // Wilayah RT/RW (Diperbesar ke text-sm / 14px)
      if (loc.rtRw) {
        const rtRwEl = document.createElement("div");
        rtRwEl.className = "text-sm text-[#171717] mb-1 font-medium";
        rtRwEl.textContent = `Wilayah: ${loc.rtRw}`;
        popupDiv.appendChild(rtRwEl);
      }

      // Deskripsi (Diperbesar ke text-xs dengan box rapi)
      if (loc.description) {
        const descEl = document.createElement("p");
        descEl.className = "text-xs italic text-[#525252] mt-1 mb-2 leading-relaxed bg-[#F5F5F5] p-2 rounded border border-[#E5E5E5]";
        descEl.textContent = `"${loc.description}"`;
        popupDiv.appendChild(descEl);
      }

      // Koordinat (Diperbesar ke text-xs font-mono)
      const coordsEl = document.createElement("div");
      coordsEl.className = "text-xs font-mono text-[#737373] mb-3";
      coordsEl.textContent = `${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}`;
      popupDiv.appendChild(coordsEl);

      // Baris Tombol Aksi
      const actDiv = document.createElement("div");
      actDiv.className = "pt-2.5 border-t border-[#E5E5E5] flex items-center justify-between gap-2.5";

      // Tombol Edit
      const editBtn = document.createElement("button");
      editBtn.className = "flex-1 py-1.5 px-3 text-xs font-semibold bg-[#171717] text-white rounded hover:bg-[#262626] transition text-center cursor-pointer";
      editBtn.textContent = "Edit Lokasi";
      editBtn.onclick = (e) => {
        e.stopPropagation();
        map.closePopup();
        if (onStartEditLocation) onStartEditLocation(loc);
      };

      // Tombol Hapus
      const delBtn = document.createElement("button");
      delBtn.className = "py-1.5 px-3 text-xs font-semibold text-[#D44C47] border border-[#E5E5E5] hover:bg-[#F5F5F5] rounded transition cursor-pointer";
      delBtn.textContent = "Hapus";
      delBtn.onclick = (e) => {
        e.stopPropagation();
        map.closePopup();
        if (onDeleteLocation) onDeleteLocation(loc.id);
      };

      actDiv.appendChild(editBtn);
      actDiv.appendChild(delBtn);
      popupDiv.appendChild(actDiv);

      marker.bindPopup(popupDiv);

      marker.on("click", () => {
        if (activeDrawMode === "eraser") {
          if (onDeleteLocation) onDeleteLocation(loc.id);
        } else {
          if (onSelectLocation) onSelectLocation(loc);
          marker.openPopup();
        }
      });


      markersGroup.addLayer(marker);
    });
  }, [locations, selectedLocation, layerVisibility.pointMarkers, activeDrawMode, onDeleteLocation, onSelectLocation, onStartEditLocation]);

  // 3. Fly to Selected Location
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedLocation) return;

    map.flyTo([selectedLocation.lat, selectedLocation.lng], 19, {
      duration: 1.0,
    });

    const targetMarker = markersMapRef.current.get(selectedLocation.id);
    if (targetMarker) {
      setTimeout(() => {
        targetMarker.openPopup();
      }, 400);
    }
  }, [selectedLocation]);

  // 4. Drawing Event Listeners (Figma Pen Tool Behavior)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const container = mapContainerRef.current;
    if (!map || !container) return;

    if (activeDrawMode === "marker" || activeDrawMode === "polygon" || activeDrawMode === "polyline") {
      container.style.cursor = "crosshair";
    } else if (activeDrawMode === "eraser") {
      container.style.cursor = "not-allowed";
    } else {
      container.style.cursor = "";
      if (rubberBandLayerGroupRef.current) rubberBandLayerGroupRef.current.clearLayers();
    }

    const handleMouseMove = (e: L.LeafletMouseEvent) => {
      setHudCoords({ lat: e.latlng.lat, lng: e.latlng.lng });

      // FIGMA PEN TOOL: Rubber-banding preview while mouse is moving
      if ((activeDrawMode === "polygon" || activeDrawMode === "polyline") && currentDrawPoints.length > 0) {
        const group = rubberBandLayerGroupRef.current;
        if (!group) return;
        group.clearLayers();

        const lastPt = currentDrawPoints[currentDrawPoints.length - 1];
        const mousePt = e.latlng;

        // Line following mouse cursor from last placed vertex
        const rubberLine = L.polyline([lastPt, mousePt], {
          color: drawingStyle.strokeColor,
          weight: drawingStyle.strokeWeight,
          dashArray: "4, 4",
          opacity: 0.85,
        });
        group.addLayer(rubberLine);

        if (activeDrawMode === "polygon") {
          // Dotted closing guide to the first point
          const closingLine = L.polyline([mousePt, currentDrawPoints[0]], {
            color: drawingStyle.strokeColor,
            weight: 1.5,
            dashArray: "3, 3",
            opacity: 0.5,
          });
          group.addLayer(closingLine);

          // Ghost fill preview
          const ghostPoly = L.polygon([...currentDrawPoints, mousePt], {
            color: drawingStyle.strokeColor,
            weight: 0,
            fillColor: drawingStyle.fillColor,
            fillOpacity: drawingStyle.fillOpacity * 0.7,
          });
          group.addLayer(ghostPoly);
        }

        // Small vertex dot under the cursor
        const cursorDot = L.circleMarker(mousePt, {
          radius: 3.5,
          color: "#FFFFFF",
          weight: 1.5,
          fillColor: drawingStyle.strokeColor,
          fillOpacity: 1,
        });
        group.addLayer(cursorDot);
      }
    };

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const latlng = e.latlng;

      if (activeDrawMode === "marker") {
        if (onRequestNewPoint) {
          onRequestNewPoint({ lat: latlng.lat, lng: latlng.lng });
        }
        if (onModeChange) onModeChange("select");
        return;
      }

      if (activeDrawMode === "polygon") {
        setCurrentDrawPoints((prev) => {
          const updated = [...prev, latlng];

          if (!previewPolygonRef.current) {
            previewPolygonRef.current = L.polygon(updated, {
              color: drawingStyle.strokeColor,
              weight: drawingStyle.strokeWeight,
              fillColor: drawingStyle.fillColor,
              fillOpacity: drawingStyle.fillOpacity,
            }).addTo(map);
          } else {
            previewPolygonRef.current.setLatLngs(updated);
          }

          if (activeVerticesGroupRef.current) {
            const vertexCircle = L.circleMarker(latlng, {
              radius: 4,
              color: "#FFFFFF",
              weight: 2,
              fillColor: drawingStyle.strokeColor,
              fillOpacity: 1,
            });
            activeVerticesGroupRef.current.addLayer(vertexCircle);
          }

          let measured: string | null = null;
          if (updated.length >= 3) {
            const areaM2 = calculatePolygonArea(updated);
            const areaHa = areaM2 / 10000;
            measured = areaHa >= 1 ? `${areaHa.toFixed(2)} Ha` : `${Math.round(areaM2)} m²`;
          }

          if (onDrawingStateChange) {
            onDrawingStateChange({
              isDrawing: true,
              pointCount: updated.length,
              measuredResult: measured,
            });
          }

          return updated;
        });
        return;
      }

      if (activeDrawMode === "polyline") {
        setCurrentDrawPoints((prev) => {
          const updated = [...prev, latlng];

          if (!previewPolylineRef.current) {
            previewPolylineRef.current = L.polyline(updated, {
              color: drawingStyle.strokeColor,
              weight: drawingStyle.strokeWeight,
            }).addTo(map);
          } else {
            previewPolylineRef.current.setLatLngs(updated);
          }

          if (activeVerticesGroupRef.current) {
            const vertexCircle = L.circleMarker(latlng, {
              radius: 4,
              color: "#FFFFFF",
              weight: 2,
              fillColor: drawingStyle.strokeColor,
              fillOpacity: 1,
            });
            activeVerticesGroupRef.current.addLayer(vertexCircle);
          }

          let measured: string | null = null;
          if (updated.length >= 2) {
            const distM = calculatePolylineDistance(updated);
            measured = distM >= 1000 ? `${(distM / 1000).toFixed(2)} km` : `${Math.round(distM)} m`;
          }

          if (onDrawingStateChange) {
            onDrawingStateChange({
              isDrawing: true,
              pointCount: updated.length,
              measuredResult: measured,
            });
          }

          return updated;
        });
      }
    };

    const handleDoubleClick = (e: L.LeafletMouseEvent) => {
      L.DomEvent.stop(e);
      if (activeDrawMode !== "select") {
        finishDrawing();
      }
    };

    map.on("mousemove", handleMouseMove);
    map.on("click", handleMapClick);
    map.on("dblclick", handleDoubleClick);

    return () => {
      map.off("mousemove", handleMouseMove);
      map.off("click", handleMapClick);
      map.off("dblclick", handleDoubleClick);
    };
  }, [
    activeDrawMode,
    currentDrawPoints,
    drawingStyle,
    finishDrawing,
    onAddLocation,
    onDrawingStateChange,
    onModeChange,
  ]);


  return (
    <div className="relative w-full h-full flex-1 overflow-hidden select-none bg-[#F5F5F5]">
      {/* 1. Leaflet Container */}
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

      {/* 3. Floating Controls Kanan */}
      <div id="tour-map-controls" className="absolute top-4 right-4 z-[500] flex flex-col gap-2">
        {/* Zoom In & Out */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E5] flex flex-col overflow-hidden">
          <button
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="w-9 h-9 flex items-center justify-center text-[#171717] hover:bg-[#F5F5F5] transition"
            title="Perbesar"
          >
            <Plus className="w-4 h-4" />
          </button>
          <div className="w-full h-[1px] bg-[#E5E5E5]" />
          <button
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="w-9 h-9 flex items-center justify-center text-[#171717] hover:bg-[#F5F5F5] transition"
            title="Perkecil"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* Current Location / Home */}
        <button
          onClick={() => mapInstanceRef.current?.flyTo(KANTOR_DESA, 17, { duration: 1.0 })}
          className="w-9 h-9 bg-white rounded-lg shadow-sm border border-[#E5E5E5] flex items-center justify-center text-[#171717] hover:bg-[#F5F5F5] transition"
          title="Lokasi Kantor Desa"
        >
          <Crosshair className="w-4 h-4" />
        </button>
      </div>


      {/* 5. Feedback Toast Banner */}
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] px-4 py-2 bg-[#171717] text-white text-xs font-medium rounded-lg shadow-md border border-[#262626] flex items-center gap-2">
          <Check className="w-3.5 h-3.5 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 6. Subtle HUD Coordinates */}
      <div className="absolute bottom-4 left-4 z-[400] pointer-events-none hidden sm:block text-[11px] text-[#737373] bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded border border-[#E5E5E5]">
        {hudCoords
          ? `${hudCoords.lat.toFixed(6)}, ${hudCoords.lng.toFixed(6)}`
          : "Peta Desa Pekauman Ulu"}
      </div>
    </div>
  );
}
