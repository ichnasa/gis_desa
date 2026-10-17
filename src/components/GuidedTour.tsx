import { useState, useEffect, useRef, type ComponentType, type ReactNode } from "react";
import {
  Compass,
  Hand,
  Crosshair,
  Search,
  Layers,
  Info,
  MapPin,
  Menu,
  List,
  SlidersHorizontal,
  PartyPopper,
  ArrowRight,
  ArrowLeft,
  X,
  Check,
  Lightbulb,
  Plus,
  Minus,
  Maximize,
  MousePointer2,
} from "lucide-react";
import {
  WelcomeIllustration,
  PanZoomIllustration,
  LayersIllustration,
  ClickInfoIllustration,
  DoneIllustration,
} from "./TourIllustrations";

export interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
  onEnsureSidebarOpen?: () => void;
  // Operator melihat langkah tambahan tentang mengubah data
  isOperator?: boolean;
}

type Placement = "center" | "right" | "left" | "bottom" | "top";

interface TourStep {
  // Beberapa ID: dipakai yang pertama terlihat (mis. sidebar di desktop, tombol menu di HP)
  targetId?: string | string[];
  badge: string;
  title: string;
  description: ReactNode;
  tip?: ReactNode;
  icon: ComponentType<{ className?: string }>;
  placement: Placement;
  illustration?: ComponentType;
  // Kursor peraga: di mana harus "diklik" di dalam target
  pointer?: (target: HTMLElement) => Element | null;
  // Langkah ini butuh panel Daftar Lokasi terbuka
  needsDataPanel?: boolean;
  // Hanya ditampilkan untuk operator yang sudah masuk
  operatorOnly?: boolean;
}

// Ikon kecil di dalam kalimat, supaya pengguna tahu tombol mana yang dimaksud
function KeyIcon({ icon: Icon }: { icon: ComponentType<{ className?: string }> }) {
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 mx-0.5 align-[-4px] rounded border border-[#E5E5E5] bg-white shadow-sm">
      <Icon className="w-3 h-3" />
    </span>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <span className="font-semibold text-[#171717]">{children}</span>;
}

const isInViewport = (r: DOMRect) =>
  r.width > 0 && r.bottom > 0 && r.right > 0 && r.top < window.innerHeight && r.left < window.innerWidth;

function resolveTarget(targetId: TourStep["targetId"]): HTMLElement | null {
  if (!targetId) return null;
  const ids = Array.isArray(targetId) ? targetId : [targetId];
  const elements = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => el !== null);
  return elements.find((el) => isInViewport(el.getBoundingClientRect())) ?? elements[0] ?? null;
}

const findButtonByText = (root: HTMLElement, text: string) =>
  [...root.querySelectorAll("button")].find((b) => b.textContent?.includes(text)) ?? null;

// Pin lokasi yang terlihat dan tidak tertutup panel (dekat tengah peta)
function findVisibleMarker(map: HTMLElement): Element | null {
  const area = map.getBoundingClientRect();
  const cx = area.left + area.width / 2;
  const cy = area.top + area.height / 2;
  const candidates = [...map.querySelectorAll(".leaflet-marker-icon > div > div")].filter((m) => {
    const r = m.getBoundingClientRect();
    return r.left > area.left + 380 && r.right < area.right - 80 && r.top > area.top + 80 && r.bottom < area.bottom - 100;
  });
  const dist = (m: Element) => {
    const r = m.getBoundingClientRect();
    return Math.hypot(r.left + r.width / 2 - cx, r.top + r.height / 2 - cy);
  };
  return candidates.sort((a, b) => dist(a) - dist(b))[0] ?? null;
}

