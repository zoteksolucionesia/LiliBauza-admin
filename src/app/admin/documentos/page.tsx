"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { 
  DataTable, 
  Modal, 
  Button, 
  TextArea, 
  Header, 
  NotificationManager, 
  Tabs, 
  TabPanel, 
  GeneradorDocumentoModal, 
  ConfirmModal,
  EditorRico,
  Input
} from "@/components/admin";
import { motion } from "framer-motion";
import { FileText, FileCheck, FileBadge, Trash2, Eye } from "lucide-react";

import { colors } from "@/lib/theme";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";

interface Plantilla {
  id: string;
  tipo: string;
  contenido_base: string;
  updated_at: string;
}

interface Documento {
  id: string;
  paciente_id: string;
  tipo: "constancia" | "receta" | "diagnostico";
  titulo: string;
  storage_url: string;
  created_at: string;
  pacientes?: { nombre_completo: string };
}

export default function DocumentosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [documentosPapelera, setDocumentosPapelera] = useState<Documento[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenModalOpen, setIsGenModalOpen] = useState(false);
  const [selectedPlantilla, setSelectedPlantilla] = useState<Plantilla | null>(null);
  
  const [selectedDoc, setSelectedDoc] = useState<Documento | null>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showHardDeleteModal, setShowHardDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [restoring, setRestoring] = useState(false);

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
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    await Promise.all([loadPlantillas(), loadDocumentos(), loadPapelera()]);
    setLoading(false);
  }

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/admin/login");
      return;
    }
  }

  async function loadPlantillas() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from("plantillas_documentos")
      .select("*")
      .eq("terapeuta_id", session.user.id)
      .order("tipo", { ascending: true });

    if (error) {
      console.error("Error loading plantillas:", error);
    } else {
      setPlantillas(data || []);
    }
  }

  async function loadDocumentos() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from("documentos")
      .select(`
        *,
        pacientes (nombre_completo)
      `)
      .eq("terapeuta_id", session.user.id)
      .eq("activo", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading documentos:", error);
    } else {
      setDocumentos(data || []);
    }
  }

  async function loadPapelera() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from("documentos")
      .select(`
        *,
        pacientes (nombre_completo)
      `)
      .eq("terapeuta_id", session.user.id)
      .eq("activo", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading papelera:", error);
    } else {
      setDocumentosPapelera(data || []);
    }
  }

  const handleDelete = (doc: Documento) => {
    setSelectedDoc(doc);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedDoc) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("documentos")
        .update({ activo: false })
        .eq("id", selectedDoc.id);
      
      if (error) throw error;
      addNotification("Documento movido a la papelera", "success");
      loadDocumentos();
      loadPapelera();
    } catch (error: any) {
      addNotification("Error al mover a papelera", "error");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setSelectedDoc(null);
    }
  };

  const handleRestore = async (doc: Documento) => {
    setRestoring(true);
    try {
      const { error } = await supabase
        .from("documentos")
        .update({ activo: true })
        .eq("id", doc.id);
      
      if (error) throw error;
      addNotification("Documento restaurado correctamente", "success");
      loadDocumentos();
      loadPapelera();
    } catch (error: any) {
      addNotification("Error al restaurar documento", "error");
    } finally {
      setRestoring(false);
    }
  };

  const confirmHardDelete = async () => {
    if (!selectedDoc) return;
    setDeleting(true);
    try {
      // Borrar de Storage
      const urlParts = selectedDoc.storage_url.split("/");
      const fileName = urlParts[urlParts.length - 1];
      
      if (fileName) {
        await supabase.storage.from("documentos").remove([fileName]);
      }

      // Borrar de DB
      const { error } = await supabase
        .from("documentos")
        .delete()
        .eq("id", selectedDoc.id);
      
      if (error) throw error;
      addNotification("Documento eliminado permanentemente", "success");
      loadPapelera();
    } catch (error: any) {
      addNotification("Error al eliminar permanentemente", "error");
    } finally {
      setDeleting(false);
      setShowHardDeleteModal(false);
      setSelectedDoc(null);
    }
  };

  const emptyTrash = async () => {
    if (!confirm("¿Estás seguro de que deseas vaciar la papelera? Esta acción no se puede deshacer.")) return;
    setDeleting(true);
    try {
      // Obtener todos los IDs de archivos en papelera
      for (const doc of documentosPapelera) {
        const urlParts = doc.storage_url.split("/");
        const fileName = urlParts[urlParts.length - 1];
        if (fileName) {
          await supabase.storage.from("documentos").remove([fileName]);
        }
      }

      // Borrar todos en DB
      const { error } = await supabase
        .from("documentos")
        .delete()
        .eq("activo", false);
      
      if (error) throw error;
      addNotification("Papelera vaciada correctamente", "success");
      loadPapelera();
    } catch (error: any) {
      addNotification("Error al vaciar papelera", "error");
    } finally {
      setDeleting(false);
    }
  };

  const plantillaColumns = [
    {
      key: "tipo",
      label: "Tipo de Plantilla",
      render: (value: string) => {
        const icons = {
          constancia: <FileText className="inline w-5 h-5 mr-2" style={{ color: colors.primary }} />,
          receta: <FileCheck className="inline w-5 h-5 mr-2" style={{ color: colors.secondary }} />,
          diagnostico: <FileBadge className="inline w-5 h-5 mr-2" style={{ color: colors.accent }} />,
        };
        return (
          <span className="capitalize font-medium flex items-center">
            {icons[value as keyof typeof icons]}
            {value}
          </span>
        );
      },
    },
    {
      key: "updated_at",
      label: "Última Actualización",
      render: (value: string) => new Date(value).toLocaleDateString("es-MX", {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
      }),
    },
  ];

  const documentoColumns = [
    {
      key: "titulo",
      label: "Título",
      render: (value: string) => <span className="font-medium">{value}</span>
    },
    {
      key: "pacientes",
      label: "Paciente",
      render: (value: any) => value?.nombre_completo || "N/A"
    },
    {
      key: "created_at",
      label: "Fecha",
      render: (value: string) => new Date(value).toLocaleDateString("es-MX")
    }
  ];

  const tabsConfig = [
    { id: "documentos", label: "Documentos", icon: "📄" },
    { id: "plantillas", label: "Plantillas", icon: "⚙️" },
    { id: "papelera", label: "Papelera", icon: "🗑️" }
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      <NotificationManager notifications={notifications} onRemove={removeNotification} />

      <Header
        title="Gestión de Documentos"
        subtitle="Administra plantillas y visualiza documentos generados"
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Tabs tabs={tabsConfig}>
          <TabPanel tabId="documentos">
            <div className="flex justify-end mb-4">
              <Button onClick={() => setIsGenModalOpen(true)}>
                ➕ Nuevo Documento
              </Button>
            </div>
            
            <DataTable
              columns={documentoColumns}
              data={documentos}
              actions={(row) => (
                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelectedDoc(row);
                      setShowPdfModal(true);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-1" /> Ver
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDelete(row)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
              emptyMessage={loading ? "Cargando documentos..." : "No hay documentos generados aún."}
            />
          </TabPanel>

          <TabPanel tabId="plantillas">
            <div className="flex justify-end mb-4">
              <Button onClick={() => {
                setSelectedPlantilla(null);
                setIsModalOpen(true);
              }}>
                ➕ Nueva Plantilla
              </Button>
            </div>

            <div className="mb-6 p-4 rounded-lg flex items-start gap-3" style={{ backgroundColor: colors.surface, borderLeft: `4px solid ${colors.primary}` }}>
              <span className="text-xl">💡</span>
              <div>
                <p className="font-medium" style={{ color: colors.text }}>Sobre las plantillas</p>
                <p className="text-sm mt-1 leading-relaxed" style={{ color: colors.textMuted }}>
                  Estas plantillas son el texto base que se usará al generar documentos.
                  Puedes usar <strong style={{ color: colors.primary }}>[NOMBRE DEL PACIENTE]</strong> y <strong style={{ color: colors.primary }}>[FECHA]</strong> para que se autocompleten.
                </p>
              </div>
            </div>

            <DataTable
              columns={plantillaColumns}
              data={plantillas}
              actions={(row) => (
                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedPlantilla(row);
                      setIsModalOpen(true);
                    }}
                  >
                    ✏️ Editar Plantilla
                  </Button>
                </div>
              )}
              emptyMessage={loading ? "Cargando plantillas..." : "No se encontraron plantillas."}
            />
          </TabPanel>
          <TabPanel tabId="papelera">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm" style={{ color: colors.textMuted }}>
                Documentos pendientes de eliminación permanente ({documentosPapelera.length})
              </p>
              <Button 
                variant="danger" 
                size="sm" 
                onClick={emptyTrash} 
                disabled={documentosPapelera.length === 0 || deleting}
              >
                🗑️ Vaciar Papelera
              </Button>
            </div>
            
            <DataTable
              columns={documentoColumns}
              data={documentosPapelera}
              actions={(row) => (
                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRestore(row)}
                    disabled={restoring}
                  >
                    🔄 Restaurar
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      setSelectedDoc(row);
                      setShowHardDeleteModal(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
              emptyMessage={loading ? "Cargando papelera..." : "La papelera está vacía."}
            />
          </TabPanel>
        </Tabs>
      </main>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPlantilla(null);
        }}
        title={selectedPlantilla ? `Editar Plantilla: ${selectedPlantilla.tipo.charAt(0).toUpperCase()}${selectedPlantilla.tipo.slice(1)}` : "Nueva Plantilla"}
        size="xl"
      >
        <PlantillaForm
          plantilla={selectedPlantilla}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPlantilla(null);
          }}
          onSuccess={() => {
            addNotification(selectedPlantilla ? "Plantilla actualizada exitosamente" : "Plantilla creada exitosamente", "success");
            setIsModalOpen(false);
            setSelectedPlantilla(null);
            loadPlantillas();
          }}
          onError={(err) => {
            addNotification(`Error: ${err}`, "error");
          }}
        />
      </Modal>

      <GeneradorDocumentoModal
        isOpen={isGenModalOpen}
        onClose={() => setIsGenModalOpen(false)}
        onSuccess={() => {
          addNotification("Documento generado exitosamente", "success");
          setIsGenModalOpen(false);
          loadDocumentos();
        }}
        onError={(err) => addNotification(`Error: ${err}`, "error")}
      />

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
                  <strong>Paciente:</strong> {selectedDoc.pacientes?.nombre_completo}
                </p>
                <p className="text-sm" style={{ color: colors.textMuted }}>
                  <strong>Fecha:</strong> {new Date(selectedDoc.created_at).toLocaleDateString("es-MX")}
                </p>
              </div>
              <a
                href={selectedDoc.storage_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm px-3 py-1.5 rounded-lg font-medium text-white transition-all hover:opacity-90"
                style={{ backgroundColor: colors.primary }}
              >
                📥 Descargar PDF
              </a>
            </div>
            <div className="border rounded-lg overflow-hidden bg-gray-100" style={{ borderColor: colors.primaryLight }}>
              <iframe
                src={selectedDoc.storage_url}
                className="w-full"
                style={{ height: "70vh" }}
                title="Visor de PDF"
              />
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Mover a Papelera"
        message={`¿Estás seguro de que deseas mover "${selectedDoc?.titulo}" a la papelera? Podrás restaurarlo más tarde.`}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setSelectedDoc(null);
        }}
        loading={deleting}
      />

      <ConfirmModal
        isOpen={showHardDeleteModal}
        title="Eliminar Permanentemente"
        message={`Esta acción eliminará "${selectedDoc?.titulo}" tanto de la base de datos como del almacenamiento de forma definitiva. ¿Continuar?`}
        onConfirm={confirmHardDelete}
        onCancel={() => {
          setShowHardDeleteModal(false);
          setSelectedDoc(null);
        }}
        loading={deleting}
      />
    </div>
  );
}

