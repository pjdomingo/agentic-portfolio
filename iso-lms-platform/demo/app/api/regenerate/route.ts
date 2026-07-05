import { NextRequest, NextResponse } from "next/server";
import { isMockMode, generateJson } from "@/lib/anthropic";
import {
  LESSON_SCHEMA,
  normalizeBlock,
  type Block,
  type CourseSettings,
  type GeneratedLesson,
  type OutlineLesson,
} from "@/lib/schemas";
import { lessonSystem, lessonUser, regenInstruction } from "@/lib/prompts";
import { prepareSource } from "@/lib/extract";
import { mockLesson, mockUsage } from "@/lib/mock";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { source, courseTitle, moduleTitle, lesson, settings, instruction } =
    (await req.json()) as {
      source: string;
      courseTitle: string;
      moduleTitle: string;
      lesson: OutlineLesson;
      settings: CourseSettings;
      instruction: string;
    };

  if (isMockMode()) {
    await new Promise((r) => setTimeout(r, 1100));
    const canned = mockLesson(lesson.id);
    // Prefix the first text block so the reviewer visibly sees the instruction took effect.
    const blocks: Block[] = canned.blocks.map((b, i) =>
      i === 0 && b.type === "text"
        ? {
            ...b,
            heading: `${b.heading ?? "Revised"} (revised: "${instruction}")`,
          }
        : b,
    );
    const regenerated: GeneratedLesson = {
      ...canned,
      id: lesson.id,
      title: lesson.title,
      blocks,
    };
    return NextResponse.json({ lesson: regenerated, usage: mockUsage(), mock: true });
  }

  try {
    const base = lessonUser(
      prepareSource(source),
      courseTitle,
      moduleTitle,
      lesson,
      settings,
    );
    const res = await generateJson<{ blocks: unknown[] }>(
      lessonSystem(),
      regenInstruction(base, instruction),
      LESSON_SCHEMA,
      8000,
    );
    const generated: GeneratedLesson = {
      id: lesson.id,
      title: lesson.title,
      objective: lesson.objective,
      blocks: (res.data.blocks || [])
        .map(normalizeBlock)
        .filter((b): b is Block => b !== null),
    };
    return NextResponse.json({ lesson: generated, usage: res.usage });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || "Regeneration failed." },
      { status: 500 },
    );
  }
}
