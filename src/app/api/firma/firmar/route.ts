import { NextRequest, NextResponse } from "next/server";
import { computarHash, buildQrUrl, MetadatosFirma } from "@/lib/firma";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<MetadatosFirma>;

    if (!body.docId || !body.tipo || !body.fecha || !body.terapeuta_id) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: docId, tipo, fecha, terapeuta_id" },
        { status: 400 }
      );
    }

    const meta: MetadatosFirma = {
      docId: body.docId,
      paciente_id: body.paciente_id ?? null,
      tipo: body.tipo,
      fecha: body.fecha,
      terapeuta_id: body.terapeuta_id,
    };

    const firma_hash = computarHash(meta);
    const qr_url = buildQrUrl(meta.docId);

    return NextResponse.json({ firma_hash, qr_url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
