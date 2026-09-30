import { useState, useRef, useEffect } from "react";
import "leaflet/dist/leaflet.css";
import Sidebar, { type SidebarTab } from "./components/Sidebar";
import PekaumanVillageMap, { KANTOR_DESA } from "./components/PekaumanVillageMap";
import FloatingBar from "./components/FloatingBar";
import CrudSidebar, { INITIAL_LOCATIONS } from "./components/CrudSidebar";
import SettingsModal from "./components/SettingsModal";
import NewPointModal from "./components/NewPointModal";
import type { GisLocation, GisDrawMode, LayerVisibility, DrawingStyle } from "./types/gis";

function App() {
  const [locations, setLocations] = useState<GisLocation[]>(INITIAL_LOCATIONS);
  const [selectedLocation, setSelectedLocation] = useState<GisLocation | null>(null);
  const [navTab, setNavTab] = useState<SidebarTab>("map");
  const [activeDrawMode, setActiveDrawMode] = useState<GisDrawMode>("select");
  const [editingLocation, setEditingLocation] = useState<GisLocation | null>(null);
  const [newPointModalCoords, setNewPointModalCoords] = useState<{ lat: number; lng: number } | null>(null);

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

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontScale * 100}%`;
    try {
      localStorage.setItem("gis_font_scale", fontScale.toString());
    } catch {
      // ignore
    }
  }, [fontScale]);

  const [drawingState, setDrawingState] = useState<{
    isDrawing: boolean;
    pointCount: number;
    measuredResult: string | null;
  }>({
    isDrawing: false,
    pointCount: 0,
    measuredResult: null,
  });

  const [drawingStyle, setDrawingStyle] = useState<DrawingStyle>({
    strokeColor: "#FFFFFF",
    fillColor: "#FFFFFF",
    fillOpacity: 0.3,
    strokeWeight: 2.5,
  });

  const [layerVisibility] = useState<LayerVisibility>({
    satelliteLayer: true,
    villageBoundary: true,
    maskOverlay: true,
    pointMarkers: true,
    labels: true,
  });

  const finishDrawingRef = useRef<(() => void) | null>(null);
  const undoPointRef = useRef<(() => void) | null>(null);
  const clearAllRef = useRef<(() => void) | null>(null);

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
      <Sidebar
        activeTab={navTab}
        onSelectTab={(tab) => {
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
          onRequestNewPoint={(coords) => setNewPointModalCoords(coords)}
          onModeChange={(mode) => setActiveDrawMode(mode)}
          onDrawingStateChange={(state) => setDrawingState(state)}
          finishDrawingRef={finishDrawingRef}
          undoPointRef={undoPointRef}
          clearAllRef={clearAllRef}
        />

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

      {isDataPanelOpen && (
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
            setNavTab("map");
          }}
        />
      )}

      <NewPointModal
        isOpen={newPointModalCoords !== null}
        coords={newPointModalCoords}
        onClose={() => setNewPointModalCoords(null)}
        onSave={(newLoc) => {
          handleAddLocation(newLoc);
          setNewPointModalCoords(null);
        }}
      />

      <SettingsModal
        isOpen={navTab === "settings"}
        onClose={() => setNavTab("map")}
        fontScale={fontScale}
        onFontScaleChange={(scale) => setFontScale(scale)}
      />
    </div>
  );
}

export default App;
