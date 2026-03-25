import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const pdfPath = path.join(process.cwd(), "src", "assets", "Hoja_Membretada.pdf");
    const fileBuffer = await fs.readFile(pdfPath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error loading hoja membretada:", error);
    return new NextResponse("Hoja membretada not found", { status: 404 });
  }
}
