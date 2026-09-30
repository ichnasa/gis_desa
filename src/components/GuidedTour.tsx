import { useState, useEffect, useRef } from "react";
import {
  Map,
  Search,
  PenTool,
  SlidersHorizontal,
  Crosshair,
  ArrowRight,
  ArrowLeft,
  X,
  Check,
  Compass,
} from "lucide-react";

export interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
  onEnsureSidebarOpen?: () => void;
}

interface TourStep {
  targetId?: string;
  title: string;
  badge: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  position: "center" | "right-of" | "left-of" | "below" | "above";
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Selamat Datang di SIG Pekauman Ulu",
    badge: "Pengenalan",
    description:
      "Aplikasi Sistem Informasi Geografis ini dirancang untuk memetakan fasilitas, wilayah administratif, dan batas Desa Pekauman Ulu dengan citra satelit tajam hingga Zoom 20x.",
    icon: Compass,
    position: "center",
  },
  {
    targetId: "tour-sidebar",
    title: "Navigasi & Menu Utama",
    badge: "Sidebar Kiri",
    description:
      "Bilah navigasi samping untuk berpindah antara tampilan peta utama, daftar lokasi desa, formulir tambah data baru, pengaturan ukuran teks font, dan panduan ini.",
    icon: Map,
    position: "right-of",
  },
  {
    targetId: "tour-search-bar",
    title: "Pencarian Lokasi Instan",
    badge: "Pencarian",
    description:
      "Ketik nama tempat, fasilitas umum, toko warga, atau jalan di Desa Pekauman Ulu. Memilih hasil pencarian akan langsung memusatkan peta dan membuka kartu informasinya.",
    icon: Search,
    position: "below",
  },
  {
    targetId: "tour-floating-bar",
    title: "Toolbar Gambar & Pen Tool",
    badge: "Alat Gambar",
    description:
      "Toolbar melayang untuk menambah titik lokasi baru, menggambar area poligon dengan color picker (outline & inner), serta menarik garis jalan/sungai persis seperti pen tool di Figma.",
    icon: PenTool,
    position: "above",
  },
  {
    targetId: "tour-crud-panel",
    title: "Panel Data & Informasi Desa",
    badge: "Sidebar Kanan",
    description:
      "Panel interaktif untuk menelusuri seluruh data lokasi, menyaring berdasarkan kategori (Pemerintahan, Ibadah, Pendidikan, Kesehatan, Fasilitas, Ekonomi), mengedit data, serta ekspor GeoJSON.",
    icon: SlidersHorizontal,
    position: "left-of",
  },
  {
    targetId: "tour-map-controls",
    title: "Kontrol Peta & Lokasi Desa",
    badge: "Navigasi Peta",
    description:
      "Gunakan tombol Zoom (+) dan (−) untuk mengatur jarak pandang, serta tombol pusatkan (◎) untuk seketika kembali ke titik pusat Kantor Desa Pekauman Ulu.",
    icon: Crosshair,
    position: "below",
  },
];

