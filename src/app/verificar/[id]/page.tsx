"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { CheckCircle, XCircle, FileText, Calendar, User, Shield } from "lucide-react";

interface Documento {
  id: string;
  tipo: string;
  titulo: string;
  created_at: string;
  paciente_id: string | null;
  terapeuta_id: string;
}

interface Terapeuta {
  nombre_clinica: string;
  color_primario: string;
}

type Estado = "verificando" | "valido" | "invalido" | "error";

export default function VerificarPage({ params }: { params: { id: string } }) {
  const [estado, setEstado] = useState<Estado>("verificando");
  const [documento, setDocumento] = useState<Documento | null>(null);
  const [terapeuta, setTerapeuta] = useState<Terapeuta | null>(null);

  useEffect(() => {
    verificarDocumento();
  }, [params.id]);

  async function verificarDocumento() {
    try {
      const { data: doc, error } = await supabase
        .from("documentos")
        .select("id, tipo, titulo, created_at, paciente_id, terapeuta_id")
        .eq("id", params.id)
        .single();

      if (error || !doc) {
        setEstado("invalido");
        return;
      }

      setDocumento(doc);

      const { data: branding } = await supabase
        .from("configuracion_branding")
        .select("nombre_clinica, color_primario")
        .eq("terapeuta_id", doc.terapeuta_id)
        .single();

      if (branding) setTerapeuta(branding);

      setEstado("valido");
    } catch {
      setEstado("error");
    }
  }

  const color = terapeuta?.color_primario ?? "#D4A5A5";
  const nombreClinica = terapeuta?.nombre_clinica ?? "Consulta Psicológica";

  const tipoLabel: Record<string, string> = {
    constancia: "Constancia",
    receta: "Receta Médica",
    diagnostico: "Diagnóstico",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f0f0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <Shield size={40} style={{ color, margin: "0 auto 12px" }} />
        <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "bold", color: "#3D2929" }}>
          Verificación de Documento
        </h1>
        <p style={{ margin: "6px 0 0", color: "#888", fontSize: "14px" }}>
          Sistema de autenticidad de documentos clínicos
        </p>
      </div>

      {/* Card */}
      <div style={{ background: "#fff", borderRadius: "16px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", padding: "40px", maxWidth: "480px", width: "100%" }}>

        {estado === "verificando" && (
          <div style={{ textAlign: "center", color: "#888" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", border: `4px solid ${color}`, borderTopColor: "transparent", margin: "0 auto 16px", animation: "spin 1s linear infinite" }} />
            <p style={{ margin: 0 }}>Verificando documento...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        )}

        {estado === "valido" && documento && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
              <CheckCircle size={36} style={{ color: "#22c55e", flexShrink: 0 }} />
              <div>
                <p style={{ margin: 0, fontWeight: "bold", color: "#166534", fontSize: "16px" }}>Documento Auténtico</p>
                <p style={{ margin: "2px 0 0", color: "#16a34a", fontSize: "13px" }}>Este documento fue generado en {nombreClinica}</p>
              </div>
            </div>

            <div style={{ background: "#f9f0f0", borderRadius: "10px", padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <Row icon={<FileText size={16} style={{ color }} />} label="Tipo" value={tipoLabel[documento.tipo] ?? documento.tipo} />
              <Row icon={<FileText size={16} style={{ color }} />} label="Título" value={documento.titulo} />
              <Row
                icon={<Calendar size={16} style={{ color }} />}
                label="Fecha de emisión"
                value={new Date(documento.created_at).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}
              />
              <Row icon={<User size={16} style={{ color }} />} label="Institución" value={nombreClinica} />
            </div>

            <div style={{ marginTop: "20px", padding: "12px 16px", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
              <p style={{ margin: 0, fontSize: "12px", color: "#166534", lineHeight: "1.5" }}>
                <strong>ID de verificación:</strong> {documento.id}
              </p>
            </div>
          </>
        )}

        {estado === "invalido" && (
          <div style={{ textAlign: "center" }}>
            <XCircle size={48} style={{ color: "#ef4444", margin: "0 auto 16px" }} />
            <p style={{ margin: "0 0 8px", fontWeight: "bold", color: "#991b1b", fontSize: "16px" }}>Documento no encontrado</p>
            <p style={{ margin: 0, color: "#888", fontSize: "14px", lineHeight: "1.6" }}>
              El documento con este código no existe en nuestro sistema o ha sido eliminado.
              Si crees que es un error, contacta directamente a tu terapeuta.
            </p>
          </div>
        )}

        {estado === "error" && (
          <div style={{ textAlign: "center", color: "#888" }}>
            <XCircle size={48} style={{ color: "#f59e0b", margin: "0 auto 16px" }} />
            <p style={{ margin: 0, fontSize: "14px" }}>Error de conexión. Intenta de nuevo.</p>
          </div>
        )}
      </div>

      <p style={{ marginTop: "24px", color: "#bbb", fontSize: "12px", textAlign: "center" }}>
        Powered by LiliBauza Admin · Sistema de gestión clínica
      </p>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
      <div style={{ marginTop: "2px" }}>{icon}</div>
      <div>
        <p style={{ margin: 0, fontSize: "11px", color: "#888", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</p>
        <p style={{ margin: "2px 0 0", fontSize: "14px", color: "#3D2929", fontWeight: "500" }}>{value}</p>
      </div>
    </div>
  );
}
