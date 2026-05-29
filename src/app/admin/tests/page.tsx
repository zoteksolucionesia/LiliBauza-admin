"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { DataTable, SearchBar, Modal, Button, Input, Select, TextArea, Header, NotificationManager } from "@/components/admin";
import { motion } from "framer-motion";
import { ClipboardList, Plus, Trash2, Edit } from "lucide-react";
import { jsPDF } from "jspdf";

import { colors } from "@/lib/theme";

// Devuelve la etiqueta legible de una respuesta (texto de la opción elegida).
function etiquetaRespuesta(p: Pregunta, valor: unknown): string {
  const ops = opcionesNormalizadas(p);
  if (ops) {
    const encontrada = ops.find((o) => o.value === valor);
    return encontrada ? encontrada.label : String(valor ?? "—");
  }
  return String(valor ?? "—");
}

interface OpcionObj {
  texto: string;
  valor: number;
}

interface Pregunta {
  id: string | number;
  texto: string;
  // Tests personalizados traen `tipo`; los predefinidos no (se infiere por `opciones`).
  tipo?: "escala" | "opcion_multiple" | "abierta";
  // Personalizados: string[]; predefinidos: {texto, valor}[].
  opciones?: (string | OpcionObj)[];
  puntaje_min?: number;
  puntaje_max?: number;
}

// Normaliza las opciones de una pregunta a {label, value} sin importar el formato.
// Predefinidos -> {label: texto, value: valor(number)}; personalizados -> {label, value: string}.
function opcionesNormalizadas(p: Pregunta): { label: string; value: number | string }[] | null {
  if (!p.opciones || p.opciones.length === 0) return null;
  return p.opciones.map((o) =>
    typeof o === "object" && o !== null
      ? { label: o.texto, value: o.valor }
      : { label: String(o), value: String(o) }
  );
}

interface Test {
  id: string;
  nombre: string;
  descripcion: string;
  preguntas: Pregunta[];
  interpretacion: string;
  es_predefinido?: boolean;
  fecha_creacion: string;
}

