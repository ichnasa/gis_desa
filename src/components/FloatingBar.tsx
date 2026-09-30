import { MousePointer2, MapPin } from "lucide-react";
import type { GisDrawMode } from "../types/gis";

export interface FloatingBarProps {
  activeMode?: GisDrawMode;
  onChangeMode?: (mode: GisDrawMode) => void;
}

export default function FloatingBar({
  activeMode = "select",
  onChangeMode,
}: FloatingBarProps) {
  const setMode = (mode: GisDrawMode) => {
    if (onChangeMode) onChangeMode(mode);
  };

  const getGuideMessage = () => {
    switch (activeMode) {
      case "marker":
        return "Klik di mana saja pada peta untuk menaruh lokasi baru.";
      default:
        return null;
    }
  };

  const guideText = getGuideMessage();

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1000] flex flex-col items-center select-none pointer-events-auto">
      {guideText && (
        <div className="mb-2.5 px-4 py-2 bg-white text-[#171717] text-xs rounded-lg shadow-md border border-[#E5E5E5] flex items-center gap-2.5 transition">
          <span className="w-2 h-2 rounded-full bg-[#171717]" />
          <span className="font-medium">{guideText}</span>
          <button
            onClick={() => setMode("select")}
            className="ml-2 text-[#737373] hover:text-[#171717] text-xs font-semibold px-1 py-0.5 rounded hover:bg-[#F5F5F5] transition"
            title="Batal"
          >
            Batal
          </button>
        </div>
      )}

      <div className="flex items-center gap-1.5 p-1.5 bg-white rounded-lg shadow-md border border-[#E5E5E5] text-[#171717] transition-all">
        <button
          onClick={() => setMode("select")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
            activeMode === "select"
              ? "bg-[#171717] text-white shadow-sm"
              : "text-[#737373] hover:text-[#171717] hover:bg-[#F5F5F5]"
          }`}
          title="Geser dan telusuri peta"
        >
          <MousePointer2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Navigasi</span>
        </button>

        <div className="w-[1px] h-4 bg-[#E5E5E5] mx-0.5" />

        <button
          onClick={() => setMode("marker")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
            activeMode === "marker"
              ? "bg-[#171717] text-white shadow-sm"
              : "text-[#737373] hover:text-[#171717] hover:bg-[#F5F5F5]"
          }`}
          title="Klik di peta untuk menambah titik lokasi"
        >
          <MapPin className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Tambah Titik</span>
        </button>
      </div>
    </div>
  );
}
