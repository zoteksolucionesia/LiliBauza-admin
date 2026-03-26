"use client";

import { Search } from "lucide-react";
import { colors } from "@/lib/theme";

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onAdd?: () => void;
  addLabel?: string;
}

export function SearchBar({
  placeholder = "Buscar...",
  value,
  onChange,
  onAdd,
  addLabel = "Nuevo",
}: SearchBarProps) {
  return (
    <div className="flex gap-3 mb-4">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: colors.textMuted }} />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all"
          style={{
            borderColor: colors.border,
            backgroundColor: colors.surface,
            color: colors.text,
          }}
          onFocus={(e) => (e.target.style.borderColor = colors.primary)}
          onBlur={(e) => (e.target.style.borderColor = colors.border)}
        />
      </div>
      {onAdd && (
        <button
          onClick={onAdd}
          className="px-4 py-2 rounded-lg font-medium text-white transition-all hover:opacity-90"
          style={{ backgroundColor: colors.primary }}
        >
          + {addLabel}
        </button>
      )}
    </div>
  );
}
