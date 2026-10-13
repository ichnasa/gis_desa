import { useMemo, useState } from "react";
import { Search, X, MapPin } from "lucide-react";
import type { GisLocation } from "../types/gis";

export interface MapSearchProps {
  locations: GisLocation[];
  onSelect: (loc: GisLocation) => void;
}

export default function MapSearch({ locations, onSelect }: MapSearchProps) {
  const [text, setText] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const results = useMemo(() => {
    const q = text.trim().toLowerCase();
    if (!q) return [];
    return locations
      .filter((loc) => loc.name.toLowerCase().includes(q) || loc.address.toLowerCase().includes(q))
      .slice(0, 6);
  }, [text, locations]);

  return (
    <div id="tour-search-bar" className="absolute top-4 left-4 z-[510] w-72 sm:w-80">
      <div className="relative bg-white rounded-lg shadow-sm border border-[#E5E5E5]">
        <input
          type="text"
          placeholder="Cari lokasi..."
          value={text}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          onChange={(e) => setText(e.target.value)}
          className="w-full pl-9 pr-8 py-2 text-sm bg-transparent rounded-lg focus:outline-none text-[#171717] placeholder-[#737373]"
        />
        <Search className="w-4 h-4 text-[#737373] absolute left-3 top-2.5" />
        {text && (
          <button onClick={() => setText("")} className="absolute right-2.5 top-2.5 text-[#737373] hover:text-[#171717]">
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {isFocused && results.length > 0 && (
          <div className="absolute left-0 right-0 mt-1 bg-white border border-[#E5E5E5] rounded-lg shadow-lg overflow-hidden divide-y divide-[#E5E5E5]">
            {results.map((loc) => (
              <div
                key={loc.id}
                onMouseDown={() => {
                  onSelect(loc);
                  setText("");
                }}
                className="p-3 hover:bg-[#F5F5F5] cursor-pointer transition flex items-start gap-2.5"
              >
                <MapPin className="w-4 h-4 text-[#171717] mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#171717] truncate">{loc.name}</div>
                  <div className="text-xs text-[#737373] truncate">{loc.address}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
