"use client";

import { X } from "lucide-react";
import { colors } from "@/lib/theme";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Modal({ isOpen, onClose, title, children, size = "lg" }: ModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.30)" }}
    >
      <div className={`w-full ${sizeClasses[size]} rounded-lg shadow-lg overflow-hidden flex flex-col`}
        style={{ maxHeight: "90vh", backgroundColor: colors.surface }}
      >
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0" style={{ borderColor: colors.border }}>
          <h2 className="text-xl font-semibold" style={{ color: colors.text }}>{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full transition-colors"
            style={{ color: colors.textMuted }}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </div>
  );
}
