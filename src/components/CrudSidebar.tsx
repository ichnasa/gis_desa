import { useState, useMemo, useRef, useEffect } from "react";
import {
  Search,
  X,
  Pencil,
  Trash2,
  MapPin,
  ArrowRight,
  Landmark,
  Moon,
  GraduationCap,
  HeartPulse,
  Anchor,
  Store,
  Plus,
} from "lucide-react";
import type { GisLocation, LayerVisibility, GisCategory } from "../types/gis";

export type { GisLocation, LayerVisibility, GisCategory };

interface CrudSidebarProps {
  locations?: GisLocation[];
  onSelectLocation?: (loc: GisLocation) => void;
  onAddLocation?: (loc: GisLocation) => void;
  onUpdateLocation?: (loc: GisLocation) => void;
  onDeleteLocation?: (id: string) => void;
  onClose?: () => void;
  activeTab?: "list" | "form";
  onChangeTab?: (tab: "list" | "form") => void;
  editingLocation?: GisLocation | null;
  onCancelEdit?: () => void;
}

export const INITIAL_LOCATIONS: GisLocation[] = [
  // Pemerintahan & Pelayanan Publik
  {
    id: "gmap-1",
    name: "Kantor Desa Pekauman Ulu",
    category: "pemerintahan",
    lat: -3.398004,
    lng: 114.844206,
    address: "Jl. Martapura Lama RT 02",
    rtRw: "RT 02 / RW 01",
    description: "Kantor pusat administrasi dan pelayanan resmi Desa Pekauman Ulu.",
    createdAt: "2026-01-10",
  },
  {
    id: "gmap-2",
    name: "Aula Balai Desa Pekauman Ulu",
    category: "pemerintahan",
    lat: -3.398271,
    lng: 114.844011,
    address: "Jl. Martapura Lama",
    rtRw: "RT 02 / RW 01",
    description: "Gedung pertemuan warga dan musyawarah desa Pekauman Ulu.",
    createdAt: "2026-01-10",
  },
  {
    id: "gmap-3",
    name: "Kantor Desa Pekauman",
    category: "pemerintahan",
    lat: -3.398850,
    lng: 114.842660,
    address: "Jl. Martapura Lama No. 24",
    rtRw: "Pekauman",
    description: "Kantor urusan pemerintahan wilayah Pekauman.",
    createdAt: "2026-01-15",
  },

  // Fasilitas Kesehatan
  {
    id: "gmap-4",
    name: "Puskesdes Pekauman Ulu",
    category: "kesehatan",
    lat: -3.397611,
    lng: 114.843901,
    address: "Jl. Martapura Lama RT 02",
    rtRw: "RT 02 / RW 01",
    description: "Pos kesehatan desa melayani pemeriksaan kesehatan dasar warga.",
    createdAt: "2026-02-14",
  },
  {
    id: "gmap-5",
    name: "Posyandu Balita & Posbindu Melati",
    category: "kesehatan",
    lat: -3.398200,
    lng: 114.843600,
    address: "Jl. Martapura Lama",
    rtRw: "RT 02 / RW 01",
    description: "Pelayanan kesehatan ibu, imunisasi balita, dan posbindu lansia.",
    createdAt: "2026-02-14",
  },

  // Tempat Ibadah & Situs Religi
  {
    id: "gmap-6",
    name: "Masjid Ibnul Amin Pekauman",
    category: "ibadah",
    lat: -3.399542,
    lng: 114.843560,
    address: "Jl. Martapura Lama",
    rtRw: "RT 01 / RW 01",
    description: "Masjid utama jemaah warga Pekauman untuk sholat Jumat dan kegiatan keagamaan.",
    createdAt: "2026-01-12",
  },
  {
    id: "gmap-7",
    name: "Masjid At-Taqwa Pekauman",
    category: "ibadah",
    lat: -3.400311,
    lng: 114.845959,
    address: "Bantaran Sungai Martapura",
    rtRw: "RT 01 / RW 01",
    description: "Masjid tepi sungai tempat ibadah dan pengajian berkala warga pesisir.",
    createdAt: "2026-01-15",
  },
  {
    id: "gmap-8",
    name: "Langgar An Nashir",
    category: "ibadah",
    lat: -3.395847,
    lng: 114.844111,
    address: "Jl. Martapura Lama Gang An Nashir",
    rtRw: "RT 03 / RW 01",
    description: "Musholla tempat sholat berjamaah warga Pekauman Ulu bagian utara.",
    createdAt: "2026-01-18",
  },
  {
    id: "gmap-9",
    name: "Langgar Taqwallah",
    category: "ibadah",
    lat: -3.397611,
    lng: 114.843901,
    address: "Jl. Martapura Lama RT 02",
    rtRw: "RT 02 / RW 01",
    description: "Musholla lingkungan RT 02 untuk ibadah harian warga.",
    createdAt: "2026-01-20",
  },
  {
    id: "gmap-10",
    name: "Musholla Nidaul Khair",
    category: "ibadah",
    lat: -3.398527,
    lng: 114.844414,
    address: "Jl. Martapura Lama Gang Berkah",
    rtRw: "RT 02 / RW 01",
    description: "Tempat ibadah dekat dermaga dan pemukiman bantaran sungai.",
    createdAt: "2026-01-22",
  },
  {
    id: "gmap-11",
    name: "Makam KH Abdul Wahab Sya'rani bin Salman",
    category: "ibadah",
    lat: -3.397474,
    lng: 114.842406,
    address: "Jl. Baburrahman No. 17",
    rtRw: "RT 02 / RW 01",
    description: "Makam ulama kharismatik Martapura, situs ziarah religi umat Islam.",
    createdAt: "2026-01-05",
  },

  // Lembaga Pendidikan
  {
    id: "gmap-12",
    name: "PAUD Harapan Bunda Pekauman Ulu",
    category: "pendidikan",
    lat: -3.395799,
    lng: 114.843976,
    address: "Jl. Martapura Lama",
    rtRw: "RT 03 / RW 01",
    description: "Pendidikan anak usia dini Desa Pekauman Ulu.",
    createdAt: "2026-02-01",
  },
  {
    id: "gmap-13",
    name: "TPA Al-Munawarrah Pekauman Ulu",
    category: "pendidikan",
    lat: -3.398642,
    lng: 114.844018,
    address: "Jl. Martapura Lama No. 32",
    rtRw: "RT 02 / RW 01",
    description: "Taman Pendidikan Al-Qur'an dan bimbingan akhlak santri cilik.",
    createdAt: "2026-02-05",
  },
  {
    id: "gmap-14",
    name: "Madrasah Al-Ikhlas Pekauman Ulu",
    category: "pendidikan",
    lat: -3.396800,
    lng: 114.843800,
    address: "Jl. K.H. Anang Sya'rani Arif Gang Madrasah",
    rtRw: "RT 02 / RW 01",
    description: "Lembaga pendidikan Islam dasar dan madrasah diniyah.",
    createdAt: "2026-02-01",
  },

  // Sentra Ekonomi, UMKM, & Toko
  {
    id: "gmap-15",
    name: "Dapur Bakery Hj. Enong Pekauman",
    category: "ekonomi",
    lat: -3.398617,
    lng: 114.844571,
    address: "Jl. Martapura Lama RT 02",
    rtRw: "RT 02 / RW 01",
    description: "Sentra produksi kue dan oleh-oleh legendaris bolu gulung khas Martapura.",
    createdAt: "2026-02-10",
  },
  {
    id: "gmap-16",
    name: "Pasar Kuliner Khas Banjar Pekauman Ulu",
    category: "ekonomi",
    lat: -3.398426,
    lng: 114.844618,
    address: "Jl. Martapura Lama RT 02",
    rtRw: "RT 02 / RW 01",
    description: "Sentra jajanan pasar kue tradisional Banjar (wadai basah, bingka, cincin).",
    createdAt: "2026-02-12",
  },
  {
    id: "gmap-17",
    name: "Warung Makan Acil Imar Pekauman",
    category: "ekonomi",
    lat: -3.396051,
    lng: 114.843110,
    address: "Jl. Martapura Lama No. 12",
    rtRw: "RT 03 / RW 01",
    description: "Warung makan menyajikan masakan khas Banjar dan lauk pauk harian.",
    createdAt: "2026-02-15",
  },
  {
    id: "gmap-18",
    name: "Rocket Chicken Pekauman Martapura",
    category: "ekonomi",
    lat: -3.398649,
    lng: 114.842521,
    address: "Jl. Martapura Lama No. 40",
    rtRw: "RT 01 / RW 01",
    description: "Restoran kuliner cepat saji ayam goreng dan burger di jalan poros.",
    createdAt: "2026-02-18",
  },
  {
    id: "gmap-19",
    name: "Roti Hapuk 23 Pekauman",
    category: "ekonomi",
    lat: -3.399018,
    lng: 114.844551,
    address: "Jl. Martapura Lama RT 02",
    rtRw: "RT 02 / RW 01",
    description: "Produksi roti hangat dan aneka kue bakery rumahan warga.",
    createdAt: "2026-02-20",
  },
  {
    id: "gmap-20",
    name: "Produksi KripKong (BSR).mm Bais",
    category: "ekonomi",
    lat: -3.396020,
    lng: 114.842133,
    address: "Jl. Babur Rahman No. 15",
    rtRw: "RT 03 / RW 01",
    description: "Usaha UMKM produksi keripik singkong gurih khas desa.",
    createdAt: "2026-02-22",
  },
  {
    id: "gmap-21",
    name: "Toko Ramadhan Pekauman",
    category: "ekonomi",
    lat: -3.399885,
    lng: 114.843755,
    address: "Jl. Martapura Lama",
    rtRw: "RT 01 / RW 01",
    description: "Toko sembako dan kebutuhan harian rumah tangga.",
    createdAt: "2026-02-24",
  },
  {
    id: "gmap-22",
    name: "Toko Iyaluna Hijab Pekauman",
    category: "ekonomi",
    lat: -3.398874,
    lng: 114.842634,
    address: "Jl. Martapura Lama No. 25",
    rtRw: "RT 01 / RW 01",
    description: "Toko busana muslimah, kerudung, gamis, dan aksesoris.",
    createdAt: "2026-02-25",
  },

  // Fasilitas Umum & Jasa Transportasi
  {
    id: "gmap-23",
    name: "Dermaga / Batang Pekauman Ulu",
    category: "fasilitas",
    lat: -3.399360,
    lng: 114.845530,
    address: "Bantaran Sungai Martapura",
    rtRw: "RT 02 / RW 01",
    description: "Dermaga tambatan perahu klotok dan aktivitas air warga bantaran sungai.",
    createdAt: "2026-02-01",
  },
  {
    id: "gmap-24",
    name: "Dermaga Penyeberangan Klotok Sungai Martapura",
    category: "fasilitas",
    lat: -3.397100,
    lng: 114.846200,
    address: "Sungai Martapura RT 02",
    rtRw: "RT 02 / RW 01",
    description: "Akses penyeberangan perahu klotok warga menuju seberang tepian sungai.",
    createdAt: "2026-02-10",
  },
  {
    id: "gmap-25",
    name: "Bengkel Habibi Motor",
    category: "fasilitas",
    lat: -3.396527,
    lng: 114.845699,
    address: "Jl. Martapura Lama Gang Sejahtera",
    rtRw: "RT 03 / RW 01",
    description: "Bengkel servis motor, ganti oli, dan perbaikan kendaraan roda dua.",
    createdAt: "2026-02-15",
  },
  {
    id: "gmap-26",
    name: "Bengkel Gondrong Lengo",
    category: "fasilitas",
    lat: -3.401299,
    lng: 114.845328,
    address: "Jl. Martapura Lama RT 01",
    rtRw: "RT 01 / RW 01",
    description: "Bengkel perawatan motor dan tambal ban warga.",
    createdAt: "2026-02-18",
  },
  {
    id: "gmap-27",
    name: "Nizam Zain Bersaudara",
    category: "fasilitas",
    lat: -3.400630,
    lng: 114.845789,
    address: "Bantaran Sungai Martapura",
    rtRw: "RT 01 / RW 01",
    description: "Jasa perlengkapan dan usaha penunjang aktivitas warga desa.",
    createdAt: "2026-02-20",
  },
];

