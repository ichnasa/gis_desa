import { Map, List, PlusCircle, Settings, BookOpen, SlidersHorizontal, FileSpreadsheet, LogIn, LogOut, UserCheck, X } from "lucide-react";

export type SidebarTab = "map" | "data" | "add" | "import" | "settings" | "guide";

export interface SidebarProps {
  activeTab?: SidebarTab;
  onSelectTab?: (tab: SidebarTab) => void;
  locationCount?: number;
  onResetMap?: () => void;
  advancedMode?: boolean;
  onToggleAdvancedMode?: () => void;
  // Email operator yang sedang masuk; null = pengunjung umum (hanya lihat)
  operatorEmail?: string | null;
  onLogin?: () => void;
  onLogout?: () => void;
  // Layar HP: sidebar tampil sebagai drawer yang bisa dibuka/tutup
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({
  activeTab = "map",
  onSelectTab,
  locationCount = 5,
  onResetMap,
  advancedMode = false,
  onToggleAdvancedMode,
  operatorEmail = null,
  onLogin,
  onLogout,
  isMobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const canEdit = !!operatorEmail;
  return (
    <>
      {/* Latar gelap drawer (HP) */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-[1590] bg-black/40 md:hidden animate-fadeIn"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}
      <aside
        id="tour-sidebar"
        className={`fixed inset-y-0 left-0 z-[1600] w-64 max-w-[85vw] h-full bg-[#F5F5F5] border-r border-[#E5E5E5] flex flex-col text-[#171717] select-none flex-shrink-0 transition-transform duration-300 md:static md:z-30 md:translate-x-0 ${
          isMobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* 1. Header Aplikasi Monochrome */}
        <div className="p-4 border-b border-[#E5E5E5] flex items-center gap-3 bg-white">
          <img
            src="/logo_desa_pekauman_ulu.png"
            alt="Logo Desa Pekauman Ulu"
            className="w-7 h-9 object-contain flex-shrink-0"
          />
          <div className="min-w-0">
            <h1 className="font-semibold text-sm leading-tight text-[#171717] truncate">Peta Pekauman Ulu</h1>
            <p className="text-xs text-[#737373] mt-0.5 truncate">Kec. Martapura Timur</p>
          </div>
          <button
            onClick={onCloseMobile}
            className="ml-auto p-1.5 rounded-md text-[#737373] hover:text-[#171717] hover:bg-[#F5F5F5] md:hidden"
            title="Tutup menu"
          >
            <X className="w-4 h-4" />
          </button>
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

          {/* Menu khusus operator */}
          {canEdit && (
            <>
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

              {/* Menu: Import Data Rumah dari Excel */}
              <button
                onClick={() => onSelectTab && onSelectTab("import")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition text-left ${
                  activeTab === "import"
                    ? "bg-white text-[#171717] shadow-sm border border-[#E5E5E5]"
                    : "text-[#737373] hover:text-[#171717] hover:bg-[#EAEAEA]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Import Data</span>
                </div>
                {activeTab === "import" && <span className="w-1.5 h-1.5 rounded-full bg-[#171717]" />}
              </button>
            </>
          )}

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

        {/* 3. Status Operator: masuk / keluar */}
        <div className="px-3 pt-3 border-t border-[#E5E5E5]">
          {canEdit ? (
            <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-white border border-[#E5E5E5]">
              <div className="flex items-center gap-2 min-w-0">
                <UserCheck className="w-4 h-4 text-[#2E9E5B] flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-[11px] text-[#737373] leading-tight">Operator</div>
                  <div className="text-xs font-medium truncate" title={operatorEmail ?? ""}>
                    {operatorEmail}
                  </div>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 rounded text-[#737373] hover:text-[#171717] hover:bg-[#F5F5F5] transition"
                title="Keluar"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-[#737373] hover:text-[#171717] hover:bg-[#EAEAEA] transition text-left"
            >
              <LogIn className="w-4 h-4" />
              <span>Masuk Operator</span>
            </button>
          )}
        </div>

        {/* 4. Toggle Mode Lanjutan (tool GIS ala QGIS) */}
        <div id="tour-advanced-toggle" className="p-3">
          <button
            onClick={onToggleAdvancedMode}
            role="switch"
            aria-checked={advancedMode}
            className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium text-[#737373] hover:text-[#171717] hover:bg-[#EAEAEA] transition text-left"
            title="Tampilkan tool GIS lanjutan: properti layer, status bar koordinat & skala, atribut lengkap"
          >
            <div className="flex items-center gap-2.5">
              <SlidersHorizontal className="w-4 h-4" />
              <span>Mode Lanjutan</span>
            </div>
            <span
              className={`relative w-8 h-[18px] rounded-full transition ${advancedMode ? "bg-[#171717]" : "bg-[#D4D4D4]"}`}
            >
              <span
                className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-all ${
                  advancedMode ? "left-[16px]" : "left-[2px]"
                }`}
              />
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
