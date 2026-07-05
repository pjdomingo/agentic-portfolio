// Client-side generation engine. Runs entirely in the browser so the app can be
// deployed as a fully static site (no server, no shared API key).
//
// - MOCK mode (default, no key): canned course content with simulated timing.
//   Free, safe for a public demo — nobody can run up API costs.
// - LIVE mode (visitor pastes their OWN Anthropic key): real generation via the
//   Anthropic SDK's direct-browser access. The key is the visitor's own, stored
//   only in their browser (localStorage), never sent anywhere but Anthropic.

import Anthropic from "@anthropic-ai/sdk";
import { extractText, getDocumentProxy } from "unpdf";
import {
  LESSON_SCHEMA,
  OUTLINE_SCHEMA,
  flattenLessons,
  normalizeBlock,
  withIds,
  type Block,
  type CourseSettings,
  type GeneratedLesson,
  type Outline,
  type Usage,
} from "./schemas";
import {
  lessonSystem,
  lessonUser,
  outlineSystem,
  outlineUser,
  regenInstruction,
} from "./prompts";
import { MOCK_OUTLINE, mockLesson, mockUsage } from "./mock";
import { SAMPLE_FILENAME, SAMPLE_PRIMER } from "./sampleText";

const KEY_STORAGE = "certifyhub-key";
const MODEL = "claude-sonnet-5";
const MAX_SOURCE_CHARS = 50_000;
const PRICING = { input: 3, output: 15 }; // USD per million tokens (Sonnet)

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------- key / mode ----------
export function getApiKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(KEY_STORAGE) || "";
}
export function setApiKey(key: string) {
  if (typeof window === "undefined") return;
  if (key) localStorage.setItem(KEY_STORAGE, key);
  else localStorage.removeItem(KEY_STORAGE);
}
export function isMock(): boolean {
  return !getApiKey();
}

function cost(inTok: number, outTok: number): number {
  return (inTok / 1e6) * PRICING.input + (outTok / 1e6) * PRICING.output;
}

// ---------- source extraction (client-side) ----------
export interface SourceResult {
  text: string;
  filename: string;
  pages?: number;
  truncated: boolean;
}

export async function extractFile(file: File): Promise<SourceResult> {
  const name = file.name.toLowerCase();
  let text = "";
  let pages: number | undefined;

  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    const buf = new Uint8Array(await file.arrayBuffer());
    const pdf = await getDocumentProxy(buf);
    const res = await extractText(pdf, { mergePages: true });
    text = Array.isArray(res.text) ? res.text.join("\n\n") : res.text;
    pages = res.totalPages;
  } else {
    text = await file.text();
  }

  text = text
    .replace(/ /g, " ")
    .replace(/[\f\v\0]/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const truncated = text.length > MAX_SOURCE_CHARS;
  if (truncated) text = text.slice(0, MAX_SOURCE_CHARS);
  return { text, filename: file.name, pages, truncated };
}

export function sampleSource(): SourceResult {
  return {
    text: SAMPLE_PRIMER,
    filename: SAMPLE_FILENAME,
    truncated: false,
  };
}

// ---------- Anthropic (browser, BYO key) ----------
function browserClient(): Anthropic {
  return new Anthropic({ apiKey: getApiKey(), dangerouslyAllowBrowser: true });
}

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  if (start === -1) throw new Error("No JSON found in model output");
  let depth = 0,
    inStr = false,
    esc = false;
  for (let i = start; i < candidate.length; i++) {
    const ch = candidate[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
    } else if (ch === '"') inStr = true;
    else if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0)
      return JSON.parse(candidate.slice(start, i + 1));
  }
  throw new Error("Unbalanced JSON in model output");
}

async function callJson<T>(
  system: string,
  user: string,
  schema: object,
  maxTokens: number,
): Promise<{ data: T; usage: Usage }> {
  const resp = await browserClient().messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    thinking: { type: "disabled" },
    system,
    messages: [{ role: "user", content: user }],
    output_config: { format: { type: "json_schema", schema } },
  } as never);
  const msg = resp as Anthropic.Message;
  const tb = msg.content.find((b) => b.type === "text");
  const raw = tb && "text" in tb ? tb.text : "";
  const inTok = msg.usage?.input_tokens ?? 0;
  const outTok = msg.usage?.output_tokens ?? 0;
  return {
    data: extractJson(raw) as T,
    usage: { inputTokens: inTok, outputTokens: outTok, costUsd: cost(inTok, outTok) },
  };
}

