"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { colors } from "@/lib/theme";

type Modo = "solicitar" | "nueva-password";

export default function ResetPasswordPage() {
  const [modo, setModo] = useState<Modo>("solicitar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Al cargar, si venimos desde el enlace del email Supabase establece una
  // sesión de recuperación (evento PASSWORD_RECOVERY) o ya hay sesión activa.
  // En ese caso pasamos directo al modo "nueva-password".
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setModo("nueva-password");
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setModo("nueva-password");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSolicitar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });

    if (error) {
      setError("No se pudo enviar el correo. Verifica el email e intenta de nuevo.");
      setLoading(false);
      return;
    }

    setSuccess("Te enviamos un correo con el enlace para restablecer tu contraseña. Revisa tu bandeja de entrada (y spam).");
    setLoading(false);
  }

  async function handleNuevaPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError("No se pudo actualizar la contraseña. El enlace pudo haber expirado; solicita uno nuevo.");
      setLoading(false);
      return;
    }

    setSuccess("¡Contraseña actualizada! Redirigiendo al inicio de sesión...");
    setLoading(false);
    setTimeout(() => {
      window.location.href = "/admin/login";
    }, 2000);
  }

  const inputStyle = {
    borderColor: `${colors.primary}44`,
    backgroundColor: colors.background,
    color: colors.text,
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
      <div className="max-w-md w-full rounded-2xl shadow-xl p-6" style={{ backgroundColor: colors.surface }}>
        <div className="mb-2 flex justify-center">
          <img src="/logo.png" alt="LiliBauza Logo" className="w-44 h-44 object-contain" />
        </div>

        <div className="text-center mb-3">
          <h1 className="text-2xl font-bold" style={{ color: colors.text }}>
            {modo === "solicitar" ? "Recuperar Contraseña" : "Nueva Contraseña"}
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: colors.textMuted }}>
            {modo === "solicitar"
              ? "Te enviaremos un enlace a tu correo"
              : "Escribe tu nueva contraseña"}
          </p>
        </div>

        {modo === "solicitar" && (
          <form onSubmit={handleSolicitar} className="space-y-4">
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
                style={inputStyle}
                placeholder="contacto@lilianabauza.com"
              />
            </div>

            {error && <Alerta tipo="error" mensaje={error} />}
            {success && <Alerta tipo="success" mensaje={success} />}

            <BotonSubmit loading={loading} texto="Enviar enlace" />
          </form>
        )}

        {modo === "nueva-password" && (
          <form onSubmit={handleNuevaPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: colors.text }}>
                Nueva contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-all pr-12"
                  style={inputStyle}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-black/5 rounded-lg transition-colors"
                  style={{ color: colors.textMuted }}
                  title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: colors.text }}>
                Confirmar contraseña
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-all"
                style={inputStyle}
                placeholder="••••••••"
              />
            </div>

            {error && <Alerta tipo="error" mensaje={error} />}
            {success && <Alerta tipo="success" mensaje={success} />}

            <BotonSubmit loading={loading} texto="Actualizar contraseña" />
          </form>
        )}

        <div className="mt-4 text-center">
          <a href="/admin/login" className="text-sm font-medium hover:underline" style={{ color: colors.primaryDark }}>
            ← Volver al inicio de sesión
          </a>
        </div>
      </div>
    </div>
  );
}

function Alerta({ tipo, mensaje }: { tipo: "error" | "success"; mensaje: string }) {
  return (
    <div
      className="p-3 rounded-xl text-sm flex items-center gap-2"
      style={{
        backgroundColor: tipo === "error" ? `${colors.accent}15` : "#22c55e15",
        color: colors.text,
      }}
    >
      <span>{tipo === "error" ? "⚠️" : "✅"}</span> {mensaje}
    </div>
  );
}

function BotonSubmit({ loading, texto }: { loading: boolean; texto: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full py-3 rounded-xl font-semibold transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 mt-2"
      style={{ backgroundColor: colors.primary, color: "#FFFFFF", boxShadow: `0 4px 12px ${colors.primary}33` }}
    >
      {loading ? "Procesando..." : texto}
    </button>
  );
}
