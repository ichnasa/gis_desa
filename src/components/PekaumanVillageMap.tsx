import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Feature, FeatureCollection, Point, Polygon, MultiPolygon } from "geojson";
import type { GisDrawMode, GisLayer, GisLayerStyle, IdentifiedFeature } from "../types/gis";
import { BATAS_DESA_LAYER_ID, KANTOR_DESA } from "../lib/layers";
import { createMonochromeMarkerPin } from "../lib/markers";

// Esri World Imagery: pakai API key ArcGIS Location Platform jika tersedia (VITE_ESRI_API_KEY di .env.local)
const ESRI_API_KEY: string | undefined = import.meta.env.VITE_ESRI_API_KEY;
const ESRI_IMAGERY_URL = ESRI_API_KEY
  ? `https://ibasemaps-api.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}?token=${ESRI_API_KEY}`
  : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const ESRI_ATTRIBUTION =
  'Powered by <a href="https://www.esri.com">Esri</a> | Esri, Maxar, Earthstar Geographics, and the GIS User Community';

const WORLD_OUTER_RING: [number, number][] = [
  [-90, -180],
  [-90, 180],
  [90, 180],
  [90, -180],
];

const HIGHLIGHT_PANE = "highlightPane";
const HIGHLIGHT_COLOR = "#EF4444";

type FeatureClickHandler = (layerId: string, feature: Feature, e: L.LeafletMouseEvent) => void;

interface LayerEntry {
  layer: L.Layer;
  data: FeatureCollection | null;
}

function createLeafletLayer(def: GisLayer, onFeatureClick: FeatureClickHandler): L.Layer | null {
  if (def.render === "tile") {
    // Esri hanya punya citra asli sampai zoom 18 di area ini, di atasnya di-upscale
    return L.tileLayer(ESRI_IMAGERY_URL, { maxNativeZoom: 18, maxZoom: 20, attribution: ESRI_ATTRIBUTION });
  }
  if (!def.data) return null;

  if (def.render === "mask") {
    // Lubangi dunia dengan poligon desa
    const holes = def.data.features.flatMap((f) => {
      const geom = f.geometry as Polygon | MultiPolygon;
      const polygons = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
      return polygons.map((p) => p[0].map(([lng, lat]) => [lat, lng] as [number, number]));
    });
    return L.polygon([WORLD_OUTER_RING, ...holes], { stroke: false, interactive: false });
  }

  return L.geoJSON(def.data, {
    pointToLayer: (feature, latlng) =>
      def.render === "points"
        ? L.marker(latlng, { icon: createMonochromeMarkerPin(feature.properties.category) })
        : L.circleMarker(latlng, { radius: def.style?.radius ?? 5 }),
    onEachFeature: (feature, layer) => {
      layer.on("click", (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e);
        onFeatureClick(def.id, feature, e);
      });
    },
  });
}

function pathStyle(style: GisLayerStyle, opacity: number, fillColor?: string): L.PathOptions {
  return {
    color: style.strokeColor,
    weight: style.strokeWeight,
    opacity,
    fillColor: fillColor ?? style.fillColor,
    fillOpacity: style.fillOpacity * opacity,
    dashArray: style.dashArray,
  };
}

function applyLayerStyle(layer: L.Layer, def: GisLayer) {
  if (layer instanceof L.TileLayer) {
    layer.setOpacity(def.opacity);
  } else if (def.render === "points" && layer instanceof L.GeoJSON) {
    layer.eachLayer((m) => (m as L.Marker).setOpacity(def.opacity));
  } else if (def.style && layer instanceof L.Polygon) {
    layer.setStyle(pathStyle(def.style, def.opacity));
  } else if (def.style && layer instanceof L.GeoJSON) {
    const style = def.style;
    layer.setStyle((feature) => {
      const highlighted = style.highlightField && feature?.properties?.[style.highlightField];
      return pathStyle(style, def.opacity, highlighted ? style.highlightColor : undefined);
    });
  }
}

