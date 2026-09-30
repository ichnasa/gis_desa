import { useState, useRef, useEffect } from "react";
import "leaflet/dist/leaflet.css";
import GuidedTour from "./components/GuidedTour";
import Sidebar, { type SidebarTab } from "./components/Sidebar";
import PekaumanVillageMap, { KANTOR_DESA } from "./components/PekaumanVillageMap";
import FloatingBar from "./components/FloatingBar";
import CrudSidebar, { INITIAL_LOCATIONS } from "./components/CrudSidebar";
import SettingsModal from "./components/SettingsModal";
import NewPointModal from "./components/NewPointModal";
import type { GisLocation, GisDrawMode, LayerVisibility, DrawingStyle } from "./types/gis";

function App() {
  // 1. Data Spasial Titik Lokasi
  const [locations, setLocations] = useState<GisLocation[]>(INITIAL_LOCATIONS);
  const [selectedLocation, setSelectedLocation] = useState<GisLocation | null>(null);

  // 2. Mode Navigasi Tab Utama di Sidebar
  const [navTab, setNavTab] = useState<SidebarTab>("map");

  // State khusus Guided Tour agar tidak terpengaruh perubahan navTab
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isDataPanelOpenOverride, setIsDataPanelOpenOverride] = useState(false);
  // State untuk edit titik dari popover peta ke sidebar kanan
  const [editingLocation, setEditingLocation] = useState<GisLocation | null>(null);

  // State untuk modal input informasi saat titik baru ditambahkan via floating bar
  const [newPointModalCoords, setNewPointModalCoords] = useState<{ lat: number; lng: number } | null>(null);

  // 3. Pengaturan Skala Ukuran Font UI (0.8 hingga 1.5)
  const [fontScale, setFontScale] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("gis_font_scale");
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= 0.8 && parsed <= 1.5) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return 1.0;
  });

  // Terapkan ukuran font dinamis pada root dokumen secara real-time
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontScale * 100}%`;
    try {
      localStorage.setItem("gis_font_scale", fontScale.toString());
    } catch {
      // ignore
    }
  }, [fontScale]);

  // 4. Mode Menggambar di Peta
  const [activeDrawMode, setActiveDrawMode] = useState<GisDrawMode>("select");
  const [drawingState, setDrawingState] = useState<{
    isDrawing: boolean;
    pointCount: number;
    measuredResult: string | null;
  }>({
    isDrawing: false,
    pointCount: 0,
    measuredResult: null,
  });

  // 5. Drawing Style State (Color Pickers untuk Outline dan Inner)
  const [drawingStyle, setDrawingStyle] = useState<DrawingStyle>({
    strokeColor: "#171717",
    fillColor: "#171717",
    fillOpacity: 0.25,
    strokeWeight: 2.5,
  });

  // 6. Visibilitas Layer Peta
  const [layerVisibility] = useState<LayerVisibility>({
    satelliteLayer: true,
    villageBoundary: true,
    maskOverlay: true,
    pointMarkers: true,
    labels: true,
  });

  // 7. Action Refs untuk FloatingBar (Undo, Finish, ClearAll)
  const finishDrawingRef = useRef<(() => void) | null>(null);
  const undoPointRef = useRef<(() => void) | null>(null);
  const clearAllRef = useRef<(() => void) | null>(null);

  // Handler CRUD
  const handleAddLocation = (newLoc: GisLocation) => {
    setLocations((prev) => [newLoc, ...prev]);
    setSelectedLocation(newLoc);
  };

  const handleUpdateLocation = (updated: GisLocation) => {
    setLocations((prev) => prev.map((loc) => (loc.id === updated.id ? updated : loc)));
    if (selectedLocation?.id === updated.id) {
      setSelectedLocation(updated);
    }
    setEditingLocation(null);
  };

  const handleDeleteLocation = (id: string) => {
    setLocations((prev) => prev.filter((loc) => loc.id !== id));
    if (selectedLocation?.id === id) {
      setSelectedLocation(null);
    }
    if (editingLocation?.id === id) {
      setEditingLocation(null);
    }
  };

  const isDataPanelOpen = navTab === "data" || navTab === "add";

  return (
    <div className="flex flex-row h-screen w-screen overflow-hidden bg-[#F5F5F5] text-[#171717] font-sans antialiased">
      {/* 1. Left Navigation Sidebar */}
      <Sidebar
        activeTab={isTourOpen ? "guide" : navTab}
        onSelectTab={(tab) => {
          if (tab === "guide") {
            setIsTourOpen(true);
            return;
          }
          if (tab !== "add") setEditingLocation(null);
          setNavTab(tab);
        }}
        locationCount={locations.length}
        onResetMap={() => {
          setSelectedLocation({
            id: "kantor-desa",
            name: "Kantor Desa Pekauman Ulu",
            category: "pemerintahan",
            lat: KANTOR_DESA[0],
            lng: KANTOR_DESA[1],
            address: "Jl. Martapura Lama RT 02",
            createdAt: "2026-01-01",
          });
        }}
      />

      {/* 2. Map Workspace (Main Area) */}
      <main className="flex-1 h-full relative overflow-hidden flex flex-col">
        <PekaumanVillageMap
          locations={locations}
          selectedLocation={selectedLocation}
          activeDrawMode={activeDrawMode}
          layerVisibility={layerVisibility}
          drawingStyle={drawingStyle}
          onAddLocation={handleAddLocation}
          onDeleteLocation={handleDeleteLocation}
          onSelectLocation={(loc) => setSelectedLocation(loc)}
          onStartEditLocation={(loc) => {
            setEditingLocation(loc);
            setNavTab("add");
          }}
          onRequestNewPoint={(coords) => {
            setNewPointModalCoords(coords);
          }}
          onModeChange={(mode) => setActiveDrawMode(mode)}
          onDrawingStateChange={(state) => setDrawingState(state)}
          finishDrawingRef={finishDrawingRef}
          undoPointRef={undoPointRef}
          clearAllRef={clearAllRef}
        />

        {/* Toolbar Gambar Melayang (FloatingBar di Bawah Tengah) */}
        <FloatingBar
          activeMode={activeDrawMode}
          onChangeMode={(mode) => setActiveDrawMode(mode)}
          isDrawing={drawingState.isDrawing}
          pointCount={drawingState.pointCount}
          measuredResult={drawingState.measuredResult}
          drawingStyle={drawingStyle}
          onUpdateDrawingStyle={(style) => setDrawingStyle(style)}
          onFinishDrawing={() => finishDrawingRef.current?.()}
          onUndoPoint={() => undoPointRef.current?.()}
          onCancelDrawing={() => {
            setActiveDrawMode("select");
            setDrawingState({ isDrawing: false, pointCount: 0, measuredResult: null });
          }}
          onClearAll={() => clearAllRef.current?.()}
        />
      </main>

      {/* 3. Panel Informasi & Data Lokasi (Buka saat tab Data / Tambah / Edit dipilih atau saat Guided Tour langkah ke-5) */}
      {(isDataPanelOpen || isDataPanelOpenOverride) && (
        <CrudSidebar
          locations={locations}
          onSelectLocation={(loc) => setSelectedLocation(loc)}
          onAddLocation={handleAddLocation}
          onUpdateLocation={handleUpdateLocation}
          onDeleteLocation={handleDeleteLocation}
          editingLocation={editingLocation}
          onCancelEdit={() => setEditingLocation(null)}
          activeTab={navTab === "add" ? "form" : "list"}
          onChangeTab={(tab) => {
            if (tab === "form") setNavTab("add");
            else {
              setEditingLocation(null);
              setNavTab("data");
            }
          }}
          onClose={() => {
            setEditingLocation(null);
            setIsDataPanelOpenOverride(false);
            setNavTab("map");
          }}
        />
      )}

      {/* 4. Modal Input Informasi Saat Tambah Titik via Floating Bar */}
      <NewPointModal
        isOpen={newPointModalCoords !== null}
        coords={newPointModalCoords}
        onClose={() => setNewPointModalCoords(null)}
        onSave={(newLoc) => {
          handleAddLocation(newLoc);
          setNewPointModalCoords(null);
        }}
      />

      {/* 5. Modal Pengaturan Skala Font UI (0.8 - 1.5) */}
      <SettingsModal
        isOpen={navTab === "settings"}
        onClose={() => setNavTab("map")}
        fontScale={fontScale}
        onFontScaleChange={(scale) => setFontScale(scale)}
      />

      {/* 6. Guided Tour Interaktif Langkah Demi Langkah */}
      <GuidedTour
        isOpen={isTourOpen}
        onClose={() => {
          setIsTourOpen(false);
          setIsDataPanelOpenOverride(false);
        }}
        onEnsureSidebarOpen={() => setIsDataPanelOpenOverride(true)}
      />
    </div>
  );
}

export default App;
