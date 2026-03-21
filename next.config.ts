import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Para desarrollo y testing local
  // Para producción en Firebase, comenta output: 'export' y usa un servidor Node
  // output: 'export',
  images: {
    unoptimized: true,
  },
  // Excluir la ruta del logo de la exportación estática
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
