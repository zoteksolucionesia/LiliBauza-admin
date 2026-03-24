"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { DataTable, SearchBar, Modal, Button, Input, Select, TextArea, Header, FileUpload, NotificationManager, ConfirmModal } from "@/components/admin";
import { motion } from "framer-motion";
import { FileText, FileCheck, FileBadge } from "lucide-react";

import { colors } from "@/lib/theme";

interface Documento {
  id: string;
  paciente_id: string;
  tipo: "constancia" | "receta" | "diagnostico";
  titulo: string;
  contenido: string;
  storage_url: string;
  created_at: string;
  activo?: boolean;
}

interface Paciente {
  id: string;
  nombre_completo: string;
}

export default function DocumentosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState<"constancia" | "receta" | "diagnostico" | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<Documento | null>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; type: "success" | "error" | "info" }>>([]);

  const addNotification = (message: string, type: "success" | "error" | "info") => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { id, message, type }]);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  useEffect(() => {
    checkAuth();
    loadDocumentos();
    loadPacientes();
  }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/admin/login");
      return;
    }
  }

  async function loadDocumentos() {
    const { data, error } = await supabase
      .from("documentos")
      .select("*")
      .in("tipo", ["constancia", "receta", "diagnostico"])
      .eq("activo", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading documentos:", error);
      return;
    }

    setDocumentos(data || []);
    setLoading(false);
  }

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

  const filteredDocumentos = documentos.filter((d) =>
    d.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.tipo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      key: "tipo",
      label: "Tipo",
      render: (value: string) => {
        const icons = {
          constancia: <FileText className="inline w-4 h-4 mr-1" />,
          receta: <FileCheck className="inline w-4 h-4 mr-1" />,
          diagnostico: <FileBadge className="inline w-4 h-4 mr-1" />,
        };
        return (
          <span className="capitalize">
            {icons[value as keyof typeof icons]}
            {value}
          </span>
        );
      },
    },
    { key: "titulo", label: "Título" },
    {
      key: "created_at",
      label: "Fecha",
      render: (value: string) => new Date(value).toLocaleDateString("es-MX"),
    },
  ];

  const handleDelete = async (doc: Documento) => {
    setSelectedDoc(doc);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedDoc) return;

    setDeleting(true);

    // Optimistic update - remover de la lista inmediatamente
    setDocumentos((prev) => prev.filter((d) => d.id !== selectedDoc.id));

    try {
      // 1. Eliminar de Storage
      const urlParts = selectedDoc.storage_url.split("/");
      const fileName = urlParts[urlParts.length - 1];

      console.log("Eliminando archivo del storage:", fileName);

      const { error: storageError } = await supabase.storage
        .from("documentos")
        .remove([fileName]);

      if (storageError) {
        console.error("Error en storage:", storageError);
        throw storageError;
      }

      // 2. Eliminar de la base de datos (soft delete)
      const { error: dbError } = await supabase
        .from("documentos")
        .update({ activo: false })
        .eq("id", selectedDoc.id);

      if (dbError) {
        console.error("Error en DB:", dbError);
        throw dbError;
      }

      addNotification("Documento eliminado", "success");
    } catch (error: any) {
      console.error("Error completo:", error);
      addNotification(`Error: ${error.message}`, "error");
      // Revertir el optimistic update si hubo error
      loadDocumentos();
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setSelectedDoc(null);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      <NotificationManager notifications={notifications} onRemove={removeNotification} />

      <Header
        title="Documentos"
        subtitle="Constancias, recetas y diagnósticos"
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <SearchBar
            placeholder="Buscar por paciente o tipo..."
            value={searchTerm}
            onChange={setSearchTerm}
            onAdd={() => {
              setSelectedTipo("constancia");
              setIsModalOpen(true);
            }}
            addLabel="Documento"
          />

          <div className="grid grid-cols-3 gap-4 mb-4">
            <button
              onClick={() => {
                setSelectedTipo("constancia");
                setIsModalOpen(true);
              }}
              className="p-4 rounded-lg border-2 transition-all hover:shadow-md"
              style={{ borderColor: colors.primary, backgroundColor: colors.surface }}
            >
              <FileText className="w-8 h-8 mx-auto mb-2" style={{ color: colors.primary }} />
              <p className="font-medium" style={{ color: colors.text }}>Constancia</p>
              <p className="text-xs" style={{ color: colors.textMuted }}>De participación o laboral</p>
            </button>
            <button
              onClick={() => {
                setSelectedTipo("receta");
                setIsModalOpen(true);
              }}
              className="p-4 rounded-lg border-2 transition-all hover:shadow-md"
              style={{ borderColor: colors.secondary, backgroundColor: colors.surface }}
            >
              <FileCheck className="w-8 h-8 mx-auto mb-2" style={{ color: colors.secondary }} />
              <p className="font-medium" style={{ color: colors.text }}>Receta</p>
              <p className="text-xs" style={{ color: colors.textMuted }}>Médica psicológica</p>
            </button>
            <button
              onClick={() => {
                setSelectedTipo("diagnostico");
                setIsModalOpen(true);
              }}
              className="p-4 rounded-lg border-2 transition-all hover:shadow-md"
              style={{ borderColor: colors.accent, backgroundColor: colors.surface }}
            >
              <FileBadge className="w-8 h-8 mx-auto mb-2" style={{ color: colors.accent }} />
              <p className="font-medium" style={{ color: colors.text }}>Diagnóstico</p>
              <p className="text-xs" style={{ color: colors.textMuted }}>Evaluación psicológica</p>
            </button>
          </div>

          <DataTable
            columns={columns}
            data={filteredDocumentos}
            actions={(row) => (
              <div className="flex gap-2 justify-end">
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedDoc(row);
                    setShowPdfModal(true);
                  }}
                >
                  📄 Ver
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDelete(row)}
                >
                  🗑️ Eliminar
                </Button>
              </div>
            )}
            emptyMessage="No hay documentos generados"
          />
        </motion.div>
      </main>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTipo(null);
        }}
        title={selectedTipo ? `Nuevo ${selectedTipo.charAt(0).toUpperCase() + selectedTipo.slice(1)}` : "Documento"}
        size="xl"
      >
        {selectedTipo && (
          <DocumentoForm
            tipo={selectedTipo}
            pacientes={pacientes}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedTipo(null);
              loadDocumentos();
            }}
          />
        )}
      </Modal>

      <Modal
        isOpen={showPdfModal}
        onClose={() => {
          setShowPdfModal(false);
          setSelectedDoc(null);
        }}
        title={selectedDoc?.titulo || "Ver Documento"}
        size="xl"
      >
        {selectedDoc && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: colors.textMuted }}>
                  <strong>Tipo:</strong> {selectedDoc.tipo}
                </p>
                <p className="text-sm" style={{ color: colors.textMuted }}>
                  <strong>Fecha:</strong> {new Date(selectedDoc.created_at).toLocaleDateString("es-MX")}
                </p>
              </div>
              <a
                href={selectedDoc.storage_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm px-3 py-1.5 rounded-lg font-medium text-white"
                style={{ backgroundColor: colors.primary }}
              >
                📥 Descargar PDF
              </a>
            </div>
            <div className="border rounded-lg overflow-hidden" style={{ borderColor: colors.primaryLight }}>
              <iframe
                src={selectedDoc.storage_url}
                className="w-full"
                style={{ height: "600px" }}
                title="Visor de PDF"
              />
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Eliminar Documento"
        message={`¿Estás seguro de que deseas eliminar "${selectedDoc?.titulo}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setSelectedDoc(null);
        }}
        loading={deleting}
      />
    </div>
  );
}

interface DocumentoFormProps {
  tipo: "constancia" | "receta" | "diagnostico";
  pacientes: Paciente[];
  onClose: () => void;
}

function DocumentoForm({ tipo, pacientes, onClose }: DocumentoFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    paciente_id: "",
    titulo: "",
    contenido: "",
    notas: "",
  });

  const getTemplate = () => {
    const paciente = pacientes.find((p) => p.id === formData.paciente_id);
    const fecha = new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });

    if (tipo === "constancia") {
      return `CONSTANCIA DE PARTICIPACIÓN

Por medio de la presente, la Mtra. Liliana Bauza, psicóloga clínica certificada, hace CONSTAR QUE:

${paciente?.nombre_completo || "[NOMBRE DEL PACIENTE]"}

Ha participado en sesiones de terapia psicológica en mi consultorio particular.

Esta constancia se expide a petición del interesado para los fines legales que le convengan.

Ciudad de México, a ${fecha}.


_________________________
Mtra. Liliana Bauza`;
    }

    if (tipo === "receta") {
      return `RECETA MÉDICA

Mtra. Liliana Bauza

Paciente: ${paciente?.nombre_completo || "[NOMBRE DEL PACIENTE]"}
Fecha: ${fecha}

INDICACIONES TERAPÉUTICAS:

1. Continuar con sesiones de terapia psicológica

2. [INDICACIONES ESPECÍFICAS]


_________________________
Mtra. Liliana Bauza`;
    }

    if (tipo === "diagnostico") {
      return `INFORME DE EVALUACIÓN PSICOLÓGICA

Mtra. Liliana Bauza

DATOS GENERALES:
Paciente: ${paciente?.nombre_completo || "[NOMBRE DEL PACIENTE]"}
Fecha de evaluación: ${fecha}

MOTIVO DE CONSULTA:
[DESCRIPCIÓN]

IMPRESIÓN DIAGNÓSTICA:
[DIAGNÓSTICO]

PLAN TERAPÉUTICO:
[OBJETIVOS Y ESTRATEGIAS]


_________________________
Mtra. Liliana Bauza`;
    }

    return "";
  };

  const handleSelectTemplate = () => {
    setFormData({
      ...formData,
      contenido: getTemplate(),
      titulo: `${tipo} - ${pacientes.find((p) => p.id === formData.paciente_id)?.nombre_completo || "Sin nombre"}`,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.paciente_id) {
      alert("Selecciona un paciente");
      return;
    }

    if (!formData.contenido.trim()) {
      alert("El contenido no puede estar vacío");
      return;
    }

    setLoading(true);

    try {
      const blob = new Blob([formData.contenido], { type: "text/plain" });
      const fileExt = "txt";
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("documentos")
        .upload(fileName, blob, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("documentos")
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase.from("documentos").insert({
        tipo,
        paciente_id: formData.paciente_id,
        titulo: formData.titulo,
        contenido: formData.contenido,
        storage_url: urlData.publicUrl,
        activo: true,
        creado_por: null,
        created_at: new Date().toISOString(),
        notas: formData.notas,
      });

      if (dbError) throw dbError;

      alert("Documento generado exitosamente");
      onClose();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-4">
        <Select
          label="Paciente"
          value={formData.paciente_id}
          onChange={(e) => setFormData({ ...formData, paciente_id: e.target.value })}
          options={[
            { value: "", label: "Seleccionar paciente..." },
            ...pacientes.map((p) => ({ value: p.id, label: p.nombre_completo })),
          ]}
          required
        />

        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Input
              label="Título del documento"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder={`Ej: Constancia - ${formData.paciente_id ? pacientes.find(p => p.id === formData.paciente_id)?.nombre_completo : "..."}`}
            />
          </div>
          <Button
            type="button"
            onClick={handleSelectTemplate}
            disabled={!formData.paciente_id}
          >
            📋 Usar Plantilla
          </Button>
        </div>

        <TextArea
          label="Contenido del Documento"
          value={formData.contenido}
          onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
          rows={12}
          placeholder="Selecciona un paciente y click en 'Usar Plantilla' para auto-llenar, o escribe el contenido manualmente..."
        />

        <TextArea
          label="Notas internas (no se incluyen en el documento)"
          value={formData.notas}
          onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
          rows={2}
          placeholder="Notas solo para uso interno..."
        />
      </div>

      <div className="flex gap-3 justify-end mt-4">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading || !formData.contenido.trim()}>
          {loading ? "Generando..." : "Generar Documento"}
        </Button>
      </div>
    </form>
  );
}