interface PlantillaFormProps {
  plantilla: Plantilla | null;
  onClose: () => void;
  onSuccess: () => void;
  onError: (err: string) => void;
}

function PlantillaForm({ plantilla, onClose, onSuccess, onError }: PlantillaFormProps) {
  const [loading, setLoading] = useState(false);
  const [tipo, setTipo] = useState<Plantilla["tipo"]>(plantilla?.tipo || "constancia");
  const [contenido, setContenido] = useState(plantilla?.contenido_base || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contenido.trim()) {
      alert("El contenido no puede estar vacío");
      return;
    }

    setLoading(true);

    try {
      if (plantilla) {
        // Update
        const { error } = await supabase
          .from("plantillas_documentos")
          .update({
            contenido_base: contenido,
            updated_at: new Date().toISOString(),
          })
          .eq("id", plantilla.id);

        if (error) throw error;
      } else {
        // Create
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("No session");

        const { error } = await supabase
          .from("plantillas_documentos")
          .insert({
            tipo,
            contenido_base: contenido,
            terapeuta_id: session.user.id,
          });

        if (error) throw error;
      }
      onSuccess();
    } catch (error: any) {
      onError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-4">
        {!plantilla && (
          <div className="mb-4">
            <Input
              label="Nombre de la Plantilla"
              value={tipo}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTipo(e.target.value)}
              placeholder="Ej: Constancia Médica Básica"
              required
            />
          </div>
        )}

        <EditorRico
          label="Contenido de la Plantilla"
          value={contenido}
          onChange={setContenido}
          placeholder="Escribe el texto de la plantilla aquí..."
        />
        
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 mt-8">
          <p className="text-xs font-semibold text-blue-800 mb-1">💡 Variables dinámicas:</p>
          <p className="text-xs text-blue-700 leading-relaxed">
            Usa <code className="bg-white px-1 rounded border border-blue-200">[NOMBRE DEL PACIENTE]</code> para que se autocompleta con el nombre real y <code className="bg-white px-1 rounded border border-blue-200">[FECHA]</code> para la fecha actual.
          </p>
        </div>
      </div>

      <div className="flex gap-3 justify-end mt-6">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!!(loading || !contenido.trim() || (plantilla && contenido === plantilla.contenido_base))}>
          {loading ? "Guardando..." : plantilla ? "Guardar Cambios" : "Crear Plantilla"}
        </Button>
      </div>
    </form>
  );
}
