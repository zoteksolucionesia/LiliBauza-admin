"use client";

import { useState, useRef } from "react";
import { Upload, FileText, X } from "lucide-react";
import { Button } from "./Button";
import { colors } from "@/lib/theme";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  acceptedTypes?: string[];
  maxSize?: number;
  label?: string;
}

export function FileUpload({
  onFileSelect,
  acceptedTypes = [".pdf"],
  maxSize = 10, // MB
  label = "Subir archivo",
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!acceptedTypes.some((type) => file.name.toLowerCase().endsWith(type))) {
      setError(`Tipo de archivo no permitido. Solo ${acceptedTypes.join(", ")}`);
      return;
    }
    if (file.size > maxSize * 1024 * 1024) {
      setError(`El archivo es muy grande. Máximo ${maxSize}MB`);
      return;
    }
    setError("");
    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setError("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
          {label}
        </label>
      )}

      {!selectedFile ? (
        <div
          className="border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer"
          style={{
            borderColor: dragActive ? colors.primary : colors.border,
            backgroundColor: dragActive ? `${colors.primaryLight}33` : "transparent",
          }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="w-12 h-12 mx-auto mb-3" style={{ color: colors.primary }} />
          <p className="font-medium" style={{ color: colors.text }}>
            Arrastra tu archivo PDF aquí
          </p>
          <p className="text-sm mt-1" style={{ color: colors.textMuted }}>
            o haz click para seleccionar
          </p>
          <p className="text-xs mt-2" style={{ color: colors.textMuted }}>
            Máximo {maxSize}MB • Solo PDF
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={acceptedTypes.join(",")}
            onChange={handleChange}
            className="hidden"
          />
        </div>
      ) : (
        <div
          className="flex items-center justify-between p-4 rounded-lg border"
          style={{ backgroundColor: colors.background, borderColor: colors.border }}
        >
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8" style={{ color: colors.primary }} />
            <div>
              <p className="font-medium" style={{ color: colors.text }}>
                {selectedFile.name}
              </p>
              <p className="text-sm" style={{ color: colors.textMuted }}>
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <button
            onClick={handleRemove}
            className="p-2 rounded-full hover:bg-red-100 transition-colors"
          >
            <X className="w-5 h-5 text-red-500" />
          </button>
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm" style={{ color: "#B85C5C" }}>
          {error}
        </p>
      )}
    </div>
  );
}
