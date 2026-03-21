"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { DataTable, SearchBar, Modal, Button, Input, Select, TextArea, Header, NotificationManager } from "@/components/admin";
import { motion } from "framer-motion";
import { ClipboardList, Plus, Trash2, Edit } from "lucide-react";

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

interface Pregunta {
  id: string;
  texto: string;
  tipo: "escala" | "opcion_multiple" | "abierta";
  opciones?: string[];
  puntaje_min?: number;
  puntaje_max?: number;
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
    const { data, error } = await supabase
      .from("tests")
      .select("*")
      .order("nombre", { ascending: true });

    if (error) {
      console.error("Error loading tests:", error);
      return;
    }

    setTests(data || []);
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
            onAdd={() => setIsBuilderOpen(true)}
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
        onClose={() => setIsBuilderOpen(false)}
        title="Test Builder - Crear Test Personalizado"
        size="xl"
      >
        <TestBuilder
          onClose={() => {
            setIsBuilderOpen(false);
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

function TestBuilder({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    interpretacion: "",
  });
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [currentPregunta, setCurrentPregunta] = useState<Pregunta>({
    id: "",
    texto: "",
    tipo: "escala",
    opciones: [],
    puntaje_min: 0,
    puntaje_max: 10,
  });
  const [opcionText, setOpcionText] = useState("");

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
    setCurrentPregunta({
      ...currentPregunta,
      opciones: [...(currentPregunta.opciones || []), opcionText],
    });
    setOpcionText("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("tests").insert({
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      preguntas: preguntas,
      interpretacion: formData.interpretacion,
      es_predefinido: false,
      fecha_creacion: new Date().toISOString(),
    });

    if (error) {
      alert("Error al guardar: " + error.message);
    } else {
      alert("Test creado exitosamente");
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
                  Opciones de respuesta
                </label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={opcionText}
                    onChange={(e) => setOpcionText(e.target.value)}
                    placeholder="Ej: Nunca"
                    className="flex-1"
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
                      {opt}
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

  const handleRespuesta = (preguntaId: string, valor: any) => {
    setRespuestas((prev) => ({ ...prev, [preguntaId]: valor }));
  };

  const calcularPuntaje = () => {
    let puntajeTotal = 0;

    test.preguntas?.forEach((pregunta) => {
      const respuesta = respuestas[pregunta.id];
      if (respuesta !== undefined && pregunta.tipo === "escala") {
        puntajeTotal += Number(respuesta);
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

    try {
      const paciente = pacientes.find((p) => p.id === selectedPaciente);
      const puntajeTotal = calcularPuntaje();

      // Guardar resultado
      const { error } = await supabase.from("resultados_tests").insert({
        test_id: test.id,
        paciente_id: selectedPaciente,
        email_paciente: paciente?.email || "",
        nombre_paciente: paciente?.nombre_completo || "",
        respuestas: respuestas,
        puntaje_total: puntajeTotal,
        interpretacion: test.interpretacion || "",
        completado: true,
        fecha_completado: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      addNotification("Test aplicado y guardado exitosamente", "success");
      onClose();
    } catch (error: any) {
      addNotification(`Error: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

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

            {pregunta.tipo === "escala" && (
              <div className="flex gap-2">
                {Array.from({ length: (pregunta.puntaje_max || 10) + 1 }, (_, i) => i).map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleRespuesta(pregunta.id, num)}
                    className={`w-10 h-10 rounded-lg font-medium transition-all ${respuestas[pregunta.id] === num
                        ? "text-white"
                        : "border hover:border-[#D4A5A5]"
                      }`}
                    style={{
                      backgroundColor: respuestas[pregunta.id] === num ? colors.primary : "transparent",
                      borderColor: respuestas[pregunta.id] === num ? colors.primary : colors.primaryLight,
                    }}
                  >
                    {num}
                  </button>
                ))}
              </div>
            )}

            {pregunta.tipo === "opcion_multiple" && (
              <div className="space-y-2">
                {pregunta.opciones?.map((opcion, idx) => (
                  <label key={idx} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name={`pregunta_${pregunta.id}`}
                      value={opcion}
                      checked={respuestas[pregunta.id] === opcion}
                      onChange={(e) => handleRespuesta(pregunta.id, e.target.value)}
                      className="w-4 h-4"
                    />
                    <span style={{ color: colors.text }}>{opcion}</span>
                  </label>
                ))}
              </div>
            )}

            {pregunta.tipo === "abierta" && (
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
          {loading ? "Guardando..." : "Guardar Resultados"}
        </Button>
      </div>
    </form>
  );
}
