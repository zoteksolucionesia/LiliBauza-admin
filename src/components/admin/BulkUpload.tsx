"use client";

import { useState, useRef } from "react";
import { Upload, FileText, X, CheckCircle } from "lucide-react";
import { Button } from "./Button";
import { colors } from "@/lib/theme";

interface FileWithStatus {
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

interface BulkUploadProps {
  pacienteId: string;
  pacienteNombre: string;
  onSuccess: () => void;
  onClose: () => void;
}

export function BulkUpload({ pacienteId, pacienteNombre, onSuccess, onClose }: BulkUploadProps) {
  const [files, setFiles] = useState<FileWithStatus[]>([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isValidPdf = (file: File): boolean => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    return ext === "pdf" && file.type === "application/pdf";
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles: FileWithStatus[] = Array.from(e.target.files).map((file) => {
        if (!isValidPdf(file)) {
          return { file, status: "error" as const, error: "Solo se permiten archivos PDF válidos" };
        }
        return { file, status: "pending" as const };
      });
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    const supabase = (await import("@/lib/supabaseClient")).supabase;
    
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < files.length; i++) {
      const fileItem = files[i];
      
      // Update status to uploading
      setFiles((prev) =>
        prev.map((f, idx) => (idx === i ? { ...f, status: "uploading" as const } : f))
      );

      if (fileItem.status === "error") {
        errorCount++;
        continue;
      }

      try {
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.pdf`;

        // Upload to Storage
        const { error: uploadError } = await supabase.storage
          .from("documentos")
          .upload(fileName, fileItem.file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("documentos")
          .getPublicUrl(fileName);

        // Save to database
        const { error: dbError } = await supabase.from("documentos").insert({
          tipo: "archivo", // Tipo genérico para archivos subidos
          paciente_id: pacienteId,
          titulo: fileItem.file.name,
          contenido: `Archivo PDF subido - ${pacienteNombre}`,
          storage_url: urlData.publicUrl,
          activo: true,
          creado_por: null,
          created_at: new Date().toISOString(),
          metadatos: {
            original_name: fileItem.file.name,
            file_size: fileItem.file.size,
            file_type: fileItem.file.type,
            uploaded_via: "bulk_upload",
          },
        });

        if (dbError) throw dbError;

        // Update status to success
        setFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, status: "success" as const } : f))
        );
        successCount++;
      } catch (error: any) {
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: "error" as const, error: error.message } : f
          )
        );
        errorCount++;
      }
    }

    setUploading(false);
    
    if (successCount > 0) {
      onSuccess();
    }
  };

  const totalSize = files.reduce((acc, f) => acc + f.file.size, 0);
  const maxSize = 50 * 1024 * 1024; // 50MB total

  return (
    <div>
      <div className="mb-4">
        <p className="text-sm mb-2" style={{ color: colors.textMuted }}>
          Sube múltiples archivos PDF del paciente de una sola vez.
        </p>
      </div>

      {/* Drop zone */}
      <div
        className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all"
        style={{ borderColor: colors.border }}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="w-12 h-12 mx-auto mb-3" style={{ color: colors.primary }} />
        <p className="font-medium" style={{ color: colors.text }}>
          Arrastra archivos PDF aquí
        </p>
        <p className="text-sm mt-1" style={{ color: colors.textMuted }}>
          o haz click para seleccionar
        </p>
        <p className="text-xs mt-2" style={{ color: colors.textMuted }}>
          Máximo 50MB en total • Múltiples PDFs
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
          {files.map((fileItem, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg"
              style={{ backgroundColor: colors.background }}
            >
              <div className="flex items-center gap-3 flex-1">
                {fileItem.status === "success" ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : fileItem.status === "error" ? (
                  <X className="w-5 h-5 text-red-500" />
                ) : (
                  <FileText className="w-5 h-5" style={{ color: colors.primary }} />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: colors.text }}>
                    {fileItem.file.name}
                  </p>
                  <p className="text-xs" style={{ color: colors.textMuted }}>
                    {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB
                    {fileItem.error && (
                      <span className="ml-2 text-red-500">• {fileItem.error}</span>
                    )}
                  </p>
                </div>
              </div>
              {fileItem.status === "pending" && (
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 rounded hover:bg-red-100 transition-colors"
                >
                  <X className="w-4 h-4 text-red-500" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {files.length > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span style={{ color: colors.textMuted }}>
            {files.length} archivo(s) • {(totalSize / 1024 / 1024).toFixed(2)} MB
          </span>
          {totalSize > maxSize && (
            <span className="text-red-500">• Excede el límite de 50MB</span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-end mt-6">
        <Button variant="ghost" onClick={onClose} disabled={uploading}>
          Cancelar
        </Button>
        <Button
          onClick={handleUpload}
          disabled={files.length === 0 || uploading || totalSize > maxSize}
        >
          {uploading ? "Subiendo..." : `Subir ${files.length} archivo(s)`}
        </Button>
      </div>
    </div>
  );
}