const TOUR_STEPS: TourStep[] = [
  {
    badge: "Selamat Datang",
    title: "Peta Digital Desa Pekauman Ulu",
    description:
      "Lewat peta ini Anda bisa melihat rumah, jalan, dan tempat-tempat penting di desa dari foto satelit. Panduan singkat ini hanya sekitar 1 menit.",
    icon: Compass,
    placement: "center",
    illustration: WelcomeIllustration,
  },
  {
    targetId: "tour-map",
    badge: "Peta",
    title: "Menggeser dan memperbesar peta",
    description: (
      <>
        <Label>Tahan klik lalu tarik</Label> untuk menggeser peta. <Label>Putar roda mouse</Label> untuk memperbesar atau
        memperkecil.
      </>
    ),
    tip: "Di HP: geser dengan satu jari, dan cubit layar dengan dua jari untuk memperbesar.",
    icon: Hand,
    placement: "center",
    illustration: PanZoomIllustration,
  },
  {
    targetId: "tour-map-controls",
    badge: "Tombol Peta",
    title: "Tombol bantu di pojok kanan",
    description: (
      <>
        <KeyIcon icon={Plus} /> <KeyIcon icon={Minus} /> memperbesar dan memperkecil. <KeyIcon icon={Maximize} /> menampilkan
        seluruh desa. <KeyIcon icon={Crosshair} /> kembali ke Kantor Desa.
      </>
    ),
    tip: (
      <>
        Tersesat di peta? Tekan <KeyIcon icon={Maximize} /> untuk melihat seluruh desa lagi.
      </>
    ),
    icon: Crosshair,
    placement: "left",
    pointer: (el) => el.querySelectorAll("button")[2] ?? null,
  },
  {
    targetId: "tour-search-bar",
    badge: "Pencarian",
    title: "Mencari tempat",
    description: (
      <>
        Ketik nama tempat, misalnya <Label>“Masjid”</Label> atau <Label>“Sekolah”</Label>, lalu pilih dari daftar yang
        muncul. Peta akan langsung menuju tempat itu.
      </>
    ),
    icon: Search,
    placement: "right",
    pointer: (el) => el.querySelector("input"),
  },
  {
    targetId: "tour-layers-panel",
    badge: "Layer",
    title: "Peta tersusun dari beberapa lapisan",
    description: (
      <>
        Bayangkan lembaran plastik bening yang ditumpuk: paling bawah <Label>foto satelit</Label>, di atasnya{" "}
        <Label>bangunan dan jalan</Label>, lalu <Label>titik-titik lokasi</Label>. Setiap lembar disebut <Label>layer</Label>.
      </>
    ),
    tip: "Hilangkan centang untuk menyembunyikan sebuah layer. Centang lagi untuk menampilkannya.",
    icon: Layers,
    placement: "right",
    illustration: LayersIllustration,
    pointer: (el) => el.querySelector("input[type=checkbox]"),
  },
  {
    targetId: "tour-map",
    badge: "Informasi",
    title: "Klik untuk melihat keterangan",
    description: (
      <>
        Klik <Label>titik, bangunan, atau jalan</Label> di peta. Keterangannya muncul di panel informasi. Untuk rumah warga
        ada tombol <Label>Rute Google Maps</Label> untuk petunjuk arah dari lokasi Anda.
      </>
    ),
    icon: Info,
    placement: "center",
    illustration: ClickInfoIllustration,
    pointer: findVisibleMarker,
  },
  {
    targetId: "tour-floating-bar",
    badge: "Tambah Data",
    title: "Menandai tempat baru",
    description: (
      <>
        Tekan <Label>Tambah Titik</Label>, lalu klik lokasinya di peta. Isi nama dan keterangannya, lalu simpan.
      </>
    ),
    tip: (
      <>
        Selesai menandai? Tekan <Label>Navigasi</Label> untuk kembali ke mode biasa.
      </>
    ),
    icon: MapPin,
    placement: "top",
    pointer: (el) => findButtonByText(el, "Tambah Titik"),
    operatorOnly: true,
  },
  {
    targetId: ["tour-sidebar", "tour-menu-button"],
    badge: "Menu",
    title: "Menu utama",
    description: (
      <ul className="space-y-1">
        <li>
          <Label>Daftar Lokasi</Label>: semua tempat penting desa
        </li>
        <li>
          <Label>Pengaturan</Label>: memperbesar ukuran huruf
        </li>
        <li>
          <Label>Panduan</Label>: membuka panduan ini lagi
        </li>
        <li>
          <Label>Masuk Operator</Label>: khusus perangkat desa, untuk menambah data dan import data rumah warga
        </li>
      </ul>
    ),
    icon: Menu,
    placement: "right",
    tip: (
      <>
        Di HP, menu dibuka lewat tombol <KeyIcon icon={Menu} /> di kiri atas.
      </>
    ),
    pointer: (el) =>
      el.id === "tour-menu-button" ? el : findButtonByText(el, "Masuk Operator") ?? findButtonByText(el, "Import Data"),
  },
  {
    targetId: "tour-crud-panel",
    badge: "Daftar Lokasi",
    title: "Daftar semua tempat",
    description:
      "Semua tempat penting desa ada di sini. Klik salah satu untuk langsung melihatnya di peta. Pilih kategori untuk menyaring, misalnya hanya Tempat Ibadah.",
    icon: List,
    placement: "left",
    needsDataPanel: true,
  },
  {
    targetId: ["tour-advanced-toggle", "tour-menu-button"],
    badge: "Mode Lanjutan",
    title: "Untuk petugas yang sudah mahir",
    description:
      "Mode Lanjutan menampilkan alat tambahan seperti koordinat, skala peta, dan data lengkap. Kalau belum perlu, biarkan mati. Semua fungsi utama tetap bisa dipakai.",
    icon: SlidersHorizontal,
    placement: "right",
    pointer: (el) => (el.id === "tour-menu-button" ? el : el.querySelector("[role=switch] > span")),
  },
  {
    badge: "Selesai",
    title: "Anda siap menggunakan peta!",
    description: (
      <>
        Panduan ini bisa dibuka lagi kapan saja lewat menu <Label>Panduan</Label>.
      </>
    ),
    icon: PartyPopper,
    placement: "center",
    illustration: DoneIllustration,
  },
];

