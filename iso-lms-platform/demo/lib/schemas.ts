// Shared types + JSON schemas for the AI course-generation pipeline.
// This file is import-safe on both client and server (pure types + plain objects,
// no SDK / Node imports).

// ---------- Outline ----------

export interface OutlineLesson {
  id: string;
  title: string;
  objective: string;
}

export interface OutlineModule {
  id: string;
  title: string;
  lessons: OutlineLesson[];
}

export interface Outline {
  courseTitle: string;
  summary: string;
  modules: OutlineModule[];
}

// ---------- Lesson content blocks ----------

export type BlockType = "text" | "quiz_check" | "flashcards" | "scenario";

export interface Flashcard {
  front: string;
  back: string;
}

export interface ScenarioChoice {
  text: string;
  correct: boolean;
  feedback: string;
}

export interface Block {
  type: BlockType;
  // text
  heading?: string;
  markdown?: string;
  // quiz_check
  question?: string;
  options?: string[];
  correctIndex?: number;
  explanation?: string;
  // flashcards
  cards?: Flashcard[];
  // scenario
  situation?: string;
  choices?: ScenarioChoice[];
  // every block: the passage in the source it was drawn from (anti-hallucination)
  sourceRef?: string;
}

export interface GeneratedLesson {
  id: string;
  title: string;
  objective: string;
  blocks: Block[];
}

export interface CourseSettings {
  audience: string;
  goal: string;
}

// ---------- Cost accounting ----------

export interface Usage {
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

// ---------- Outline helpers (pure; client + server safe) ----------

// The outline schema intentionally omits ids (the model shouldn't invent them);
// assign deterministic ids server-side after generation.
export function withIds(outline: Outline): Outline {
  return {
    ...outline,
    modules: outline.modules.map((m, mi) => ({
      ...m,
      id: m.id || `m${mi + 1}`,
      lessons: m.lessons.map((l, li) => ({
        ...l,
        id: l.id || `m${mi + 1}l${li + 1}`,
      })),
    })),
  };
}

export function flattenLessons(
  outline: Outline,
): { moduleTitle: string; lesson: OutlineLesson }[] {
  const out: { moduleTitle: string; lesson: OutlineLesson }[] = [];
  for (const m of outline.modules) {
    for (const lesson of m.lessons) out.push({ moduleTitle: m.title, lesson });
  }
  return out;
}

// ---------- JSON Schemas for structured outputs ----------
// Structured outputs require: additionalProperties:false on every object, and
// no min/max/length constraints. Keep these plain.

export const OUTLINE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    courseTitle: { type: "string" },
    summary: { type: "string" },
    modules: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          lessons: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                title: { type: "string" },
                objective: { type: "string" },
              },
              required: ["title", "objective"],
            },
          },
        },
        required: ["title", "lessons"],
      },
    },
  },
  required: ["courseTitle", "summary", "modules"],
} as const;

// A permissive single-object block schema: `type` selects the block, the model
// fills the relevant fields, and the server normalizes/validates. This is more
// robust across model runs than a strict anyOf discriminated union.
export const LESSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    blocks: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          type: {
            type: "string",
            enum: ["text", "quiz_check", "flashcards", "scenario"],
          },
          heading: { type: "string" },
          markdown: { type: "string" },
          question: { type: "string" },
          options: { type: "array", items: { type: "string" } },
          correctIndex: { type: "integer" },
          explanation: { type: "string" },
          cards: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                front: { type: "string" },
                back: { type: "string" },
              },
              required: ["front", "back"],
            },
          },
          situation: { type: "string" },
          choices: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                text: { type: "string" },
                correct: { type: "boolean" },
                feedback: { type: "string" },
              },
              required: ["text", "correct", "feedback"],
            },
          },
          sourceRef: { type: "string" },
        },
        required: ["type"],
      },
    },
  },
  required: ["blocks"],
} as const;

// Normalize a raw block (from the model) into a valid Block, or return null if
// it can't form a usable block. Keeps the review UI from ever rendering garbage.
export function normalizeBlock(raw: unknown): Block | null {
  if (!raw || typeof raw !== "object") return null;
  const b = raw as Record<string, unknown>;
  const type = b.type as BlockType;
  const sourceRef = typeof b.sourceRef === "string" ? b.sourceRef : undefined;

  switch (type) {
    case "text":
      if (typeof b.markdown !== "string" || !b.markdown.trim()) return null;
      return {
        type,
        heading: typeof b.heading === "string" ? b.heading : undefined,
        markdown: b.markdown,
        sourceRef,
      };
    case "quiz_check": {
      const options = Array.isArray(b.options)
        ? (b.options.filter((o) => typeof o === "string") as string[])
        : [];
      if (typeof b.question !== "string" || options.length < 2) return null;
      const correctIndex =
        typeof b.correctIndex === "number" &&
        b.correctIndex >= 0 &&
        b.correctIndex < options.length
          ? b.correctIndex
          : 0;
      return {
        type,
        question: b.question,
        options,
        correctIndex,
        explanation:
          typeof b.explanation === "string" ? b.explanation : "",
        sourceRef,
      };
    }
    case "flashcards": {
      const cards = Array.isArray(b.cards)
        ? (b.cards
            .map((c) =>
              c && typeof c === "object"
                ? {
                    front: String((c as Record<string, unknown>).front ?? ""),
                    back: String((c as Record<string, unknown>).back ?? ""),
                  }
                : null,
            )
            .filter((c): c is Flashcard => !!c && !!c.front && !!c.back) as Flashcard[])
        : [];
      if (cards.length === 0) return null;
      return { type, cards, sourceRef };
    }
    case "scenario": {
      const choices = Array.isArray(b.choices)
        ? (b.choices
            .map((c) =>
              c && typeof c === "object"
                ? {
                    text: String((c as Record<string, unknown>).text ?? ""),
                    correct: Boolean((c as Record<string, unknown>).correct),
                    feedback: String(
                      (c as Record<string, unknown>).feedback ?? "",
                    ),
                  }
                : null,
            )
            .filter((c): c is ScenarioChoice => !!c && !!c.text) as ScenarioChoice[])
        : [];
      if (typeof b.situation !== "string" || choices.length < 2) return null;
      return { type, situation: b.situation, choices, sourceRef };
    }
    default:
      return null;
  }
}
