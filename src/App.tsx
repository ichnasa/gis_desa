import { useState, useEffect, useMemo } from "react";
import type { Session } from "@supabase/supabase-js";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import GuidedTour from "./components/GuidedTour";
import Sidebar, { type SidebarTab } from "./components/Sidebar";
import PekaumanVillageMap from "./components/PekaumanVillageMap";
import FloatingBar from "./components/FloatingBar";
import CrudSidebar from "./components/CrudSidebar";
import SettingsModal from "./components/SettingsModal";
import NewPointModal from "./components/NewPointModal";
import LayersPanel from "./components/LayersPanel";
import IdentifyPanel from "./components/IdentifyPanel";
import StatusBar from "./components/StatusBar";
import MapControls from "./components/MapControls";
import MapSearch from "./components/MapSearch";
import ImportModal, { type ImportMode } from "./components/ImportModal";
import LoginModal from "./components/LoginModal";
import Toast, { type ToastMessage } from "./components/Toast";
import MoveLocationBar from "./components/MoveLocationBar";
import { distanceMeters, pointInGeometry } from "./lib/geo";
import type { GisLocation, GisDrawMode, DrawingStyle, GisLayer, IdentifiedFeature } from "./types/gis";
import {
  INITIAL_LAYERS,
  KANTOR_DESA,
  LOKASI_LAYER_ID,
  BATAS_DESA_LAYER_ID,
  RUMAH_LAYER_ID,
  createRumahLayer,
  locationsToFeatureCollection,
} from "./lib/layers";
import type { ImportResult } from "./lib/importRumah";
import type { FeatureCollection, Point } from "geojson";
import type { RumahProperties } from "./lib/importRumah";
import { supabase } from "./lib/supabase";
import * as api from "./lib/api";

const errorMessage = (err: unknown) => (err instanceof Error ? err.message : String(err));

// Sisipkan / perbarui / buang layer Rumah Warga sesuai data dari database
function upsertRumahLayer(prev: GisLayer[], data: FeatureCollection<Point, RumahProperties>): GisLayer[] {
  const existing = prev.find((l) => l.id === RUMAH_LAYER_ID);
  if (data.features.length === 0) return existing ? prev.filter((l) => l.id !== RUMAH_LAYER_ID) : prev;
  const next = createRumahLayer(data);
  if (existing) {
    // Pertahankan visibilitas & opacity yang sudah diatur pengguna
    return prev.map((l) => (l.id === RUMAH_LAYER_ID ? { ...next, visible: l.visible, opacity: l.opacity } : l));
  }
  // Letakkan tepat di bawah Titik Lokasi
  return [prev[0], next, ...prev.slice(1)];
}

