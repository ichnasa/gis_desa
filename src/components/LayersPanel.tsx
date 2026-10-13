import { useState } from "react";
import {
  Layers,
  ChevronDown,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ScanSearch,
  MapPin,
  Spline,
  Hexagon,
  Image,
  Loader2,
  Trash2,
} from "lucide-react";
import type { GisLayer } from "../types/gis";

export interface LayersPanelProps {
  layers: GisLayer[];
  advanced: boolean;
  onToggleVisible: (id: string) => void;
  onChangeOpacity: (id: string, opacity: number) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onZoomToLayer: (id: string) => void;
  // Tidak diisi = tombol hapus layer disembunyikan (pengunjung umum)
  onRemove?: (id: string) => void;
}

const GEOMETRY_ICONS = {
  Point: MapPin,
  LineString: Spline,
  Polygon: Hexagon,
  Raster: Image,
};

// Simbol kecil di samping nama layer (seperti legend di Layers Panel QGIS)
function LayerSymbol({ layer }: { layer: GisLayer }) {
  if (!layer.style) {
    const Icon = GEOMETRY_ICONS[layer.geometryType];
    return <Icon className="w-3.5 h-3.5 text-[#525252] flex-shrink-0" />;
  }
  const { strokeColor, strokeWeight, fillColor, fillOpacity, dashArray } = layer.style;
  if (layer.geometryType === "Point") {
    return (
      <span
        className="w-2.5 h-2.5 mx-0.5 rounded-full flex-shrink-0"
        style={{ border: `1.5px solid ${strokeColor}`, backgroundColor: fillColor }}
      />
    );
  }
  if (layer.geometryType === "LineString") {
    return <span className="w-3.5 h-[3px] rounded-full flex-shrink-0" style={{ backgroundColor: strokeColor }} />;
  }
  // Garis putih / tanpa garis tidak terlihat di atas panel putih, pakai abu-abu
  const borderColor = strokeWeight === 0 || strokeColor === "#FFFFFF" ? "#A3A3A3" : strokeColor;
  return (
    <span
      className="w-3.5 h-3.5 rounded-[3px] flex-shrink-0"
      style={{
        border: `1.5px ${dashArray ? "dashed" : "solid"} ${borderColor}`,
        backgroundColor: fillOpacity > 0 ? fillColor : "transparent",
      }}
    />
  );
}

export default function LayersPanel({
  layers,
  advanced,
  onToggleVisible,
  onChangeOpacity,
  onMove,
  onZoomToLayer,
  onRemove,
}: LayersPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div id="tour-layers-panel" className="absolute top-16 left-4 z-[500] w-72 sm:w-80 bg-white rounded-lg shadow-sm border border-[#E5E5E5] text-[#171717] select-none overflow-hidden">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-[#F5F5F5] transition"
      >
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Layers className="w-4 h-4" />
          <span>{advanced ? "Panel Layer" : "Layer"}</span>
        </div>
        {isOpen ? <ChevronDown className="w-4 h-4 text-[#737373]" /> : <ChevronRight className="w-4 h-4 text-[#737373]" />}
      </button>

      {isOpen && (
        <ul className="border-t border-[#E5E5E5] max-h-[50vh] overflow-y-auto py-1">
          {layers.map((layer, index) => {
            const isLoading = layer.render !== "tile" && !layer.data;
            const isTile = layer.render === "tile";
            const isExpanded = advanced && expandedId === layer.id;
            const featureCount = layer.data?.features.length;

            return (
              <li key={layer.id} className="px-2">
                <div className="group flex items-center gap-2 px-1 py-1.5 rounded-md hover:bg-[#F5F5F5]">
                  {advanced && (
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : layer.id)}
                      className="text-[#737373] hover:text-[#171717]"
                      title="Properti layer"
                    >
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                  )}

                  <input
                    type="checkbox"
                    checked={layer.visible}
                    onChange={() => onToggleVisible(layer.id)}
                    className="w-3.5 h-3.5 accent-[#171717] cursor-pointer"
                    aria-label={`Tampilkan ${layer.name}`}
                  />
                  <LayerSymbol layer={layer} />

                  <span className={`flex-1 min-w-0 truncate text-sm ${layer.visible ? "" : "text-[#A3A3A3]"}`}>
                    {layer.name}
                    {advanced && featureCount !== undefined && (
                      <span className="ml-1 text-xs text-[#737373]">[{featureCount.toLocaleString("id-ID")}]</span>
                    )}
                  </span>

                  {isLoading && <Loader2 className="w-3.5 h-3.5 text-[#737373] animate-spin" />}

                  {advanced && !isLoading && (
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => onZoomToLayer(layer.id)}
                        className="p-1 rounded text-[#737373] hover:text-[#171717] hover:bg-white"
                        title="Zoom ke Layer"
                      >
                        <ScanSearch className="w-3.5 h-3.5" />
                      </button>
                      {!isTile && (
                        <>
                          <button
                            onClick={() => onMove(layer.id, -1)}
                            disabled={index === 0}
                            className="p-1 rounded text-[#737373] hover:text-[#171717] hover:bg-white disabled:opacity-30"
                            title="Naikkan"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onMove(layer.id, 1)}
                            disabled={layers[index + 1]?.render === "tile" || index === layers.length - 1}
                            className="p-1 rounded text-[#737373] hover:text-[#171717] hover:bg-white disabled:opacity-30"
                            title="Turunkan"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      {layer.removable && onRemove && (
                        <button
                          onClick={() => onRemove(layer.id)}
                          className="p-1 rounded text-[#737373] hover:text-[#D44C47] hover:bg-white"
                          title="Hapus Layer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {isExpanded && (
                  <div className="ml-6 mr-1 mb-2 p-2.5 bg-[#F5F5F5] border border-[#E5E5E5] rounded-md space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-[#737373] w-14">Opacity</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={layer.opacity}
                        onChange={(e) => onChangeOpacity(layer.id, parseFloat(e.target.value))}
                        className="flex-1 h-1.5 accent-[#171717] cursor-pointer"
                      />
                      <span className="text-xs font-mono w-9 text-right">{Math.round(layer.opacity * 100)}%</span>
                    </div>
                    <div className="text-xs text-[#737373] space-y-0.5">
                      <div>
                        Geometri: <span className="text-[#171717]">{layer.geometryType}</span>
                      </div>
                      <div>
                        CRS: <span className="text-[#171717]">{isTile ? "EPSG:3857" : "EPSG:4326"}</span>
                      </div>
                      {layer.source && (
                        <div>
                          Sumber: <span className="text-[#171717]">{layer.source}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
