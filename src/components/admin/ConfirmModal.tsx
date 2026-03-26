"use client";

import { AlertTriangle, X } from "lucide-react";
import { Button } from "./Button";
import { colors } from "@/lib/theme";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Eliminar",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg shadow-lg overflow-hidden" style={{ backgroundColor: colors.surface }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: colors.border }}>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${colors.primary}22` }}
            >
              <AlertTriangle className="w-6 h-6" style={{ color: colors.primary }} />
            </div>
            <h2 className="text-xl font-semibold" style={{ color: colors.text }}>{title}</h2>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-full transition-colors"
            style={{ color: colors.textMuted }}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p style={{ color: colors.textMuted }}>{message}</p>
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end p-4 border-t" style={{ borderColor: colors.border }}>
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={loading}>
            {loading ? "Eliminando..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
