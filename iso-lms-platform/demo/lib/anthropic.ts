// Server-only. Anthropic client, model config, cost accounting, and a robust
// structured-JSON helper. Imported by API routes, never by client components.

import Anthropic from "@anthropic-ai/sdk";
import type { Usage } from "./schemas";

export const GENERATION_MODEL =
  process.env.GENERATION_MODEL || "claude-sonnet-5";

// USD per million tokens. Conservative (standard, not introductory) so the
// cost the demo displays never under-promises. Update if pricing changes.
const PRICING: Record<string, { input: number; output: number }> = {
  "claude-sonnet-5": { input: 3, output: 15 },
  "claude-haiku-4-5": { input: 1, output: 5 },
  "claude-opus-4-8": { input: 5, output: 25 },
};

export function isMockMode(): boolean {
  if (process.env.DEMO_MODE === "mock") return true;
  return !process.env.ANTHROPIC_API_KEY;
}

export function costFor(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const p = PRICING[model] || PRICING["claude-sonnet-5"];
  return (inputTokens / 1e6) * p.input + (outputTokens / 1e6) * p.output;
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

// Pull the first balanced JSON object out of a string, tolerating markdown
// fences or any stray preamble. Structured outputs should return clean JSON,
// but this makes a live demo resilient to surprises.
export function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  if (start === -1) throw new Error("No JSON object found in model output");
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < candidate.length; i++) {
    const ch = candidate[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
    } else if (ch === '"') inStr = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return JSON.parse(candidate.slice(start, i + 1));
    }
  }
  throw new Error("Unbalanced JSON in model output");
}

export interface JsonResult<T> {
  data: T;
  usage: Usage;
}

// Call Claude for a structured-JSON response and return parsed data + usage.
// Uses output_config.format when available and falls back to prompt-guided JSON
// via extractJson so parsing never hard-fails on a stray character.
export async function generateJson<T>(
  system: string,
  user: string,
  schema: object,
  maxTokens = 8000,
): Promise<JsonResult<T>> {
  const resp = await getClient().messages.create({
    model: GENERATION_MODEL,
    max_tokens: maxTokens,
    thinking: { type: "disabled" },
    system,
    messages: [{ role: "user", content: user }],
    output_config: { format: { type: "json_schema", schema } },
  } as never); // `output_config` is newer than some SDK type defs; wire-supported.

  const message = resp as Anthropic.Message;
  const textBlock = message.content.find((b) => b.type === "text");
  const raw = textBlock && "text" in textBlock ? textBlock.text : "";
  const data = extractJson(raw) as T;

  const inputTokens = message.usage?.input_tokens ?? 0;
  const outputTokens = message.usage?.output_tokens ?? 0;
  return {
    data,
    usage: {
      inputTokens,
      outputTokens,
      costUsd: costFor(GENERATION_MODEL, inputTokens, outputTokens),
    },
  };
}
