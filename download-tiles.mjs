import fs from "fs";
import path from "path";

// Bounding box strictly covering Desa Pekauman Ulu & surrounding Martapura
const bbox = {
  minLat: -3.4250, // Southern edge
  maxLat: -3.3900, // Northern edge
  minLng: 114.8450, // Western edge
  maxLng: 114.8800, // Eastern edge
};

// Target zoom levels:
// 14 = district view
// 16 = village view
// 18 = house/street detail view
const ZOOM_LEVELS = [14, 15, 16, 17, 18];

// Convert Lat/Lng into Slippy Tile Coordinates
function lon2tile(lon, zoom) {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
}

function lat2tile(lat, zoom) {
  const rad = (lat * Math.PI) / 180;
  return Math.floor(
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) *
      Math.pow(2, zoom)
  );
}

// Google Hybrid tile endpoint (Satellite + Road names)
const getTileUrl = (z, x, y) =>
  `https://mt1.google.com/vt/lyrs=y&x=${x}&y=${y}&z=${z}`;

async function run() {
  console.log("Starting tile download for Desa Pekauman Ulu...\n");
  let downloadedCount = 0;
  let skippedCount = 0;

  for (const z of ZOOM_LEVELS) {
    const minX = lon2tile(bbox.minLng, z);
    const maxX = lon2tile(bbox.maxLng, z);
    const minY = lat2tile(bbox.maxLat, z); // North has smaller Y index
    const maxY = lat2tile(bbox.minLat, z); // South has larger Y index

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        // Output directory: public/tiles/{z}/{x}/
        const folderPath = path.join("public", "tiles", `${z}`, `${x}`);
        fs.mkdirSync(folderPath, { recursive: true });

        const filePath = path.join(folderPath, `${y}.png`);

        // Skip if already downloaded
        if (fs.existsSync(filePath)) {
          skippedCount++;
          continue;
        }

        try {
          const res = await fetch(getTileUrl(z, x, y), {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            },
          });

          if (res.ok) {
            const buffer = Buffer.from(await res.arrayBuffer());
            fs.writeFileSync(filePath, buffer);
            downloadedCount++;
            process.stdout.write(
              `\rDownloaded: ${downloadedCount} tiles | Current: Zoom ${z} (${x}, ${y})`
            );
          } else {
            console.error(`\nFailed status ${res.status} for ${z}/${x}/${y}`);
          }

          // Gentle pause (50ms) to prevent server throttling
          await new Promise((resolve) => setTimeout(resolve, 50));
        } catch (err) {
          console.error(`\nNetwork error for tile ${z}/${x}/${y}:`, err.message);
        }
      }
    }
  }

  console.log(
    `\n\nDone! Downloaded: ${downloadedCount} new tiles. Skipped: ${skippedCount} existing tiles.`
  );
  console.log("Saved inside: public/tiles/");
}