export default function TestsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tests, setTests] = useState<Test[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
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
    loadTests();
    loadPacientes();
  }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/admin/login");
      return;
    }
  }

  async function loadTests() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from("tests")
      .select("*")
      .or(`terapeuta_id.eq.${session.user.id},es_predefinido.eq.true`)
      .order("nombre", { ascending: true });

    if (error) {
      console.error("Error loading tests:", error);
      return;
    }

    setTests(data || []);
    setLoading(false);
  }

  async function loadPacientes() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from("pacientes")
      .select("id, nombre_completo, email")
      .eq("terapeuta_id", session.user.id)
      .eq("activo", true)
      .order("nombre_completo", { ascending: true });

    if (!error && data) {
      setPacientes(data);
    }
  }

  const filteredTests = tests.filter((t) =>
    t.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { key: "nombre", label: "Nombre" },
    {
      key: "es_predefinido",
      label: "Tipo",
      render: (value: boolean) => (
        <span className={`px-2 py-1 rounded text-xs ${value ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}>
          {value ? "Predefinido" : "Personalizado"}
        </span>
      ),
    },
    {
      key: "preguntas",
      label: "Preguntas",
      render: (value: Pregunta[]) => value?.length || 0,
    },
    {
      key: "fecha_creacion",
      label: "Creación",
      render: (value: string) => new Date(value).toLocaleDateString("es-MX"),
    },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      {/* Notificaciones */}
      <NotificationManager notifications={notifications} onRemove={removeNotification} />

      {/* Header con logo */}
      <Header
        title="Tests Psicológicos"
        subtitle="Crear, gestionar y aplicar tests"
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <SearchBar
            placeholder="Buscar test..."
            value={searchTerm}
            onChange={setSearchTerm}
            onAdd={() => { setEditingTest(null); setIsBuilderOpen(true); }}
            addLabel="Crear Test"
          />

          {/* Info cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-lg" style={{ backgroundColor: colors.surface, border: `2px solid ${colors.primary}` }}>
              <div className="flex items-center gap-3">
                <ClipboardList className="w-8 h-8" style={{ color: colors.primary }} />
                <div>
                  <p className="text-2xl font-bold" style={{ color: colors.text }}>{tests.length}</p>
                  <p className="text-sm" style={{ color: colors.textMuted }}>Tests disponibles</p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-lg" style={{ backgroundColor: colors.surface, border: `2px solid ${colors.secondary}` }}>
              <div className="flex items-center gap-3">
                <Plus className="w-8 h-8" style={{ color: colors.secondary }} />
                <div>
                  <p className="text-2xl font-bold" style={{ color: colors.text }}>
                    {tests.filter((t) => !t.es_predefinido).length}
                  </p>
                  <p className="text-sm" style={{ color: colors.textMuted }}>Personalizados</p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-lg" style={{ backgroundColor: colors.surface, border: `2px solid ${colors.accent}` }}>
              <div className="flex items-center gap-3">
                <Edit className="w-8 h-8" style={{ color: colors.accent }} />
                <div>
                  <p className="text-2xl font-bold" style={{ color: colors.text }}>
                    {tests.filter((t) => t.es_predefinido).length}
                  </p>
                  <p className="text-sm" style={{ color: colors.textMuted }}>Predefinidos</p>
                </div>
              </div>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filteredTests}
            onRowClick={(row) => {
              setSelectedTest(row);
              setIsModalOpen(true);
            }}
            actions={(row) => (
              <div className="flex gap-2 justify-end">
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedTest(row);
                    setIsApplyOpen(true);
                  }}
                >
                  📋 Aplicar
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedTest(row);
                    setIsModalOpen(true);
                  }}
                >
                  👁️ Ver
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setEditingTest(row);
                    setIsBuilderOpen(true);
                  }}
                  title={row.es_predefinido ? "Editar crea una copia personal" : "Editar test"}
                >
                  ✏️ Editar
                </Button>
                {!row.es_predefinido && (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={async () => {
                      if (confirm("¿Eliminar este test?")) {
                        await supabase.from("tests").delete().eq("id", row.id);
                        loadTests();
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}
            emptyMessage="No hay tests creados. ¡Crea tu primer test!"
          />
        </motion.div>
      </main>

      {/* Modal de vista del test */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTest(null);
        }}
        title={selectedTest?.nombre || "Test"}
        size="lg"
      >
        {selectedTest && (
          <TestDetalle
            test={selectedTest}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedTest(null);
            }}
          />
        )}
      </Modal>

      {/* Test Builder Modal */}
      <Modal
        isOpen={isBuilderOpen}
        onClose={() => { setIsBuilderOpen(false); setEditingTest(null); }}
        title={editingTest ? `Editar Test: ${editingTest.nombre}` : "Test Builder - Crear Test Personalizado"}
        size="xl"
      >
        <TestBuilder
          key={editingTest?.id || "nuevo"}
          editingTest={editingTest}
          onClose={() => {
            setIsBuilderOpen(false);
            setEditingTest(null);
            loadTests();
          }}
        />
      </Modal>

      {/* Modal para Aplicar Test */}
      <Modal
        isOpen={isApplyOpen}
        onClose={() => {
          setIsApplyOpen(false);
          setSelectedTest(null);
        }}
        title={selectedTest ? `Aplicar: ${selectedTest.nombre}` : "Aplicar Test"}
        size="xl"
      >
        {selectedTest && (
          <ApplyTestForm
            test={selectedTest}
            pacientes={pacientes}
            addNotification={addNotification}
            onClose={() => {
              setIsApplyOpen(false);
              setSelectedTest(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
}

function TestBuilder({ editingTest, onClose }: { editingTest?: Test | null; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: editingTest?.nombre || "",
    descripcion: editingTest?.descripcion || "",
    interpretacion: editingTest?.interpretacion || "",
  });
  const [preguntas, setPreguntas] = useState<Pregunta[]>(editingTest?.preguntas || []);
  const [currentPregunta, setCurrentPregunta] = useState<Pregunta>({
    id: "",
    texto: "",
    tipo: "opcion_multiple",
    opciones: [],
    puntaje_min: 0,
    puntaje_max: 10,
  });
  const [opcionText, setOpcionText] = useState("");
  const [opcionValor, setOpcionValor] = useState("0");

  const addPregunta = () => {
    if (!currentPregunta.texto.trim()) return;
    setPreguntas([...preguntas, { ...currentPregunta, id: Date.now().toString() }]);
    setCurrentPregunta({
      id: "",
      texto: "",
      tipo: "escala",
      opciones: [],
      puntaje_min: 0,
      puntaje_max: 10,
    });
    setOpcionText("");
  };

  const removePregunta = (index: number) => {
    setPreguntas(preguntas.filter((_, i) => i !== index));
  };

  const addOpcion = () => {
    if (!opcionText.trim()) return;
    // Guarda la opción como {texto, valor} para que sume al puntaje (formato Likert).
    setCurrentPregunta({
      ...currentPregunta,
      opciones: [...(currentPregunta.opciones || []), { texto: opcionText, valor: Number(opcionValor) || 0 }],
    });
    setOpcionText("");
    setOpcionValor("0");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("No session");

    let error;
    if (editingTest && !editingTest.es_predefinido) {
      // Editar un test propio → UPDATE en sitio.
      ({ error } = await supabase
        .from("tests")
        .update({
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          preguntas: preguntas,
          interpretacion: formData.interpretacion,
        })
        .eq("id", editingTest.id));
    } else {
      // Test nuevo, o copy-on-edit de un predefinido: crea una copia privada
      // del terapeuta sin modificar la base compartida.
      ({ error } = await supabase.from("tests").insert({
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        preguntas: preguntas,
        interpretacion: formData.interpretacion,
        es_predefinido: false,
        terapeuta_id: session.user.id,
        fecha_creacion: new Date().toISOString(),
      }));
    }

    if (error) {
      alert("Error al guardar: " + error.message);
    } else {
      alert(
        editingTest && editingTest.es_predefinido
          ? "Se creó tu copia personal del test con los cambios"
          : editingTest
          ? "Test actualizado exitosamente"
          : "Test creado exitosamente"
      );
      onClose();
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-4">
        <Input
          label="Nombre del Test"
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          placeholder="Ej: Test de Ansiedad Laboral"
          required
        />

        <TextArea
          label="Descripción"
          value={formData.descripcion}
          onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
          rows={2}
          placeholder="Descripción del propósito del test..."
        />

        {/* Builder de preguntas */}
        <div className="p-4 rounded-lg border-2" style={{ borderColor: colors.primaryLight }}>
          <h3 className="font-semibold mb-3" style={{ color: colors.text }}>Preguntas</h3>

          <div className="grid grid-cols-1 gap-3 mb-4">
            <TextArea
              label="Texto de la pregunta"
              value={currentPregunta.texto}
              onChange={(e) => setCurrentPregunta({ ...currentPregunta, texto: e.target.value })}
              rows={2}
              placeholder="Ej: ¿Con qué frecuencia se siente nervioso?"
            />

            <Select
              label="Tipo de respuesta"
              value={currentPregunta.tipo}
              onChange={(e) => setCurrentPregunta({ ...currentPregunta, tipo: e.target.value as any })}
              options={[
                { value: "escala", label: "Escala (0-10)" },
                { value: "opcion_multiple", label: "Opción múltiple" },
                { value: "abierta", label: "Respuesta abierta" },
              ]}
            />

            {currentPregunta.tipo === "escala" && (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Puntaje mínimo"
                  type="number"
                  value={currentPregunta.puntaje_min?.toString() || "0"}
                  onChange={(e) => setCurrentPregunta({ ...currentPregunta, puntaje_min: parseInt(e.target.value) })}
                />
                <Input
                  label="Puntaje máximo"
                  type="number"
                  value={currentPregunta.puntaje_max?.toString() || "10"}
                  onChange={(e) => setCurrentPregunta({ ...currentPregunta, puntaje_max: parseInt(e.target.value) })}
                />
              </div>
            )}

            {currentPregunta.tipo === "opcion_multiple" && (
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>
                  Opciones de respuesta (texto y valor de puntaje)
                </label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={opcionText}
                    onChange={(e) => setOpcionText(e.target.value)}
                    placeholder="Texto (ej: Nunca)"
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={opcionValor}
                    onChange={(e) => setOpcionValor(e.target.value)}
                    placeholder="Valor"
                    className="w-24"
                  />
                  <Button type="button" onClick={addOpcion}>
                    Agregar
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(currentPregunta.opciones || []).map((opt, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 rounded text-sm flex items-center gap-1"
                      style={{ backgroundColor: colors.primaryLight, color: colors.primaryDark }}
                    >
                      {typeof opt === "string" ? opt : `${opt.texto} (${opt.valor})`}
                      <button
                        type="button"
                        onClick={() => setCurrentPregunta({
                          ...currentPregunta,
                          opciones: currentPregunta.opciones?.filter((_, i) => i !== idx),
                        })}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <Button type="button" onClick={addPregunta} className="mt-2">
              + Agregar Pregunta
            </Button>
          </div>

          {/* Lista de preguntas agregadas */}
          {preguntas.length > 0 && (
            <div className="space-y-2">
              {preguntas.map((p, idx) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded"
                  style={{ backgroundColor: colors.background }}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold" style={{ color: colors.primary }}>{idx + 1}.</span>
                    <span style={{ color: colors.text }}>{p.texto}</span>
                    <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: colors.primaryLight, color: colors.primaryDark }}>
                      {p.tipo}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removePregunta(idx)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <TextArea
          label="Interpretación de resultados"
          value={formData.interpretacion}
          onChange={(e) => setFormData({ ...formData, interpretacion: e.target.value })}
          rows={4}
          placeholder="Ej: 0-3: Bajo, 4-7: Moderado, 8-10: Alto..."
        />
      </div>

      <div className="flex gap-3 justify-end mt-4">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading || preguntas.length === 0}>
          {loading ? "Guardando..." : `Guardar Test (${preguntas.length} preguntas)`}
        </Button>
      </div>
    </form>
  );
}

function TestDetalle({ test, onClose }: { test: Test; onClose: () => void }) {
  return (
    <div>
      <div className="mb-4">
        <h3 className="font-semibold" style={{ color: colors.text }}>Descripción</h3>
        <p style={{ color: colors.textMuted }}>{test.descripcion}</p>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold" style={{ color: colors.text }}>Preguntas ({test.preguntas?.length || 0})</h3>
        <div className="space-y-2 mt-2">
          {test.preguntas?.map((p, idx) => (
            <div
              key={p.id}
              className="p-3 rounded"
              style={{ backgroundColor: colors.background }}
            >
              <div className="flex items-start gap-2">
                <span className="font-bold" style={{ color: colors.primary }}>{idx + 1}.</span>
                <div>
                  <p style={{ color: colors.text }}>{p.texto}</p>
                  <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
                    Tipo: {p.tipo}
                    {p.tipo === "escala" && ` ( ${p.puntaje_min} - ${p.puntaje_max} )`}
                    {p.tipo === "opcion_multiple" && p.opciones && ` [${p.opciones.join(", ")}]`}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4 p-3 rounded" style={{ backgroundColor: colors.primaryLight }}>
        <h3 className="font-semibold" style={{ color: colors.primaryDark }}>Interpretación</h3>
        <p style={{ color: colors.primaryDark }}>{test.interpretacion}</p>
      </div>

      <div className="flex gap-3 justify-end">
        <Button variant="ghost" onClick={onClose}>
          Cerrar
        </Button>
        <Button onClick={() => alert("Funcionalidad de aplicar test próximamente")}>
          Aplicar Test
        </Button>
      </div>
    </div>
  );
}

// Componente para Aplicar Test a Paciente
function ApplyTestForm({ test, pacientes, addNotification, onClose }: {
  test: Test;
  pacientes: any[];
  addNotification: (msg: string, type: "success" | "error" | "info") => void;
  onClose: () => void;
}) {
  const [selectedPaciente, setSelectedPaciente] = useState("");
  const [respuestas, setRespuestas] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [resultado, setResultado] = useState<{ id: string; puntaje: number; interpretacion: string; emailPaciente: string; nombrePaciente: string } | null>(null);

  const handleRespuesta = (preguntaId: string | number, valor: any) => {
    setRespuestas((prev) => ({ ...prev, [preguntaId]: valor }));
  };

  const calcularPuntaje = () => {
    let puntajeTotal = 0;

    test.preguntas?.forEach((pregunta) => {
      const respuesta = respuestas[pregunta.id];
      // Suma cualquier respuesta numérica: escala (botones 0-N) y opciones
      // tipo Likert de los predefinidos (se guarda el `valor` numérico).
      if (typeof respuesta === "number") {
        puntajeTotal += respuesta;
      }
    });

    return puntajeTotal;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPaciente) {
      addNotification("Selecciona un paciente", "error");
      return;
    }

    const preguntasRespondidas = Object.keys(respuestas).length;
    const totalPreguntas = test.preguntas?.length || 0;

    if (preguntasRespondidas < totalPreguntas) {
      addNotification(`Responde todas las preguntas (${preguntasRespondidas}/${totalPreguntas})`, "error");
      return;
    }

    setLoading(true);
    addNotification("Guardando y generando interpretación con IA...", "info");

    try {
      const paciente = pacientes.find((p) => p.id === selectedPaciente);
      const puntajeTotal = calcularPuntaje();

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      // Obtener interpretación con IA
      let interpretacionIA = test.interpretacion || "";
      try {
        const resp = await fetch("/api/interpretar-test", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            testNombre: test.nombre,
            testDescripcion: test.descripcion,
            preguntas: test.preguntas,
            respuestas,
            puntajeTotal,
            interpretacionManual: test.interpretacion,
          }),
        });
        if (resp.ok) {
          const data = await resp.json();
          interpretacionIA = data.interpretacion || interpretacionIA;
        }
      } catch {
        // Si la IA falla, usamos la interpretación manual
      }

      // Guardar resultado con interpretación IA y obtener ID
      const { data: insertedRows, error } = await supabase
        .from("resultados_tests")
        .insert({
          test_id: test.id,
          paciente_id: selectedPaciente,
          email_paciente: paciente?.email || "",
          nombre_paciente: paciente?.nombre_completo || "",
          respuestas,
          puntaje_total: puntajeTotal,
          interpretacion: interpretacionIA,
          interpretacion_ia: interpretacionIA,
          completado: true,
          email_enviado: false,
          terapeuta_id: session.user.id,
          fecha_completado: new Date().toISOString(),
          created_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (error) throw error;

      setResultado({
        id: insertedRows.id,
        puntaje: puntajeTotal,
        interpretacion: interpretacionIA,
        emailPaciente: paciente?.email || "",
        nombrePaciente: paciente?.nombre_completo || "",
      });
    } catch (error: any) {
      addNotification(`Error: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const enviarEmail = async () => {
    if (!resultado) return;
    setEnviandoEmail(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const { data: branding } = await supabase
        .from("configuracion_branding")
        .select("nombre_clinica")
        .eq("terapeuta_id", session.user.id)
        .single();

      const resp = await fetch("/api/enviar-resultados", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          emailPaciente: resultado.emailPaciente,
          nombrePaciente: resultado.nombrePaciente,
          testNombre: test.nombre,
          puntajeTotal: resultado.puntaje,
          interpretacion: resultado.interpretacion,
          nombreClinica: branding?.nombre_clinica || "",
          resultadoId: resultado.id,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Error al enviar");
      }

      addNotification("Resultados enviados por email al paciente", "success");
      onClose();
    } catch (error: any) {
      addNotification(`Error al enviar email: ${error.message}`, "error");
    } finally {
      setEnviandoEmail(false);
    }
  };

  const descargarPDF = async () => {
    if (!resultado) return;

    const { data: { session } } = await supabase.auth.getSession();
    let nombreClinica = "";
    if (session) {
      const { data: branding } = await supabase
        .from("configuracion_branding")
        .select("nombre_clinica")
        .eq("terapeuta_id", session.user.id)
        .single();
      nombreClinica = branding?.nombre_clinica || "";
    }

    const doc = new jsPDF({ unit: "mm", format: "letter" });
    const pageW = 215.9;
    const ml = 20, mr = 20;
    const maxW = pageW - ml - mr;
    let y = 22;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(61, 41, 41);
    doc.text(nombreClinica || "Resultados de Evaluación", ml, y);
    y += 8;
    doc.setDrawColor(212, 165, 165);
    doc.line(ml, y, pageW - mr, y);
    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    [
      `Test: ${test.nombre}`,
      `Paciente: ${resultado.nombrePaciente || "—"}`,
      `Fecha: ${new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}`,
    ].forEach((line) => { doc.text(line, ml, y); y += 6; });
    y += 2;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(`Puntaje total: ${resultado.puntaje}`, ml, y);
    y += 11;

    doc.setFontSize(12);
    doc.text("Respuestas", ml, y); y += 7;
    test.preguntas?.forEach((p, i) => {
      const pregLines: string[] = doc.splitTextToSize(`${i + 1}. ${p.texto}`, maxW);
      const respLines: string[] = doc.splitTextToSize(`→ ${etiquetaRespuesta(p, respuestas[p.id])}`, maxW - 6);
      if (y + (pregLines.length + respLines.length) * 5 > 270) { doc.addPage(); y = 22; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(pregLines, ml, y); y += pregLines.length * 5;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(90, 90, 90);
      doc.text(respLines, ml + 4, y); y += respLines.length * 5 + 3;
      doc.setTextColor(61, 41, 41);
    });
    y += 4;

    if (y > 250) { doc.addPage(); y = 22; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Interpretación", ml, y); y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    (doc.splitTextToSize(resultado.interpretacion || "—", maxW) as string[]).forEach((line) => {
      if (y > 272) { doc.addPage(); y = 22; }
      doc.text(line, ml, y); y += 5;
    });

    const safe = (s: string) => s.replace(/[^a-z0-9]/gi, "_");
    doc.save(`Resultado_${safe(test.nombre)}_${safe(resultado.nombrePaciente || "paciente")}.pdf`);
  };

  // Pantalla de éxito con interpretación IA y opción de email
  if (resultado) {
    return (
      <div>
        <div className="mb-4 p-4 rounded-lg flex items-start gap-3" style={{ backgroundColor: "#f0fdf4", border: "1px solid #86efac" }}>
          <span className="text-2xl">✅</span>
          <div>
            <p className="font-semibold text-green-800">Test aplicado exitosamente</p>
            <p className="text-sm text-green-700">Puntaje total: <strong>{resultado.puntaje}</strong></p>
          </div>
        </div>

        <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.primaryLight}` }}>
          <p className="font-semibold mb-2 text-sm" style={{ color: colors.primary }}>🤖 Interpretación generada por IA</p>
          <p className="text-sm whitespace-pre-line" style={{ color: colors.text, lineHeight: "1.7" }}>
            {resultado.interpretacion}
          </p>
        </div>

        {/* Detalle de respuestas en pantalla */}
        <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
          <p className="font-semibold mb-3 text-sm" style={{ color: colors.text }}>Detalle de respuestas</p>
          <div className="space-y-2">
            {test.preguntas?.map((p, i) => (
              <div key={p.id} className="text-sm flex justify-between gap-3 border-b pb-2" style={{ borderColor: colors.primaryLight }}>
                <span style={{ color: colors.text }}>{i + 1}. {p.texto}</span>
                <span className="font-medium whitespace-nowrap" style={{ color: colors.primary }}>
                  {etiquetaRespuesta(p, respuestas[p.id])}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 justify-end flex-wrap">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cerrar
          </Button>
          <Button type="button" variant="secondary" onClick={descargarPDF}>
            ⬇️ Descargar PDF
          </Button>
          {resultado.emailPaciente && (
            <Button
              type="button"
              onClick={enviarEmail}
              disabled={enviandoEmail}
            >
              {enviandoEmail ? "Enviando..." : `📧 Enviar a ${resultado.emailPaciente}`}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
        <h3 className="font-semibold mb-2" style={{ color: colors.text }}>{test.nombre}</h3>
        <p className="text-sm" style={{ color: colors.textMuted }}>{test.descripcion}</p>
      </div>

      <Select
        label="Paciente"
        value={selectedPaciente}
        onChange={(e) => setSelectedPaciente(e.target.value)}
        options={[
          { value: "", label: "Seleccionar paciente..." },
          ...pacientes.map((p) => ({ value: p.id, label: p.nombre_completo })),
        ]}
        required
      />

      <div className="space-y-4 mb-6">
        <h3 className="font-semibold" style={{ color: colors.text }}>Preguntas</h3>
        {test.preguntas?.map((pregunta, index) => (
          <div key={pregunta.id} className="p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
            <p className="font-medium mb-3" style={{ color: colors.text }}>
              {index + 1}. {pregunta.texto}
            </p>

            {pregunta.tipo === "escala" ? (
              <div className="flex gap-2 flex-wrap">
                {Array.from({ length: (pregunta.puntaje_max || 10) + 1 }, (_, i) => i).map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleRespuesta(pregunta.id, num)}
                    className={`w-10 h-10 rounded-lg font-medium transition-all ${respuestas[pregunta.id] === num ? "text-white" : "border"}`}
                    style={{
                      backgroundColor: respuestas[pregunta.id] === num ? colors.primary : "transparent",
                      borderColor: respuestas[pregunta.id] === num ? colors.primary : colors.primaryLight,
                    }}
                  >
                    {num}
                  </button>
                ))}
              </div>
            ) : opcionesNormalizadas(pregunta) ? (
              // Cubre opcion_multiple (personalizados) y opciones tipo Likert
              // de los predefinidos ({texto, valor}). Guarda el `value` normalizado.
              <div className="space-y-2">
                {opcionesNormalizadas(pregunta)!.map((op, idx) => (
                  <label key={idx} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name={`pregunta_${pregunta.id}`}
                      checked={respuestas[pregunta.id] === op.value}
                      onChange={() => handleRespuesta(pregunta.id, op.value)}
                      className="w-4 h-4"
                    />
                    <span style={{ color: colors.text }}>{op.label}</span>
                  </label>
                ))}
              </div>
            ) : (
              <textarea
                value={respuestas[pregunta.id] || ""}
                onChange={(e) => handleRespuesta(pregunta.id, e.target.value)}
                className="w-full p-3 rounded-lg border focus:outline-none focus:ring-2"
                style={{ borderColor: colors.primaryLight }}
                rows={3}
                placeholder="Tu respuesta..."
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Analizando con IA..." : "Guardar y Analizar"}
        </Button>
      </div>
    </form>
  );
}