export interface PekaumanVillageMapProps {
  layers: GisLayer[];
  identified?: IdentifiedFeature | null;
  activeDrawMode?: GisDrawMode;
  onIdentify?: (result: IdentifiedFeature | null) => void;
  onRequestNewPoint?: (coords: { lat: number; lng: number }) => void;
  onMapReady?: (map: L.Map | null) => void;
  // Mode pindah titik: ID fitur pin yang sedang dipindahkan & posisi sementaranya
  movingFeatureId?: string | null;
  movingPosition?: { lat: number; lng: number } | null;
  onMovePosition?: (pos: { lat: number; lng: number }) => void;
}

// Cari titik (pin L.Marker atau lingkaran L.CircleMarker) berdasarkan ID fitur di semua layer GeoJSON
function findPoint(entries: Map<string, LayerEntry>, featureId: string): L.Marker | L.CircleMarker | null {
  for (const [, entry] of entries) {
    if (!(entry.layer instanceof L.GeoJSON)) continue;
    for (const l of entry.layer.getLayers()) {
      if ((l instanceof L.Marker || l instanceof L.CircleMarker) && (l.feature as Feature | undefined)?.id === featureId) {
        return l;
      }
    }
  }
  return null;
}

// Penanda bulat yang bisa digeser, pengganti sementara titik lingkaran (mis. rumah warga)
function createMovingDotIcon(fillColor: string) {
  return L.divIcon({
    className: "marker-moving",
    html: `<div style="transform: translate(-50%, -50%);"><div style="width: 22px; height: 22px; border-radius: 50%; box-sizing: border-box; background: ${fillColor}; border: 3px solid #EF4444;"></div></div>`,
    iconSize: [0, 0],
  });
}

