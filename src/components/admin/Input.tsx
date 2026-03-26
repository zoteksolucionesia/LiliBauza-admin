"use client";

import { forwardRef } from "react";
import { colors } from "@/lib/theme";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="mb-4">
        {label && (
          <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all ${className}`}
          style={{
            borderColor: error ? "#B85C5C" : colors.border,
            backgroundColor: colors.surface,
            color: colors.text,
          }}
          {...props}
        />
        {error && <p className="mt-1 text-sm" style={{ color: "#B85C5C" }}>{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
