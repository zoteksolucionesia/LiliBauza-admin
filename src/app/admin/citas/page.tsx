"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { DataTable, SearchBar, Modal, Button, Input, Select, TextArea, Header } from "@/components/admin";
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";

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

interface Cita {
  id: string;
  paciente_id: string;
  paciente_nombre: string;
  paciente_email: string;
  fecha: string;
  hora: string;
  tipo: string;
  estado: "pendiente" | "confirmada" | "cancelada" | "completada";
  notas?: string;
  calendly_id?: string;
}

interface Paciente {
  id: string;
  nombre: string;
  email: string;
}

export default function CitasPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");

  useEffect(() => {
    checkAuth();
    loadCitas();
    loadPacientes();
  }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/admin/login");
      return;
    }
  }

  async function loadCitas() {
    const { data, error } = await supabase
      .from("citas")
      .select("*")
      .order("fecha", { ascending: true });

    if (error) {
      console.error("Error loading citas:", error);
      return;
    }

    setCitas(data || []);
    setLoading(false);
  }

  async function loadPacientes() {
    const { data, error } = await supabase
      .from("pacientes")
      .select("id, nombre, email")
      .order("nombre", { ascending: true });

    if (!error && data) {
      setPacientes(data);
    }
  }

  const filteredCitas = citas.filter((c) => {
    const matchSearch = c.paciente_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.paciente_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchEstado = filtroEstado === "todos" || c.estado === filtroEstado;
    return matchSearch && matchEstado;
  });

  const columns = [
    {
      key: "fecha",
      label: "Fecha",
      render: (value: string) => new Date(value).toLocaleDateString("es-MX", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric"
      }),
    },
    { key: "hora", label: "Hora" },
    { key: "paciente_nombre", label: "Paciente" },
    { key: "tipo", label: "Tipo" },
    {
      key: "estado",
      label: "Estado",
      render: (value: string) => {
        const styles: Record<string, string> = {
          pendiente: "bg-yellow-100 text-yellow-800",
          confirmada: "bg-green-100 text-green-800",
          cancelada: "bg-red-100 text-red-800",
          completada: "bg-blue-100 text-blue-800",
        };
        return (
          <span className={`px-2 py-1 rounded text-xs capitalize ${styles[value] || "bg-gray-100 text-gray-800"}`}>
            {value}
          </span>
        );
      },
    },
  ];

  const citasProximas = citas.filter((c) => {
    const citaDate = new Date(c.fecha);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return citaDate >= today && c.estado !== "cancelada";
  }).length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      {/* Header con logo */}
      <Header
        title="Citas"
        subtitle="Gestión de appointments"
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-lg flex items-center gap-4" style={{ backgroundColor: colors.surface }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.primaryLight }}>
                <Calendar className="w-6 h-6" style={{ color: colors.primaryDark }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: colors.text }}>{citasProximas}</p>
                <p className="text-sm" style={{ color: colors.textMuted }}>Citas próximas</p>
              </div>
            </div>
            <div className="p-4 rounded-lg flex items-center gap-4" style={{ backgroundColor: colors.surface }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.secondary }}>
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: colors.text }}>{citas.length}</p>
                <p className="text-sm" style={{ color: colors.textMuted }}>Total de citas</p>
              </div>
            </div>
          </div>

          <SearchBar
            placeholder="Buscar por paciente..."
            value={searchTerm}
            onChange={setSearchTerm}
            onAdd={() => setIsModalOpen(true)}
            addLabel="Agendar Cita"
          />

          {/* Filtro por estado */}
          <div className="mb-4">
            <Select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              options={[
                { value: "todos", label: "Todos los estados" },
                { value: "pendiente", label: "Pendiente" },
                { value: "confirmada", label: "Confirmada" },
                { value: "cancelada", label: "Cancelada" },
                { value: "completada", label: "Completada" },
              ]}
            />
          </div>

          <DataTable
            columns={columns}
            data={filteredCitas}
            actions={(row) => (
              <div className="flex gap-2 justify-end">
                {row.estado === "pendiente" && (
                  <Button
                    size="sm"
                    onClick={async () => {
                      await supabase.from("citas").update({ estado: "confirmada" }).eq("id", row.id);
                      loadCitas();
                    }}
                  >
                    Confirmar
                  </Button>
                )}
                {row.estado !== "cancelada" && row.estado !== "completada" && (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={async () => {
                      if (confirm("¿Cancelar esta cita?")) {
                        await supabase.from("citas").update({ estado: "cancelada" }).eq("id", row.id);
                        loadCitas();
                      }
                    }}
                  >
                    Cancelar
                  </Button>
                )}
                {row.estado === "confirmada" && (
                  <Button
                    size="sm"
                    onClick={async () => {
                      await supabase.from("citas").update({ estado: "completada" }).eq("id", row.id);
                      loadCitas();
                    }}
                  >
                    Completar
                  </Button>
                )}
              </div>
            )}
            emptyMessage="No hay citas registradas"
          />
        </motion.div>
      </main>

      {/* Modal para agendar cita */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Agendar Nueva Cita"
        size="md"
      >
        <CitaForm
          pacientes={pacientes}
          onClose={() => {
            setIsModalOpen(false);
            loadCitas();
          }}
        />
      </Modal>
    </div>
  );
}

function CitaForm({ pacientes, onClose }: { pacientes: Paciente[]; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    paciente_id: "",
    fecha: "",
    hora: "",
    tipo: "Consulta individual",
    estado: "pendiente" as const,
    notas: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const paciente = pacientes.find((p) => p.id === formData.paciente_id);

    const { error } = await supabase.from("citas").insert({
      paciente_id: formData.paciente_id,
      paciente_nombre: paciente?.nombre || "",
      paciente_email: paciente?.email || "",
      fecha: formData.fecha,
      hora: formData.hora,
      tipo: formData.tipo,
      estado: formData.estado,
      notas: formData.notas,
    });

    if (error) {
      alert("Error al guardar: " + error.message);
    } else {
      alert("Cita agendada exitosamente");
      onClose();
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Select
        label="Paciente"
        value={formData.paciente_id}
        onChange={(e) => setFormData({ ...formData, paciente_id: e.target.value })}
        options={[
          { value: "", label: "Seleccionar paciente..." },
          ...pacientes.map((p) => ({ value: p.id, label: p.nombre })),
        ]}
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Fecha"
          type="date"
          value={formData.fecha}
          onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
          required
        />
        <Input
          label="Hora"
          type="time"
          value={formData.hora}
          onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
          required
        />
      </div>

      <Select
        label="Tipo de cita"
        value={formData.tipo}
        onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
        options={[
          { value: "Consulta individual", label: "Consulta individual" },
          { value: "Terapia de pareja", label: "Terapia de pareja" },
          { value: "Evaluación psicológica", label: "Evaluación psicológica" },
          { value: "Seguimiento", label: "Seguimiento" },
          { value: "Otro", label: "Otro" },
        ]}
      />

      <Select
        label="Estado inicial"
        value={formData.estado}
        onChange={(e) => setFormData({ ...formData, estado: e.target.value as any })}
        options={[
          { value: "pendiente", label: "Pendiente" },
          { value: "confirmada", label: "Confirmada" },
        ]}
      />

      <TextArea
        label="Notas"
        value={formData.notas}
        onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
        rows={3}
        placeholder="Notas adicionales sobre la cita..."
      />

      <div className="flex gap-3 justify-end mt-4">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Agendando..." : "Agendar Cita"}
        </Button>
      </div>
    </form>
  );
}
