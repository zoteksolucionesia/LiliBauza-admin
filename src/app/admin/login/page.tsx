"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { colors } from "@/lib/theme";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: colors.text }}>
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-all"
              style={{
                borderColor: `${colors.primary}44`,
                backgroundColor: colors.background,
                color: colors.text,
              }}
              placeholder="contacto@lilianabauza.com"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-sm font-medium" style={{ color: colors.text }}>
                Contraseña
              </label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-all pr-12"
                style={{
                  borderColor: `${colors.primary}44`,
                  backgroundColor: colors.background,
                  color: colors.text,
                }}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-black/5 rounded-lg transition-colors"
                style={{ color: colors.textMuted }}
                title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-1" style={{ backgroundColor: `${colors.accent}15`, color: colors.text }}>
              <span>⚠️</span> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 mt-2"
            style={{
              backgroundColor: colors.primary,
              color: "#FFFFFF",
              boxShadow: `0 4px 12px ${colors.primary}33`
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verificando...
              </span>
            ) : "Iniciar Sesión"}
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
