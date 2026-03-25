"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Modal, Button, Select, TextArea, Input, EditorRico } from "@/components/admin";
import { colors } from "@/lib/theme";
import { jsPDF } from "jspdf";
import { PDFDocument } from "pdf-lib";
import { HOJA_MEMBRETADA_BASE64 } from "@/lib/membretadaData";

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
    const { data, error } = await supabase
      .from("pacientes")
      .select("id, nombre_completo")
      .eq("activo", true)
      .order("nombre_completo", { ascending: true });
    
    if (!error && data) {
      setPacientes(data);
    }
  }

  async function loadPlantillas() {
    const { data, error } = await supabase
      .from("plantillas_documentos")
      .select("id, tipo, contenido_base");
      
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
      
      // REEMPLAZO DINÁMICO:
      // 1. Limpiamos cualquier etiqueta HTML que se haya metido dentro de los corchetes
      // 2. Reemplazamos la etiqueta por el valor real en negrita
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

  const generatePDF = async (content: string) => {
    // =====================================================
    // FASE 1: Generar PDF de contenido sin fondo (solo texto)
    // =====================================================
    const contentDoc = new jsPDF({
      orientation: "p",
      unit: "mm",
      format: "letter" 
    });

    const pageWidth = 215.9;
    const pageHeight = 279.4;
    const marginLeft = 22;
    const marginRight = 22;
    const marginTop = 62;  // Espacio para el header de la membretada
    const marginBottom = 25; // Espacio para el footer de la membretada

    // Renderizar Contenido HTML en un div temporal
    const tempDiv = document.createElement("div");
    tempDiv.className = "pdf-content";
    
    const renderWidthPX = 1024;
    tempDiv.style.width = `${renderWidthPX}px`;
    tempDiv.style.padding = "0 40px";
    tempDiv.style.boxSizing = "border-box";
    tempDiv.style.margin = "0";
    tempDiv.style.fontSize = "12pt";
    tempDiv.style.fontFamily = "helvetica";
    tempDiv.style.lineHeight = "1.8";
    tempDiv.style.color = "#3D2929";
    
    tempDiv.style.position = "fixed";
    tempDiv.style.top = "0";
    tempDiv.style.left = "0";
    tempDiv.style.zIndex = "-1"; 
    
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
      .pdf-content { 
        background: transparent;
        text-align: justify;
        text-justify: inter-word;
      }
      .pdf-content .ql-align-center { text-align: center; }
      .pdf-content .ql-align-right { text-align: right; }
      .pdf-content .ql-align-justify { text-align: justify; text-justify: inter-word; }
      .pdf-content p { 
        margin-bottom: 25px;
        margin-top: 0; 
        display: block;
        width: 100%;
      }
      .pdf-content strong { font-weight: bold; } 
    `;
    document.head.appendChild(styleSheet);
    
    tempDiv.innerHTML = content;
    document.body.appendChild(tempDiv);

    await new Promise(r => setTimeout(r, 100));

    const innerWidthMM = pageWidth - marginLeft - marginRight;

    await contentDoc.html(tempDiv, {
      callback: function (doc) {
        document.body.removeChild(tempDiv);
        document.head.removeChild(styleSheet);
      },
      margin: [marginTop, marginRight, marginBottom, marginLeft],
      autoPaging: "text",
      x: marginLeft,
      y: marginTop,
      width: innerWidthMM,
      windowWidth: renderWidthPX 
    });

    // =====================================================
    // FASE 2: Combinar con la hoja membretada usando pdf-lib
    // =====================================================
    
    // Decodificar la hoja membretada desde base64 (embebida en el bundle)
    const binaryString = atob(HOJA_MEMBRETADA_BASE64);
    const membretadaBytes = new Uint8Array(binaryString.length);
    for (let j = 0; j < binaryString.length; j++) {
      membretadaBytes[j] = binaryString.charCodeAt(j);
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
      // Crear página en blanco tamaño carta
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
      // NOMBRE DE ARCHIVO HUMANO: Usamos el título que tú escribes
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

      // 2. Obtener URL pública
      const { data: urlData } = supabase.storage
        .from("documentos")
        .getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;

      // 2. Guardar en base de datos
      const { data, error: dbError } = await supabase
        .from("documentos")
        .insert({
          paciente_id: formData.paciente_id || null,
          tipo: selectedTipo,
          titulo: formData.titulo,
          contenido: formData.contenido,
          storage_url: publicUrl,
          notas: formData.notas
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
