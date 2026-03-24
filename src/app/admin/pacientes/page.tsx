"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { DataTable, SearchBar, Modal, Button, Input, Select, TextArea, Header, FileUpload, NotificationManager, BulkUpload, ConfirmModal, Tabs, TabPanel } from "@/components/admin";
import { motion } from "framer-motion";

const colors = {
  primary: "#D4A5A5",
  primaryLight: "#E8C4C4",
  primaryDark: "#B88B8B",
  secondary: "#C9B1B1",
  accent: "#E5989B",
  background: "#FDF8F8",
  surface: "#FFFFFF",
  text: "#3D2929",
  textMuted: "#7D6B6B",
};

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
    const query = supabase
      .from("pacientes")
      .select("*")
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
          />
        )}
      </Modal>
    </div>
  );
}

function PacienteForm({ onClose }: { onClose: () => void }) {
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

    const { error } = await supabase.from("pacientes").insert({
      nombre_completo: formData.nombre,
      email: formData.email,
      telefono: formData.telefono,
      fecha_nacimiento: formData.fecha_nacimiento,
      genero: formData.genero,
      ocupacion: formData.ocupacion,
      notas: formData.notas,
      activo: true,
      created_at: new Date().toISOString(),
    });

    if (error) {
      alert("Error al guardar: " + error.message);
    } else {
      alert("Paciente registrado exitosamente");
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
  const [cargandoDocumentos, setCargandoDocumentos] = useState(true);
  const [cargandoTests, setCargandoTests] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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
      alert("Error: " + error.message);
    } else {
      alert(`Paciente ${nuevoActivo ? 'reactivado' : 'archivado'} exitosamente`);
      onClose();
    }
    setArchivando(false);
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
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div>
        <Tabs
          tabs={[
            { id: "datos", label: "Datos Generales", icon: "📋" },
            { id: "documentos", label: "Documentos", icon: "📄" },
            { id: "tests", label: "Tests", icon: "📊" },
            { id: "constancias", label: "Constancias", icon: "📑" },
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
              <h3 className="font-semibold" style={{ color: colors.text }}>📄 Documentos del Paciente</h3>
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
                {documentos.map((doc) => (
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
              <h3 className="font-semibold" style={{ color: colors.text }}>📑 Constancias y Recetas</h3>
              <a
                href={`/admin/documentos?paciente=${paciente.id}`}
                className="text-sm px-3 py-1.5 rounded-lg font-medium text-white transition-all hover:opacity-90"
                style={{ backgroundColor: colors.primary }}
              >
                📄 Generar Documento
              </a>
            </div>

            {cargandoDocumentos ? (
              <p style={{ color: colors.textMuted }}>Cargando documentos...</p>
            ) : (
              <div className="space-y-2">
                {documentos
                  .filter((doc) => ["constancia", "receta", "diagnostico"].includes(doc.tipo))
                  .map((doc) => (
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
                        </span>
                        <div>
                          <p className="font-medium" style={{ color: colors.text }}>
                            {doc.titulo || doc.tipo}
                          </p>
                          <p className="text-xs" style={{ color: colors.textMuted }}>
                            {new Date(doc.created_at).toLocaleDateString("es-MX")}
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
                {documentos.filter((doc) => ["constancia", "receta", "diagnostico"].includes(doc.tipo)).length === 0 && (
                  <p style={{ color: colors.textMuted }}>No hay constancias o recetas generadas</p>
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
    </div>
  );
}
