"use client";

import { forwardRef } from "react";
import { Input as ShadcnInput } from "@/components/ui/input";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="mb-4">
        {label && (
          <label className="block text-sm font-medium mb-1 text-foreground">
            {label}
          </label>
        )}
        <ShadcnInput
          ref={ref}
          className={`${error ? "border-destructive focus-visible:ring-destructive" : ""} ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
