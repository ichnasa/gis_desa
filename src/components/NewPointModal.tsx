import { useState, useEffect } from "react";
import { X, MapPin, Landmark, Moon, GraduationCap, HeartPulse, Anchor, Store } from "lucide-react";
import type { GisLocation, GisCategory } from "../types/gis";

interface NewPointModalProps {
  isOpen: boolean;
  coords: { lat: number; lng: number } | null;
  onClose: () => void;
  onSave: (newLocation: GisLocation) => void;
}

const CATEGORY_OPTIONS: Array<{ key: GisCategory; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { key: "pemerintahan", label: "Pemerintahan", icon: Landmark },
  { key: "ibadah", label: "Tempat Ibadah", icon: Moon },
  { key: "pendidikan", label: "Pendidikan", icon: GraduationCap },
  { key: "kesehatan", label: "Kesehatan", icon: HeartPulse },
  { key: "fasilitas", label: "Fasilitas Umum", icon: Anchor },
  { key: "ekonomi", label: "Ekonomi / UMKM", icon: Store },
];

export default function NewPointModal({
  isOpen,
  coords,
  onClose,
  onSave,
}: NewPointModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<GisCategory>("fasilitas");
  const [rtRw, setRtRw] = useState("RT 02 / RW 01");
  const [address, setAddress] = useState("Jl. Martapura Lama");
  const [description, setDescription] = useState("");

  // Reset form setiap kali modal dibuka untuk koordinat baru
  useEffect(() => {
    if (isOpen && coords) {
      setName("");
      setCategory("fasilitas");
      setRtRw("RT 02 / RW 01");
      setAddress("Jl. Martapura Lama");
      setDescription("");
    }
  }, [isOpen, coords]);

  if (!isOpen || !coords) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newLoc: GisLocation = {
      id: `loc-${Date.now()}`,
      name: name.trim(),
      category,
      lat: coords.lat,
      lng: coords.lng,
      address: address.trim(),
      rtRw: rtRw.trim(),
      description: description.trim(),
      createdAt: new Date().toISOString().split("T")[0],
    };

    onSave(newLoc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[2500] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-fadeIn">
      <div className="bg-white border border-[#E5E5E5] rounded-xl shadow-2xl max-w-md w-full p-6 text-[#171717] space-y-4">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#171717] text-white flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-[#171717]">Tambah Titik Lokasi</h3>
              <p className="text-xs text-[#737373]">
                {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#737373] hover:text-[#171717] rounded hover:bg-[#F5F5F5] transition"
            title="Batal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Input Detail Titik */}
        <form
          onSubmit={handleSubmit}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          data-form-type="other"
          className="space-y-3.5 text-xs"
        >
          {/* Nama Lokasi */}
          <div>
            <label className="block font-medium text-[#171717] mb-1">
              Nama Lokasi / Bangunan <span className="text-[#D44C47]">*</span>
            </label>
            <input
              type="text"
              name="gis_new_place_title"
              autoComplete="off"
              required
              autoFocus
              placeholder="Contoh: Musholla Darussalam"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-[#E5E5E5] rounded-md focus:outline-none focus:border-[#171717] focus:ring-1 focus:ring-[#171717]"
            />
          </div>

          {/* Kategori */}
          <div>
            <label className="block font-medium text-[#171717] mb-1">Kategori</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as GisCategory)}
              className="w-full px-3 py-2 text-sm bg-white border border-[#E5E5E5] rounded-md focus:outline-none focus:border-[#171717]"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Alamat & RT/RW */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-medium text-[#171717] mb-1">Alamat / Jalan</label>
              <input
                type="text"
                name="gis_new_place_road"
                autoComplete="off"
                placeholder="Jl. Martapura Lama"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E5E5E5] rounded-md focus:outline-none focus:border-[#171717]"
              />
            </div>
            <div>
              <label className="block font-medium text-[#171717] mb-1">Wilayah RT / RW</label>
              <input
                type="text"
                name="gis_new_place_neighborhood"
                autoComplete="off"
                placeholder="RT 02 / RW 01"
                value={rtRw}
                onChange={(e) => setRtRw(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E5E5E5] rounded-md focus:outline-none focus:border-[#171717]"
              />
            </div>
          </div>

          {/* Keterangan */}
          <div>
            <label className="block font-medium text-[#171717] mb-1">Keterangan Tambahan</label>
            <textarea
              rows={2}
              placeholder="Deskripsi singkat fungsi tempat atau fasilitas..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-[#E5E5E5] rounded-md focus:outline-none focus:border-[#171717]"
            />
          </div>

          {/* Tombol Aksi */}
          <div className="pt-2 flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-[#171717] hover:bg-[#262626] text-white font-medium text-xs rounded-md shadow-sm transition"
            >
              Simpan Titik
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 bg-white border border-[#E5E5E5] hover:bg-[#F5F5F5] text-[#171717] font-medium text-xs rounded-md transition"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
