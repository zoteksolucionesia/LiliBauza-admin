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
  // Inyectar variables de entorno directamente en el build para garantizar
  // que estén disponibles en Firebase Hosting (producción).
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://wxbbmzeoydtygqykkrdk.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4YmJtemVveWR0eWdxeWtrcmRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MTI1MzYsImV4cCI6MjA4OTI4ODUzNn0.jSNK7ohuIGBrHdqemy3kaEYhpdRGBKV8GlmQF0MxHaw",
  },
};

export default nextConfig;
