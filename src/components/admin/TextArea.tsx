"use client";

import { forwardRef } from "react";

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="mb-4">
        {label && (
          <label className="block text-sm font-medium mb-1" style={{ color: "#3D2929" }}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all ${className}`}
          style={{
            borderColor: error ? "#B85C5C" : "#E8C4C4",
            backgroundColor: "#FFFFFF",
          }}
          {...props}
        />
        {error && <p className="mt-1 text-sm" style={{ color: "#B85C5C" }}>{error}</p>}
      </div>
    );
  }
);

TextArea.displayName = "TextArea";
