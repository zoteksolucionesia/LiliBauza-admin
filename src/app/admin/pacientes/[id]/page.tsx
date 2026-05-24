"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, useParams } from "next/navigation";
import { Button, Input, Select, TextArea, Modal, FileUpload, NotificationManager, BulkUpload, ConfirmModal, Header } from "@/components/admin";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { colors } from "@/lib/theme";
import { ChevronLeft, FileText, Calendar, User, Save, X } from "lucide-react";

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
}

interface Documento {
  id: string;
  titulo: string;
  tipo: string;
  created_at: string;
  storage_url: string;
  activo: boolean;
}

interface Test {
  id: string;
  nombre_test: string;
  puntaje_total?: number;
  rango_obtenido?: string;
  created_at: string;
  interpretacion_ia?: string;
}

export default function PacienteDetallePage() {
  const router = useRouter();
  const params = useParams();
  const pacienteId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [citas, setCitas] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; type: "success" | "error" | "info" }>>([]);

  const [activeTab, setActiveTab] = useState("info");
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [archivando, setArchivando] = useState(false);

  const [formData, setFormData] = useState({
    nombre_completo: "",
    email: "",
    telefono: "",
    fecha_nacimiento: "",
    genero: "",
    ocupacion: "",
    notas: "",
  });

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Documento | null>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showDeletePacienteModal, setShowDeletePacienteModal] = useState(false);
  const [eliminandoPaciente, setEliminandoPaciente] = useState(false);

  useAuth();

  useEffect(() => {
    loadPaciente();
  }, [pacienteId]);

  const addNotification = (message: string, type: "success" | "error" | "info") => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { id, message, type }]);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  async function loadPaciente() {
    try {
      const { data: pacienteData, error } = await supabase
        .from("pacientes")
        .select("*")
        .eq("id", pacienteId)
        .single();

      if (error || !pacienteData) {
        addNotification("Paciente no encontrado", "error");
        router.push("/admin/pacientes");
        return;
      }

      setPaciente(pacienteData);
      setFormData(pacienteData);

      // Cargar documentos
      const { data: docsData } = await supabase
        .from("documentos")
        .select("*")
        .eq("paciente_id", pacienteId)
        .eq("activo", true)
        .order("created_at", { ascending: false });

      setDocumentos(docsData || []);

      // Cargar tests
      const { data: testsData } = await supabase
        .from("resultados_tests")
        .select("*")
        .eq("paciente_id", pacienteId)
        .order("created_at", { ascending: false });

      setTests(testsData || []);

      // Cargar citas
      const { data: citasData } = await supabase
        .from("citas")
        .select("*")
        .eq("paciente_id", pacienteId)
        .order("created_at", { ascending: false });

      setCitas(citasData || []);

      setLoading(false);
    } catch (error) {
      addNotification("Error al cargar paciente", "error");
      setLoading(false);
    }
  }

  const handleSaveChanges = async () => {
    if (!paciente) return;
    setGuardando(true);

    try {
      const { error } = await supabase
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
        .eq("id", pacienteId);

      if (error) throw error;

      setPaciente(formData as Paciente);
      setEditando(false);
      addNotification("Cambios guardados exitosamente", "success");
    } catch (error: any) {
      addNotification("Error al guardar cambios: " + error.message, "error");
    } finally {
      setGuardando(false);
    }
  };

  const handleArchivo = async () => {
    if (!paciente) return;
    setArchivando(true);

    try {
      const { error } = await supabase
        .from("pacientes")
        .update({ activo: !paciente.activo, updated_at: new Date().toISOString() })
        .eq("id", pacienteId);

      if (error) throw error;

      setPaciente({ ...paciente, activo: !paciente.activo });
      addNotification(paciente.activo ? "Paciente archivado" : "Paciente reactivado", "success");
    } catch (error: any) {
      addNotification("Error al cambiar estado: " + error.message, "error");
    } finally {
      setArchivando(false);
    }
  };

  const handleDeletePaciente = async () => {
    if (!paciente) return;
    setEliminandoPaciente(true);

    try {
      const { error } = await supabase
        .from("pacientes")
        .delete()
        .eq("id", pacienteId);

      if (error) throw error;

      addNotification("Paciente eliminado", "success");
      router.push("/admin/pacientes");
    } catch (error: any) {
      addNotification("Error al eliminar paciente: " + error.message, "error");
    } finally {
      setEliminandoPaciente(false);
    }
  };

  const handleDeleteDoc = async (doc: Documento) => {
    try {
      const { error } = await supabase
        .from("documentos")
        .update({ activo: false })
        .eq("id", doc.id);

      if (error) throw error;

      setDocumentos(documentos.filter((d) => d.id !== doc.id));
      addNotification("Documento eliminado", "success");
    } catch (error: any) {
      addNotification("Error al eliminar documento: " + error.message, "error");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p style={{ color: colors.textMuted }}>Cargando...</p>
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p style={{ color: colors.text }}>Paciente no encontrado</p>
      </div>
    );
  }

  const edad = new Date().getFullYear() - new Date(paciente.fecha_nacimiento).getFullYear();

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      <NotificationManager notifications={notifications} onRemove={removeNotification} />

      {/* Header con navegación */}
      <div className="border-b" style={{ borderColor: colors.border }}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push("/admin/pacientes")}
              className="flex items-center gap-2 text-sm font-medium hover:opacity-75 transition"
              style={{ color: colors.primary }}
            >
              <ChevronLeft size={18} />
              Volver a Pacientes
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold" style={{ color: colors.text }}>
                👤 {paciente.nombre_completo}
              </h1>
              <span
                className="px-3 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: paciente.activo ? "#dcfce7" : "#f3f4f6",
                  color: paciente.activo ? "#166534" : "#6b7280",
                }}
              >
                {paciente.activo ? "Activo" : "Archivado"}
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b" style={{ borderColor: colors.border }}>
            {[
              { id: "info", label: "Información General", icon: "📋" },
              { id: "documentos", label: "Documentos & Tests", icon: "📁" },
              { id: "acciones", label: "Acciones", icon: "⚙️" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition ${
                  activeTab === tab.id
                    ? "border-opacity-100"
                    : "border-opacity-0 opacity-50 hover:opacity-75"
                }`}
                style={{
                  borderColor: activeTab === tab.id ? colors.primary : "transparent",
                  color: colors.text,
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenido de Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Pestaña: Información General */}
        {activeTab === "info" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna izquierda: Formulario */}
            <div className="lg:col-span-2">
              <div
                className="rounded-lg p-6 border"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold" style={{ color: colors.text }}>
                    Datos del Paciente
                  </h2>
                  {!editando && (
                    <button
                      onClick={() => setEditando(true)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition"
                      style={{
                        backgroundColor: colors.primary,
                        color: "#fff",
                      }}
                    >
                      ✏️ Editar
                    </button>
                  )}
                </div>

                {editando ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium mb-2" style={{ color: colors.text }}>
                          Nombre Completo
                        </label>
                        <Input
                          value={formData.nombre_completo}
                          onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-2" style={{ color: colors.text }}>
                          Email
                        </label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-2" style={{ color: colors.text }}>
                          Teléfono
                        </label>
                        <Input
                          value={formData.telefono}
                          onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-2" style={{ color: colors.text }}>
                          Fecha de Nacimiento
                        </label>
                        <Input
                          type="date"
                          value={formData.fecha_nacimiento}
                          onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-2" style={{ color: colors.text }}>
                          Género
                        </label>
                        <Select
                          value={formData.genero}
                          onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
                          options={[
                            { value: "", label: "Seleccionar..." },
                            { value: "masculino", label: "Masculino" },
                            { value: "femenino", label: "Femenino" },
                            { value: "otro", label: "Otro" },
                          ]}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-2" style={{ color: colors.text }}>
                          Ocupación
                        </label>
                        <Input
                          value={formData.ocupacion}
                          onChange={(e) => setFormData({ ...formData, ocupacion: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-2" style={{ color: colors.text }}>
                        Notas
                      </label>
                      <TextArea
                        value={formData.notas}
                        onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                        placeholder="Notas adicionales sobre el paciente..."
                        rows={4}
                      />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={handleSaveChanges}
                        disabled={guardando}
                        className="flex items-center gap-2"
                      >
                        <Save size={16} />
                        {guardando ? "Guardando..." : "Guardar Cambios"}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setEditando(false);
                          setFormData({
                            nombre_completo: paciente.nombre_completo,
                            email: paciente.email,
                            telefono: paciente.telefono,
                            fecha_nacimiento: paciente.fecha_nacimiento,
                            genero: paciente.genero,
                            ocupacion: paciente.ocupacion,
                            notas: paciente.notas || "",
                          });
                        }}
                      >
                        <X size={16} />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium" style={{ color: colors.textMuted }}>
                          Email
                        </p>
                        <p className="text-sm mt-1" style={{ color: colors.text }}>
                          {paciente.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium" style={{ color: colors.textMuted }}>
                          Teléfono
                        </p>
                        <p className="text-sm mt-1" style={{ color: colors.text }}>
                          {paciente.telefono}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium" style={{ color: colors.textMuted }}>
                          Edad
                        </p>
                        <p className="text-sm mt-1" style={{ color: colors.text }}>
                          {edad} años
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium" style={{ color: colors.textMuted }}>
                          Género
                        </p>
                        <p className="text-sm mt-1" style={{ color: colors.text }}>
                          {paciente.genero}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium" style={{ color: colors.textMuted }}>
                          Ocupación
                        </p>
                        <p className="text-sm mt-1" style={{ color: colors.text }}>
                          {paciente.ocupacion}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium" style={{ color: colors.textMuted }}>
                          Registro
                        </p>
                        <p className="text-sm mt-1" style={{ color: colors.text }}>
                          {new Date(paciente.created_at).toLocaleDateString("es-MX")}
                        </p>
                      </div>
                    </div>
                    {paciente.notas && (
                      <div className="pt-4 border-t" style={{ borderColor: colors.border }}>
                        <p className="text-xs font-medium mb-2" style={{ color: colors.textMuted }}>
                          Notas
                        </p>
                        <p className="text-sm" style={{ color: colors.text }}>
                          {paciente.notas}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Columna derecha: Resumen rápido */}
            <div className="space-y-4">
              <div
                className="rounded-lg p-6 border"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                }}
              >
                <h3 className="font-semibold mb-4" style={{ color: colors.text }}>
                  📊 Resumen
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span style={{ color: colors.textMuted }}>Tests aplicados</span>
                    <span className="font-bold" style={{ color: colors.primary }}>
                      {tests.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: colors.textMuted }}>Documentos</span>
                    <span className="font-bold" style={{ color: colors.primary }}>
                      {documentos.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: colors.textMuted }}>Citas</span>
                    <span className="font-bold" style={{ color: colors.primary }}>
                      {citas.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card de acciones rápidas */}
              <div
                className="rounded-lg p-6 border space-y-2"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                }}
              >
                <Button
                  variant={paciente.activo ? "danger" : "primary"}
                  onClick={handleArchivo}
                  disabled={archivando}
                  className="w-full justify-center"
                >
                  {archivando ? "Procesando..." : paciente.activo ? "📁 Archivar" : "✅ Reactivar"}
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setShowDeletePacienteModal(true)}
                  className="w-full justify-center"
                >
                  🗑️ Eliminar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Pestaña: Documentos & Tests */}
        {activeTab === "documentos" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna izquierda: Tests */}
            <div className="lg:col-span-2">
              <div
                className="rounded-lg p-6 border"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold" style={{ color: colors.text }}>
                    📊 Tests Aplicados
                  </h3>
                </div>
                {tests.length === 0 ? (
                  <p className="text-sm" style={{ color: colors.textMuted }}>
                    No hay tests registrados
                  </p>
                ) : (
                  <div className="space-y-2">
                    {tests.map((test) => (
                      <div
                        key={test.id}
                        onClick={() => {
                          setSelectedTest(test);
                          setShowTestModal(true);
                        }}
                        className="p-3 rounded-lg cursor-pointer transition hover:opacity-75"
                        style={{ backgroundColor: colors.background }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm" style={{ color: colors.text }}>
                              {test.nombre_test}
                            </p>
                            <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
                              {new Date(test.created_at).toLocaleDateString("es-MX")}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm" style={{ color: colors.primary }}>
                              {test.puntaje_total ?? "—"}
                            </p>
                            {test.rango_obtenido && (
                              <p className="text-xs" style={{ color: colors.textMuted }}>
                                {test.rango_obtenido}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Columna derecha: Documentos */}
            <div className="space-y-4">
              <div
                className="rounded-lg p-6 border"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm" style={{ color: colors.text }}>
                    📁 Documentos
                  </h3>
                  <Button
                    size="sm"
                    onClick={() => setShowUploadModal(true)}
                  >
                    ➕
                  </Button>
                </div>
                {documentos.length === 0 ? (
                  <p className="text-xs" style={{ color: colors.textMuted }}>
                    Sin documentos
                  </p>
                ) : (
                  <div className="space-y-2">
                    {documentos.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-2 rounded-lg flex items-center justify-between text-xs"
                        style={{ backgroundColor: colors.background }}
                      >
                        <span style={{ color: colors.text }} className="truncate">
                          {doc.titulo}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setSelectedDoc(doc);
                              setShowPdfModal(true);
                            }}
                            className="px-2 py-1 rounded hover:opacity-75 transition"
                            style={{ backgroundColor: colors.primary, color: "#fff" }}
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => handleDeleteDoc(doc)}
                            className="px-2 py-1 rounded hover:opacity-75 transition"
                            style={{ backgroundColor: "#ef4444", color: "#fff" }}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Pestaña: Acciones */}
        {activeTab === "acciones" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div
              className="rounded-lg p-6 border"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <h3 className="font-semibold mb-4" style={{ color: colors.text }}>
                📋 Gestionar Documentos
              </h3>
              <p className="text-sm mb-4" style={{ color: colors.textMuted }}>
                Carga y organiza documentos clínicos del paciente.
              </p>
              <Button
                onClick={() => setShowUploadModal(true)}
                className="w-full justify-center"
              >
                📁 Cargar Documentos
              </Button>
            </div>

            <div
              className="rounded-lg p-6 border"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <h3 className="font-semibold mb-4" style={{ color: colors.text }}>
                {paciente.activo ? "📁 Archivar Paciente" : "✅ Reactivar Paciente"}
              </h3>
              <p className="text-sm mb-4" style={{ color: colors.textMuted }}>
                {paciente.activo
                  ? "Marca este paciente como archivado."
                  : "Reactiva este paciente en el sistema."}
              </p>
              <Button
                variant={paciente.activo ? "danger" : "primary"}
                onClick={handleArchivo}
                disabled={archivando}
                className="w-full justify-center"
              >
                {archivando ? "Procesando..." : paciente.activo ? "📁 Archivar" : "✅ Reactivar"}
              </Button>
            </div>

            <div
              className="rounded-lg p-6 border"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <h3 className="font-semibold mb-4" style={{ color: colors.text }}>
                🗑️ Eliminar Paciente
              </h3>
              <p className="text-sm mb-4" style={{ color: colors.textMuted }}>
                Elimina permanentemente este paciente y todos sus datos.
              </p>
              <Button
                variant="danger"
                onClick={() => setShowDeletePacienteModal(true)}
                className="w-full justify-center"
              >
                🗑️ Eliminar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modales */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title={`Cargar Documentos - ${paciente.nombre_completo}`}
        size="md"
      >
        <BulkUpload
          pacienteId={paciente.id}
          pacienteNombre={paciente.nombre_completo}
          onSuccess={() => {
            addNotification("Documentos cargados", "success");
            setShowUploadModal(false);
            loadPaciente();
          }}
          onClose={() => setShowUploadModal(false)}
        />
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
                📥 Descargar
              </a>
            </div>
            <div className="border rounded-lg overflow-hidden" style={{ borderColor: colors.border }}>
              <iframe
                src={selectedDoc.storage_url}
                className="w-full"
                style={{ height: "600px" }}
                title="PDF Viewer"
              />
            </div>
          </div>
        )}
      </Modal>

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
          <div className="space-y-4">
            <div
              className="p-4 rounded-lg"
              style={{ backgroundColor: colors.background }}
            >
              <h3 className="font-semibold mb-3" style={{ color: colors.text }}>
                Información del Test
              </h3>
              <div className="space-y-2 text-sm">
                <p>
                  <strong style={{ color: colors.text }}>Test:</strong>{" "}
                  <span style={{ color: colors.textMuted }}>{selectedTest.nombre_test}</span>
                </p>
                <p>
                  <strong style={{ color: colors.text }}>Fecha:</strong>{" "}
                  <span style={{ color: colors.textMuted }}>
                    {new Date(selectedTest.created_at).toLocaleDateString("es-MX")}
                  </span>
                </p>
                <p>
                  <strong style={{ color: colors.text }}>Puntaje:</strong>{" "}
                  <span style={{ color: colors.primary, fontWeight: "bold" }}>
                    {selectedTest.puntaje_total ?? "N/A"}
                  </span>
                </p>
                {selectedTest.rango_obtenido && (
                  <p>
                    <strong style={{ color: colors.text }}>Rango:</strong>{" "}
                    <span style={{ color: colors.textMuted }}>
                      {selectedTest.rango_obtenido}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {selectedTest.interpretacion_ia && (
              <div
                className="p-4 rounded-lg"
                style={{ backgroundColor: colors.background }}
              >
                <h3 className="font-semibold mb-3" style={{ color: colors.text }}>
                  Interpretación Clínica
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: colors.text, whiteSpace: "pre-wrap" }}>
                  {selectedTest.interpretacion_ia}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={showDeletePacienteModal}
        onConfirm={handleDeletePaciente}
        onCancel={() => setShowDeletePacienteModal(false)}
        title="Eliminar Paciente"
        message={`¿Estás seguro de que deseas eliminar a ${paciente.nombre_completo}? Esta acción es irreversible.`}
        loading={eliminandoPaciente}
        confirmLabel="Sí, Eliminar"
        cancelLabel="Cancelar"
      />
    </div>
  );
}
