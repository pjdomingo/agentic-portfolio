import { NextRequest, NextResponse } from "next/server";
import { isMockMode, generateJson } from "@/lib/anthropic";
import {
  OUTLINE_SCHEMA,
  withIds,
  type Outline,
  type CourseSettings,
} from "@/lib/schemas";
import { outlineSystem, outlineUser } from "@/lib/prompts";
import { prepareSource } from "@/lib/extract";
import { MOCK_OUTLINE, mockUsage } from "@/lib/mock";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { source, settings } = (await req.json()) as {
    source: string;
    settings: CourseSettings;
  };

  if (isMockMode()) {
    await new Promise((r) => setTimeout(r, 900));
    return NextResponse.json({
      outline: withIds(MOCK_OUTLINE),
      usage: mockUsage(),
      mock: true,
    });
  }

  if (!source || source.trim().length < 200) {
    return NextResponse.json(
      { error: "Source document is too short to build a course from." },
      { status: 400 },
    );
  }

  try {
    const { data, usage } = await generateJson<Outline>(
      outlineSystem(),
      outlineUser(prepareSource(source), settings),
      OUTLINE_SCHEMA,
      4000,
    );
    return NextResponse.json({ outline: withIds(data), usage });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || "Outline generation failed." },
      { status: 500 },
    );
  }
}
