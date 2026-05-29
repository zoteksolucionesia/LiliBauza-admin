"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Modal, Button, Select, TextArea, Input, EditorRico } from "@/components/admin";
import { colors } from "@/lib/theme";
import { jsPDF } from "jspdf";
import { PDFDocument } from "pdf-lib";
import { HOJA_MEMBRETADA_BASE64 } from "@/lib/membretadaData";
import { useTheme } from "@/hooks/useTheme";

interface Paciente {
  id: string;
  nombre_completo: string;
}

interface Plantilla {
  id: string;
  tipo: string;
  contenido_base: string;
  es_predefinido?: boolean;
}

interface PacienteSelect {
  id: string;
  nombre_completo: string;
}

interface DocumentoState {
  paciente_id: string;
  paciente_nombre: string;
  titulo: string;
  contenido: string;
  notas: string;
}

interface CredencialesTerapeuta {
  nombre_terapeuta: string | null;
  cedula_profesional: string | null;
  cedula_maestria: string | null;
  email_clinica: string | null;
  telefono_clinica: string | null;
}

interface GeneradorDocumentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  paciente?: Paciente;
  onSuccess: () => void;
  onError: (err: string) => void;
}

export function GeneradorDocumentoModal({
  isOpen,
  onClose,
  paciente,
  onSuccess,
  onError,
}: GeneradorDocumentoModalProps) {
  const { membretadaUrl } = useTheme();
  const [loading, setLoading] = useState(false);
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [pacientes, setPacientes] = useState<PacienteSelect[]>([]);
  const [credenciales, setCredenciales] = useState<CredencialesTerapeuta | null>(null);
  const [selectedTipo, setSelectedTipo] = useState<Plantilla["tipo"] | "">("");
  
  const [formData, setFormData] = useState<DocumentoState>({
    paciente_id: paciente?.id || "",
    paciente_nombre: paciente?.nombre_completo || "",
    titulo: "",
    contenido: "",
    notas: "",
  });

  useEffect(() => {
    if (isOpen) {
      loadPlantillas();
      loadCredenciales();
      if (!paciente) {
        loadPacientes();
      }
      setSelectedTipo("");
      setFormData({
        paciente_id: paciente?.id || "",
        paciente_nombre: paciente?.nombre_completo || "",
        titulo: "",
        contenido: "",
        notas: ""
      });
    }
  }, [isOpen, paciente]);

  async function loadCredenciales() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("configuracion_branding")
      .select("nombre_terapeuta, cedula_profesional, cedula_maestria, email_clinica, telefono_clinica")
      .eq("terapeuta_id", session.user.id)
      .single();

    if (data) setCredenciales(data as CredencialesTerapeuta);
  }

  async function loadPacientes() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from("pacientes")
      .select("id, nombre_completo")
      .eq("terapeuta_id", session.user.id)
      .eq("activo", true)
      .order("nombre_completo", { ascending: true });
    
    if (!error && data) {
      setPacientes(data);
    }
  }

  async function loadPlantillas() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from("plantillas_documentos")
      .select("id, tipo, contenido_base, es_predefinido")
      .or(`terapeuta_id.eq.${session.user.id},es_predefinido.eq.true`);

    if (!error && data) {
      setPlantillas(data as Plantilla[]);
    } else {
      console.error("Error cargando plantillas:", error);
    }
  }

  const escapeHtml = (text: string): string =>
    text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const handleTipoChange = (tipo: string) => {
    setSelectedTipo(tipo as Plantilla["tipo"]);

    // Si existe copia propia del tipo, usarla; si no, la global predefinida.
    const matches = plantillas.filter((p) => p.tipo === tipo);
    const plantilla = matches.find((p) => !p.es_predefinido) || matches[0];
    const pNombreBuffer = paciente?.nombre_completo || pacientes.find(p => p.id === formData.paciente_id)?.nombre_completo || "";
    const pNombre = pNombreBuffer ? escapeHtml(pNombreBuffer) : "[NOMBRE DEL PACIENTE]";

    if (plantilla) {
      const fechaActual = new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });

      let contenidoRellenado = plantilla.contenido_base;

      const nombreRegex = /\[[^\]]*NOMBRE[^\]]*PACIENTE[^\]]*\]/gi;
      const fechaRegex = /\[[^\]]*FECHA[^\]]*\]/gi;

      contenidoRellenado = contenidoRellenado.replace(nombreRegex, `<strong>${pNombre}</strong>`);
      contenidoRellenado = contenidoRellenado.replace(fechaRegex, `<strong>${escapeHtml(fechaActual)}</strong>`);

      setFormData({
        ...formData,
        contenido: contenidoRellenado,
        titulo: `${tipo.charAt(0).toUpperCase() + tipo.slice(1)} - ${pNombre === "[NOMBRE DEL PACIENTE]" ? "" : pNombre}`,
      });
    } else {
      setFormData({
        ...formData,
        contenido: "",
        titulo: "",
      });
    }
  };

  // =====================================================
  // generatePDF: Renderizado NATIVO con jsPDF
  // Usa splitTextToSize() que GARANTIZA no cortar palabras
  // docId: UUID del documento, se embebe en el QR de verificación
  // firma_hash: hash SHA-256 truncado, se muestra como sello textual
  // qr_url: URL pública que codifica el QR
  // =====================================================
  const generatePDF = async (
    content: string,
    docId: string,
    firma_hash: string,
    qr_url: string,
  ) => {
    const contentDoc = new jsPDF({
      orientation: "p",
      unit: "mm",
      format: "letter" 
    });

    const pageWidth = 215.9;
    const pageHeight = 279.4;
    const ml = 30;   // 3cm izquierdo (Word default)
    const mr = 30;   // 3cm derecho (Word default)
    const mt = 57;   // Debajo del header membretada (2 renglones más abajo)
    const mb = 25;   // Arriba del footer membretada
    const maxW = pageWidth - ml - mr; // ~155.9mm
    const lhFactor = 1.5;

    contentDoc.setTextColor(61, 41, 41); // #3D2929
    let cursorY = mt;

    // Salto de página si no cabe
    const ensureSpace = (h: number) => {
      if (cursorY + h > pageHeight - mb) {
        contentDoc.addPage();
        cursorY = mt;
      }
    };

    // Renderizar línea justificada (distribuye espacios entre palabras)
    const renderJustified = (line: string, y: number, isLast: boolean) => {
      const words = line.split(/\s+/).filter(Boolean);
      if (isLast || words.length <= 1) {
        contentDoc.text(line, ml, y);
        return;
      }
      const wordsW = words.reduce((s, w) => s + contentDoc.getTextWidth(w), 0);
      const gap = (maxW - wordsW) / (words.length - 1);
      let x = ml;
      words.forEach((w, idx) => {
        contentDoc.text(w, x, y);
        x += contentDoc.getTextWidth(w) + (idx < words.length - 1 ? gap : 0);
      });
    };

    // Parsear HTML del editor Quill a bloques
    const dom = new DOMParser().parseFromString(`<div>${content}</div>`, "text/html");
    const root = dom.body.firstElementChild;
    if (!root) return new Blob([contentDoc.output("arraybuffer")], { type: "application/pdf" });

    const elements = Array.from(root.children) as HTMLElement[];

    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      const tag = el.tagName.toLowerCase();
      const rawText = (el.textContent || "").replace(/\s+/g, " ").trim();

      // Párrafo vacío = salto de línea
      if (!rawText) { cursorY += 4; continue; }

      // Alineación (clases Quill)
      let align: "left" | "center" | "right" | "justify" = "justify";
      if (el.classList.contains("ql-align-center")) align = "center";
      else if (el.classList.contains("ql-align-right")) align = "right";

      // Formato según etiqueta HTML
      let fontSize = 12;
      let fontStyle: string = "normal";
      let spaceBefore = 0;
      let spaceAfter = 5;

      if (tag === "h1") {
        fontSize = 18;
        fontStyle = "bold";
        align = align === "justify" ? "center" : align;
        spaceBefore = 10;
        spaceAfter = 12;
      } else if (tag === "h2") {
        fontSize = 15;
        fontStyle = "bold";
        spaceAfter = 8;
      } else {
        // Detectar si TODO el bloque es bold o italic
        const strongEl = el.querySelector("strong, b");
        const emEl = el.querySelector("em, i");
        const isAllBold = strongEl && strongEl.textContent?.trim() === rawText;
        const isAllItalic = emEl && emEl.textContent?.trim() === rawText;
        if (isAllBold && isAllItalic) fontStyle = "bolditalic";
        else if (isAllBold) fontStyle = "bold";
        else if (isAllItalic) fontStyle = "italic";
      }

      // Detectar tamaño de fuente personalizado (Quill ql-size-*)
      if (el.classList.contains("ql-size-small")) fontSize = 10;
      else if (el.classList.contains("ql-size-large")) fontSize = 14;
      else if (el.classList.contains("ql-size-huge")) fontSize = 18;
      // También revisar si hay un span hijo con la clase de tamaño
      const sizeSpan = el.querySelector(".ql-size-small, .ql-size-large, .ql-size-huge");
      if (sizeSpan) {
        if (sizeSpan.classList.contains("ql-size-small")) fontSize = 10;
        else if (sizeSpan.classList.contains("ql-size-large")) fontSize = 14;
        else if (sizeSpan.classList.contains("ql-size-huge")) fontSize = 18;
      }

      cursorY += spaceBefore;
      contentDoc.setFontSize(fontSize);
      contentDoc.setFont("helvetica", fontStyle);

      // Altura de línea: pt a mm, multiplicado por factor de interlineado
      const lineH = (fontSize * 0.3528) * lhFactor;

      // splitTextToSize: divide respetando palabras COMPLETAS
      const lines: string[] = contentDoc.splitTextToSize(rawText, maxW);
      const blockH = lines.length * lineH;

      ensureSpace(blockH);

      // Renderizar cada línea
      for (let j = 0; j < lines.length; j++) {
        const ly = cursorY + j * lineH;
        if (align === "center") {
          contentDoc.text(lines[j], pageWidth / 2, ly, { align: "center" });
        } else if (align === "right") {
          contentDoc.text(lines[j], pageWidth - mr, ly, { align: "right" });
        } else if (align === "justify") {
          renderJustified(lines[j], ly, j === lines.length - 1);
        } else {
          contentDoc.text(lines[j], ml, ly);
        }
      }

      cursorY += blockH + spaceAfter;
    }

    // =====================================================
    // SELLO DIGITAL: QR + firma textual en última página
    // QR a la derecha, credenciales y hash a la izquierda
    // =====================================================
    try {
      const QRCode = (await import("qrcode")).default;
      const qrDataUrl: string = await QRCode.toDataURL(qr_url, { width: 120, margin: 1 });
      const qrBase64 = qrDataUrl.replace("data:image/png;base64,", "");
      const qrSize = 22; // mm
      const qrX = pageWidth - mr - qrSize;
      const qrY = pageHeight - mb - qrSize - 2;

      // QR en esquina inferior derecha
      contentDoc.addImage(qrBase64, "PNG", qrX, qrY, qrSize, qrSize);
      contentDoc.setFontSize(5.5);
      contentDoc.setFont("helvetica", "normal");
      contentDoc.setTextColor(130, 130, 130);
      contentDoc.text("Escanea para verificar", qrX + qrSize / 2, pageHeight - mb + 2, { align: "center" });

      // Firma textual a la izquierda del QR
      const sigX = ml;
      let sigY = qrY + 4;

      contentDoc.setFontSize(7);
      contentDoc.setFont("helvetica", "bold");
      contentDoc.setTextColor(80, 80, 80);

      if (credenciales?.nombre_terapeuta) {
        contentDoc.text(credenciales.nombre_terapeuta, sigX, sigY);
        sigY += 3.5;
      }

      contentDoc.setFont("helvetica", "normal");
      contentDoc.setFontSize(6.5);

      const cedulas: string[] = [];
      if (credenciales?.cedula_profesional) {
        cedulas.push(`Cédula Profesional: ${credenciales.cedula_profesional}`);
      }
      if (credenciales?.cedula_maestria) {
        cedulas.push(`Cédula Maestría: ${credenciales.cedula_maestria}`);
      }
      if (cedulas.length > 0) {
        contentDoc.text(cedulas.join("   ·   "), sigX, sigY);
        sigY += 3;
      }

      const contacto: string[] = [];
      if (credenciales?.email_clinica) contacto.push(credenciales.email_clinica);
      if (credenciales?.telefono_clinica) contacto.push(credenciales.telefono_clinica);
      if (contacto.length > 0) {
        contentDoc.text(contacto.join("  ·  "), sigX, sigY);
        sigY += 3;
      }

      contentDoc.setFontSize(5.5);
      contentDoc.setTextColor(150, 150, 150);
      contentDoc.text(`ID: ${docId}`, sigX, sigY);
      sigY += 2.5;
      contentDoc.text(`Firma: ${firma_hash}`, sigX, sigY);
    } catch {
      // QR no crítico — continúa sin él si falla
    }

    // =====================================================
    // FASE 2: Combinar con la hoja membretada usando pdf-lib
    // =====================================================
    
    // Obtener la hoja membretada (URL personalizada o default base64)
    let membretadaBytes: Uint8Array;
    if (membretadaUrl) {
      const resp = await fetch(membretadaUrl);
      const arrBuffer = await resp.arrayBuffer();
      membretadaBytes = new Uint8Array(arrBuffer);
    } else {
      // Decodificar la hoja membretada desde base64 (embebida en el bundle)
      const binaryString = atob(HOJA_MEMBRETADA_BASE64);
      membretadaBytes = new Uint8Array(binaryString.length);
      for (let j = 0; j < binaryString.length; j++) {
        membretadaBytes[j] = binaryString.charCodeAt(j);
      }
    }
    const membretadaPdf = await PDFDocument.load(membretadaBytes);

    // Cargar el PDF de contenido generado por jsPDF
    const contentBytes = contentDoc.output("arraybuffer");
    const contentPdf = await PDFDocument.load(contentBytes);

    // Crear PDF final
    const finalPdf = await PDFDocument.create();
    const totalPages = contentPdf.getPageCount();
    
    // Embeder ambos PDFs como templates reutilizables
    const [membretadaTemplate] = await finalPdf.embedPdf(membretadaPdf, [0]);
    const contentTemplates = await finalPdf.embedPdf(contentPdf, 
      Array.from({ length: totalPages }, (_, i) => i)
    );

    // Tamaño carta en puntos (Letter: 612 x 792)
    const letterWidth = 612;
    const letterHeight = 792;

    for (let i = 0; i < totalPages; i++) {
      const page = finalPdf.addPage([letterWidth, letterHeight]);
      
      // PASO 1: Dibujar la membretada como FONDO (se dibuja primero)
      page.drawPage(membretadaTemplate, {
        x: 0,
        y: 0,
        width: letterWidth,
        height: letterHeight,
      });
      
      // PASO 2: Dibujar el contenido ENCIMA del fondo
      page.drawPage(contentTemplates[i], {
        x: 0,
        y: 0,
        width: letterWidth,
        height: letterHeight,
      });
    }

    // Exportar como blob
    const finalBytes = await finalPdf.save();
    return new Blob([finalBytes.buffer as ArrayBuffer], { type: "application/pdf" });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedTipo) {
      alert("Selecciona un tipo de documento");
      return;
    }

    if (!formData.contenido.trim()) {
      alert("El contenido no puede estar vacío");
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      // 1. Generar UUID y fecha ISO ANTES del PDF (ambos entran al hash)
      const docId = crypto.randomUUID();
      const fecha = new Date().toISOString();

      // 2. Solicitar firma al servidor (SHA-256 con secret server-side)
      const firmaResp = await fetch("/api/firma/firmar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docId,
          paciente_id: formData.paciente_id || null,
          tipo: selectedTipo,
          fecha,
          terapeuta_id: session.user.id,
        }),
      });
      if (!firmaResp.ok) {
        const errData = await firmaResp.json().catch(() => ({}));
        throw new Error(errData.error || "Error al firmar el documento");
      }
      const { firma_hash, qr_url } = (await firmaResp.json()) as {
        firma_hash: string;
        qr_url: string;
      };

      // 3. Generar PDF con QR + firma textual
      const blob = await generatePDF(formData.contenido, docId, firma_hash, qr_url);

      const safeTitle = formData.titulo.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      const fileName = `${safeTitle}_${Date.now()}.pdf`;

      const { error: uploadError } = await supabase.storage
        .from("documentos")
        .upload(fileName, blob, {
          cacheControl: "3600",
          upsert: false,
          contentType: "application/pdf"
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("documentos")
        .getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;

      const { error: dbError } = await supabase
        .from("documentos")
        .insert({
          id: docId,
          paciente_id: formData.paciente_id || null,
          tipo: selectedTipo,
          titulo: formData.titulo,
          contenido: formData.contenido,
          storage_url: publicUrl,
          notas: formData.notas,
          terapeuta_id: session.user.id,
          created_at: fecha,
          firma_hash,
          qr_url,
        });

      if (dbError) throw dbError;

      onSuccess();
    } catch (error: any) {
      onError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={paciente ? `Generar Documento para ${paciente.nombre_completo}` : "Generar Nuevo Documento"}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full gap-4">
        <div className="flex-1 overflow-y-auto space-y-4">
          {paciente ? (
            <Input
              label="Paciente"
              value={paciente.nombre_completo}
              disabled
              readOnly
            />
          ) : (
            <Select
              label="Paciente"
              value={formData.paciente_id}
              onChange={(e) => {
                const id = e.target.value;
                const p = pacientes.find((x) => x.id === id);
                setFormData({
                  ...formData,
                  paciente_id: id,
                  paciente_nombre: p?.nombre_completo || "",
                });
              }}
              options={[
                { value: "", label: "Selecciona un paciente..." },
                ...pacientes.map((p) => ({ value: p.id, label: p.nombre_completo })),
              ]}
              required
            />
          )}

          <Select
            label="Tipo de Documento"
            value={selectedTipo}
            onChange={(e) => handleTipoChange(e.target.value)}
            disabled={!paciente && !formData.paciente_id}
            options={[
              { value: "", label: "Seleccionar tipo de documento..." },
              { value: "constancia", label: "Constancia" },
              { value: "receta", label: "Receta Médica" },
              { value: "diagnostico", label: "Diagnóstico" },
            ]}
            required
          />

          {selectedTipo && (
            <div className="p-3 rounded-lg flex items-center gap-2" style={{ backgroundColor: colors.surface, borderLeft: `3px solid ${colors.primary}` }}>
              <span>💡</span>
              <p className="text-sm" style={{ color: colors.text }}>
                La plantilla para <strong>{selectedTipo}</strong> ha sido cargada y los datos del paciente han sido autocompletados. Puedes ajustar el texto libremente antes de generar el documento final.
              </p>
            </div>
          )}

          <Input
            label="Título (referencia interna)"
            value={formData.titulo}
            onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
            placeholder="Ej: Constancia - Juan Pérez"
            required
            disabled={!selectedTipo}
          />

          <div className="flex-1">
            <EditorRico
              label="Contenido del Documento"
              value={formData.contenido}
              onChange={(val) => setFormData({ ...formData, contenido: val })}
              placeholder="Selecciona el tipo de documento para cargar la plantilla..."
              disabled={!selectedTipo}
            />
          </div>

          <TextArea
            label="Notas internas (opcional, no se imprimirán)"
            value={formData.notas}
            onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
            rows={2}
            placeholder="Anotaciones extra para ti..."
            disabled={!selectedTipo}
          />
        </div>

        <div className="flex justify-end gap-3 flex-shrink-0 border-t pt-4" style={{ borderColor: colors.border }}>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading || !selectedTipo || !formData.contenido.trim()}>
            {loading ? "Generando y Guardando..." : "✅ Generar Documento"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
