import { NextRequest } from "next/server";
import { isMockMode, generateJson } from "@/lib/anthropic";
import {
  LESSON_SCHEMA,
  flattenLessons,
  normalizeBlock,
  type Block,
  type CourseSettings,
  type GeneratedLesson,
  type Outline,
} from "@/lib/schemas";
import { lessonSystem, lessonUser } from "@/lib/prompts";
import { prepareSource } from "@/lib/extract";
import { mockLesson, mockUsage } from "@/lib/mock";

export const runtime = "nodejs";
export const maxDuration = 300;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Streams SSE progress events as each lesson generates, so the browser can show
// lessons appearing one by one with a live token/cost tally.
export async function POST(req: NextRequest) {
  const { source, outline, settings } = (await req.json()) as {
    source: string;
    outline: Outline;
    settings: CourseSettings;
  };

  const mock = isMockMode();
  const lessons = flattenLessons(outline);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

      let totalIn = 0;
      let totalOut = 0;
      let totalCost = 0;

      send({ type: "start", total: lessons.length, mock });

      for (let i = 0; i < lessons.length; i++) {
        const { moduleTitle, lesson } = lessons[i];
        send({ type: "lesson_start", lessonId: lesson.id, index: i });

        try {
          let generated: GeneratedLesson;
          let usage;

          if (mock) {
            await sleep(650 + Math.random() * 500);
            const canned = mockLesson(lesson.id);
            generated = { ...canned, id: lesson.id, title: lesson.title };
            usage = mockUsage();
          } else {
            const res = await generateJson<{ blocks: unknown[] }>(
              lessonSystem(),
              lessonUser(
                prepareSource(source),
                outline.courseTitle,
                moduleTitle,
                lesson,
                settings,
              ),
              LESSON_SCHEMA,
              8000,
            );
            const blocks = (res.data.blocks || [])
              .map(normalizeBlock)
              .filter((b): b is Block => b !== null);
            generated = {
              id: lesson.id,
              title: lesson.title,
              objective: lesson.objective,
              blocks,
            };
            usage = res.usage;
          }

          totalIn += usage.inputTokens;
          totalOut += usage.outputTokens;
          totalCost += usage.costUsd;

          send({
            type: "lesson_done",
            lessonId: lesson.id,
            index: i,
            lesson: generated,
            usage,
            totals: {
              inputTokens: totalIn,
              outputTokens: totalOut,
              costUsd: totalCost,
            },
          });
        } catch (e) {
          send({
            type: "lesson_error",
            lessonId: lesson.id,
            index: i,
            message: (e as Error).message || "Lesson generation failed.",
          });
        }
      }

      send({
        type: "complete",
        totals: {
          inputTokens: totalIn,
          outputTokens: totalOut,
          costUsd: totalCost,
        },
      });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
