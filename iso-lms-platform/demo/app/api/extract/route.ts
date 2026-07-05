import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { extractSource } from "@/lib/extract";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const url = new URL(req.url);

  // "Use sample document" — serve the bundled ISO 27001 primer.
  if (url.searchParams.get("sample")) {
    try {
      const p = path.join(process.cwd(), "sample", "iso27001-primer.md");
      const text = await fs.readFile(p, "utf8");
      return NextResponse.json({
        text,
        filename: "iso27001-primer.md",
        truncated: false,
        sample: true,
      });
    } catch {
      return NextResponse.json(
        { error: "Sample document not found." },
        { status: 500 },
      );
    }
  }

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }
    const { text, pages, truncated } = await extractSource(file);
    if (!text.trim()) {
      return NextResponse.json(
        {
          error:
            "Could not extract text from that file (a scanned image PDF may need OCR).",
        },
        { status: 422 },
      );
    }
    return NextResponse.json({ text, filename: file.name, pages, truncated });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || "Extraction failed." },
      { status: 500 },
    );
  }
}
