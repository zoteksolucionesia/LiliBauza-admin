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
      .select("id, tipo, contenido_base")
      .eq("terapeuta_id", session.user.id);
      
    if (!error && data) {
      setPlantillas(data as Plantilla[]);
    } else {
      console.error("Error cargando plantillas:", error);
    }
  }

  const handleTipoChange = (tipo: string) => {
    setSelectedTipo(tipo as Plantilla["tipo"]);
    
    const plantilla = plantillas.find((p) => p.tipo === tipo);
    const pNombreBuffer = paciente?.nombre_completo || pacientes.find(p => p.id === formData.paciente_id)?.nombre_completo || "";
    const pNombre = pNombreBuffer || "[NOMBRE DEL PACIENTE]";

    if (plantilla) {
      const fechaActual = new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });
      
      let contenidoRellenado = plantilla.contenido_base;
      
      const nombreRegex = /\[[^\]]*NOMBRE[^\]]*PACIENTE[^\]]*\]/gi;
      const fechaRegex = /\[[^\]]*FECHA[^\]]*\]/gi;

      contenidoRellenado = contenidoRellenado.replace(nombreRegex, `<strong>${pNombre}</strong>`);
      contenidoRellenado = contenidoRellenado.replace(fechaRegex, `<strong>${fechaActual}</strong>`);

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
  // =====================================================
  const generatePDF = async (content: string) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
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
      // 1. Generar PDF con Branding y HTML
      const blob = await generatePDF(formData.contenido);
      
      const fileExt = "pdf";
      const safeTitle = formData.titulo.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      const fileName = `${safeTitle}_${Date.now()}.${fileExt}`;

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

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("No session");

        const { data, error: dbError } = await supabase
          .from("documentos")
          .insert({
            paciente_id: formData.paciente_id || null,
            tipo: selectedTipo,
            titulo: formData.titulo,
            contenido: formData.contenido,
            storage_url: publicUrl,
            notas: formData.notas,
            terapeuta_id: session.user.id,
          })
        .select()
        .single();

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
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4">
          {paciente ? (
            <Input
              label="Paciente"
              value={paciente.nombre_completo}
              disabled
              readOnly
            />
          ) : (
            <Input
              label="Nombre del Paciente"
              value={formData.paciente_nombre || ""}
              onChange={(e) => setFormData({ ...formData, paciente_nombre: e.target.value })}
              placeholder="Escribe el nombre del paciente..."
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
            <div className="p-3 rounded-lg flex items-center gap-2 mb-2" style={{ backgroundColor: colors.surface, borderLeft: `3px solid ${colors.primary}` }}>
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

          <EditorRico
            label="Contenido del Documento"
            value={formData.contenido}
            onChange={(val) => setFormData({ ...formData, contenido: val })}
            placeholder="Selecciona el tipo de documento para cargar la plantilla..."
            disabled={!selectedTipo}
          />

          <TextArea
            label="Notas internas (opcional, no se imprimirán)"
            value={formData.notas}
            onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
            rows={2}
            placeholder="Anotaciones extra para ti..."
            disabled={!selectedTipo}
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
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
