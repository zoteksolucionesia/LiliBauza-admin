import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  // Verificar sesión con el token del usuario
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { testNombre, testDescripcion, preguntas, respuestas, puntajeTotal, interpretacionManual } = await req.json();

  const prompt = `Eres un psicólogo clínico especializado en interpretación de evaluaciones psicológicas estandarizadas.

Test aplicado: ${testNombre}
${testDescripcion ? `Descripción: ${testDescripcion}` : ""}
Puntaje total obtenido: ${puntajeTotal}
${interpretacionManual ? `Guía de interpretación del test:\n${interpretacionManual}` : ""}

Respuestas del paciente:
${(preguntas as Array<{ id: string; texto: string }>)
  .map((p, i) => `${i + 1}. ${p.texto}: ${respuestas[p.id] ?? "(no respondida)"}`)
  .join("\n")}

Redacta una interpretación clínica profesional y empática en español. Incluye:
1. Interpretación del puntaje según la escala del instrumento
2. Observaciones relevantes basadas en el patrón de respuestas
3. Recomendaciones generales para el terapeuta (máximo 2 líneas)

Importante: sé conciso (máximo 3 párrafos), usa lenguaje clínico pero comprensible, y NO hagas diagnósticos definitivos — eso corresponde al criterio clínico del terapeuta.`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    messages: [{ role: "user", content: prompt }],
  });

  const interpretacion = message.content[0].type === "text" ? message.content[0].text : "";

  return NextResponse.json({ interpretacion });
}
