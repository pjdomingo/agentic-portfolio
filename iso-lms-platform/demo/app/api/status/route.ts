import { NextResponse } from "next/server";
import { isMockMode, GENERATION_MODEL } from "@/lib/anthropic";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    mock: isMockMode(),
    model: isMockMode() ? null : GENERATION_MODEL,
  });
}