const prep = (s: string) =>
  s.length > MAX_SOURCE_CHARS ? s.slice(0, MAX_SOURCE_CHARS) : s;

// ---------- pipeline ----------
export async function generateOutline(
  source: string,
  settings: CourseSettings,
): Promise<{ outline: Outline; usage: Usage }> {
  if (isMock()) {
    await sleep(850);
    return { outline: withIds(MOCK_OUTLINE), usage: mockUsage() };
  }
  const { data, usage } = await callJson<Outline>(
    outlineSystem(),
    outlineUser(prep(source), settings),
    OUTLINE_SCHEMA,
    4000,
  );
  return { outline: withIds(data), usage };
}

export interface LessonProgressEvent {
  lessonId: string;
  index: number;
  phase: "start" | "done" | "error";
  lesson?: GeneratedLesson;
  usage?: Usage;
  message?: string;
}

// Generate every lesson, invoking `onEvent` as each starts/finishes so the UI
// can reveal lessons one at a time with a live cost tally.
export async function generateCourse(
  source: string,
  outline: Outline,
  settings: CourseSettings,
  onEvent: (e: LessonProgressEvent) => void,
): Promise<void> {
  const lessons = flattenLessons(outline);
  const mock = isMock();

  for (let i = 0; i < lessons.length; i++) {
    const { moduleTitle, lesson } = lessons[i];
    onEvent({ lessonId: lesson.id, index: i, phase: "start" });
    try {
      let generated: GeneratedLesson;
      let usage: Usage;
      if (mock) {
        await sleep(600 + Math.random() * 500);
        const canned = mockLesson(lesson.id);
        generated = { ...canned, id: lesson.id, title: lesson.title };
        usage = mockUsage();
      } else {
        const res = await callJson<{ blocks: unknown[] }>(
          lessonSystem(),
          lessonUser(prep(source), outline.courseTitle, moduleTitle, lesson, settings),
          LESSON_SCHEMA,
          8000,
        );
        generated = {
          id: lesson.id,
          title: lesson.title,
          objective: lesson.objective,
          blocks: (res.data.blocks || [])
            .map(normalizeBlock)
            .filter((b): b is Block => b !== null),
        };
        usage = res.usage;
      }
      onEvent({ lessonId: lesson.id, index: i, phase: "done", lesson: generated, usage });
    } catch (e) {
      onEvent({
        lessonId: lesson.id,
        index: i,
        phase: "error",
        message: (e as Error).message,
      });
    }
  }
}

export async function regenerateLesson(
  source: string,
  courseTitle: string,
  moduleTitle: string,
  lesson: { id: string; title: string; objective: string },
  settings: CourseSettings,
  instruction: string,
): Promise<{ lesson: GeneratedLesson; usage: Usage }> {
  if (isMock()) {
    await sleep(1000);
    const canned = mockLesson(lesson.id);
    const blocks: Block[] = canned.blocks.map((b, i) =>
      i === 0 && b.type === "text"
        ? { ...b, heading: `${b.heading ?? "Revised"} (revised: “${instruction}”)` }
        : b,
    );
    return {
      lesson: { ...canned, id: lesson.id, title: lesson.title, blocks },
      usage: mockUsage(),
    };
  }
  const base = lessonUser(prep(source), courseTitle, moduleTitle, lesson, settings);
  const res = await callJson<{ blocks: unknown[] }>(
    lessonSystem(),
    regenInstruction(base, instruction),
    LESSON_SCHEMA,
    8000,
  );
  return {
    lesson: {
      id: lesson.id,
      title: lesson.title,
      objective: lesson.objective,
      blocks: (res.data.blocks || [])
        .map(normalizeBlock)
        .filter((b): b is Block => b !== null),
    },
    usage: res.usage,
  };
}
