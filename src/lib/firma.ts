import crypto from "crypto";

export interface MetadatosFirma {
  docId: string;
  paciente_id: string | null;
  tipo: string;
  fecha: string;
  terapeuta_id: string;
}

const FIRMA_SECRET = process.env.FIRMA_SECRET || "lilibauza-default-dev-secret-change-in-prod";

export function computarHash(meta: MetadatosFirma): string {
  const payload = [
    meta.docId,
    meta.paciente_id ?? "null",
    meta.tipo,
    meta.fecha,
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