const MARGIN = 16;
const GAP = 18;
const SPOT_PADDING = 6;

interface Size {
  width: number;
  height: number;
}

// Cari posisi kartu yang muat di layar: sisi yang diminta dulu, lalu sisi lain
function placeCard(target: DOMRect | null, card: Size, placement: Placement, pointer: DOMRect | null) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const clampX = (x: number) => Math.min(Math.max(MARGIN, x), vw - card.width - MARGIN);
  const clampY = (y: number) => Math.min(Math.max(MARGIN, y), vh - card.height - MARGIN);

  if (!target || placement === "center") {
    // Target besar (mis. peta): taruh kartu di sisi yang berlawanan dengan kursor peraga
    if (target && pointer) {
      const pointerOnRight = pointer.left + pointer.width / 2 > target.left + target.width / 2;
      const x = pointerOnRight ? target.left + target.width * 0.25 : target.left + target.width * 0.75;
      return { top: clampY(target.top + (target.height - card.height) / 2), left: clampX(x - card.width / 2) };
    }
    const area = target ?? new DOMRect(0, 0, vw, vh);
    return {
      top: clampY(area.top + (area.height - card.height) / 2),
      left: clampX(area.left + (area.width - card.width) / 2),
    };
  }

  const midX = target.left + target.width / 2 - card.width / 2;
  const options: Record<Exclude<Placement, "center">, { top: number; left: number; fits: boolean }> = {
    right: { top: clampY(target.top), left: target.right + GAP, fits: target.right + GAP + card.width <= vw - MARGIN },
    left: { top: clampY(target.top), left: target.left - GAP - card.width, fits: target.left - GAP - card.width >= MARGIN },
    bottom: { top: target.bottom + GAP, left: clampX(midX), fits: target.bottom + GAP + card.height <= vh - MARGIN },
    top: { top: target.top - GAP - card.height, left: clampX(midX), fits: target.top - GAP - card.height >= MARGIN },
  };
  const order = [placement, "right", "left", "bottom", "top"] as const;
  for (const side of order) {
    if (options[side].fits) return { top: options[side].top, left: options[side].left };
  }
  return { top: clampY(target.top + MARGIN), left: clampX(midX) };
}

