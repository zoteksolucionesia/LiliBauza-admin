"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Header, Button } from "@/components/admin";

// Colores Palo de Rosa (por defecto)
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

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pacientes: 0,
    documentos: 0,
    tests: 0,
    citas: 0,
  });

  useEffect(() => {
    checkAuth();
    loadStats();
  }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/admin/login");
      return;
    }
    setLoading(false);
  }

  async function loadStats() {
    const { count: pacientesCount } = await supabase
      .from("pacientes")
      .select("*", { count: "exact", head: true });

    const { count: documentosCount } = await supabase
      .from("documentos")
      .select("*", { count: "exact", head: true });

    const { count: testsCount } = await supabase
      .from("tests")
      .select("*", { count: "exact", head: true });

    const { count: citasCount } = await supabase
      .from("citas")
      .select("*", { count: "exact", head: true });

    setStats({
      pacientes: pacientesCount || 0,
      documentos: documentosCount || 0,
      tests: testsCount || 0,
      citas: citasCount || 0,
    });
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
        <div className="text-center">
          <div
            className="w-32 h-32 rounded-full flex items-center justify-center overflow-hidden mx-auto mb-4"
            style={{ backgroundColor: colors.surface, boxShadow: `0 8px 16px -4px rgba(0, 0, 0, 0.15)` }}
          >
            <img
              src="/api/logo?v=5"
              alt="LiliBauza Logo"
              className="w-28 h-28 object-contain animate-pulse"
            />
          </div>
          <p style={{ color: colors.textMuted }}>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      {/* Header con logo y botón de salir */}
      <div className="flex items-center justify-between">
        <Header
          title="Dashboard Administrativo"
          subtitle="Mtra. Liliana Bauza"
          showBack={false}
        />
        <Button
          onClick={handleLogout}
          className="mr-4"
          style={{ backgroundColor: colors.primaryDark }}
        >
          🚪 Cerrar Sesión
        </Button>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Pacientes"
            value={stats.pacientes}
            href="/admin/pacientes"
            color={colors.primary}
            emoji="👥"
          />
          <StatCard
            title="Documentos"
            value={stats.documentos}
            href="/admin/documentos"
            color={colors.secondary}
            emoji="📄"
          />
          <StatCard
            title="Tests"
            value={stats.tests}
            href="/admin/tests"
            color={colors.accent}
            emoji="📊"
          />
          <StatCard
            title="Citas"
            value={stats.citas}
            href="/admin/citas"
            color={colors.primaryDark}
            emoji="📅"
          />
        </div>

        {/* Quick Actions */}
        <div className="rounded-lg shadow p-6" style={{ backgroundColor: colors.surface }}>
          <h2 className="text-xl font-semibold mb-4" style={{ color: colors.text }}>
            Acciones Rápidas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <QuickActionButton
              label="Nuevo Paciente"
              href="/admin/pacientes"
              icon="👤"
              colors={colors}
            />
            <QuickActionButton
              label="Nuevo Documento"
              href="/admin/documentos"
              icon="📄"
              colors={colors}
            />
            <QuickActionButton
              label="Crear Test"
              href="/admin/tests"
              icon="📋"
              colors={colors}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, href, color, emoji }: any) {
  return (
    <a
      href={href}
      className="rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
      style={{ backgroundColor: "#FFFFFF" }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p style={{ color: "#6B7280" }} className="text-sm">{title}</p>
          <p className="text-3xl font-bold" style={{ color: "#3D2929" }}>{value}</p>
        </div>
        <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: color }}>
          <span className="text-2xl">{emoji}</span>
        </div>
      </div>
    </a>
  );
}

function QuickActionButton({ label, href, icon, colors }: any) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 p-4 border-2 rounded-lg transition-all"
      style={{
        borderColor: `${colors.primary}44`,
        backgroundColor: colors.background,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = colors.primary;
        e.currentTarget.style.backgroundColor = colors.primaryLight;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = `${colors.primary}44`;
        e.currentTarget.style.backgroundColor = colors.background;
      }}
    >
      <span className="text-2xl">{icon}</span>
      <span className="font-medium" style={{ color: colors.text }}>{label}</span>
    </a>
  );
}
