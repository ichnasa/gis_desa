import type { Feature, Geometry, Position } from "geojson";

const R_EARTH = 6378137;

// Luas poligon (m²) dengan proyeksi lokal equirectangular, cukup akurat untuk skala desa
function ringArea(ring: Position[]): number {
  if (ring.length < 3) return 0;
  const meanLat = ring.reduce((acc, p) => acc + p[1], 0) / ring.length;
  const latRad = (meanLat * Math.PI) / 180;
  // Meter per derajat pada elipsoid WGS84 (deret lengkap, suku cos 3φ penting: ~0,08% di khatulistiwa)
  const mLat = 111132.92 - 559.82 * Math.cos(2 * latRad) + 1.175 * Math.cos(4 * latRad) - 0.0023 * Math.cos(6 * latRad);
  const mLng = 111412.84 * Math.cos(latRad) - 93.5 * Math.cos(3 * latRad) + 0.118 * Math.cos(5 * latRad);
  let area = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    area += x1 * mLng * (y2 * mLat) - x2 * mLng * (y1 * mLat);
  }
  return Math.abs(area) / 2;
}

function polygonArea(rings: Position[][]): number {
  const [outer, ...holes] = rings;
  return ringArea(outer) - holes.reduce((acc, h) => acc + ringArea(h), 0);
}

// Jarak haversine (m)
function distance(a: Position, b: Position): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLng / 2) ** 2;
  return 2 * R_EARTH * Math.asin(Math.sqrt(h));
}

function lineLength(coords: Position[]): number {
  let total = 0;
  for (let i = 0; i < coords.length - 1; i++) total += distance(coords[i], coords[i + 1]);
  return total;
}

export function geometryArea(geom: Geometry): number {
  if (geom.type === "Polygon") return polygonArea(geom.coordinates);
  if (geom.type === "MultiPolygon") return geom.coordinates.reduce((acc, p) => acc + polygonArea(p), 0);
  return 0;
}

export function geometryLength(geom: Geometry): number {
  if (geom.type === "LineString") return lineLength(geom.coordinates);
  if (geom.type === "MultiLineString") return geom.coordinates.reduce((acc, l) => acc + lineLength(l), 0);
  if (geom.type === "Polygon") return lineLength(geom.coordinates[0]);
  if (geom.type === "MultiPolygon") return geom.coordinates.reduce((acc, p) => acc + lineLength(p[0]), 0);
  return 0;
}

export function featureCentroid(feature: Feature): [number, number] | null {
  const pts: Position[] = [];
  const walk = (c: unknown): void => {
    if (Array.isArray(c) && typeof c[0] === "number") pts.push(c as Position);
    else if (Array.isArray(c)) c.forEach(walk);
  };
  if (!feature.geometry || feature.geometry.type === "GeometryCollection") return null;
  walk(feature.geometry.coordinates);
  if (pts.length === 0) return null;
  const lng = pts.reduce((a, p) => a + p[0], 0) / pts.length;
  const lat = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  return [lat, lng];
}

// WGS84 -> UTM zona 50S (EPSG:32750), Snyder (USGS PP 1395)
export function toUtm50S(lat: number, lng: number): { easting: number; northing: number } {
  const a = R_EARTH;
  const f = 1 / 298.257223563;
  const e2 = f * (2 - f);
  const ep2 = e2 / (1 - e2);
  const k0 = 0.9996;
  const phi = (lat * Math.PI) / 180;
  const lambda = (lng * Math.PI) / 180;
  const lambda0 = (117 * Math.PI) / 180;

  const sin = Math.sin(phi);
  const cos = Math.cos(phi);
  const tan = Math.tan(phi);
  const N = a / Math.sqrt(1 - e2 * sin * sin);
  const T = tan * tan;
  const C = ep2 * cos * cos;
  const A = cos * (lambda - lambda0);
  const M =
    a *
    ((1 - e2 / 4 - (3 * e2 ** 2) / 64 - (5 * e2 ** 3) / 256) * phi -
      ((3 * e2) / 8 + (3 * e2 ** 2) / 32 + (45 * e2 ** 3) / 1024) * Math.sin(2 * phi) +
      ((15 * e2 ** 2) / 256 + (45 * e2 ** 3) / 1024) * Math.sin(4 * phi) -
      ((35 * e2 ** 3) / 3072) * Math.sin(6 * phi));

  const easting =
    500000 +
    k0 * N * (A + ((1 - T + C) * A ** 3) / 6 + ((5 - 18 * T + T * T + 72 * C - 58 * ep2) * A ** 5) / 120);
  const northing =
    10000000 +
    k0 *
      (M +
        N *
          tan *
          (A ** 2 / 2 +
            ((5 - T + 9 * C + 4 * C * C) * A ** 4) / 24 +
            ((61 - 58 * T + T * T + 600 * C - 330 * ep2) * A ** 6) / 720));
  return { easting, northing };
}

// Skala peta 1:N pada layar 96 DPI (sama seperti angka skala di status bar QGIS)
export function mapScale(lat: number, zoom: number): number {
  const metersPerPixel = (2 * Math.PI * R_EARTH * Math.cos((lat * Math.PI) / 180)) / 2 ** (zoom + 8);
  return metersPerPixel * (96 / 0.0254);
}

export function formatArea(m2: number): string {
  if (m2 >= 10000) return `${(m2 / 10000).toLocaleString("id-ID", { maximumFractionDigits: 2 })} ha`;
  return `${m2.toLocaleString("id-ID", { maximumFractionDigits: 1 })} m²`;
}

export function formatLength(m: number): string {
  if (m >= 1000) return `${(m / 1000).toLocaleString("id-ID", { maximumFractionDigits: 2 })} km`;
  return `${m.toLocaleString("id-ID", { maximumFractionDigits: 1 })} m`;
}

export function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  return distance([a.lng, a.lat], [b.lng, b.lat]);
}

// Ray casting: apakah titik berada di dalam (Multi)Polygon
function inRing(lng: number, lat: number, ring: Position[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function pointInGeometry(lat: number, lng: number, geom: Geometry): boolean {
  const polygons = geom.type === "Polygon" ? [geom.coordinates] : geom.type === "MultiPolygon" ? geom.coordinates : [];
  return polygons.some(([outer, ...holes]) => inRing(lng, lat, outer) && !holes.some((h) => inRing(lng, lat, h)));
}