export const CATEGORY_ICONS_CONFIG: Record<
  GisCategory,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  pemerintahan: { label: "Pemerintahan", icon: Landmark },
  ibadah: { label: "Tempat Ibadah", icon: Moon },
  pendidikan: { label: "Pendidikan", icon: GraduationCap },
  kesehatan: { label: "Kesehatan", icon: HeartPulse },
  fasilitas: { label: "Fasilitas Umum", icon: Anchor },
  ekonomi: { label: "Ekonomi / UMKM", icon: Store },
};

export default function CrudSidebar({
  locations: externalLocations,
  onSelectLocation,
  onAddLocation,
  onUpdateLocation,
  onDeleteLocation,
  onClose,
  activeTab: externalTab,
  onChangeTab,
  editingLocation,
  onCancelEdit,
}: CrudSidebarProps) {
  const [internalLocations, setInternalLocations] = useState<GisLocation[]>(INITIAL_LOCATIONS);
  const locations = externalLocations ?? internalLocations;

  const [internalTab, setInternalTab] = useState<"list" | "form">("list");
  const activeTab = externalTab ?? internalTab;

  const setActiveTab = (tab: "list" | "form") => {
    if (onChangeTab) onChangeTab(tab);
    else setInternalTab(tab);
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    category: GisCategory;
    lat: string;
    lng: string;
    address: string;
    rtRw: string;
    description: string;
  }>({
    name: "",
    category: "fasilitas",
    lat: "-3.397991",
    lng: "114.844238",
    address: "",
    rtRw: "RT 01 / RW 01",
    description: "",
  });

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Sinkronisasi jika ada titik lokasi yang dipilih untuk diedit dari popover peta
  useEffect(() => {
    if (editingLocation) {
      setEditingLocationId(editingLocation.id);
      setFormData({
        name: editingLocation.name,
        category: editingLocation.category,
        lat: editingLocation.lat.toString(),
        lng: editingLocation.lng.toString(),
        address: editingLocation.address,
        rtRw: editingLocation.rtRw || "",
        description: editingLocation.description || "",
      });
      setActiveTab("form");
    }
  }, [editingLocation]);
  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      const matchSearch =
        loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (loc.rtRw && loc.rtRw.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (loc.description && loc.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory = selectedCategory === "all" || loc.category === selectedCategory;

      return matchSearch && matchCategory;
    });
  }, [locations, searchQuery, selectedCategory]);

  const handleOpenAddForm = () => {
    setEditingLocationId(null);
    setFormData({
      name: "",
      category: "fasilitas",
      lat: "-3.397991",
      lng: "114.844238",
      address: "",
      rtRw: "RT 01 / RW 01",
      description: "",
    });
    setActiveTab("form");
  };

  const handleOpenEditForm = (loc: GisLocation) => {
    setEditingLocationId(loc.id);
    setFormData({
      name: loc.name,
      category: loc.category,
      lat: loc.lat.toString(),
      lng: loc.lng.toString(),
      address: loc.address,
      rtRw: loc.rtRw || "",
      description: loc.description || "",
    });
    setActiveTab("form");
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedLat = parseFloat(formData.lat);
    const parsedLng = parseFloat(formData.lng);

    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      alert("Koordinat tidak valid. Harap masukkan angka.");
      return;
    }

    if (editingLocationId) {
      const updated: GisLocation = {
        id: editingLocationId,
        name: formData.name,
        category: formData.category,
        lat: parsedLat,
        lng: parsedLng,
        address: formData.address,
        rtRw: formData.rtRw,
        description: formData.description,
        createdAt: new Date().toISOString().split("T")[0],
      };

      if (onUpdateLocation) onUpdateLocation(updated);
      else setInternalLocations((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    } else {
      const newLoc: GisLocation = {
        id: `loc-${Date.now()}`,
        name: formData.name,
        category: formData.category,
        lat: parsedLat,
        lng: parsedLng,
        address: formData.address,
        rtRw: formData.rtRw,
        description: formData.description,
        createdAt: new Date().toISOString().split("T")[0],
      };

      if (onAddLocation) onAddLocation(newLoc);
      else setInternalLocations((prev) => [newLoc, ...prev]);
    }

    setActiveTab("list");
    setEditingLocationId(null);
    if (onCancelEdit) onCancelEdit();
  };

  // Pengaturan Resizable Width (Rentang 300px s/d 560px)
  const MIN_WIDTH = 300;
  const MAX_WIDTH = 560;

  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("gis_sidebar_width");
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= MIN_WIDTH && parsed <= MAX_WIDTH) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return 384;
  });

  const isResizingRef = useRef(false);

  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizingRef.current) return;
      const delta = startX - moveEvent.clientX;
      const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startWidth + delta));
      setSidebarWidth(newWidth);
      window.dispatchEvent(new Event("resize"));
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      try {
        localStorage.setItem("gis_sidebar_width", sidebarWidth.toString());
      } catch {
        // ignore
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleDelete = (id: string) => {
    if (onDeleteLocation) onDeleteLocation(id);
    else setInternalLocations((prev) => prev.filter((l) => l.id !== id));
    setDeleteConfirmId(null);
  };

  return (
    <aside
      id="tour-crud-panel"
      style={{ width: `${sidebarWidth}px` }}
      className="relative h-full flex flex-col bg-white border-l border-[#E5E5E5] shadow-sm select-none z-20 flex-shrink-0 text-[#171717]"
    >
      {/* Handle Penggeser Lebar Sidebar (Resize Handle) */}
      <div
        onMouseDown={handleMouseDownResize}
        className="absolute -left-1.5 top-0 bottom-0 w-3 cursor-col-resize z-40 group flex items-center justify-center select-none"
        title="Geser untuk mengubah lebar panel (Min: 300px, Max: 560px)"
      >
        <div className="w-[3px] h-12 rounded-full bg-[#E5E5E5] group-hover:bg-[#171717] group-active:bg-[#171717] transition-colors" />
      </div>
      <header className="px-5 py-4 border-b border-[#E5E5E5] flex items-center justify-between bg-white">
        <div>
          <h2 className="font-semibold text-base text-[#171717]">Informasi Desa</h2>
          <p className="text-xs text-[#737373] mt-0.5">Desa Pekauman Ulu</p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#737373] hover:text-[#171717] hover:bg-[#F5F5F5] transition"
            title="Tutup Panel"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </header>

      {/* 2. Dua Tab Utama (Monochrome Underline) */}
      <div className="flex border-b border-[#E5E5E5] bg-[#F5F5F5] text-xs font-medium px-2">
        <button
          onClick={() => setActiveTab("list")}
          className={`py-2.5 px-3 text-center border-b-2 transition flex items-center gap-1.5 ${
            activeTab === "list"
              ? "border-[#171717] text-[#171717] bg-white font-semibold"
              : "border-transparent text-[#737373] hover:text-[#171717]"
          }`}
        >
          <span>Daftar Lokasi</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#E5E5E5] text-[#737373]">
            {filteredLocations.length}
          </span>
        </button>

        <button
          onClick={handleOpenAddForm}
          className={`py-2.5 px-3 text-center border-b-2 transition flex items-center gap-1.5 ${
            activeTab === "form"
              ? "border-[#171717] text-[#171717] bg-white font-semibold"
              : "border-transparent text-[#737373] hover:text-[#171717]"
          }`}
        >
          <span>{editingLocationId ? "Edit Lokasi" : "Tambah Lokasi"}</span>
        </button>
      </div>

      {/* 3. Konten Panel */}
      <div className="flex-1 overflow-y-auto">
        {/* ================= TAB 1: LIST / DAFTAR LOKASI ================= */}
        {activeTab === "list" && (
          <div className="p-4 space-y-4">
            {/* Search Box Monochrome */}
            <div className="relative">
              <input
                type="text"
                placeholder="Cari lokasi, desa, atau tempat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-[#E5E5E5] rounded-md focus:outline-none focus:border-[#171717] focus:ring-1 focus:ring-[#171717] text-[#171717] placeholder-[#737373] transition"
              />
              <Search className="w-4 h-4 text-[#737373] absolute left-3 top-2.5" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2.5 text-[#737373] hover:text-[#171717]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Kategori Monochrome */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-2.5 py-1 rounded-md border transition whitespace-nowrap ${
                  selectedCategory === "all"
                    ? "bg-[#171717] text-white border-[#171717]"
                    : "bg-white text-[#737373] border-[#E5E5E5] hover:bg-[#F5F5F5] hover:text-[#171717]"
                }`}
              >
                Semua
              </button>
              {(Object.keys(CATEGORY_ICONS_CONFIG) as GisCategory[]).map((catKey) => {
                const isSelected = selectedCategory === catKey;
                const IconComponent = CATEGORY_ICONS_CONFIG[catKey].icon;
                return (
                  <button
                    key={catKey}
                    onClick={() => setSelectedCategory(catKey)}
                    className={`px-2.5 py-1 rounded-md border transition whitespace-nowrap flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-[#171717] text-white border-[#171717]"
                        : "bg-white text-[#737373] border-[#E5E5E5] hover:bg-[#F5F5F5] hover:text-[#171717]"
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                    <span>{CATEGORY_ICONS_CONFIG[catKey].label}</span>
                  </button>
                );
              })}
            </div>

            {/* Daftar Lokasi */}
            {filteredLocations.length === 0 ? (
              <div className="text-center py-12 px-4 bg-[#F5F5F5] rounded-lg border border-[#E5E5E5]">
                <MapPin className="w-6 h-6 text-[#737373] mx-auto mb-2" />
                <h4 className="font-semibold text-sm text-[#171717]">Belum ada lokasi</h4>
                <p className="text-xs text-[#737373] mt-1 max-w-xs mx-auto">
                  Belum ada data yang cocok. Coba gunakan nama lokasi lain atau tambah lokasi baru.
                </p>
                <button
                  onClick={handleOpenAddForm}
                  className="mt-4 px-3 py-1.5 bg-[#171717] text-white text-xs font-medium rounded-md hover:bg-[#262626] transition inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Lokasi</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLocations.map((loc) => {
                  const IconComp = CATEGORY_ICONS_CONFIG[loc.category]?.icon || Anchor;
                  return (
                    <div
                      key={loc.id}
                      className="p-4 bg-white rounded-lg border border-[#E5E5E5] hover:border-[#171717] transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <span className="text-xs text-[#737373] flex items-center gap-1 mb-1">
                            <IconComp className="w-3.5 h-3.5" />
                            <span>{CATEGORY_ICONS_CONFIG[loc.category]?.label}</span>
                          </span>
                          <h3
                            onClick={() => onSelectLocation && onSelectLocation(loc)}
                            className="font-semibold text-sm text-[#171717] hover:underline cursor-pointer truncate"
                            title={loc.name}
                          >
                            {loc.name}
                          </h3>
                        </div>

                        {/* Tombol Aksi */}
                        <div className="flex items-center gap-1 text-[#737373]">
                          <button
                            onClick={() => handleOpenEditForm(loc)}
                            className="p-1.5 hover:text-[#171717] rounded hover:bg-[#F5F5F5]"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(loc.id)}
                            className="p-1.5 hover:text-[#171717] rounded hover:bg-[#F5F5F5]"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-[#737373] mt-1 line-clamp-1">{loc.address}</p>

                      {loc.rtRw && (
                        <div className="text-[11px] text-[#737373] mt-1">
                          Wilayah: <span className="text-[#171717]">{loc.rtRw}</span>
                        </div>
                      )}

                      <div className="mt-3 pt-2.5 border-t border-[#E5E5E5] flex items-center justify-between">
                        <button
                          onClick={() => onSelectLocation && onSelectLocation(loc)}
                          className="text-xs font-medium text-[#171717] hover:underline flex items-center gap-1"
                        >
                          <span>Lihat di peta</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[10px] text-[#737373] font-mono">
                          {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
                        </span>
                      </div>

                      {/* Konfirmasi Hapus */}
                      {deleteConfirmId === loc.id && (
                        <div className="mt-3 p-3 bg-[#F5F5F5] border border-[#E5E5E5] rounded-md text-xs text-[#171717]">
                          <div className="font-semibold text-[#171717]">Hapus Lokasi?</div>
                          <p className="text-[11px] text-[#737373] mt-0.5 mb-2">
                            Data yang dihapus tidak dapat dikembalikan.
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDelete(loc.id)}
                              className="px-2.5 py-1 bg-[#171717] text-white rounded-md font-medium text-xs hover:bg-[#262626] transition"
                            >
                              Hapus
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2.5 py-1 bg-white border border-[#E5E5E5] text-[#171717] rounded-md text-xs hover:bg-[#F5F5F5] transition"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: FORM INPUT ================= */}
        {activeTab === "form" && (
          <form
            onSubmit={handleSubmitForm}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            data-form-type="other"
            className="p-4 space-y-4 text-xs"
          >
            <div className="pb-2 border-b border-[#E5E5E5]">
              <h3 className="font-semibold text-sm text-[#171717]">
                {editingLocationId ? "Edit Lokasi" : "Tambah Lokasi Baru"}
              </h3>
              <p className="text-[#737373] mt-0.5">Masukkan data lokasi untuk ditampilkan pada peta.</p>
            </div>

            {/* Nama Lokasi */}
            <div>
              <label className="block font-medium text-[#171717] mb-1">Nama Lokasi</label>
              <input
                type="text"
                name="gis_place_title"
                autoComplete="off"
                required
                placeholder="Contoh: Balai Warga RT 02"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-[#E5E5E5] rounded-md focus:outline-none focus:border-[#171717] focus:ring-1 focus:ring-[#171717]"
              />
            </div>

            {/* Kategori */}
            <div>
              <label className="block font-medium text-[#171717] mb-1">Kategori</label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value as GisCategory })
                }
                className="w-full px-3 py-2 text-sm bg-white border border-[#E5E5E5] rounded-md focus:outline-none focus:border-[#171717]"
              >
                {(Object.keys(CATEGORY_ICONS_CONFIG) as GisCategory[]).map((key) => (
                  <option key={key} value={key}>
                    {CATEGORY_ICONS_CONFIG[key].label}
                  </option>
                ))}
              </select>
            </div>

            {/* Wilayah RT/RW */}
            <div>
              <label className="block font-medium text-[#171717] mb-1">Wilayah RT / RW</label>
              <input
                type="text"
                name="gis_place_neighborhood"
                autoComplete="off"
                placeholder="Contoh: RT 02 / RW 01"
                value={formData.rtRw}
                onChange={(e) => setFormData({ ...formData, rtRw: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-[#E5E5E5] rounded-md focus:outline-none focus:border-[#171717]"
              />
            </div>

            {/* Alamat */}
            <div>
              <label className="block font-medium text-[#171717] mb-1">Alamat atau Jalan</label>
              <input
                type="text"
                name="gis_place_road"
                autoComplete="off"
                placeholder="Contoh: Jl. Martapura Lama Gang Berkah"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-[#E5E5E5] rounded-md focus:outline-none focus:border-[#171717]"
              />
            </div>

            {/* Koordinat */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-medium text-[#171717] mb-1">Latitude</label>
                <input
                  type="text"
                  name="gis_place_lat"
                  autoComplete="off"
                  required
                  value={formData.lat}
                  onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                  className="w-full px-2.5 py-1.5 font-mono text-xs bg-white border border-[#E5E5E5] rounded-md focus:outline-none focus:border-[#171717]"
                />
              </div>
              <div>
                <label className="block font-medium text-[#171717] mb-1">Longitude</label>
                <input
                  type="text"
                  name="gis_place_lng"
                  autoComplete="off"
                  required
                  value={formData.lng}
                  onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                  className="w-full px-2.5 py-1.5 font-mono text-xs bg-white border border-[#E5E5E5] rounded-md focus:outline-none focus:border-[#171717]"
                />
              </div>
            </div>
            <p className="text-[11px] text-[#737373] -mt-2">
              Tip: Anda dapat langsung mengeklik pada peta untuk mengisi posisi.
            </p>

            {/* Deskripsi */}
            <div>
              <label className="block font-medium text-[#171717] mb-1">Keterangan Tambahan</label>
              <textarea
                rows={3}
                placeholder="Keterangan singkat mengenai lokasi ini..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-[#E5E5E5] rounded-md focus:outline-none focus:border-[#171717]"
              />
            </div>

            {/* Tombol Simpan & Batal */}
            <div className="pt-2 flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2 px-4 bg-[#171717] hover:bg-[#262626] text-white font-medium text-sm rounded-md transition shadow-sm"
              >
                {editingLocationId ? "Simpan Perubahan" : "Simpan Lokasi"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingLocationId(null);
                  setActiveTab("list");
                  if (onCancelEdit) onCancelEdit();
                }}
                className="py-2 px-4 bg-white border border-[#E5E5E5] hover:bg-[#F5F5F5] text-[#171717] font-medium text-sm rounded-md transition"
              >
                Batal
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 4. Footer Panel */}
      <footer className="p-3 border-t border-[#E5E5E5] text-xs text-[#737373] flex items-center justify-between bg-[#F5F5F5]">
        <span>Desa Pekauman Ulu</span>
        <button
          onClick={handleOpenAddForm}
          className="text-[#171717] font-medium hover:underline flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Lokasi</span>
        </button>
      </footer>
    </aside>
  );
}