export default function GuidedTour({
  isOpen,
  onClose,
  onEnsureSidebarOpen,
}: GuidedTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const step = TOUR_STEPS[currentStepIndex];

  // Reset ke langkah pertama saat dibuka
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
    }
  }, [isOpen]);

  // Jika langkah saat ini menargetkan panel data kanan, pastikan panel terbuka
  useEffect(() => {
    if (isOpen && step.targetId === "tour-crud-panel" && onEnsureSidebarOpen) {
      onEnsureSidebarOpen();
    }
  }, [isOpen, step, onEnsureSidebarOpen]);

  // Hitung posisi bounding rect elemen target untuk efek spotlight & positioning
  useEffect(() => {
    if (!isOpen) return;

    const updateRect = () => {
      if (!step.targetId) {
        setTargetRect(null);
        return;
      }
      const el = document.getElementById(step.targetId);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    };

    updateRect();
    const timer = setTimeout(updateRect, 100);
    window.addEventListener("resize", updateRect);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateRect);
    };
  }, [isOpen, currentStepIndex, step.targetId]);

  // Keyboard navigation (Arrow keys & Escape)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        if (currentStepIndex < TOUR_STEPS.length - 1) {
          setCurrentStepIndex((prev) => prev + 1);
        } else {
          onClose();
        }
      } else if (e.key === "ArrowLeft") {
        if (currentStepIndex > 0) {
          setCurrentStepIndex((prev) => prev - 1);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentStepIndex, onClose]);

  if (!isOpen) return null;

  // Hitung posisi floating card modal berdasarkan target rect
  const getCardStyle = (): React.CSSProperties => {
    if (!targetRect || step.position === "center") {
      return {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }

    const margin = 16;
    const cardWidth = 360;

    switch (step.position) {
      case "right-of":
        return {
          position: "fixed",
          top: Math.max(margin, Math.min(window.innerHeight - 340, targetRect.top + 20)),
          left: targetRect.right + margin,
        };
      case "left-of":
        return {
          position: "fixed",
          top: Math.max(margin, Math.min(window.innerHeight - 340, targetRect.top + 20)),
          left: Math.max(margin, targetRect.left - cardWidth - margin),
        };
      case "below":
        return {
          position: "fixed",
          top: targetRect.bottom + margin,
          left: Math.max(
            margin,
            Math.min(window.innerWidth - cardWidth - margin, targetRect.left)
          ),
        };
      case "above":
        return {
          position: "fixed",
          bottom: window.innerHeight - targetRect.top + margin,
          left: Math.max(
            margin,
            Math.min(window.innerWidth - cardWidth - margin, targetRect.left + (targetRect.width - cardWidth) / 2)
          ),
        };
      default:
        return {
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        };
    }
  };

  const IconComponent = step.icon;

  return (
    <div className="fixed inset-0 z-[3000] select-none pointer-events-auto">
      {/* 1. Backdrop Gelap Transparan (Tidak exit saat diklik di luar card) */}
      <div className="fixed inset-0 bg-black/45 backdrop-blur-[2px] transition-opacity pointer-events-auto" />

      {/* 2. Spotlight Box Ring pada Target Elemen */}
      {targetRect && (
        <div
          style={{
            position: "fixed",
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
          }}
          className="rounded-xl border-2 border-white ring-4 ring-black/30 pointer-events-none transition-all duration-300 shadow-2xl"
        />
      )}

      {/* 3. Guided Tour Card Dialog */}
      <div
        ref={cardRef}
        style={getCardStyle()}
        className="w-[360px] max-w-[calc(100vw-32px)] bg-white text-[#171717] rounded-xl border border-[#E5E5E5] shadow-2xl p-5 space-y-4 animate-fadeIn z-[3100]"
      >
        {/* Header Card: Icon, Badge, Step Counter & Close Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#171717] text-white flex items-center justify-center flex-shrink-0">
              <IconComponent className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] font-semibold text-[#737373] uppercase tracking-wider">
              {step.badge}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-[#737373]">
              {currentStepIndex + 1} / {TOUR_STEPS.length}
            </span>
            <button
              onClick={onClose}
              className="p-1 text-[#737373] hover:text-[#171717] hover:bg-[#F5F5F5] rounded transition"
              title="Lewati / Tutup Panduan (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Konten Langkah Panduan */}
        <div>
          <h3 className="font-bold text-base text-[#171717] leading-snug">
            {step.title}
          </h3>
          <p className="text-xs text-[#525252] mt-1.5 leading-relaxed">
            {step.description}
          </p>
        </div>

        {/* Step Progress Dots Indicator */}
        <div className="flex items-center justify-center gap-1.5 pt-1">
          {TOUR_STEPS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStepIndex(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentStepIndex
                  ? "w-6 bg-[#171717]"
                  : "w-1.5 bg-[#E5E5E5] hover:bg-[#A3A3A3]"
              }`}
              title={`Langkah ${idx + 1}`}
            />
          ))}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="pt-3 border-t border-[#E5E5E5] flex items-center justify-between gap-2">
          {/* Tombol Lewati */}
          <button
            onClick={onClose}
            className="text-xs text-[#737373] hover:text-[#171717] font-medium transition px-1 py-1"
          >
            Lewati
          </button>

          <div className="flex items-center gap-2">
            {/* Tombol Sebelumnya */}
            {currentStepIndex > 0 && (
              <button
                onClick={() => setCurrentStepIndex((prev) => prev - 1)}
                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-[#E5E5E5] hover:bg-[#F5F5F5] text-[#171717] rounded-md text-xs font-medium transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Sebelumnya</span>
              </button>
            )}

            {/* Tombol Lanjut / Selesai */}
            {currentStepIndex < TOUR_STEPS.length - 1 ? (
              <button
                onClick={() => setCurrentStepIndex((prev) => prev + 1)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#171717] hover:bg-[#262626] text-white rounded-md text-xs font-semibold shadow-sm transition"
              >
                <span>Lanjut</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#171717] hover:bg-[#262626] text-white rounded-md text-xs font-semibold shadow-sm transition"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Selesai</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
