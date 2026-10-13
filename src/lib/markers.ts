import L from "leaflet";
import type { GisCategory } from "../types/gis";

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

export function createMonochromeMarkerPin(category: GisCategory, isSelected: boolean = false) {
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