function TourOverlay({ onClose, onEnsureSidebarOpen, isOperator = false }: Omit<GuidedTourProps, "isOpen">) {
  const steps = TOUR_STEPS.filter((s) => isOperator || !s.operatorOnly);
  const [stepIndex, setStepIndex] = useState(0);
  const [rects, setRects] = useState<{ target: DOMRect | null; pointer: DOMRect | null }>({ target: null, pointer: null });
  const [cardSize, setCardSize] = useState<Size>({ width: 380, height: 320 });
  const cardRef = useRef<HTMLDivElement | null>(null);
  const nextButtonRef = useRef<HTMLButtonElement | null>(null);

  const step = steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;

  const goNext = () => (isLast ? onClose() : setStepIndex((i) => i + 1));
  const goBack = () => setStepIndex((i) => Math.max(0, i - 1));

  // Buka panel Daftar Lokasi bila langkah ini menyorotnya
  useEffect(() => {
    if (step.needsDataPanel) onEnsureSidebarOpen?.();
  }, [step, onEnsureSidebarOpen]);

  // Ukur posisi target & titik kursor peraga; ukur ulang saat layout berubah
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      const el = resolveTarget(step.targetId);
      const target = el ? el.getBoundingClientRect() : null;
      let pointer: DOMRect | null = null;
      if (el && step.pointer) {
        const r = step.pointer(el)?.getBoundingClientRect();
        if (r && isInViewport(r)) pointer = r;
      }
      setRects({ target: target && isInViewport(target) ? target : null, pointer });
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    schedule();
    // Panel yang baru dibuka / peta yang menyesuaikan ukuran butuh waktu sebentar
    const timer = setTimeout(schedule, 400);
    window.addEventListener("resize", schedule);
    const observer = new ResizeObserver(schedule);
    const el = resolveTarget(step.targetId);
    if (el) observer.observe(el);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
    };
  }, [step]);

  // Ukuran kartu berubah per langkah (ilustrasi, panjang teks)
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const observer = new ResizeObserver(([entry]) => {
      const box = entry.borderBoxSize?.[0];
      setCardSize(box ? { width: box.inlineSize, height: box.blockSize } : { width: card.offsetWidth, height: card.offsetHeight });
    });
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  // Fokus ke tombol Lanjut supaya Enter / Spasi langsung bekerja
  useEffect(() => {
    nextButtonRef.current?.focus({ preventScroll: true });
  }, [stepIndex]);

  // Navigasi keyboard: ← → dan Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") {
        if (stepIndex < steps.length - 1) setStepIndex(stepIndex + 1);
        else onClose();
      } else if (e.key === "ArrowLeft" && stepIndex > 0) setStepIndex(stepIndex - 1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [stepIndex, steps.length, onClose]);

  const { target, pointer } = rects;
  const cardPos = placeCard(target, cardSize, step.placement, pointer);

  // Tanpa target: spotlight menyusut ke tengah layar sehingga seluruh layar redup
  const spot = target
    ? {
        top: target.top - SPOT_PADDING,
        left: target.left - SPOT_PADDING,
        width: target.width + SPOT_PADDING * 2,
        height: target.height + SPOT_PADDING * 2,
        borderRadius: 12,
      }
    : { top: window.innerHeight / 2, left: window.innerWidth / 2, width: 0, height: 0, borderRadius: 999 };

  const Icon = step.icon;
  const Illustration = step.illustration;

  return (
    <div className="fixed inset-0 z-[3000] select-none" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      {/* Penahan klik: aplikasi di belakang tidak bisa diklik selama panduan */}
      <div className="fixed inset-0" />

      {/* Spotlight: area di luar target digelapkan lewat bayangan raksasa */}
      <div
        className="tour-spotlight fixed pointer-events-none"
        style={{ ...spot, boxShadow: "0 0 0 9999px rgba(10, 10, 10, 0.62)" }}
      >
        {target && <div className="tour-pulse absolute inset-0 rounded-[inherit] ring-2 ring-white" />}
      </div>

      {/* Kursor peraga yang "mengklik" bagian yang dimaksud */}
      {pointer && (
        <div
          key={stepIndex}
          className="fixed pointer-events-none"
          style={{ top: pointer.top + pointer.height / 2, left: pointer.left + pointer.width / 2 }}
        >
          <span className="tour-ripple opacity-0 absolute left-0 top-0 w-12 h-12 rounded-full border-[3px] border-white" />
          <div className="tour-tap absolute -left-[3px] -top-[2px]">
            <MousePointer2
              className="w-7 h-7 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
              fill="#171717"
              strokeWidth={1.5}
            />
          </div>
        </div>
      )}

      {/* Kartu Panduan */}
      <div
        ref={cardRef}
        className="tour-card tour-card-in fixed w-[380px] max-w-[calc(100vw-32px)] bg-white text-[#171717] rounded-2xl shadow-2xl border border-[#E5E5E5] overflow-hidden"
        style={{ top: cardPos.top, left: cardPos.left }}
      >
        {/* Progres langkah */}
        <div className="flex gap-1 px-5 pt-4">
          {steps.map((s, idx) => (
            <button
              key={s.title}
              onClick={() => setStepIndex(idx)}
              className="flex-1 h-1.5 rounded-full overflow-hidden bg-[#E5E5E5]"
              title={`Langkah ${idx + 1}: ${s.title}`}
              aria-label={`Langkah ${idx + 1}`}
            >
              <span
                className={`block h-full bg-[#171717] transition-all duration-500 ${idx <= stepIndex ? "w-full" : "w-0"}`}
              />
            </button>
          ))}
        </div>

        <div key={stepIndex} className="tour-content-in px-5 pt-4 pb-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#171717] text-white flex items-center justify-center flex-shrink-0">
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-semibold text-[#737373] uppercase tracking-wider">{step.badge}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#737373]">
                {stepIndex + 1} dari {steps.length}
              </span>
              <button
                onClick={onClose}
                className="p-1 text-[#737373] hover:text-[#171717] hover:bg-[#F5F5F5] rounded transition"
                title="Tutup panduan (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {Illustration && <Illustration />}

          <div>
            <h3 id="tour-title" className="font-bold text-lg leading-snug">
              {step.title}
            </h3>
            <div className="text-sm text-[#525252] mt-1.5 leading-relaxed">{step.description}</div>
          </div>

          {step.tip && (
            <div className="flex gap-2 p-2.5 rounded-lg bg-[#FFF8E6] border border-[#F5E3B3] text-xs text-[#6B5200] leading-relaxed">
              <Lightbulb className="w-4 h-4 flex-shrink-0 text-[#D99A00]" />
              <div>{step.tip}</div>
            </div>
          )}
        </div>

        <div className="px-5 py-3.5 border-t border-[#E5E5E5] bg-[#FAFAFA] flex items-center justify-between gap-2">
          {!isLast ? (
            <button onClick={onClose} className="text-xs text-[#737373] hover:text-[#171717] font-medium transition py-1">
              Lewati panduan
            </button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                onClick={goBack}
                className="flex items-center gap-1 px-3 py-2 bg-white border border-[#E5E5E5] hover:bg-[#F5F5F5] rounded-lg text-xs font-medium transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Kembali
              </button>
            )}
            <button
              ref={nextButtonRef}
              onClick={goNext}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#171717] hover:bg-[#262626] text-white rounded-lg text-xs font-semibold shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#171717] focus-visible:ring-offset-2"
            >
              {isLast ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Mulai Pakai Peta
                </>
              ) : (
                <>
                  {isFirst ? "Mulai Panduan" : "Lanjut"}
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Dirender hanya saat terbuka, jadi setiap kali dibuka selalu mulai dari langkah pertama
export default function GuidedTour({ isOpen, ...props }: GuidedTourProps) {
  if (!isOpen) return null;
  return <TourOverlay {...props} />;
}
