import { useRef, useState } from "react";
import { X, FileSpreadsheet, Upload, Download, Loader2, CheckCircle2, AlertTriangle, MinusCircle } from "lucide-react";
import {
  RUMAH_COLUMNS,
  parseRumahFile,
  downloadRumahTemplate,
  type ImportResult,
  type RowStatus,
  type VillageBounds,
} from "../lib/importRumah";

export type ImportMode = "replace" | "append";

export interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  villageBounds: VillageBounds | null;
  existingCount: number;
  onImport: (result: ImportResult, mode: ImportMode) => void;
}

const STATUS_META: Record<RowStatus, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  ok: { label: "Siap", className: "text-[#2E9E5B]", icon: CheckCircle2 },
  warning: { label: "Peringatan", className: "text-[#D99A00]", icon: AlertTriangle },
  skipped: { label: "Dilewati", className: "text-[#D44C47]", icon: MinusCircle },
};

const MAX_PREVIEW_ROWS = 300;

export default function ImportModal({ isOpen, onClose, villageBounds, existingCount, onImport }: ImportModalProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [filter, setFilter] = useState<RowStatus | "all">("all");
  const [mode, setMode] = useState<ImportMode>("replace");

  if (!isOpen) return null;

  const reset = () => {
    setResult(null);
    setError(null);
    setFilter("all");
    setMode("replace");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setIsParsing(true);
    setError(null);
    setResult(null);
    try {
      setResult(await parseRumahFile(file, villageBounds));
    } catch (err) {
      setError(err instanceof Error ? err.message : "File tidak dapat dibaca.");
    } finally {
      setIsParsing(false);
    }
  };

  const counts = result
    ? {
        ok: result.rows.filter((r) => r.status === "ok").length,
        warning: result.rows.filter((r) => r.status === "warning").length,
        skipped: result.rows.filter((r) => r.status === "skipped").length,
        umkm: result.data.features.filter((f) => f.properties.umkm).length,
      }
    : null;
  const importCount = result?.data.features.length ?? 0;
  const visibleRows = result ? result.rows.filter((r) => filter === "all" || r.status === filter) : [];

  return (
    <div className="fixed inset-0 z-[2000] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-white border border-[#E5E5E5] rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col text-[#171717]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E5E5] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#171717] text-white flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Import Data Rumah</h3>
              <p className="text-xs text-[#737373]">Dari file Excel (.xlsx, .xls) atau CSV</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-md text-[#737373] hover:text-[#171717] hover:bg-[#F5F5F5] transition"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* 1. Pilih File */}
          {!result && (
            <>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleFile(e.dataTransfer.files[0]);
                }}
                onClick={() => inputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center gap-2 cursor-pointer transition ${
                  isDragging ? "border-[#171717] bg-[#F5F5F5]" : "border-[#E5E5E5] hover:bg-[#FAFAFA]"
                }`}
              >
                {isParsing ? (
                  <Loader2 className="w-6 h-6 text-[#737373] animate-spin" />
                ) : (
                  <Upload className="w-6 h-6 text-[#737373]" />
                )}
                <div className="text-sm font-medium">
                  {isParsing ? "Membaca file..." : "Klik atau seret file Excel ke sini"}
                </div>
                <div className="text-xs text-[#737373]">Sheet pertama yang dibaca</div>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
              </div>

              {error && (
                <div className="px-3 py-2.5 text-xs text-[#D44C47] bg-[#FDF2F2] border border-[#F5D0CE] rounded-md">
                  {error}
                </div>
              )}

              <div className="p-3.5 bg-[#F5F5F5] border border-[#E5E5E5] rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium">Format kolom</div>
                  <button
                    onClick={() => downloadRumahTemplate()}
                    className="flex items-center gap-1.5 text-xs font-medium text-[#171717] hover:underline"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Unduh Template
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {RUMAH_COLUMNS.map((c) => (
                    <span key={c} className="px-2 py-0.5 text-xs bg-white border border-[#E5E5E5] rounded">
                      {c}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-[#737373]">
                  Koordinat dalam derajat desimal (WGS 84), mis. Longitude <span className="font-mono">114.846357</span>,
                  Latitude <span className="font-mono">-3.401051</span>. Baris tanpa koordinat akan dilewati.
                </p>
              </div>
            </>
          )}

          {/* 2. Pratinjau & Validasi */}
          {result && counts && (
            <>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{result.fileName}</div>
                  <div className="text-xs text-[#737373]">
                    Sheet "{result.sheetName}" · {result.rows.length} baris data
                  </div>
                </div>
                <button
                  onClick={reset}
                  className="flex-shrink-0 px-3 py-1.5 text-xs font-medium border border-[#E5E5E5] rounded-md hover:bg-[#F5F5F5] transition"
                >
                  Ganti File
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {(
                  [
                    ["all", "Semua", result.rows.length, "text-[#171717]"],
                    ["ok", "Siap", counts.ok, STATUS_META.ok.className],
                    ["warning", "Peringatan", counts.warning, STATUS_META.warning.className],
                    ["skipped", "Dilewati", counts.skipped, STATUS_META.skipped.className],
                  ] as const
                ).map(([key, label, value, className]) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`p-2.5 rounded-lg border text-left transition ${
                      filter === key ? "border-[#171717] bg-[#F5F5F5]" : "border-[#E5E5E5] hover:bg-[#FAFAFA]"
                    }`}
                  >
                    <div className={`text-lg font-semibold ${className}`}>{value}</div>
                    <div className="text-xs text-[#737373]">{label}</div>
                  </button>
                ))}
              </div>

              <div className="border border-[#E5E5E5] rounded-lg overflow-hidden">
                <div className="max-h-72 overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-[#F5F5F5] sticky top-0">
                      <tr className="text-left text-[#737373]">
                        <th className="px-2.5 py-2 font-medium">Baris</th>
                        <th className="px-2.5 py-2 font-medium">No.</th>
                        <th className="px-2.5 py-2 font-medium">RT/RW</th>
                        <th className="px-2.5 py-2 font-medium">Lingk.</th>
                        <th className="px-2.5 py-2 font-medium">Koordinat</th>
                        <th className="px-2.5 py-2 font-medium">UMKM</th>
                        <th className="px-2.5 py-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRows.slice(0, MAX_PREVIEW_ROWS).map((row) => {
                        const meta = STATUS_META[row.status];
                        const Icon = meta.icon;
                        return (
                          <tr key={row.barisExcel} className="border-t border-[#F0F0F0] align-top">
                            <td className="px-2.5 py-1.5 text-[#737373]">{row.barisExcel}</td>
                            <td className="px-2.5 py-1.5">{row.noRumah || "–"}</td>
                            <td className="px-2.5 py-1.5">
                              {row.rt || "–"}/{row.rw || "–"}
                            </td>
                            <td className="px-2.5 py-1.5">{row.lingkungan || "–"}</td>
                            <td className="px-2.5 py-1.5 font-mono whitespace-nowrap">
                              {row.lat !== null && row.lng !== null ? `${row.lat.toFixed(6)}, ${row.lng.toFixed(6)}` : "–"}
                            </td>
                            <td className="px-2.5 py-1.5 max-w-[120px] truncate">{row.umkm || "–"}</td>
                            <td className={`px-2.5 py-1.5 ${meta.className}`}>
                              <div className="flex items-start gap-1">
                                <Icon className="w-3.5 h-3.5 flex-shrink-0 mt-px" />
                                <span>{row.message ?? meta.label}</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {visibleRows.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-2.5 py-6 text-center text-[#737373]">
                            Tidak ada baris.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {visibleRows.length > MAX_PREVIEW_ROWS && (
                  <div className="px-2.5 py-1.5 text-xs text-[#737373] bg-[#F5F5F5] border-t border-[#E5E5E5]">
                    Menampilkan {MAX_PREVIEW_ROWS} dari {visibleRows.length} baris.
                  </div>
                )}
              </div>

              {existingCount > 0 && (
                <div className="p-3 border border-[#E5E5E5] rounded-lg space-y-1.5">
                  <div className="text-xs font-medium">Sudah ada {existingCount} rumah dari import sebelumnya</div>
                  <div className="flex gap-4 text-xs">
                    {(
                      [
                        ["replace", "Ganti data lama"],
                        ["append", "Tambahkan ke data lama"],
                      ] as const
                    ).map(([value, label]) => (
                      <label key={value} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="import-mode"
                          checked={mode === value}
                          onChange={() => setMode(value)}
                          className="accent-[#171717]"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-[#E5E5E5]">
          <div className="text-xs text-[#737373]">
            {counts && counts.umkm > 0 && `${counts.umkm} rumah memiliki UMKM (ditandai oranye di peta)`}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-xs font-medium border border-[#E5E5E5] rounded-md hover:bg-[#F5F5F5] transition"
            >
              Batal
            </button>
            <button
              disabled={importCount === 0}
              onClick={() => {
                if (!result) return;
                onImport(result, mode);
                handleClose();
              }}
              className="px-4 py-2 bg-[#171717] hover:bg-[#262626] text-white text-xs font-medium rounded-md shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Import {importCount > 0 ? `${importCount.toLocaleString("id-ID")} Titik` : ""}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
