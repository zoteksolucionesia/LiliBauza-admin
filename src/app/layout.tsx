import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LiliBauza - Admin",
  description: "Dashboard Administrativo - Mtra. Liliana Bauza",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
