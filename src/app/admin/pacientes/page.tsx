"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { DataTable, SearchBar, Modal, Button, Input, Select, TextArea, Header, FileUpload, NotificationManager, BulkUpload, ConfirmModal, Tabs, TabPanel, GeneradorDocumentoModal } from "@/components/admin";
import { motion } from "framer-motion";
import JSZip from "jszip";
import { saveAs } from "file-saver";

import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { colors } from "@/lib/theme";

interface Paciente {
  id: string;
  nombre_completo: string;
  email: string;
  telefono: string;
  fecha_nacimiento: string;
  genero: string;
  ocupacion: string;
  notas?: string;
  created_at: string;
  activo?: boolean;
  estado?: 'activo' | 'archivado';
}

export default function PacientesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'activo' | 'archivado'>('activo');
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
    loadPacientes();
  }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/admin/login");
      return;
    }
  }

  async function loadPacientes() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const query = supabase
      .from("pacientes")
      .select("*")
      .eq("terapeuta_id", session.user.id)
      .order("nombre_completo", { ascending: true });

    if (filtroEstado !== 'todos') {
      query.eq("activo", filtroEstado === 'activo');
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error loading pacientes:", error);
      return;
    }

    setPacientes(data || []);
    setLoading(false);
  }

  const filteredPacientes = pacientes.filter((p) =>
    p.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      key: "nombre_completo",
      label: "Nombre"
    },
    { key: "email", label: "Email" },
    { key: "telefono", label: "Teléfono" },
    {
      key: "fecha_nacimiento",
      label: "Edad",
      render: (value: string) => {
        const age = new Date().getFullYear() - new Date(value).getFullYear();
        return `${age} años`;
      },
    },
    {
      key: "activo",
      label: "Estado",
      render: (value: boolean) => (
        <span className={`px-2 py-1 rounded text-xs ${value !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {value !== false ? 'Activo' : 'Archivado'}
        </span>
      ),
    },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      {/* Notificaciones */}
      <NotificationManager notifications={notifications} onRemove={removeNotification} />

      {/* Header con logo */}
      <Header
        title="Pacientes"
        subtitle="Gestión de expedientes"
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Filtro de estado */}
          <div className="flex gap-3 mb-4">
            <Select
              value={filtroEstado}
              onChange={(e) => {
                setFiltroEstado(e.target.value as any);
                setTimeout(loadPacientes, 100);
              }}
              options={[
                { value: 'activo', label: 'Pacientes Activos' },
                { value: 'archivado', label: 'Pacientes Archivados' },
                { value: 'todos', label: 'Todos los Pacientes' },
              ]}
            />
            <div className="flex-1">
              <SearchBar
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={setSearchTerm}
                onAdd={() => {
                  setSelectedPaciente(null);
                  setIsModalOpen(true);
                }}
                addLabel="Paciente"
              />
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filteredPacientes}
            onRowClick={(row) => {
              setSelectedPaciente(row);
              setIsModalOpen(true);
            }}
            actions={(row) => (
              <Button size="sm" onClick={() => {
                setSelectedPaciente(row);
                setIsModalOpen(true);
              }}>
                Ver
              </Button>
            )}
            emptyMessage="No hay pacientes registrados"
          />
        </motion.div>
      </main>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPaciente(null);
        }}
        title={selectedPaciente?.id ? "Expediente del Paciente" : "Nuevo Paciente"}
        size="xl"
      >
        {selectedPaciente?.id ? (
          <PacienteDetalle
            paciente={selectedPaciente}
            addNotification={addNotification}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedPaciente(null);
              loadPacientes();
            }}
          />
        ) : (
          <PacienteForm
            onClose={() => {
              setIsModalOpen(false);
              loadPacientes();
            }}
            addNotification={addNotification}
          />
        )}
      </Modal>
    </div>
  );
}

function PacienteForm({ onClose, addNotification }: { onClose: () => void; addNotification: (message: string, type: "success" | "error" | "info") => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    fecha_nacimiento: "",
    genero: "Femenino",
    ocupacion: "",
    notas: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      addNotification("No hay sesión activa. Inicia sesión nuevamente.", "error");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("pacientes").insert({
      nombre_completo: formData.nombre,
      email: formData.email,
      telefono: formData.telefono,
      fecha_nacimiento: formData.fecha_nacimiento,
      genero: formData.genero,
      ocupacion: formData.ocupacion,
      notas: formData.notas,
      activo: true,
      terapeuta_id: session.user.id,
      created_at: new Date().toISOString(),
    });

    if (error) {
      addNotification("Error al guardar: " + error.message, "error");
    } else {
      addNotification("✅ Paciente registrado exitosamente", "success");
      onClose();
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="Nombre completo"
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          required
        />
        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
        <Input
          label="Teléfono"
          value={formData.telefono}
          onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
        />
        <Input
          label="Fecha de nacimiento"
          type="date"
          value={formData.fecha_nacimiento}
          onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
          required
        />
        <Select
          label="Género"
          value={formData.genero}
          onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
          options={[
            { value: "Femenino", label: "Femenino" },
            { value: "Masculino", label: "Masculino" },
            { value: "Otro", label: "Otro" },
            { value: "Prefiero no decirlo", label: "Prefiero no decirlo" },
          ]}
        />
        <Input
          label="Ocupación"
          value={formData.ocupacion}
          onChange={(e) => setFormData({ ...formData, ocupacion: e.target.value })}
        />
      </div>
      <TextArea
        label="Notas adicionales"
        value={formData.notas}
        onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
        rows={3}
      />
      <div className="flex gap-3 justify-end mt-4">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Guardar Paciente"}
        </Button>
      </div>
    </form>
  );
}

function PacienteDetalle({ paciente, onClose, addNotification }: { paciente: Paciente; onClose: () => void; addNotification: (message: string, type: "success" | "error" | "info") => void }) {
  const edad = new Date().getFullYear() - new Date(paciente.fecha_nacimiento).getFullYear();
  const [archivando, setArchivando] = useState(false);
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [testsAplicados, setTestsAplicados] = useState<any[]>([]);
  const [citas, setCitas] = useState<any[]>([]);
  const [cargandoDocumentos, setCargandoDocumentos] = useState(true);
  const [cargandoTests, setCargandoTests] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDocumentoModal, setShowDocumentoModal] = useState(false);
  const [showDeletePacienteModal, setShowDeletePacienteModal] = useState(false);
  const [eliminandoPaciente, setEliminandoPaciente] = useState(false);
  const [respaldando, setRespaldando] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Estado para edición
  const [editando, setEditando] = useState(false);
  const [formData, setFormData] = useState({
    nombre_completo: paciente.nombre_completo,
    email: paciente.email,
    telefono: paciente.telefono,
    fecha_nacimiento: paciente.fecha_nacimiento,
    genero: paciente.genero,
    ocupacion: paciente.ocupacion,
    notas: paciente.notas || "",
  });
  const [guardando, setGuardando] = useState(false);
  const [pacienteData, setPacienteData] = useState<Paciente>(paciente);

  // Cargar documentos del paciente
  useEffect(() => {
    async function loadDocumentos() {
      const { data } = await supabase
        .from("documentos")
        .select("*")
        .eq("paciente_id", paciente.id)
        .eq("activo", true)
        .order("created_at", { ascending: false });

      setDocumentos(data || []);
      setCargandoDocumentos(false);
    }
    loadDocumentos();
  }, [paciente.id, reloadTrigger]);

  // Cargar tests aplicados del paciente
  useEffect(() => {
    async function loadTests() {
      const { data } = await supabase
        .from("resultados_tests")
        .select("*")
        .eq("paciente_id", paciente.id)
        .order("created_at", { ascending: false });

      setTestsAplicados(data || []);
      setCargandoTests(false);
    }
    loadTests();
  }, [paciente.id, reloadTrigger]);

  // Cargar citas del paciente (para conteo de historial)
  useEffect(() => {
    async function loadCitas() {
      const { data } = await supabase
        .from("citas")
        .select("id")
        .eq("paciente_id", paciente.id);
      setCitas(data || []);
    }
    loadCitas();
  }, [paciente.id, reloadTrigger]);

  const triggerReload = () => {
    setReloadTrigger(prev => prev + 1);
  };

  const handleSaveChanges = async () => {
    setGuardando(true);

    try {
      const { error, data } = await supabase
        .from("pacientes")
        .update({
          nombre_completo: formData.nombre_completo,
          email: formData.email,
          telefono: formData.telefono,
          fecha_nacimiento: formData.fecha_nacimiento,
          genero: formData.genero,
          ocupacion: formData.ocupacion,
          notas: formData.notas,
          updated_at: new Date().toISOString(),
        })
        .eq("id", paciente.id)
        .select()
        .single();

      if (error) throw error;

      // Actualizar datos del paciente localmente
      if (data) {
        setPacienteData(data);
      }

      addNotification("Datos actualizados exitosamente", "success");
      setEditando(false);
      triggerReload();
    } catch (error: any) {
      addNotification(`Error: ${error.message}`, "error");
    } finally {
      setGuardando(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      nombre_completo: pacienteData.nombre_completo,
      email: pacienteData.email,
      telefono: pacienteData.telefono,
      fecha_nacimiento: pacienteData.fecha_nacimiento,
      genero: pacienteData.genero,
      ocupacion: pacienteData.ocupacion,
      notas: pacienteData.notas || "",
    });
    setEditando(false);
  };

  const handleDeleteDoc = async (doc: any) => {
    setSelectedDoc(doc);
    setShowDeleteModal(true);
  };

  const confirmDeleteDoc = async () => {
    if (!selectedDoc) return;

    setDeleting(true);

    // Optimistic update - remover de la lista inmediatamente
    setDocumentos((prev) => prev.filter((d) => d.id !== selectedDoc.id));

    try {
      const { error } = await supabase
        .from("documentos")
        .update({ activo: false })
        .eq("id", selectedDoc.id);

      if (error) throw error;

      addNotification("Documento eliminado", "success");
      triggerReload();
    } catch (error: any) {
      addNotification(`Error: ${error.message}`, "error");
      // Revertir el optimistic update si hubo error
      triggerReload();
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setSelectedDoc(null);
    }
  };

  const toggleArchivo = async () => {
    setArchivando(true);
    const nuevoActivo = !pacienteData.activo;

    const { error } = await supabase
      .from("pacientes")
      .update({ activo: nuevoActivo })
      .eq("id", pacienteData.id);

    if (error) {
      addNotification("Error: " + error.message, "error");
    } else {
      addNotification(`✅ Paciente ${nuevoActivo ? 'reactivado' : 'archivado'} exitosamente`, "success");
      onClose();
    }
    setArchivando(false);
  };

  const totalHistorial = documentos.length + testsAplicados.length + citas.length;

  const handleDeletePaciente = async () => {
    setEliminandoPaciente(true);
    try {
      // 1. Borrar documentos del storage
      for (const doc of documentos) {
        if (doc.storage_url) {
          const urlParts = doc.storage_url.split("/");
          const fileName = urlParts[urlParts.length - 1];
          if (fileName) {
            await supabase.storage.from("documentos").remove([fileName]);
          }
        }
      }

      // 2. Borrar documentos de la DB
      await supabase.from("documentos").delete().eq("paciente_id", paciente.id);

      // 3. Borrar resultados de tests
      await supabase.from("resultados_tests").delete().eq("paciente_id", paciente.id);

      // 4. Borrar citas
      await supabase.from("citas").delete().eq("paciente_id", paciente.id);

      // 5. Borrar paciente
      const { error } = await supabase.from("pacientes").delete().eq("id", paciente.id);

      if (error) throw error;

      addNotification("Paciente y todo su historial eliminados permanentemente", "success");
      onClose();
    } catch (error: any) {
      addNotification("Error al eliminar paciente: " + error.message, "error");
    } finally {
      setEliminandoPaciente(false);
      setShowDeletePacienteModal(false);
    }
  };

  const handleBackup = async () => {
    setRespaldando(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder(`Respaldo_${pacienteData.nombre_completo.replace(/\s+/g, '_')}`);
      if (!folder) throw new Error("No se pudo crear la carpeta del ZIP");

      // 1. Agregar resumen JSON del paciente
      const resumen = {
        paciente: {
          nombre: pacienteData.nombre_completo,
          email: pacienteData.email,
          telefono: pacienteData.telefono,
          fecha_nacimiento: pacienteData.fecha_nacimiento,
          genero: pacienteData.genero,
          ocupacion: pacienteData.ocupacion,
          notas: pacienteData.notas,
          fecha_registro: pacienteData.created_at,
        },
        tests_aplicados: testsAplicados.map(t => ({
          fecha: t.created_at,
          puntaje: t.puntaje_total,
          interpretacion: t.interpretacion,
          respuestas: t.respuestas,
        })),
        citas: citas,
        total_documentos: documentos.length,
        fecha_respaldo: new Date().toISOString(),
      };
      folder.file("resumen_historial.json", JSON.stringify(resumen, null, 2));

      // 2. Descargar cada documento del storage y añadirlo al ZIP
      let descargados = 0;
      for (const doc of documentos) {
        if (doc.storage_url) {
          try {
            const response = await fetch(doc.storage_url);
            if (response.ok) {
              const blob = await response.blob();
              const safeName = (doc.titulo || `documento_${doc.id.slice(0, 8)}`).replace(/[^a-zA-Z0-9_áéíóúñÁÉÍÓÚÑ .\-]/g, '_');
              const ext = doc.storage_url.split('.').pop()?.split('?')[0] || 'pdf';
              folder.file(`${safeName}.${ext}`, blob);
              descargados++;
            }
          } catch (e) {
            console.warn(`No se pudo descargar: ${doc.titulo}`, e);
          }
        }
      }

      // 3. Generar y descargar el ZIP
      const content = await zip.generateAsync({ type: "blob" });
      const fechaHoy = new Date().toISOString().split('T')[0];
      saveAs(content, `Respaldo_${pacienteData.nombre_completo.replace(/\s+/g, '_')}_${fechaHoy}.zip`);

      addNotification(`✅ Respaldo generado con ${descargados} archivo(s) descargado(s)`, "success");
    } catch (error: any) {
      addNotification("Error al generar respaldo: " + error.message, "error");
    } finally {
      setRespaldando(false);
    }
  };

  return (
    <div>
      {/* Acciones Superiores - Siempre Visibles */}
      <div className="flex items-center justify-between mb-3 p-3 rounded-lg" style={{ backgroundColor: colors.background }}>
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold" style={{ color: colors.text }}>
            👤 {pacienteData.nombre_completo}
          </h2>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${pacienteData.activo !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
            {pacienteData.activo !== false ? 'Activo' : 'Archivado'}
          </span>
        </div>
        <div className="flex gap-2">
          {editando ? (
            <>
              <Button size="sm" variant="ghost" onClick={handleCancelEdit} disabled={guardando}>
                ❌ Cancelar
              </Button>
              <Button size="sm" onClick={handleSaveChanges} disabled={guardando}>
                {guardando ? "💾 Guardando..." : "💾 Guardar"}
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="ghost" onClick={onClose}>
                ❌ Cerrar
              </Button>
              <Button size="sm" onClick={() => setEditando(true)}>
                ✏️ Editar
              </Button>
              <Button
                size="sm"
                variant={paciente.activo !== false ? 'danger' : 'primary'}
                onClick={toggleArchivo}
                disabled={archivando}
              >
                {archivando ? 'Procesando...' : (paciente.activo !== false ? '📁 Archivar' : '✅ Reactivar')}
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => setShowDeletePacienteModal(true)}
              >
                🗑️ Eliminar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleBackup}
                disabled={respaldando}
              >
                {respaldando ? '⏳ Respaldando...' : '💾 Respaldar'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div>
        <Tabs
          tabs={[
            { id: "datos", label: "Datos Generales", icon: "📋" },
            { id: "documentos", label: "Archivos", icon: "📁" },
            { id: "tests", label: "Tests", icon: "📊" },
            { id: "constancias", label: "Constancias", icon: "📄" },
            { id: "recetas", label: "Recetas", icon: "💊" },
            { id: "diagnosticos", label: "Diagnósticos", icon: "🩺" },
          ]}
          defaultTab="datos"
        >
          {/* Pestaña: Datos Generales */}
          <TabPanel tabId="datos">
            {editando ? (
              /* Formulario de Edición */
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: colors.text }}>Nombre completo</label>
                    <Input
                      value={formData.nombre_completo}
                      onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: colors.text }}>Email</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: colors.text }}>Teléfono</label>
                    <Input
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: colors.text }}>Fecha de nacimiento</label>
                    <Input
                      type="date"
                      value={formData.fecha_nacimiento}
                      onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: colors.text }}>Género</label>
                    <Select
                      value={formData.genero}
                      onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
                      options={[
                        { value: "Femenino", label: "Femenino" },
                        { value: "Masculino", label: "Masculino" },
                        { value: "Otro", label: "Otro" },
                        { value: "Prefiero no decirlo", label: "Prefiero no decirlo" },
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: colors.text }}>Ocupación</label>
                    <Input
                      value={formData.ocupacion}
                      onChange={(e) => setFormData({ ...formData, ocupacion: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-xs font-medium mb-1" style={{ color: colors.text }}>Notas</label>
                    <TextArea
                      value={formData.notas}
                      onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                      rows={3}
                      placeholder="Notas adicionales del paciente..."
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Vista de solo lectura */
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2" style={{ color: colors.text }}>Información Personal</h3>
                    <div className="space-y-2 text-sm" style={{ color: colors.textMuted }}>
                      <p><strong>Nombre:</strong> {pacienteData.nombre_completo}</p>
                      <p><strong>Email:</strong> {pacienteData.email}</p>
                      <p><strong>Teléfono:</strong> {pacienteData.telefono}</p>
                      <p><strong>Fecha de nacimiento:</strong> {new Date(pacienteData.fecha_nacimiento).toLocaleDateString("es-MX")}</p>
                      <p><strong>Edad:</strong> {edad} años</p>
                      <p><strong>Género:</strong> {pacienteData.genero}</p>
                      <p><strong>Ocupación:</strong> {pacienteData.ocupacion}</p>
                      <p><strong>Estado:</strong>
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${pacienteData.activo !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {pacienteData.activo !== false ? 'Activo' : 'Archivado'}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2" style={{ color: colors.text }}>Información del Registro</h3>
                    <div className="space-y-2 text-sm" style={{ color: colors.textMuted }}>
                      <p><strong>Fecha de registro:</strong> {new Date(pacienteData.created_at).toLocaleDateString("es-MX")}</p>
                      <p><strong>ID:</strong> {pacienteData.id.slice(0, 8)}...</p>
                    </div>
                  </div>
                </div>

                {/* Notas del Paciente */}
                {pacienteData.notas && (
                  <div className="mt-4">
                    <h3 className="font-semibold mb-2" style={{ color: colors.text }}>📝 Notas</h3>
                    <div
                      className="p-3 rounded-lg border text-sm overflow-y-auto"
                      style={{
                        backgroundColor: colors.background,
                        borderColor: colors.primaryLight,
                        maxHeight: "80px",
                        minHeight: "80px",
                      }}
                    >
                      {pacienteData.notas}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabPanel>

          {/* Pestaña: Documentos */}
          <TabPanel tabId="documentos">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: colors.text }}>📁 Archivos Adjuntos</h3>
              <Button
                size="sm"
                onClick={() => setShowUploadModal(true)}
              >
                📎 Adjuntar PDF
              </Button>
            </div>

            {cargandoDocumentos ? (
              <p style={{ color: colors.textMuted }}>Cargando documentos...</p>
            ) : documentos.length === 0 ? (
              <p style={{ color: colors.textMuted }}>No hay documentos adjuntos</p>
            ) : (
              <div className="space-y-2">
                {documentos.filter(doc => doc.tipo === 'archivo').map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 rounded"
                    style={{ backgroundColor: colors.surface }}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-xl">
                        {doc.tipo === 'constancia' && '📋'}
                        {doc.tipo === 'receta' && '💊'}
                        {doc.tipo === 'diagnostico' && '🏥'}
                        {doc.tipo === 'archivo' && '📎'}
                      </span>
                      <div>
                        <p className="font-medium" style={{ color: colors.text }}>
                          {doc.titulo || doc.tipo}
                        </p>
                        <p className="text-xs" style={{ color: colors.textMuted }}>
                          {new Date(doc.created_at).toLocaleDateString("es-MX")}
                          {doc.metadatos?.file_size && (
                            <span className="ml-2">
                              • {(doc.metadatos.file_size / 1024 / 1024).toFixed(2)} MB
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedDoc(doc);
                          setShowPdfModal(true);
                        }}
                      >
                        📄 Ver
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteDoc(doc)}
                      >
                        🗑️
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabPanel>

          {/* Pestaña: Tests */}
          <TabPanel tabId="tests">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: colors.text }}>📊 Tests Aplicados</h3>
              <a
                href="/admin/tests"
                className="text-sm px-3 py-1.5 rounded-lg font-medium text-white transition-all hover:opacity-90"
                style={{ backgroundColor: colors.primary }}
              >
                📋 Aplicar Test
              </a>
            </div>

            {cargandoTests ? (
              <p style={{ color: colors.textMuted }}>Cargando tests...</p>
            ) : testsAplicados.length === 0 ? (
              <p style={{ color: colors.textMuted }}>No hay tests aplicados</p>
            ) : (
              <div className="space-y-2">
                {testsAplicados.map((test, index) => (
                  <div
                    key={test.id}
                    className="flex items-center justify-between p-3 rounded"
                    style={{ backgroundColor: colors.surface }}
                  >
                    <div>
                      <p className="font-medium" style={{ color: colors.text }}>
                        Test #{index + 1} - {new Date(test.created_at).toLocaleDateString("es-MX")}
                      </p>
                      <p className="text-xs" style={{ color: colors.textMuted }}>
                        Puntaje: <strong>{test.puntaje_total || "N/A"}</strong>
                        {test.interpretacion && (
                          <span className="ml-2">• {test.interpretacion?.substring(0, 80)}...</span>
                        )}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedTest(test);
                        setShowTestModal(true);
                      }}
                    >
                      📄 Ver
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabPanel>

          {/* Pestaña: Constancias */}
          <TabPanel tabId="constancias">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: colors.text }}>📄 Constancias Generadas</h3>
              <Button
                size="sm"
                onClick={() => setShowDocumentoModal(true)}
              >
                ➕ Generar
              </Button>
            </div>

            {cargandoDocumentos ? (
              <p style={{ color: colors.textMuted }}>Cargando...</p>
            ) : (
              <div className="space-y-2">
                {documentos
                  .filter((doc) => doc.tipo === "constancia")
                  .map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 rounded"
                      style={{ backgroundColor: colors.surface }}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-xl">📋</span>
                        <div>
                          <p className="font-medium" style={{ color: colors.text }}>
                            {doc.titulo}
                          </p>
                          <p className="text-xs" style={{ color: colors.textMuted }}>
                            {new Date(doc.created_at).toLocaleDateString("es-MX")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" onClick={() => { setSelectedDoc(doc); setShowPdfModal(true); }}>📄 Ver</Button>
                        <Button size="sm" variant="danger" onClick={() => handleDeleteDoc(doc)}>🗑️</Button>
                      </div>
                    </div>
                  ))}
                {documentos.filter((doc) => doc.tipo === "constancia").length === 0 && (
                  <p className="text-sm italic" style={{ color: colors.textMuted }}>No hay constancias generadas aún</p>
                )}
              </div>
            )}
          </TabPanel>

          {/* Pestaña: Recetas */}
          <TabPanel tabId="recetas">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: colors.text }}>💊 Recetas Médicas</h3>
              <Button
                size="sm"
                onClick={() => setShowDocumentoModal(true)}
              >
                ➕ Generar
              </Button>
            </div>

            {cargandoDocumentos ? (
              <p style={{ color: colors.textMuted }}>Cargando...</p>
            ) : (
              <div className="space-y-2">
                {documentos
                  .filter((doc) => doc.tipo === "receta")
                  .map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 rounded"
                      style={{ backgroundColor: colors.surface }}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-xl">💊</span>
                        <div>
                          <p className="font-medium" style={{ color: colors.text }}>
                            {doc.titulo}
                          </p>
                          <p className="text-xs" style={{ color: colors.textMuted }}>
                            {new Date(doc.created_at).toLocaleDateString("es-MX")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" onClick={() => { setSelectedDoc(doc); setShowPdfModal(true); }}>📄 Ver</Button>
                        <Button size="sm" variant="danger" onClick={() => handleDeleteDoc(doc)}>🗑️</Button>
                      </div>
                    </div>
                  ))}
                {documentos.filter((doc) => doc.tipo === "receta").length === 0 && (
                  <p className="text-sm italic" style={{ color: colors.textMuted }}>No hay recetas generadas aún</p>
                )}
              </div>
            )}
          </TabPanel>

          {/* Pestaña: Diagnósticos */}
          <TabPanel tabId="diagnosticos">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: colors.text }}>🩺 Diagnósticos</h3>
              <Button
                size="sm"
                onClick={() => setShowDocumentoModal(true)}
              >
                ➕ Generar
              </Button>
            </div>

            {cargandoDocumentos ? (
              <p style={{ color: colors.textMuted }}>Cargando...</p>
            ) : (
              <div className="space-y-2">
                {documentos
                  .filter((doc) => doc.tipo === "diagnostico")
                  .map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 rounded"
                      style={{ backgroundColor: colors.surface }}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-xl">🏥</span>
                        <div>
                          <p className="font-medium" style={{ color: colors.text }}>
                            {doc.titulo}
                          </p>
                          <p className="text-xs" style={{ color: colors.textMuted }}>
                            {new Date(doc.created_at).toLocaleDateString("es-MX")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" onClick={() => { setSelectedDoc(doc); setShowPdfModal(true); }}>📄 Ver</Button>
                        <Button size="sm" variant="danger" onClick={() => handleDeleteDoc(doc)}>🗑️</Button>
                      </div>
                    </div>
                  ))}
                {documentos.filter((doc) => doc.tipo === "diagnostico").length === 0 && (
                  <p className="text-sm italic" style={{ color: colors.textMuted }}>No hay diagnósticos generados aún</p>
                )}
              </div>
            )}
          </TabPanel>
        </Tabs>
      </div>

      {/* Modal de Bulk Upload */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title={`Adjuntar PDFs - ${paciente.nombre_completo}`}
        size="md"
      >
        <BulkUpload
          pacienteId={paciente.id}
          pacienteNombre={paciente.nombre_completo}
          onSuccess={() => {
            addNotification("Documentos subidos exitosamente", "success");
            setShowUploadModal(false);
            triggerReload();
          }}
          onClose={() => setShowUploadModal(false)}
        />
      </Modal>

      {/* Modal para ver PDF */}
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

      {/* Modal para ver Test */}
      <Modal
        isOpen={showTestModal}
        onClose={() => {
          setShowTestModal(false);
          setSelectedTest(null);
        }}
        title="Detalles del Test"
        size="lg"
      >
        {selectedTest && (
          <div>
            <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
              <h3 className="font-semibold mb-2" style={{ color: colors.text }}>Información del Test</h3>
              <div className="space-y-2 text-sm" style={{ color: colors.textMuted }}>
                <p><strong>Fecha de aplicación:</strong> {new Date(selectedTest.created_at).toLocaleDateString("es-MX")}</p>
                <p><strong>Paciente:</strong> {selectedTest.nombre_paciente}</p>
                <p><strong>Puntaje Total:</strong> <span className="font-bold" style={{ color: colors.primary }}>{selectedTest.puntaje_total || "N/A"}</span></p>
                {selectedTest.rango_obtenido && (
                  <p><strong>Rango:</strong> {selectedTest.rango_obtenido}</p>
                )}
              </div>
            </div>

            {selectedTest.interpretacion && (
              <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: colors.surface, border: `2px solid ${colors.primaryLight}` }}>
                <h3 className="font-semibold mb-2" style={{ color: colors.text }}>📋 Interpretación</h3>
                <p style={{ color: colors.text }}>{selectedTest.interpretacion}</p>
              </div>
            )}

            {selectedTest.recomendaciones && (
              <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: colors.surface, border: `2px solid ${colors.secondary}` }}>
                <h3 className="font-semibold mb-2" style={{ color: colors.text }}>💡 Recomendaciones</h3>
                <div className="space-y-2 text-sm" style={{ color: colors.textMuted }}>
                  {Array.isArray(selectedTest.recomendaciones)
                    ? selectedTest.recomendaciones.map((rec: string, idx: number) => (
                      <p key={idx}>• {rec}</p>
                    ))
                    : selectedTest.recomendaciones
                  }
                </div>
              </div>
            )}

            {selectedTest.respuestas && (
              <div className="p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
                <h3 className="font-semibold mb-2" style={{ color: colors.text }}>📝 Respuestas</h3>
                <div className="space-y-2 text-sm" style={{ color: colors.textMuted }}>
                  {Object.entries(selectedTest.respuestas).map(([key, value]: [string, any]) => (
                    <p key={key}>
                      <strong>Pregunta {key}:</strong> {String(value)}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal de confirmación para eliminar */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Eliminar Documento"
        message={`¿Estás seguro de que deseas eliminar "${selectedDoc?.titulo}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={confirmDeleteDoc}
        onCancel={() => {
          setShowDeleteModal(false);
          setSelectedDoc(null);
        }}
        loading={deleting}
      />

      {/* Modal de eliminación definitiva del paciente */}
      <Modal
        isOpen={showDeletePacienteModal}
        onClose={() => setShowDeletePacienteModal(false)}
        title="⚠️ Eliminar Paciente Permanentemente"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-lg border-2 border-red-300 bg-red-50">
            <p className="font-bold text-red-800 text-sm mb-2">⚠️ Esta acción es IRREVERSIBLE</p>
            <p className="text-sm text-red-700 leading-relaxed">
              Estás a punto de eliminar permanentemente a <strong>{pacienteData.nombre_completo}</strong> y todo su historial clínico.
            </p>
          </div>

          {totalHistorial > 0 && (
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
              <p className="font-bold text-amber-800 text-sm mb-2">📋 Historial que será eliminado:</p>
              <ul className="text-sm text-amber-700 space-y-1">
                {documentos.length > 0 && (
                  <li>📄 <strong>{documentos.length}</strong> documento(s) (incluyendo PDFs del storage)</li>
                )}
                {testsAplicados.length > 0 && (
                  <li>📊 <strong>{testsAplicados.length}</strong> resultado(s) de test(s)</li>
                )}
                {citas.length > 0 && (
                  <li>📅 <strong>{citas.length}</strong> cita(s)</li>
                )}
              </ul>
            </div>
          )}

          {totalHistorial === 0 && (
            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <p className="text-sm text-green-700">✅ Este paciente no tiene historial asociado. Se puede eliminar de forma segura.</p>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => setShowDeletePacienteModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleDeletePaciente}
              disabled={eliminandoPaciente}
            >
              {eliminandoPaciente ? "Eliminando..." : `🗑️ Eliminar Paciente${totalHistorial > 0 ? ` y ${totalHistorial} registro(s)` : ''}`}
            </Button>
          </div>
        </div>
      </Modal>

      <GeneradorDocumentoModal
        isOpen={showDocumentoModal}
        onClose={() => setShowDocumentoModal(false)}
        paciente={paciente}
        onSuccess={() => {
          addNotification("Documento generado exitosamente", "success");
          setShowDocumentoModal(false);
          triggerReload();
        }}
        onError={(err) => {
          addNotification(`Error: ${err}`, "error");
        }}
      />
    </div>
  );
}