function loadBoolean(key: string): boolean {
  try {
    return localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

function App() {
  // 1. Data Spasial Titik Lokasi (dimuat dari Supabase)
  const [locations, setLocations] = useState<GisLocation[]>([]);

  // Sesi operator: tanpa login aplikasi hanya bisa dilihat
  const [session, setSession] = useState<Session | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const isOperator = session !== null;
  const userId = session?.user.id ?? null;

  useEffect(() => {
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => data.subscription.unsubscribe();
  }, []);

  // Notifikasi singkat (berhasil / gagal menyimpan)
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const showToast = (message: string, type: ToastMessage["type"] = "success") =>
    setToast({ id: Date.now(), message, type });
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), toast.type === "error" ? 7000 : 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  // 2. Mode Navigasi Tab Utama di Sidebar
  const [navTab, setNavTab] = useState<SidebarTab>("map");

  // State khusus Guided Tour agar tidak terpengaruh perubahan navTab
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isDataPanelOpenOverride, setIsDataPanelOpenOverride] = useState(false);
  // State untuk edit titik dari panel Identify ke sidebar kanan
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

  // 4. Mode Lanjutan: tampilkan tool GIS ala QGIS (properti layer, status bar, atribut mentah)
  const [advancedMode, setAdvancedMode] = useState<boolean>(() => loadBoolean("gis_advanced_mode"));
  useEffect(() => {
    try {
      localStorage.setItem("gis_advanced_mode", String(advancedMode));
    } catch {
      // ignore
    }
  }, [advancedMode]);

  // 5. Mode Menggambar di Peta
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

  // 6. Drawing Style State (Color Pickers untuk Outline dan Inner)
  const [drawingStyle, setDrawingStyle] = useState<DrawingStyle>({
    strokeColor: "#171717",
    fillColor: "#171717",
    fillOpacity: 0.25,
    strokeWeight: 2.5,
  });

  // 7. Layer Peta (Layers Panel) & hasil Identify
  const [layers, setLayers] = useState<GisLayer[]>(INITIAL_LAYERS);
  const [identified, setIdentified] = useState<IdentifiedFeature | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [rumahVersion, setRumahVersion] = useState(0);

  // Layer referensi & titik lokasi dari database
  useEffect(() => {
    let cancelled = false;
    Promise.all([api.fetchBatasDesa(), api.fetchJalan(), api.fetchBangunan(), api.fetchLokasi()])
      .then(([batas, jalan, bangunan, lokasi]) => {
        if (cancelled) return;
        const dataById: Record<string, GisLayer["data"]> = {
          [BATAS_DESA_LAYER_ID]: batas,
          masking: batas,
          jalan,
          bangunan,
        };
        setLayers((prev) => prev.map((l) => (dataById[l.id] ? { ...l, data: dataById[l.id] } : l)));
        setLocations(lokasi);
        setLoadError(null);
      })
      .catch((err) => !cancelled && setLoadError(errorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  // Rumah warga dimuat ulang saat login/logout (kontak UMKM hanya untuk operator) dan setelah import
  useEffect(() => {
    let cancelled = false;
    api
      .fetchRumahWarga(userId !== null)
      .then((data) => !cancelled && setLayers((prev) => upsertRumahLayer(prev, data)))
      .catch((err) => !cancelled && setLoadError(errorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, [userId, rumahVersion, reloadKey]);

  // Layer Titik Lokasi selalu diturunkan dari state locations
  const locationsFC = useMemo(() => locationsToFeatureCollection(locations), [locations]);
  const mapLayers = useMemo(
    () => layers.map((l) => (l.id === LOKASI_LAYER_ID ? { ...l, data: locationsFC } : l)),
    [layers, locationsFC]
  );

  // Fitur hasil Identify diambil ulang dari data terbaru supaya ikut ter-update setelah edit/pindah/hapus
  const currentIdentified = useMemo(() => {
    if (!identified || identified.feature.id === undefined) return identified;
    const data = mapLayers.find((l) => l.id === identified.layerId)?.data;
    if (!data) return identified;
    const feature = data.features.find((f) => f.id === identified.feature.id);
    return feature ? { layerId: identified.layerId, feature } : null;
  }, [identified, mapLayers]);
  const identifiedLayer = currentIdentified ? mapLayers.find((l) => l.id === currentIdentified.layerId) : undefined;

  // Batas wilayah desa untuk validasi koordinat import
  const villageBounds = useMemo(() => {
    const data = layers.find((l) => l.id === BATAS_DESA_LAYER_ID)?.data;
    if (!data) return null;
    const b = L.geoJSON(data).getBounds();
    return { minLat: b.getSouth(), maxLat: b.getNorth(), minLng: b.getWest(), maxLng: b.getEast() };
  }, [layers]);

  const rumahLayer = layers.find((l) => l.id === RUMAH_LAYER_ID);

  const handleImport = async (result: ImportResult, mode: ImportMode) => {
    try {
      const count = await api.importRumahWarga(result.data.features, mode);
      if (identified?.layerId === RUMAH_LAYER_ID) setIdentified(null);
      setRumahVersion((v) => v + 1);
      fitToData(result.data);
      showToast(`${count.toLocaleString("id-ID")} rumah tersimpan ke database.`);
    } catch (err) {
      showToast(errorMessage(err), "error");
    }
  };

  const removeLayer = async (id: string) => {
    const layer = layers.find((l) => l.id === id);
    if (!layer || id !== RUMAH_LAYER_ID) return;
    const count = layer.data?.features.length ?? 0;
    if (!window.confirm(`Hapus semua ${count} data "${layer.name}" dari database? Tindakan ini tidak bisa dibatalkan.`)) return;
    try {
      await api.importRumahWarga([], "replace");
      if (identified?.layerId === id) setIdentified(null);
      setRumahVersion((v) => v + 1);
      showToast(`Data ${layer.name} dihapus.`);
    } catch (err) {
      showToast(errorMessage(err), "error");
    }
  };

  const updateLayer = (id: string, patch: Partial<GisLayer>) => {
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const moveLayer = (id: string, direction: -1 | 1) => {
    setLayers((prev) => {
      const index = prev.findIndex((l) => l.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const fitToData = (data: GisLayer["data"] | undefined) => {
    if (!map || !data || data.features.length === 0) return;
    map.fitBounds(L.geoJSON(data).getBounds(), { padding: [40, 40], maxZoom: 19 });
  };

  const zoomToLayer = (id: string) => {
    const layer = mapLayers.find((l) => l.id === id);
    // Basemap tidak punya extent sendiri, pakai extent desa
    fitToData(layer?.render === "tile" ? mapLayers.find((l) => l.id === BATAS_DESA_LAYER_ID)?.data : layer?.data);
  };

  const zoomToFeature = (result: IdentifiedFeature) => {
    if (!map) return;
    if (result.feature.geometry.type === "Point") {
      const [lng, lat] = result.feature.geometry.coordinates;
      map.flyTo([lat, lng], 19, { duration: 1.0 });
    } else {
      map.flyToBounds(L.geoJSON(result.feature).getBounds(), { padding: [60, 60], maxZoom: 20, duration: 1.0 });
    }
  };

  // Pilih titik lokasi dari daftar / pencarian: buka di Identify & terbang ke sana
  const selectLocation = (loc: GisLocation) => {
    const feature = locationsFC.features.find((f) => f.id === loc.id);
    const result = feature ? { layerId: LOKASI_LAYER_ID, feature } : null;
    setIdentified(result);
    if (result) zoomToFeature(result);
  };

  // Handler CRUD: simpan ke database dulu, baru perbarui tampilan
  const handleAddLocation = async (newLoc: GisLocation) => {
    try {
      await api.insertLokasi(newLoc);
      setLocations((prev) => [newLoc, ...prev]);
      setIdentified({
        layerId: LOKASI_LAYER_ID,
        feature: { type: "Feature", id: newLoc.id, properties: {}, geometry: { type: "Point", coordinates: [newLoc.lng, newLoc.lat] } },
      });
      showToast(`"${newLoc.name}" tersimpan.`);
    } catch (err) {
      showToast(errorMessage(err), "error");
    }
  };

  const handleUpdateLocation = async (updated: GisLocation) => {
    try {
      await api.updateLokasi(updated);
      setLocations((prev) => prev.map((loc) => (loc.id === updated.id ? updated : loc)));
      setEditingLocation(null);
      showToast(`Perubahan "${updated.name}" tersimpan.`);
    } catch (err) {
      showToast(errorMessage(err), "error");
    }
  };

  const handleDeleteLocation = async (id: string) => {
    try {
      await api.deleteLokasi(id);
      setLocations((prev) => prev.filter((loc) => loc.id !== id));
      if (editingLocation?.id === id) setEditingLocation(null);
      showToast("Lokasi dihapus.");
    } catch (err) {
      showToast(errorMessage(err), "error");
    }
  };

  // Mode pindah titik (Titik Lokasi & Rumah Warga): digeser di peta, lalu koordinat baru disimpan
  const MOVABLE_LAYERS = [LOKASI_LAYER_ID, RUMAH_LAYER_ID];
  const [moving, setMoving] = useState<{
    layerId: string;
    id: string;
    name: string;
    original: { lat: number; lng: number };
    current: { lat: number; lng: number };
  } | null>(null);
  const [isSavingMove, setIsSavingMove] = useState(false);

  const startMove = (result: IdentifiedFeature) => {
    const { feature, layerId } = result;
    if (feature.geometry.type !== "Point" || feature.id === undefined) return;
    const layer = mapLayers.find((l) => l.id === layerId);
    const [lng, lat] = feature.geometry.coordinates;
    const title = layer?.titleField ? feature.properties?.[layer.titleField] : null;
    // Pastikan layer terlihat & tidak sedang mode Tambah Titik
    updateLayer(layerId, { visible: true });
    setActiveDrawMode("select");
    setMoving({
      layerId,
      id: String(feature.id),
      name: title ? String(title) : layer?.name ?? "Titik",
      original: { lat, lng },
      current: { lat, lng },
    });
    map?.flyTo([lat, lng], Math.max(map.getZoom(), 19), { duration: 0.8 });
  };

  const cancelMoveLocation = () => setMoving(null);

  const saveMoveLocation = async () => {
    if (!moving) return;
    const { layerId, id, name, current } = moving;
    setIsSavingMove(true);
    try {
      if (layerId === LOKASI_LAYER_ID) {
        const loc = locations.find((l) => l.id === id);
        if (!loc) throw new Error("Lokasi tidak ditemukan.");
        const updated = { ...loc, lat: current.lat, lng: current.lng };
        await api.updateLokasi(updated);
        setLocations((prev) => prev.map((l) => (l.id === id ? updated : l)));
      } else if (layerId === RUMAH_LAYER_ID) {
        await api.updateRumahPosition(id, current.lat, current.lng);
        // Perbarui data layer di tempat, tanpa memuat ulang semua rumah
        setLayers((prev) =>
          prev.map((l) =>
            l.id === RUMAH_LAYER_ID && l.data
              ? {
                  ...l,
                  data: {
                    ...l.data,
                    features: l.data.features.map((f) =>
                      f.id === id ? { ...f, geometry: { type: "Point" as const, coordinates: [current.lng, current.lat] } } : f
                    ),
                  },
                }
              : l
          )
        );
      }
      setMoving(null);
      showToast(`Posisi "${name}" diperbarui.`);
    } catch (err) {
      showToast(errorMessage(err), "error");
    } finally {
      setIsSavingMove(false);
    }
  };

  // Esc membatalkan mode pindah
  useEffect(() => {
    if (!moving) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoving(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [moving]);

  const batasDesaGeometry = layers.find((l) => l.id === BATAS_DESA_LAYER_ID)?.data?.features[0]?.geometry;
  const isMoveOutsideVillage =
    !!moving && !!batasDesaGeometry && !pointInGeometry(moving.current.lat, moving.current.lng, batasDesaGeometry);

  const handleLogout = async () => {
    await supabase?.auth.signOut();
    setMoving(null);
    setEditingLocation(null);
    setActiveDrawMode("select");
    if (navTab === "add" || navTab === "import") setNavTab("map");
    showToast("Anda telah keluar.");
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
        onResetMap={() => map?.flyTo(KANTOR_DESA, 18, { duration: 1.0 })}
        advancedMode={advancedMode}
        onToggleAdvancedMode={() => setAdvancedMode((v) => !v)}
        operatorEmail={session?.user.email ?? null}
        onLogin={() => setIsLoginOpen(true)}
        onLogout={handleLogout}
      />

      {/* 2. Map Workspace (Main Area) */}
      <main className="flex-1 h-full relative overflow-hidden flex flex-col">
        <div id="tour-map" className="relative flex-1 overflow-hidden">
          <PekaumanVillageMap
            layers={mapLayers}
            identified={currentIdentified}
            activeDrawMode={activeDrawMode}
            onIdentify={setIdentified}
            onRequestNewPoint={(coords) => setNewPointModalCoords(coords)}
            onMapReady={setMap}
            movingFeatureId={moving?.id ?? null}
            movingPosition={moving?.current ?? null}
            onMovePosition={(current) => setMoving((prev) => (prev ? { ...prev, current } : prev))}
          />

          <MapSearch locations={locations} onSelect={selectLocation} />

          <LayersPanel
            layers={mapLayers}
            advanced={advancedMode}
            onToggleVisible={(id) => {
              const layer = layers.find((l) => l.id === id);
              if (layer) updateLayer(id, { visible: !layer.visible });
            }}
            onChangeOpacity={(id, opacity) => updateLayer(id, { opacity })}
            onMove={moveLayer}
            onZoomToLayer={zoomToLayer}
            onRemove={isOperator ? removeLayer : undefined}
          />

          <MapControls
            map={map}
            onHome={() => map?.flyTo(KANTOR_DESA, 18, { duration: 1.0 })}
            onZoomFull={() => zoomToLayer(BATAS_DESA_LAYER_ID)}
          />

          {moving && (
            <MoveLocationBar
              name={moving.name}
              current={moving.current}
              movedMeters={distanceMeters(moving.original, moving.current)}
              isOutsideVillage={isMoveOutsideVillage}
              isSaving={isSavingMove}
              onSave={saveMoveLocation}
              onCancel={cancelMoveLocation}
            />
          )}

          {currentIdentified && identifiedLayer && !moving && (
            <IdentifyPanel
              identified={currentIdentified}
              layer={identifiedLayer}
              advanced={advancedMode}
              onClose={() => setIdentified(null)}
              onZoomToFeature={() => zoomToFeature(currentIdentified)}
              onEditLocation={
                isOperator
                  ? (id) => {
                      const loc = locations.find((l) => l.id === id);
                      if (!loc) return;
                      setEditingLocation(loc);
                      setNavTab("add");
                    }
                  : undefined
              }
              onMoveFeature={
                isOperator && MOVABLE_LAYERS.includes(currentIdentified.layerId)
                  ? () => startMove(currentIdentified)
                  : undefined
              }
              onDeleteLocation={
                isOperator
                  ? (id) => {
                      const loc = locations.find((l) => l.id === id);
                      if (loc && window.confirm(`Hapus "${loc.name}" dari database?`)) handleDeleteLocation(id);
                    }
                  : undefined
              }
            />
          )}

          {/* Gagal memuat data dari Supabase */}
          {loadError && (
            <div
              role="alert"
              className="absolute top-4 left-1/2 -translate-x-1/2 z-[1500] max-w-md flex items-start gap-3 px-4 py-3 bg-white border border-[#F5D0CE] rounded-lg shadow-md text-xs"
            >
              <div className="flex-1 text-[#D44C47] leading-relaxed">{loadError}</div>
              <button
                onClick={() => {
                  setLoadError(null);
                  setReloadKey((k) => k + 1);
                }}
                className="flex-shrink-0 px-2.5 py-1 font-medium bg-[#171717] text-white rounded hover:bg-[#262626] transition"
              >
                Coba lagi
              </button>
            </div>
          )}

          <Toast toast={toast} onClose={() => setToast(null)} />

          {/* Toolbar Gambar Melayang (FloatingBar di Bawah Tengah), khusus operator */}
          {isOperator && (
            <FloatingBar
              activeMode={activeDrawMode}
              onChangeMode={(mode) => setActiveDrawMode(mode)}
              isDrawing={drawingState.isDrawing}
              pointCount={drawingState.pointCount}
              measuredResult={drawingState.measuredResult}
              drawingStyle={drawingStyle}
              onUpdateDrawingStyle={(style) => setDrawingStyle(style)}
              onCancelDrawing={() => {
                setActiveDrawMode("select");
                setDrawingState({ isDrawing: false, pointCount: 0, measuredResult: null });
              }}
            />
          )}
        </div>

        {/* Status Bar ala QGIS (Mode Lanjutan) */}
        {advancedMode && <StatusBar map={map} />}
      </main>

      {/* 3. Panel Informasi & Data Lokasi (Buka saat tab Data / Tambah / Edit dipilih atau saat Guided Tour langkah ke-5) */}
      {(isDataPanelOpen || isDataPanelOpenOverride) && (
        <CrudSidebar
          locations={locations}
          onSelectLocation={selectLocation}
          onAddLocation={handleAddLocation}
          onUpdateLocation={handleUpdateLocation}
          onDeleteLocation={handleDeleteLocation}
          editingLocation={editingLocation}
          onCancelEdit={() => setEditingLocation(null)}
          canEdit={isOperator}
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

      {/* Modal Import Data Rumah dari Excel */}
      <ImportModal
        isOpen={navTab === "import" && isOperator}
        onClose={() => setNavTab("map")}
        villageBounds={villageBounds}
        existingCount={rumahLayer?.data?.features.length ?? 0}
        onImport={handleImport}
      />

      {/* Modal Masuk Operator */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
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
        isOperator={isOperator}
      />
    </div>
  );
}

export default App;
