import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { emailPaciente, nombrePaciente, testNombre, puntajeTotal, interpretacion, nombreClinica, resultadoId } = await req.json();

  if (!emailPaciente) return NextResponse.json({ error: "Email del paciente requerido" }, { status: 400 });

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
    to: emailPaciente,
    subject: `Resultados de tu evaluación: ${testNombre}`,
    html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
        <!-- Header -->
        <tr>
          <td style="background:#D4A5A5;padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:bold;">Resultados de Evaluación</h1>
            <p style="margin:8px 0 0;color:#fff5f5;font-size:14px;">${nombreClinica || "Consulta Psicológica"}</p>
          </td>
        </tr>
        <!-- Saludo -->
        <tr>
          <td style="padding:32px 40px 0;">
            <p style="margin:0;color:#333;font-size:16px;">Hola <strong>${nombrePaciente}</strong>,</p>
            <p style="margin:12px 0 0;color:#555;font-size:14px;line-height:1.6;">
              A continuación encontrarás los resultados de tu evaluación <strong>${testNombre}</strong>,
              realizada a través del sistema de ${nombreClinica || "tu terapeuta"}.
            </p>
          </td>
        </tr>
        <!-- Puntaje -->
        <tr>
          <td style="padding:24px 40px 0;">
            <div style="background:#fff0f0;border-left:4px solid #D4A5A5;border-radius:6px;padding:20px 24px;">
              <p style="margin:0 0 4px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Puntaje obtenido</p>
              <p style="margin:0;color:#3D2929;font-size:36px;font-weight:bold;">${puntajeTotal}</p>
            </div>
          </td>
        </tr>
        <!-- Interpretación -->
        <tr>
          <td style="padding:24px 40px 0;">
            <h2 style="margin:0 0 12px;color:#3D2929;font-size:16px;">Interpretación clínica</h2>
            <div style="color:#444;font-size:14px;line-height:1.8;white-space:pre-line;">${interpretacion}</div>
          </td>
        </tr>
        <!-- Aviso -->
        <tr>
          <td style="padding:24px 40px;">
            <div style="background:#fafafa;border-radius:6px;padding:16px 20px;">
              <p style="margin:0;color:#888;font-size:12px;line-height:1.6;">
                ⚠️ Esta interpretación es orientativa y no reemplaza el criterio clínico de tu terapeuta.
                Si tienes dudas sobre estos resultados, comunícate directamente con tu especialista.
              </p>
            </div>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9f0f0;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
            <p style="margin:0;color:#aaa;font-size:12px;">
              Generado por ${nombreClinica || "el sistema de gestión"} · ${new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Marcar resultado como enviado en BD
  if (resultadoId) {
    await supabase.from("resultados_tests").update({ email_enviado: true }).eq("id", resultadoId);
  }

  return NextResponse.json({ success: true });
}
