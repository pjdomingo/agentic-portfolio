// Server-only. Turn an uploaded file (PDF / Markdown / TXT) into plain text,
// with a size cap that keeps generation cost bounded.

import { extractText, getDocumentProxy } from "unpdf";

// ~50k chars is roughly 13k tokens of source per call. Enough for a rich demo
// course; production would chunk per-lesson (see 05-tech-stack-and-costs.md).
export const MAX_SOURCE_CHARS = 50_000;

export async function extractSource(
  file: File,
): Promise<{ text: string; pages?: number; truncated: boolean }> {
  const name = file.name.toLowerCase();
  let text = "";
  let pages: number | undefined;

  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    const buf = new Uint8Array(await file.arrayBuffer());
    const pdf = await getDocumentProxy(buf);
    const result = await extractText(pdf, { mergePages: true });
    text = Array.isArray(result.text) ? result.text.join("\n\n") : result.text;
    pages = result.totalPages;
  } else {
    // .md / .txt / anything text-like
    text = await file.text();
  }

  text = cleanText(text);
  const truncated = text.length > MAX_SOURCE_CHARS;
  if (truncated) text = text.slice(0, MAX_SOURCE_CHARS);
  return { text, pages, truncated };
}

// Normalize non-breaking spaces, drop control chars PDF extraction leaves
// behind (form feeds, NULs), and collapse blank runs — while preserving real
// spaces and newlines. Uses code-point replacements to avoid literal invisible
// characters in source.
function cleanText(input: string): string {
  return input
    .replace(/ /g, " ") // nbsp -> space
    .replace(/[\f\v\0]/g, "\n") // control chars -> newline
    .replace(/[ \t]+\n/g, "\n") // trailing whitespace
    .replace(/\n{3,}/g, "\n\n") // collapse blank runs
    .trim();
}

export function prepareSource(text: string): string {
  const t = text.trim();
  return t.length > MAX_SOURCE_CHARS ? t.slice(0, MAX_SOURCE_CHARS) : t;
}
