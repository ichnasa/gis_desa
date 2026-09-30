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
