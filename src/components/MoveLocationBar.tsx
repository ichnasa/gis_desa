import { Move, Check, X, Loader2, AlertTriangle } from "lucide-react";
import { formatLength } from "../lib/geo";

export interface MoveLocationBarProps {
  name: string;
  current: { lat: number; lng: number };
  movedMeters: number;
  isOutsideVillage: boolean;
  isSaving: boolean;
  onSave: () => void;
  onCancel: () => void;
}

// Bar kontrol selama mode pindah titik lokasi
export default function MoveLocationBar({
  name,
  current,
  movedMeters,
  isOutsideVillage,
  isSaving,
  onSave,
  onCancel,
}: MoveLocationBarProps) {
  const hasMoved = movedMeters >= 0.05;

  return (
    <div
      role="dialog"
      aria-label={`Memindahkan ${name}`}
      className="absolute top-4 left-1/2 -translate-x-1/2 z-[1200] w-[min(560px,calc(100%-2rem))] bg-white border border-[#E5E5E5] rounded-xl shadow-lg text-[#171717] animate-fadeIn"
    >
      <div className="flex items-start gap-3 px-4 pt-3 pb-2.5">
        <div className="w-8 h-8 rounded-lg bg-[#EF4444] text-white flex items-center justify-center flex-shrink-0">
          <Move className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">Memindahkan: {name}</div>
          <div className="text-xs text-[#737373] leading-relaxed">
            Geser penanda merah ke posisi baru, atau klik di peta untuk menaruhnya di sana.
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 bg-[#F5F5F5] border-y border-[#E5E5E5] text-xs">
        <div>
          <span className="text-[#737373]">Koordinat baru </span>
          <span className="font-mono">
            {current.lat.toFixed(6)}, {current.lng.toFixed(6)}
          </span>
        </div>
        <div>
          <span className="text-[#737373]">Bergeser </span>
          <span className="font-mono">{hasMoved ? formatLength(movedMeters) : "–"}</span>
        </div>
        {isOutsideVillage && (
          <div className="flex items-center gap-1 text-[#D99A00] font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            Di luar batas desa
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 px-4 py-2.5">
        <span className="text-[11px] text-[#A3A3A3]">Esc untuk batal</span>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#E5E5E5] rounded-md hover:bg-[#F5F5F5] transition disabled:opacity-50"
          >
            <X className="w-3.5 h-3.5" />
            Batal
          </button>
          <button
            onClick={onSave}
            disabled={!hasMoved || isSaving}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-[#171717] text-white rounded-md hover:bg-[#262626] transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Simpan Posisi
          </button>
        </div>
      </div>
    </div>
  );
}
