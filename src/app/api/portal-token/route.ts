import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// Genera un token SSO firmado (JWT HS256) para que el terapeuta ya autenticado
// en el CRM entre al portal de Zotek (zotek-ia.web.app/portal) sin volver a loguearse.
// El token es de corta duración y va firmado con un secreto COMPARTIDO con el portal
// (PORTAL_SSO_SECRET) — distinto del SECRET_KEY interno del portal por seguridad.

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function signJWT(payload: Record<string, unknown>, secret: string): string {
  const header = { alg: "HS256", typ: "JWT" };
  const h = base64url(JSON.stringify(header));
  const p = base64url(JSON.stringify(payload));
  const data = `${h}.${p}`;
  const sig = crypto.createHmac("sha256", secret).update(data).digest();
  return `${data}.${base64url(sig)}`;
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnon) {
      return NextResponse.json({ error: "Supabase no configurado" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const secret = process.env.PORTAL_SSO_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "PORTAL_SSO_SECRET no configurado en el servidor" }, { status: 500 });
    }

    // Token válido por 2 minutos (solo para el handshake de entrada al portal).
    const ssoToken = signJWT(
      { email: user.email, exp: Math.floor(Date.now() / 1000) + 120 },
      secret
    );

    return NextResponse.json({ token: ssoToken });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error generando el token";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
