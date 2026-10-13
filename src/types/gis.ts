import type { Feature, FeatureCollection } from "geojson";

export type GisCategory =
  | "pemerintahan"
  | "ibadah"
  | "pendidikan"
  | "kesehatan"
  | "fasilitas"
  | "ekonomi";

export interface GisLocation {
  id: string;
  name: string;
  category: GisCategory;
  lat: number;
  lng: number;
  address: string;
  rtRw?: string;
  description?: string;
  createdAt: string;
}

export type GisDrawMode =
  | "select"
  | "marker"
  | "polygon"
  | "polyline"
  | "eraser";

export interface DrawingStyle {
  strokeColor: string;
  fillColor: string;
  fillOpacity: number;
  strokeWeight: number;
}

export interface LayerVisibility {
  satelliteLayer: boolean;
  villageBoundary: boolean;
  maskOverlay: boolean;
  pointMarkers: boolean;
  labels: boolean;
}

export interface DrawnShape {
  id: string;
  type: "polygon" | "polyline";
  name: string;
  coordinates: [number, number][];
  properties?: {
    strokeColor?: string;
    fillColor?: string;
    fillOpacity?: number;
    strokeWeight?: number;
    areaText?: string;
    distanceText?: string;
  };
}

// ===== Model Layer (mengikuti konsep Layers Panel di QGIS) =====

export type GisGeometryType = "Point" | "LineString" | "Polygon" | "Raster";

// Cara layer digambar di peta
export type GisLayerRender = "tile" | "vector" | "mask" | "points";

export interface GisFieldAlias {
  name: string;
  alias: string;
  // Disembunyikan di Mode Sederhana (mis. fid, det_id)
  advancedOnly?: boolean;
  unit?: string;
  // Tampilan nilai di Mode Sederhana, mis. 0.83 -> "83%"
  format?: "percent";
}

export interface GisLayerStyle {
  strokeColor: string;
  strokeWeight: number;
  fillColor: string;
  fillOpacity: number;
  dashArray?: string;
  // Radius titik (circle marker) dalam piksel
  radius?: number;
  // Fitur dengan field ini terisi diberi warna isian berbeda (mis. rumah ber-UMKM)
  highlightField?: string;
  highlightColor?: string;
}

export interface GisLayer {
  id: string;
  name: string;
  geometryType: GisGeometryType;
  render: GisLayerRender;
  visible: boolean;
  // Opacity layer 0..1 (dikalikan ke style)
  opacity: number;
  style?: GisLayerStyle;
  // null selama data belum dimuat; layer tile tidak punya data
  data: FeatureCollection | null;
  fields?: GisFieldAlias[];
  // Field yang dipakai sebagai judul fitur di Identify
  titleField?: string;
  source?: string;
  // Layer hasil import yang boleh dihapus dari Layers Panel
  removable?: boolean;
}

export interface IdentifiedFeature {
  layerId: string;
  feature: Feature;
}
