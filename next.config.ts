import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Las variables NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY
  // deben definirse en .env.local (desarrollo) o en las variables de entorno
  // del sistema de CI/CD (producción). NUNCA hardcodear credenciales aquí.
};

export default nextConfig;
