import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

// Forzar renderizado dinámico para esta ruta
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    // Leer el nuevo logo PNG transparente
    const logoPath = path.join(process.cwd(), "src", "assets", "LogoLiliTransparente.png");
    const fileBuffer = await fs.readFile(logoPath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error loading logo:", error);
    return new NextResponse("Logo not found", { status: 404 });
  }
}
