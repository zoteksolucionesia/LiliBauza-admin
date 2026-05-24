import crypto from "crypto";

export interface MetadatosFirma {
  docId: string;
  paciente_id: string | null;
  tipo: string;
  fecha: string;
  terapeuta_id: string;
}

const FIRMA_SECRET = process.env.FIRMA_SECRET || "lilibauza-default-dev-secret-change-in-prod";

// Canoniza la fecha a ISO-8601 UTC con sufijo "Z" antes del hash.
// Postgres TIMESTAMPTZ se serializa como "...+00:00" al leerse, mientras que
// el cliente firma con `new Date().toISOString()` que produce "...Z". Sin
// normalizar, los dos strings difieren y el SHA-256 no coincide.
export function computarHash(meta: MetadatosFirma): string {
  const fechaCanonica = new Date(meta.fecha).toISOString();
  const payload = [
    meta.docId,
    meta.paciente_id ?? "null",
    meta.tipo,
    fechaCanonica,
    meta.terapeuta_id,
    FIRMA_SECRET,
  ].join("|");

  return crypto.createHash("sha256").update(payload).digest("hex").slice(0, 16);
}

export function getVerifyBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_VERIFY_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://lilibauza-admin.web.app"
  ).replace(/\/$/, "");
}

export function buildQrUrl(docId: string): string {
  return `${getVerifyBaseUrl()}/verificar/${docId}`;
}
