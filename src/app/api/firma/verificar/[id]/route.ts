import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { computarHash } from "@/lib/firma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnon) {
      return NextResponse.json({ error: "Supabase no configurado" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnon);

    const { data: doc, error } = await supabase
      .from("documentos")
      .select(
        "id, tipo, titulo, created_at, paciente_id, terapeuta_id, firma_hash, activo"
      )
      .eq("id", id)
      .single();

    if (error || !doc) {
      return NextResponse.json({ valid: false, reason: "no_encontrado" }, { status: 404 });
    }

    if (doc.activo === false) {
      return NextResponse.json({ valid: false, reason: "revocado" }, { status: 410 });
    }

    const hashEsperado = computarHash({
      docId: doc.id,
      paciente_id: doc.paciente_id,
      tipo: doc.tipo,
      fecha: doc.created_at,
      terapeuta_id: doc.terapeuta_id,
    });

    const hashValido = doc.firma_hash === hashEsperado;

    const { data: branding } = await supabase
      .from("configuracion_branding")
      .select(
        "nombre_clinica, nombre_terapeuta, cedula_profesional, cedula_maestria, email_clinica, telefono_clinica, color_primario"
      )
      .eq("terapeuta_id", doc.terapeuta_id)
      .single();

    return NextResponse.json({
      valid: hashValido,
      reason: hashValido ? "ok" : "hash_invalido",
      documento: {
        id: doc.id,
        tipo: doc.tipo,
        titulo: doc.titulo,
        created_at: doc.created_at,
      },
      terapeuta: branding ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
