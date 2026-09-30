import { Map, List, PlusCircle, Settings, BookOpen } from "lucide-react";

export type SidebarTab = "map" | "data" | "add" | "settings" | "guide";

export interface SidebarProps {
  activeTab?: SidebarTab;
  onSelectTab?: (tab: SidebarTab) => void;
  locationCount?: number;
  onResetMap?: () => void;
}

export default function Sidebar({
  activeTab = "map",
  onSelectTab,
  locationCount = 5,
  onResetMap,
}: SidebarProps) {
  return (
    <aside id="tour-sidebar" className="w-64 h-full bg-[#F5F5F5] border-r border-[#E5E5E5] flex flex-col text-[#171717] select-none z-30 transition-all flex-shrink-0">
      {/* 1. Header Aplikasi Monochrome */}
      <div className="p-4 border-b border-[#E5E5E5] flex items-center gap-3 bg-white">
        <img
          src="/logo_desa_pekauman_ulu.png"
          alt="Logo Desa Pekauman Ulu"
          className="w-7 h-9 object-contain flex-shrink-0"
        />
        <div className="min-w-0">
          <h1 className="font-semibold text-sm leading-tight text-[#171717] truncate">
            Peta Pekauman Ulu
          </h1>
          <p className="text-xs text-[#737373] mt-0.5 truncate">Kec. Martapura Timur</p>
        </div>
      </div>

      {/* 2. Menu Navigasi Sederhana */}
      <nav className="p-3 space-y-1 flex-1">
        {/* Menu: Peta */}
        <button
          onClick={() => {
            if (onSelectTab) onSelectTab("map");
            if (onResetMap) onResetMap();
          }}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition text-left ${
            activeTab === "map"
              ? "bg-white text-[#171717] shadow-sm border border-[#E5E5E5]"
              : "text-[#737373] hover:text-[#171717] hover:bg-[#EAEAEA]"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Map className="w-4 h-4" />
            <span>Peta</span>
          </div>
          {activeTab === "map" && <span className="w-1.5 h-1.5 rounded-full bg-[#171717]" />}
        </button>

        {/* Menu: Daftar Lokasi */}
        <button
          onClick={() => onSelectTab && onSelectTab("data")}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition text-left ${
            activeTab === "data"
              ? "bg-white text-[#171717] shadow-sm border border-[#E5E5E5]"
              : "text-[#737373] hover:text-[#171717] hover:bg-[#EAEAEA]"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <List className="w-4 h-4" />
            <span>Daftar Lokasi</span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#E5E5E5] text-[#737373] font-normal">
            {locationCount}
          </span>
        </button>

        {/* Menu: Tambah Lokasi */}
        <button
          onClick={() => onSelectTab && onSelectTab("add")}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition text-left ${
            activeTab === "add"
              ? "bg-white text-[#171717] shadow-sm border border-[#E5E5E5]"
              : "text-[#737373] hover:text-[#171717] hover:bg-[#EAEAEA]"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <PlusCircle className="w-4 h-4" />
            <span>Tambah Lokasi</span>
          </div>
          {activeTab === "add" && <span className="w-1.5 h-1.5 rounded-full bg-[#171717]" />}
        </button>

        {/* Menu: Pengaturan (Font Size dsb) */}
        <button
          onClick={() => onSelectTab && onSelectTab("settings")}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition text-left ${
            activeTab === "settings"
              ? "bg-white text-[#171717] shadow-sm border border-[#E5E5E5]"
              : "text-[#737373] hover:text-[#171717] hover:bg-[#EAEAEA]"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Settings className="w-4 h-4" />
            <span>Pengaturan</span>
          </div>
          {activeTab === "settings" && <span className="w-1.5 h-1.5 rounded-full bg-[#171717]" />}
        </button>

        {/* Menu: Panduan */}
        <button
          onClick={() => onSelectTab && onSelectTab("guide")}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition text-left ${
            activeTab === "guide"
              ? "bg-white text-[#171717] shadow-sm border border-[#E5E5E5]"
              : "text-[#737373] hover:text-[#171717] hover:bg-[#EAEAEA]"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-4 h-4" />
            <span>Panduan</span>
          </div>
          {activeTab === "guide" && <span className="w-1.5 h-1.5 rounded-full bg-[#171717]" />}
        </button>
      </nav>
    </aside>
  );
}
