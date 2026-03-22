"use client";

import { forwardRef } from "react";
import { Textarea as ShadcnTextarea } from "@/components/ui/textarea";

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="mb-4">
        {label && (
          <label className="block text-sm font-medium mb-1 text-foreground">
            {label}
          </label>
        )}
        <ShadcnTextarea
          ref={ref}
          className={`${error ? "border-destructive focus-visible:ring-destructive" : ""} ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
      </div>
    );
  }
);

TextArea.displayName = "TextArea";
