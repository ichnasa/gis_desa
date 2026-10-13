import type { ReactNode } from "react";
import { MapPin, MousePointer2, Navigation, Hand } from "lucide-react";

// Ilustrasi animasi kecil untuk Guided Tour, menjelaskan konsep GIS ke orang awam

const FRAME = "relative h-28 rounded-lg overflow-hidden border border-[#E5E5E5]";

// Latar "peta" sederhana: lahan hijau, sungai, jalan, dan beberapa atap
function MiniMap() {
  return (
    <svg viewBox="0 0 320 112" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
      <rect width="320" height="112" fill="#DDE8D2" />
      <path d="M210 -5 C 190 40, 240 70, 215 120" stroke="#B9D6E6" strokeWidth="22" fill="none" />
      <path d="M-5 70 L 330 40" stroke="#FACC15" strokeWidth="4" />
      <path d="M90 -5 L 120 120" stroke="#FACC15" strokeWidth="3" />
      {[
        [30, 20], [52, 28], [140, 18], [160, 30], [40, 85], [62, 92], [140, 80], [165, 88], [262, 22], [280, 78],
      ].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="16" height="11" rx="1.5" fill="#C98B6B" stroke="#FFFFFF" strokeWidth="1" />
      ))}
    </svg>
  );
}

export function WelcomeIllustration() {
  return (
    <div className={FRAME}>
      <MiniMap />
      <div className="absolute left-1/2 top-[22%] -translate-x-1/2 tour-pin-drop">
        <div className="w-9 h-9 rounded-full rounded-bl-none -rotate-45 bg-white border-2 border-[#171717] shadow-md flex items-center justify-center">
          <MapPin className="w-4 h-4 rotate-45 text-[#171717]" />
        </div>
      </div>
    </div>
  );
}

export function PanZoomIllustration() {
  return (
    <div className={FRAME}>
      {/* Peta ikut bergeser selama "tangan" menarik */}
      <div className="absolute -left-5 -top-5 w-[calc(100%+130px)] h-[calc(100%+50px)] tour-map-pan">
        <MiniMap />
      </div>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="tour-drag">
          <Hand className="w-8 h-8 text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)]" fill="#171717" />
        </div>
      </div>
    </div>
  );
}

// Lapisan peta seperti lembaran plastik bening yang ditumpuk
function LayerSheet({
  className,
  label,
  animation,
  children,
}: {
  className: string;
  label: string;
  animation?: string;
  children?: ReactNode;
}) {
  return (
    <div className={`absolute left-[36%] top-[62%] ${animation ?? ""}`}>
      <div
        className={`absolute w-20 h-20 rounded-md border overflow-hidden shadow-sm ${className}`}
        style={{ transform: "translate(-50%, -50%) rotateX(60deg) rotateZ(-45deg)" }}
      >
        {children}
      </div>
      {/* Label menempel di sudut kanan lembaran, muncul saat lembaran merenggang */}
      <span className="tour-label-in absolute left-[64px] -translate-y-1/2 whitespace-nowrap text-[10px] font-semibold text-[#525252]">
        <span className="inline-block w-3 h-px bg-[#A3A3A3] align-middle mr-1" />
        {label}
      </span>
    </div>
  );
}

export function LayersIllustration() {
  return (
    <div className={`${FRAME} bg-[#F5F5F5]`}>
      <LayerSheet label="Foto satelit" className="border-[#8A8A8A] bg-[linear-gradient(135deg,#7FA36B,#C9B48A_55%,#8BB5C9)]" />
      <LayerSheet label="Bangunan & jalan" animation="tour-layer-mid" className="border-[#A3A3A3] bg-white/35">
        <div className="absolute left-5 top-0 bottom-0 w-1 bg-[#FACC15]" />
        <div className="absolute left-0 right-0 top-12 h-1 bg-[#FACC15]" />
        <div className="absolute left-8 top-2 w-5 h-4 border border-white bg-[#C98B6B]/70" />
        <div className="absolute left-14 top-6 w-4 h-4 border border-white bg-[#C98B6B]/70" />
        <div className="absolute left-8 top-14 w-6 h-4 border border-white bg-[#C98B6B]/70" />
      </LayerSheet>
      <LayerSheet label="Titik lokasi" animation="tour-layer-top" className="border-[#A3A3A3] bg-white/25">
        <div className="absolute left-4 top-4 w-3 h-3 rounded-full bg-[#F97316] border border-[#171717]" />
        <div className="absolute left-12 top-9 w-3 h-3 rounded-full bg-white border border-[#171717]" />
        <div className="absolute left-6 top-14 w-3 h-3 rounded-full bg-white border border-[#171717]" />
      </LayerSheet>
    </div>
  );
}

// Klik pin -> kartu info muncul, lengkap dengan tombol rute
export function ClickInfoIllustration() {
  return (
    <div className={FRAME}>
      <MiniMap />
      <div className="absolute left-[30%] top-[52%]">
        <div className="w-4 h-4 rounded-full bg-[#F97316] border-2 border-[#171717] shadow" />
        <div className="absolute left-2 top-2 tour-cursor-to-pin">
          <MousePointer2 className="w-5 h-5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" fill="#171717" />
        </div>
      </div>
      <div className="absolute left-[42%] top-2.5 w-[52%] p-2 bg-white rounded-md shadow-lg border border-[#E5E5E5] tour-popup">
        <div className="text-[10px] font-semibold text-[#171717]">Rumah No. 10</div>
        <div className="text-[9px] text-[#737373] leading-tight">RT 1 / RW 1 · Warung Sembako</div>
        <div className="mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#171717] text-white text-[9px] font-semibold">
          <Navigation className="w-2.5 h-2.5" />
          Rute Google Maps
        </div>
      </div>
    </div>
  );
}

export function DoneIllustration() {
  return (
    <div className="flex justify-center py-2">
      <div className="w-16 h-16 rounded-full bg-[#2E9E5B] flex items-center justify-center shadow-md tour-pop">
        <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7.5" className="tour-check-draw" />
        </svg>
      </div>
    </div>
  );
}
