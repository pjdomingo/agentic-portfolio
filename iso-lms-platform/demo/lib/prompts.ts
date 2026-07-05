// Prompt builders for the generation pipeline. The cite-the-source rules are
// the anti-hallucination mechanism from the MVP spec (02-mvp-spec.md §3.3).

import type { CourseSettings, OutlineLesson } from "./schemas";

const HOUSE_STYLE = `You are an expert compliance-training instructional designer for a platform that teaches ISO and SOC audit-framework readiness (ISO 27001, ISO 9001, SOC 2). Your writing is clear, practical, and aimed at working professionals preparing their organization for a certification audit. You teach how to interpret and apply the frameworks — you never reproduce copyrighted standard text verbatim.

Grounding rule (critical): only teach what the provided SOURCE MATERIAL supports. Do not invent facts, clause numbers, or requirements that are not in the source. When the source is thin on a point, keep the coverage light rather than fabricating detail. Every substantive item you produce must include a short "sourceRef" quoting or closely paraphrasing the passage of the source it is grounded in, so a human reviewer can verify it.`;

export function outlineSystem(): string {
  return HOUSE_STYLE;
}

export function outlineUser(
  source: string,
  settings: CourseSettings,
): string {
  return `SOURCE MATERIAL:
"""
${source}
"""

TARGET AUDIENCE: ${settings.audience || "compliance and IT staff preparing for certification"}
COURSE GOAL: ${settings.goal || "certification readiness"}

Produce a course outline grounded strictly in the source above. Aim for 2–3 modules, each with 2–3 lessons (keep the whole course to at most ~8 lessons for this build). Give each lesson a specific, outcome-oriented title and a one-sentence learning objective. Return the outline as JSON matching the provided schema.`;
}

export function lessonSystem(): string {
  return HOUSE_STYLE;
}

export function lessonUser(
  source: string,
  courseTitle: string,
  moduleTitle: string,
  lesson: OutlineLesson,
  settings: CourseSettings,
): string {
  return `SOURCE MATERIAL:
"""
${source}
"""

COURSE: ${courseTitle}
MODULE: ${moduleTitle}
LESSON: ${lesson.title}
LEARNING OBJECTIVE: ${lesson.objective}
AUDIENCE: ${settings.audience || "compliance and IT staff"}

Write this single lesson as an engaging sequence of content blocks, grounded strictly in the source material. Produce 4–6 blocks total, mixing these types:
- "text": a teaching passage. Use "heading" for a short section title and "markdown" for the body (short paragraphs, bullet lists where helpful).
- "quiz_check": an inline knowledge check with "question", 3–4 "options", a 0-based "correctIndex", and a one-sentence "explanation".
- "flashcards": 2–4 key term/definition "cards" ({front, back}).
- "scenario": a realistic audit/workplace "situation" with 2–3 "choices" ({text, correct, feedback}) where the learner picks the best response.

Include at least one "text" block and at least one interactive block (quiz_check, flashcards, or scenario). Put the most important teaching first. Every block must include a short "sourceRef" grounding it in the source. Return JSON matching the provided schema.`;
}

export function regenInstruction(
  base: string,
  instruction: string,
): string {
  return `${base}

REVISION INSTRUCTION FROM THE REVIEWER: "${instruction}"
Regenerate this lesson applying that instruction. Keep it grounded in the same source material and return JSON matching the schema.`;
}