export default function PekaumanVillageMap({
  layers,
  identified,
  activeDrawMode = "select",
  onIdentify,
  onRequestNewPoint,
  onMapReady,
  movingFeatureId = null,
  movingPosition = null,
  onMovePosition,
}: PekaumanVillageMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerEntriesRef = useRef<Map<string, LayerEntry>>(new Map());
  const highlightGroupRef = useRef<L.LayerGroup | null>(null);
  const hasFittedRef = useRef(false);

  // Handler Leaflet dipasang sekali, jadi baca props terbaru lewat ref
  const drawModeRef = useRef(activeDrawMode);
  const onIdentifyRef = useRef(onIdentify);
  const onRequestNewPointRef = useRef(onRequestNewPoint);
  const onMapReadyRef = useRef(onMapReady);
  const movingIdRef = useRef(movingFeatureId);
  // Penanda yang sedang digeser (pin asli, atau penanda sementara untuk titik lingkaran)
  const movingMarkerRef = useRef<L.Marker | null>(null);
  const movingPositionRef = useRef(movingPosition);
  const onMovePositionRef = useRef(onMovePosition);
  useEffect(() => {
    drawModeRef.current = activeDrawMode;
    onIdentifyRef.current = onIdentify;
    onRequestNewPointRef.current = onRequestNewPoint;
    onMapReadyRef.current = onMapReady;
    movingIdRef.current = movingFeatureId;
    movingPositionRef.current = movingPosition;
    onMovePositionRef.current = onMovePosition;
  });

  // 1. Inisialisasi Peta
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: KANTOR_DESA,
      zoom: 17,
      minZoom: 14,
      maxZoom: 20,
      zoomControl: false,
    });
    mapInstanceRef.current = map;
    const layerEntries = layerEntriesRef.current;

    L.control.scale({ metric: true, imperial: false, position: "bottomleft" }).addTo(map);

    // Pane khusus highlight Identify: di atas semua vektor, di bawah marker
    map.createPane(HIGHLIGHT_PANE);
    map.getPane(HIGHLIGHT_PANE)!.style.zIndex = "450";
    map.getPane(HIGHLIGHT_PANE)!.style.pointerEvents = "none";
    highlightGroupRef.current = L.layerGroup().addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      // Mode pindah: klik di peta menaruh pin di titik itu
      if (movingMarkerRef.current) {
        movingMarkerRef.current.setLatLng(e.latlng);
        onMovePositionRef.current?.({ lat: e.latlng.lat, lng: e.latlng.lng });
        return;
      }
      if (drawModeRef.current === "marker") {
        onRequestNewPointRef.current?.({ lat: e.latlng.lat, lng: e.latlng.lng });
      } else if (drawModeRef.current === "select") {
        onIdentifyRef.current?.(null);
      }
    });

    const handleResize = () => map.invalidateSize();
    window.addEventListener("resize", handleResize);
    onMapReadyRef.current?.(map);

    return () => {
      window.removeEventListener("resize", handleResize);
      onMapReadyRef.current?.(null);
      map.remove();
      mapInstanceRef.current = null;
      layerEntries.clear();
      hasFittedRef.current = false;
    };
  }, []);

  // 2. Sinkronisasi layer: buat, tampil/sembunyi, style, opacity, urutan
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const entries = layerEntriesRef.current;

    const handleFeatureClick: FeatureClickHandler = (layerId, feature, e) => {
      if (movingMarkerRef.current) {
        movingMarkerRef.current.setLatLng(e.latlng);
        onMovePositionRef.current?.({ lat: e.latlng.lat, lng: e.latlng.lng });
        return;
      }
      if (drawModeRef.current === "marker") {
        onRequestNewPointRef.current?.({ lat: e.latlng.lat, lng: e.latlng.lng });
      } else if (drawModeRef.current === "select") {
        onIdentifyRef.current?.({ layerId, feature });
      }
    };

    // Layer yang sudah dihapus dari panel (mis. hasil import)
    const ids = new Set(layers.map((l) => l.id));
    for (const [id, entry] of entries) {
      if (!ids.has(id)) {
        entry.layer.remove();
        entries.delete(id);
      }
    }

    for (const def of layers) {
      let entry = entries.get(def.id);
      if (!entry || (def.render !== "tile" && entry.data !== def.data)) {
        entry?.layer.remove();
        const layer = createLeafletLayer(def, handleFeatureClick);
        if (!layer) {
          entries.delete(def.id);
          continue;
        }
        entry = { layer, data: def.data };
        entries.set(def.id, entry);
      }

      applyLayerStyle(entry.layer, def);
      if (def.visible && !map.hasLayer(entry.layer)) entry.layer.addTo(map);
      if (!def.visible && map.hasLayer(entry.layer)) entry.layer.remove();
    }

    // Layer teratas di panel digambar paling atas
    for (const def of [...layers].reverse()) {
      const layer = entries.get(def.id)?.layer;
      if (def.visible && (layer instanceof L.GeoJSON || layer instanceof L.Polygon)) layer.bringToFront();
    }

    // Saat batas desa pertama kali dimuat, arahkan peta ke desa
    const batas = layers.find((l) => l.id === BATAS_DESA_LAYER_ID)?.data;
    if (batas && !hasFittedRef.current) {
      const bounds = L.geoJSON(batas).getBounds();
      map.setMaxBounds(bounds.pad(1));
      map.fitBounds(bounds);
      hasFittedRef.current = true;
    }
  }, [layers]);

  // 3. Highlight fitur hasil Identify (merah seperti QGIS)
  useEffect(() => {
    const group = highlightGroupRef.current;
    if (!group) return;
    group.clearLayers();

    // Pin titik lokasi: ganti ikon jadi versi terpilih
    for (const [, entry] of layerEntriesRef.current) {
      if (!(entry.layer instanceof L.GeoJSON)) continue;
      entry.layer.eachLayer((l) => {
        if (!(l instanceof L.Marker)) return;
        const feature = l.feature as Feature;
        const isSelected = !!identified && identified.feature.id === feature.id;
        l.setIcon(createMonochromeMarkerPin(feature.properties?.category, isSelected));
        l.setZIndexOffset(isSelected ? 1000 : 0);
        // setIcon membuat elemen baru: pasang lagi tanda pin yang sedang dipindahkan
        if (feature.id === movingIdRef.current) {
          l.getElement()?.classList.add("marker-moving");
          l.setZIndexOffset(2000);
        }
      });
    }

    if (!identified) return;
    // Titik yang sedang dipindahkan sudah punya penanda sendiri
    if (movingFeatureId && identified.feature.id === movingFeatureId) return;
    const geom = identified.feature.geometry;
    if (geom.type === "Point") {
      // Titik lingkaran (mis. rumah warga): beri cincin merah
      const isPin = layers.find((l) => l.id === identified.layerId)?.render === "points";
      if (!isPin) {
        L.circleMarker([geom.coordinates[1], geom.coordinates[0]], {
          pane: HIGHLIGHT_PANE,
          interactive: false,
          radius: 11,
          color: HIGHLIGHT_COLOR,
          weight: 3,
          fill: false,
        }).addTo(group);
      }
      return;
    }
    L.geoJSON(identified.feature, {
      pane: HIGHLIGHT_PANE,
      interactive: false,
      style: { color: HIGHLIGHT_COLOR, weight: 3, fillColor: HIGHLIGHT_COLOR, fillOpacity: 0.15 },
    }).addTo(group);
  }, [identified, layers, movingFeatureId]);

  // 4. Kursor crosshair saat mode tambah titik
  useEffect(() => {
    mapContainerRef.current?.classList.toggle("map-crosshair", activeDrawMode === "marker");
  }, [activeDrawMode]);

  // 5. Mode pindah titik: titik bisa digeser, posisi dilaporkan ke App
  useEffect(() => {
    const map = mapInstanceRef.current;
    const container = mapContainerRef.current;
    if (!map || !movingFeatureId) return;
    const point = findPoint(layerEntriesRef.current, movingFeatureId);
    if (!point) return;

    // Pin asli bisa langsung digeser; lingkaran diganti penanda sementara yang bisa digeser
    const isPin = point instanceof L.Marker;
    const circleStyle = isPin ? null : { opacity: point.options.opacity, fillOpacity: point.options.fillOpacity };
    const marker = isPin
      ? point
      : L.marker(point.getLatLng(), {
          icon: createMovingDotIcon(point.options.fillColor ?? "#FFFFFF"),
          zIndexOffset: 2000,
        }).addTo(map);
    if (!isPin) point.setStyle({ opacity: 0, fillOpacity: 0 });
    movingMarkerRef.current = marker;

    // Layer bisa dibangun ulang saat mode pindah berlangsung: lanjutkan dari posisi sementara
    const pending = movingPositionRef.current;
    if (pending) marker.setLatLng([pending.lat, pending.lng]);

    let frame = 0;
    const report = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const { lat, lng } = marker.getLatLng();
        onMovePositionRef.current?.({ lat, lng });
      });
    };

    marker.dragging?.enable();
    marker.setZIndexOffset(2000);
    marker.getElement()?.classList.add("marker-moving");
    container?.classList.add("map-moving");
    marker.on("drag dragend", report);

    return () => {
      cancelAnimationFrame(frame);
      marker.off("drag dragend", report);
      movingMarkerRef.current = null;
      container?.classList.remove("map-moving");
      if (isPin) {
        marker.dragging?.disable();
        marker.getElement()?.classList.remove("marker-moving");
        // Kembalikan ke koordinat data; bila disimpan, layer dibangun ulang dengan posisi baru
        const [lng, lat] = ((marker.feature as Feature).geometry as Point).coordinates;
        marker.setLatLng([lat, lng]);
      } else {
        marker.remove();
        if (circleStyle) point.setStyle(circleStyle);
      }
    };
  }, [movingFeatureId, layers]);

  return <div ref={mapContainerRef} className="w-full h-full z-0" />;
}
