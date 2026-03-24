"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { colors } from "@/lib/theme";

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
      setError("Credenciales incorrectas. Verifica tu email y contraseña.");
      setLoading(false);
      return;
    }

    router.push("/admin/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
      <div
        className="max-w-md w-full rounded-2xl shadow-xl p-8"
        style={{ backgroundColor: colors.surface }}
      >
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <div
            className="w-28 h-28 rounded-full flex items-center justify-center overflow-hidden"
            style={{ backgroundColor: colors.surface, boxShadow: `0 8px 32px -4px rgba(212,165,165,0.4)` }}
          >
            <img
              src="/api/logo?v=5"
              alt="LiliBauza Logo"
              className="w-24 h-24 object-contain"
            />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold" style={{ color: colors.text }}>
            Panel Administrativo
          </h1>
          <p className="mt-1 text-sm" style={{ color: colors.textMuted }}>
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
              autoComplete="email"
              className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-all"
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
              autoComplete="current-password"
              className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-all"
              style={{
                borderColor: `${colors.primary}66`,
                backgroundColor: colors.background,
                color: colors.text,
              }}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl text-sm flex items-center gap-2" style={{ backgroundColor: `${colors.accent}22`, color: colors.text }}>
              <span>⚠️</span> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold transition-all hover:opacity-90 disabled:opacity-50 mt-2"
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
            ¿Problemas para acceder?{" "}
            <a
              href="mailto:zoteksolucionesia@gmail.com"
              className="font-medium hover:underline"
              style={{ color: colors.primaryDark }}
            >
              Contacta al soporte
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
