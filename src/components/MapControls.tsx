import { Plus, Minus, Crosshair, Maximize } from "lucide-react";
import type L from "leaflet";

export interface MapControlsProps {
  map: L.Map | null;
  onHome: () => void;
  onZoomFull: () => void;
}

const buttonClass =
  "w-9 h-9 flex items-center justify-center text-[#171717] hover:bg-[#F5F5F5] transition";

export default function MapControls({ map, onHome, onZoomFull }: MapControlsProps) {
  return (
    <div id="tour-map-controls" className="absolute top-4 right-4 z-[500] flex flex-col gap-2">
      <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E5] flex flex-col overflow-hidden">
        <button onClick={() => map?.zoomIn()} className={buttonClass} title="Perbesar">
          <Plus className="w-4 h-4" />
        </button>
        <div className="w-full h-[1px] bg-[#E5E5E5]" />
        <button onClick={() => map?.zoomOut()} className={buttonClass} title="Perkecil">
          <Minus className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-[#E5E5E5] flex flex-col overflow-hidden">
        <button onClick={onZoomFull} className={buttonClass} title="Tampilkan Seluruh Desa (Zoom Full)">
          <Maximize className="w-4 h-4" />
        </button>
        <div className="w-full h-[1px] bg-[#E5E5E5]" />
        <button onClick={onHome} className={buttonClass} title="Lokasi Kantor Desa">
          <Crosshair className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
