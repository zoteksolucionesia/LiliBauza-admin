import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware de protección de rutas para el panel de administración.
 * Redirige a /admin/login si no existe una cookie de sesión de Supabase.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir el acceso a la página de login siempre
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // Buscar cualquier cookie de sesión de Supabase (el prefijo varía por proyecto)
  const cookies = request.cookies.getAll();
  const hasSession = cookies.some(
    (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
  );

  // Si no hay cookie de sesión, redirigir al login
  if (!hasSession) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
