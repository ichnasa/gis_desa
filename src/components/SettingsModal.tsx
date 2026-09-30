import { X, RotateCcw, Type } from "lucide-react";

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  fontScale: number;
  onFontScaleChange: (scale: number) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  fontScale,
  onFontScaleChange,
}: SettingsModalProps) {
  if (!isOpen) return null;

  const percentage = Math.round(fontScale * 100);

  const getScaleLabel = (val: number) => {
    if (val <= 0.85) return "Kecil (80%)";
    if (val >= 0.95 && val <= 1.05) return "Normal (100%)";
    if (val >= 1.15 && val <= 1.25) return "Besar (120%)";
    if (val >= 1.45) return "Sangat Besar (150%)";
    return `${Math.round(val * 100)}%`;
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-fadeIn">
      <div className="bg-white border border-[#E5E5E5] rounded-xl shadow-xl max-w-md w-full p-6 space-y-5 text-[#171717]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#171717] text-white flex items-center justify-center">
              <Type className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-[#171717]">Pengaturan Tampilan</h3>
              <p className="text-xs text-[#737373]">Skala ukuran font antarmuka GIS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#737373] hover:text-[#171717] hover:bg-[#F5F5F5] transition"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Slider Pengaturan Font Scale: 0.8 s/d 1.5 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-[#171717]">Ukuran Font Keseluruhan</label>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-[#F5F5F5] border border-[#E5E5E5] rounded">
              {getScaleLabel(fontScale)}
            </span>
          </div>

          <div className="space-y-1">
            <input
              type="range"
              min="0.8"
              max="1.5"
              step="0.05"
              value={fontScale}
              onChange={(e) => onFontScaleChange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-[#E5E5E5] rounded-lg appearance-none cursor-pointer accent-[#171717]"
            />
          </div>

          {/* Tombol Preset Cepat */}
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            {[
              { label: "80%", val: 0.8 },
              { label: "100%", val: 1.0 },
              { label: "120%", val: 1.2 },
              { label: "150%", val: 1.5 },
            ].map((preset) => (
              <button
                key={preset.val}
                type="button"
                onClick={() => onFontScaleChange(preset.val)}
                className={`py-1.5 text-xs font-medium rounded border transition ${
                  Math.abs(fontScale - preset.val) < 0.02
                    ? "bg-[#171717] text-white border-[#171717]"
                    : "bg-white text-[#737373] border-[#E5E5E5] hover:bg-[#F5F5F5] hover:text-[#171717]"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Live Preview Box */}
        <div className="p-3.5 bg-[#F5F5F5] border border-[#E5E5E5] rounded-lg space-y-1.5">
          <div className="text-[11px] font-medium text-[#737373] uppercase tracking-wider">
            Pratinjau Langsung ({percentage}%)
          </div>
          <div className="font-semibold text-sm text-[#171717]">
            Kantor Desa Pekauman Ulu
          </div>
          <p className="text-xs text-[#737373]">
            Ini adalah contoh pratinjau teks pada tombol, daftar lokasi, dan popup peta.
          </p>
          <div className="pt-1 flex gap-2">
            <span className="px-2.5 py-1 bg-[#171717] text-white text-xs font-medium rounded">
              Tombol Utama
            </span>
            <span className="px-2.5 py-1 bg-white border border-[#E5E5E5] text-[#171717] text-xs font-medium rounded">
              Tombol Sekunder
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-[#E5E5E5] flex items-center justify-between">
          <button
            type="button"
            onClick={() => onFontScaleChange(1.0)}
            className="flex items-center gap-1.5 text-xs text-[#737373] hover:text-[#171717] transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Kembalikan Default (100%)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#171717] hover:bg-[#262626] text-white text-xs font-medium rounded-md shadow-sm transition"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
