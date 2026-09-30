import {
  MousePointer2,
  MapPin,
  Hexagon,
  PenTool,
  Trash2,
  Undo2,
  Check,
  RotateCcw,
} from "lucide-react";
import type { GisDrawMode, DrawingStyle } from "../types/gis";

export interface FloatingBarProps {
  activeMode?: GisDrawMode;
  onChangeMode?: (mode: GisDrawMode) => void;
  isDrawing?: boolean;
  pointCount?: number;
  measuredResult?: string | null;
  drawingStyle?: DrawingStyle;
  onUpdateDrawingStyle?: (style: DrawingStyle) => void;
  onFinishDrawing?: () => void;
  onUndoPoint?: () => void;
  onCancelDrawing?: () => void;
  onClearAll?: () => void;
}

export default function FloatingBar({
  activeMode = "select",
  onChangeMode,
  isDrawing = false,
  pointCount = 0,
  measuredResult,
  drawingStyle = {
    strokeColor: "#171717",
    fillColor: "#171717",
    fillOpacity: 0.25,
    strokeWeight: 2.5,
  },
  onUpdateDrawingStyle,
  onFinishDrawing,
  onUndoPoint,
  onCancelDrawing,
  onClearAll,
}: FloatingBarProps) {
  const setMode = (mode: GisDrawMode) => {
    if (onChangeMode) onChangeMode(mode);
  };

  const getGuideMessage = () => {
    switch (activeMode) {
      case "marker":
        return "Klik pada peta untuk menaruh titik lokasi baru.";
      case "polygon":
        return pointCount === 0
          ? "Klik pada peta untuk mulai menggambar area poligon (seperti pen tool)."
          : `Sudah ${pointCount} titik sudut. Klik dua kali atau klik Selesai untuk menutup poligon. ${
              measuredResult ? `(Luas: ${measuredResult})` : ""
            }`;
      case "polyline":
        return pointCount === 0
          ? "Klik pada peta untuk mulai menarik garis (seperti pen tool di Figma)."
          : `Garis terhubung ${pointCount} titik. Klik dua kali atau klik Selesai untuk mengakhiri. ${
              measuredResult ? `(Panjang: ${measuredResult})` : ""
            }`;
      case "eraser":
        return "Klik pada garis, poligon, atau marker di peta untuk menghapusnya.";
      default:
        return null;
    }
  };

  const guideText = getGuideMessage();

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1000] flex flex-col items-center select-none pointer-events-auto">
      {/* 1. Panduan Interaktif Ringan */}
      {guideText && (
        <div className="mb-2.5 px-4 py-2 bg-white text-[#171717] text-xs rounded-lg shadow-md border border-[#E5E5E5] flex items-center gap-2.5 transition">
          <span className="w-2 h-2 rounded-full bg-[#171717]" />
          <span className="font-medium">{guideText}</span>

          <button
            onClick={() => {
              setMode("select");
              if (onCancelDrawing) onCancelDrawing();
            }}
            className="ml-2 text-[#737373] hover:text-[#171717] text-xs font-semibold px-1 py-0.5 rounded hover:bg-[#F5F5F5] transition"
            title="Batal"
          >
            Batal
          </button>
        </div>
      )}

      {/* 2. Floating Action Bar */}
      <div id="tour-floating-bar" className="flex items-center gap-1.5 p-1.5 bg-white rounded-lg shadow-md border border-[#E5E5E5] text-[#171717] transition-all">
        {/* Navigasi (Select) */}
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

        {/* Tambah Titik Marker */}
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

        <div className="w-[1px] h-4 bg-[#E5E5E5] mx-0.5" />

        {/* Gambar Area (Polygon) */}
        <button
          onClick={() => setMode("polygon")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
            activeMode === "polygon"
              ? "bg-[#171717] text-white shadow-sm"
              : "text-[#737373] hover:text-[#171717] hover:bg-[#F5F5F5]"
          }`}
          title="Gambar batas wilayah / area poligon"
        >
          <Hexagon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Gambar Area</span>
        </button>

        {/* Pen Tool: Garis (Polyline) */}
        <button
          onClick={() => setMode("polyline")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
            activeMode === "polyline"
              ? "bg-[#171717] text-white shadow-sm"
              : "text-[#737373] hover:text-[#171717] hover:bg-[#F5F5F5]"
          }`}
          title="Gambar garis rute / jalan (Pen Tool)"
        >
          <PenTool className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Garis (Pen)</span>
        </button>

        {/* COLOR PICKERS: Muncul dinamis sesuai tool yang aktif */}
        {activeMode === "polygon" && onUpdateDrawingStyle && (
          <div className="flex items-center gap-2 px-2.5 py-1 bg-[#F5F5F5] rounded-md border border-[#E5E5E5] text-xs">
            {/* Outline Color Picker */}
            <label className="flex items-center gap-1 cursor-pointer" title="Warna Garis Luar (Outline)">
              <span className="text-[11px] font-medium text-[#737373]">Outline:</span>
              <input
                type="color"
                value={drawingStyle.strokeColor}
                onChange={(e) =>
                  onUpdateDrawingStyle({ ...drawingStyle, strokeColor: e.target.value })
                }
                className="w-5 h-5 rounded cursor-pointer border border-[#E5E5E5] bg-transparent p-0"
              />
            </label>

            {/* Inner / Fill Color Picker */}
            <label className="flex items-center gap-1 cursor-pointer" title="Warna Isi (Inner/Fill)">
              <span className="text-[11px] font-medium text-[#737373]">Inner:</span>
              <input
                type="color"
                value={drawingStyle.fillColor}
                onChange={(e) =>
                  onUpdateDrawingStyle({ ...drawingStyle, fillColor: e.target.value })
                }
                className="w-5 h-5 rounded cursor-pointer border border-[#E5E5E5] bg-transparent p-0"
              />
            </label>
          </div>
        )}

        {activeMode === "polyline" && onUpdateDrawingStyle && (
          <div className="flex items-center gap-2 px-2.5 py-1 bg-[#F5F5F5] rounded-md border border-[#E5E5E5] text-xs">
            {/* Line Color Picker */}
            <label className="flex items-center gap-1 cursor-pointer" title="Warna Garis (Line Color)">
              <span className="text-[11px] font-medium text-[#737373]">Warna Garis:</span>
              <input
                type="color"
                value={drawingStyle.strokeColor}
                onChange={(e) =>
                  onUpdateDrawingStyle({ ...drawingStyle, strokeColor: e.target.value })
                }
                className="w-5 h-5 rounded cursor-pointer border border-[#E5E5E5] bg-transparent p-0"
              />
            </label>
          </div>
        )}

        <div className="w-[1px] h-4 bg-[#E5E5E5] mx-0.5" />

        {/* Mode Hapus (Eraser) */}
        <button
          onClick={() => setMode(activeMode === "eraser" ? "select" : "eraser")}
          className={`p-1.5 rounded-md text-xs font-medium transition ${
            activeMode === "eraser"
              ? "bg-[#171717] text-white"
              : "text-[#737373] hover:text-[#171717] hover:bg-[#F5F5F5]"
          }`}
          title="Klik objek di peta untuk menghapus"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        {/* Tombol Aksi saat Menggambar (Undo & Selesai) */}
        {(isDrawing || pointCount > 0) && (
          <>
            <div className="w-[1px] h-4 bg-[#E5E5E5] mx-0.5" />

            {onUndoPoint && (
              <button
                onClick={onUndoPoint}
                className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium text-[#737373] hover:text-[#171717] hover:bg-[#F5F5F5] transition"
                title="Batalkan titik terakhir"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Urungkan</span>
              </button>
            )}

            {onFinishDrawing && (
              <button
                onClick={onFinishDrawing}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#171717] hover:bg-[#262626] text-white rounded-md text-xs font-medium shadow-sm transition"
                title="Selesaikan gambar ini"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Selesai</span>
              </button>
            )}
          </>
        )}

        {/* Bersihkan semua sketsa */}
        {onClearAll && (
          <button
            onClick={onClearAll}
            className="p-1.5 text-[#737373] hover:text-[#171717] hover:bg-[#F5F5F5] rounded-md transition"
            title="Bersihkan semua sketsa gambar"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
