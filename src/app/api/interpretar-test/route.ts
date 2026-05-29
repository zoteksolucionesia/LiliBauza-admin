import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Proveedor de IA configurable por variable de entorno.
// AI_PROVIDER = "gemini" | "anthropic" (default: "anthropic")
// - Gemini:   GEMINI_API_KEY    + GEMINI_MODEL    (default gemini-2.0-flash-lite)
// - Anthropic: ANTHROPIC_API_KEY + ANTHROPIC_MODEL (default claude-haiku-4-5-20251001)
export async function POST(req: NextRequest) {
  try {
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

    const provider = (process.env.AI_PROVIDER || "anthropic").toLowerCase();
    let interpretacion = "";

    if (provider === "gemini") {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return NextResponse.json({ error: "GEMINI_API_KEY no configurada en el servidor" }, { status: 500 });
      }
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || "gemini-2.0-flash-lite",
      });
      const result = await model.generateContent(prompt);
      interpretacion = result.response.text();
    } else {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        return NextResponse.json({ error: "ANTHROPIC_API_KEY no configurada en el servidor" }, { status: 500 });
      }
      const anthropic = new Anthropic({ apiKey });
      const message = await anthropic.messages.create({
        model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
        max_tokens: 800,
        messages: [{ role: "user", content: prompt }],
      });
      interpretacion = message.content[0].type === "text" ? message.content[0].text : "";
    }

    return NextResponse.json({ interpretacion, provider });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error generando la interpretación";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
