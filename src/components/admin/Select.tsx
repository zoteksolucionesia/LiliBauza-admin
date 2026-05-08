"use client";

import { forwardRef } from "react";
import { colors } from "@/lib/theme";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = "", ...props }, ref) => {
    return (
      <div className="mb-4">
        {label && (
          <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all ${className}`}
          style={{
            borderColor: error ? "#B85C5C" : colors.border,
            backgroundColor: colors.surface,
            color: colors.text,
          }}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-sm" style={{ color: "#B85C5C" }}>{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
