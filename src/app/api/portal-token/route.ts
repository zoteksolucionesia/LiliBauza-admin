import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { SignJWT } from 'jose';

// Secreto compartido con el backend de Zotek. NO se hardcodea un fallback:
// si falta la variable, el SSO devuelve 500 en vez de firmar con un secreto débil.
const SECRET_RAW = process.env.PORTAL_SSO_SECRET;
const SECRET = SECRET_RAW ? new TextEncoder().encode(SECRET_RAW) : null;

export async function POST(request: NextRequest) {
  try {
    if (!SECRET) {
      return NextResponse.json({ error: 'SSO no configurado' }, { status: 500 });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authorization' }, { status: 401 });
    }

    const token = authHeader.slice(7);

    // Verificar token de Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Crear JWT para SSO del portal (válido 2 minutos)
    const ssoToken = await new SignJWT({
      sub: user.id,
      email: user.email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 120,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .sign(SECRET);

    return NextResponse.json({ token: ssoToken });
  } catch (err) {
    console.error('Portal token error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
