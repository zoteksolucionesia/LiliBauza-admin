"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { colors } from "@/lib/theme";

export default function AdminLogin() {
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

    window.location.href = "/admin/dashboard";
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
      <div
        className="max-w-md w-full rounded-2xl shadow-xl p-6"
        style={{ backgroundColor: colors.surface }}
      >
        {/* Logo — plano, sin circulo */}
        <div className="mb-2 flex justify-center">
          <img
            src="/logo.png"
            alt="LiliBauza Logo"
            className="w-44 h-44 object-contain"
          />
        </div>

        <div className="text-center mb-3">
          <h1 className="text-2xl font-bold" style={{ color: colors.text }}>
            Panel Administrativo
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: colors.textMuted }}>
            Mtra. Liliana Bauza
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 transition-all"
              style={{
                borderColor: `${colors.primary}66`,
                backgroundColor: colors.background,
                color: colors.text,
              }}
              placeholder="contacto@lilianabauza.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: colors.text }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 transition-all"
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
            className="w-full py-2.5 rounded-xl font-semibold transition-all hover:opacity-90 disabled:opacity-50 mt-1"
            style={{
              backgroundColor: colors.primary,
              color: "#FFFFFF",
            }}
          >
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>
        </form>

        <div className="mt-4 text-center">
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

      {/* Zotek Signature — dentro del flujo, no fixed */}
      <div className="absolute bottom-4 w-full flex justify-center opacity-70 hover:opacity-100 transition-opacity">
        <a href="https://zotek.com.mx" target="_blank" rel="noopener noreferrer">
          <img src="/images/logo_zotek_principal.svg" alt="Powered by Zotek" className="h-7 object-contain filter drop-shadow-sm" />
        </a>
      </div>
    </div>
  );
}
