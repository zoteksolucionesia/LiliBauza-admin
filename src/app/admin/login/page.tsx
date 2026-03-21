"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

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

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/admin/dashboard");
  }

  async function handleSignUp() {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      return;
    }

    alert("Cuenta creada. Por favor verifica tu email.");
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
      <div
        className="max-w-md w-full rounded-lg shadow-lg p-8"
        style={{ backgroundColor: colors.surface }}
      >
        <div className="text-center mb-8">
          {/* Logo */}
          <div className="mb-6 flex justify-center">
            <div
              className="w-64 h-64 rounded-full flex items-center justify-center overflow-hidden"
              style={{ backgroundColor: colors.surface, boxShadow: `0 8px 16px -4px rgba(0, 0, 0, 0.15)` }}
            >
              <img
                src="/api/logo?v=5"
                alt="LiliBauza Logo"
                className="w-60 h-60 object-contain"
              />
            </div>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: colors.text }}>
            Admin Login
          </h1>
          <p className="mt-2" style={{ color: colors.textMuted }}>
            Mtra. Liliana Bauza
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all"
              style={{
                borderColor: `${colors.primary}66`,
                backgroundColor: colors.background,
                color: colors.text,
              }}
              placeholder="contacto@lilianabauza.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all"
              style={{
                borderColor: `${colors.primary}66`,
                backgroundColor: colors.background,
                color: colors.text,
              }}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: `${colors.accent}22`, color: colors.text }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-semibold transition-all hover:opacity-90 disabled:opacity-50"
            style={{
              backgroundColor: colors.primary,
              color: "#FFFFFF",
            }}
          >
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm" style={{ color: colors.textMuted }}>
            ¿Es tu primera vez?{" "}
            <button
              onClick={handleSignUp}
              className="font-medium hover:underline"
              style={{ color: colors.primaryDark }}
            >
              Crear cuenta
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
