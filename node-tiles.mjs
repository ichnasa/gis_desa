import fs from "fs";
import path from "path";

// Bounding box for Desa Pekauman Ulu & surrounding Martapura
const bbox = {
  minLat: -3.4250,
  maxLat: -3.3900,
  minLng: 114.8450,
  maxLng: 114.8800,
};

// Target zoom levels (14 is village view, 18 is house-level view)
const ZOOM_LEVELS = [14, 15, 16, 17, 18];

// Convert Lat/Lng to Slippy Map Tile numbers
function lon2tile(lon, zoom) {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
}
function lat2tile(lat, zoom) {
  return Math.floor(
    ((1 -
      Math.log(
        Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)
      ) /
        Math.PI) /
      2) *
      Math.pow(2, zoom)
  );
}

// Tile server URL (Google Hybrid: Satellite + Streets)
const TILE_URL = (z, x, y) =>
  `https://mt1.google.com/vt/lyrs=y&x=${x}&y=${y}&z=${z}`;

async function downloadTiles() {
  let totalCount = 0;
  for (const z of ZOOM_LEVELS) {
    const minX = lon2tile(bbox.minLng, z);
    const maxX = lon2tile(bbox.maxLng, z);
    const minY = lat2tile(bbox.maxLat, z);
    const maxY = lat2tile(bbox.minLng, z);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const outDir = path.join("public", "tiles", `${z}`, `${x}`);
        fs.mkdirSync(outDir, { recursive: true });
        const filePath = path.join(outDir, `${y}.png`);

        if (fs.existsSync(filePath)) continue;

        try {
          const res = await fetch(TILE_URL(z, x, y));
          if (res.ok) {
            const buffer = Buffer.from(await res.arrayBuffer());
            fs.writeFileSync(filePath, buffer);
            totalCount++;
            process.stdout.write(`\rDownloaded ${totalCount} tiles... (Z:${z} X:${x} Y:${y})`);
          }
          // Slight delay to be polite to the server
          await new Promise((r) => setTimeout(r, 60));
        } catch (err) {
          console.error(`\nFailed tile ${z}/${x}/${y}:`, err.message);
        }
      }
    }
  }
  console.log(`\nFinished! All tiles saved to public/tiles/`);
}

downloadTiles();
