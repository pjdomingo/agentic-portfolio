# CertifyHub — AI Course Generator (working demo)

A **real, working** proof-of-concept of the platform's differentiator: upload a
document and watch Claude generate a complete interactive ISO/SOC compliance
course — lessons, quizzes, flashcards, scenarios, and exams — with every block
grounded in a citation back to the source, ready for expert review.

This is the "show, don't tell" companion to the planning package in the parent
folder. It implements the AI course-generation pipeline described in
[`../02-mvp-spec.md` §3.3](../02-mvp-spec.md).

## What it does

A four-step studio wizard:

1. **Source** — drop a PDF / Markdown / TXT file, or click **Use sample
   document** (a bundled ISO 27001 primer). Set the target audience and goal.
2. **Outline** — Claude drafts a course outline (modules → lessons →
   objectives). Edit lesson titles or remove lessons before generating.
3. **Generate** — each lesson is generated individually and streamed to the
   browser, so you watch lessons appear one by one with a **live token/cost
   tally** (real API spend).
4. **Review & publish** — the generated course renders like a real course
   player. The quizzes, flashcards, and scenarios **actually work**. Hover any
   **“source”** tag to see the passage a block was grounded in (the
   anti-hallucination story). Regenerate any lesson with an instruction
   (e.g. *“simpler language”*), then publish.

## Two ways to run

The app auto-detects its mode:

- **Mock mode** (default, no setup) — if there's no API key, the entire flow
  runs on canned course content with simulated streaming. **Perfect for pitching
  offline** — nothing to configure, no spend, no network.
- **Live mode** — set an Anthropic API key and it really calls Claude to
  generate a course from whatever document you upload.

## Run it

```bash
cd iso-lms-platform/demo
npm install
npm run dev            # http://localhost:3000  (mock mode)
```

To run against the real Claude API:

```bash
cp .env.example .env.local
# edit .env.local and set ANTHROPIC_API_KEY=sk-ant-...
npm run dev            # now generates live from your uploads
```

Get an API key at <https://console.anthropic.com/> → API Keys. A live demo
course from the sample document costs roughly **$0.10–$0.50** in API usage —
the cost tally on the Generate screen shows the real number.

> Designed to be run locally (`npm run dev` / `npm run start`). Live generation
> makes several sequential model calls, so if you deploy it, use a host that
> allows long-running serverless functions (or keep it on mock mode for a hosted
> pitch link).

## Configuration (`.env.local`)

| Variable | Default | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | — | Set it to enable live generation. Unset = mock mode. |
| `GENERATION_MODEL` | `claude-sonnet-5` | The model used for generation (per the plan's tech-stack doc). `claude-haiku-4-5` is cheaper/faster. |
| `DEMO_MODE` | — | Set to `mock` to force mock mode even with a key. |

## How it's built

- **Next.js (App Router) + TypeScript**, one app, no database — course state
  lives in the browser (with `localStorage` so a refresh doesn't lose your work).
- **Anthropic TypeScript SDK** with **structured outputs** (JSON-schema-
  constrained responses) so generated courses are always valid, parseable JSON.
- **PDF extraction** via `unpdf`.
- Server routes: `outline` (one structured call), `generate` (per-lesson
  pipeline streamed over SSE), `regenerate` (single lesson with an instruction),
  `extract` (file → text), `status` (mode).
- Generation prompts require every block to cite the source passage it was
  grounded in — the human-review gate the real product depends on.

```
app/
  page.tsx              the 4-step wizard + course player
  api/{extract,outline,generate,regenerate,status}/route.ts
lib/
  schemas.ts            shared types + JSON schemas + block normalization
  anthropic.ts          client, model/pricing config, structured-JSON helper
  prompts.ts            outline/lesson/regen prompts (cite-the-source rules)
  extract.ts            PDF/MD/TXT extraction
  mock.ts               canned course for offline mode
sample/
  iso27001-primer.md    the bundled sample source document
```

Not included (it's a focused demo of the generator, not the whole product):
auth, database, payments, the learner/admin apps, AI video. Those are scoped in
the parent planning package.
