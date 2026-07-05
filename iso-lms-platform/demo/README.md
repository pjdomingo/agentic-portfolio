# CertifyHub — AI Course Generator (working demo)

Upload a document and watch it become a **complete, interactive, mobile-friendly
course** — an outline, then step-by-step lessons with quizzes, flashcards, and
decision scenarios, each grounded in a citation back to the source. It's the
"show, don't tell" companion to the planning package in the parent folder, and it
implements the AI course-generation pipeline from [`../02-mvp-spec.md` §3.3](../02-mvp-spec.md).

**It runs entirely in the browser** — no server, no database — so it deploys as a
plain static site (e.g. Cloudflare Pages) and is safe to make public.

## What it does

1. **Source** — drop a PDF / Markdown / TXT file, or tap **Use sample document**
   (a bundled ISO 27001 primer). Set the audience and goal.
2. **Outline** — an outline is drafted (modules → lessons → objectives). Edit
   titles or remove lessons before generating.
3. **Generate** — lessons are produced one at a time with a **live cost tally**.
4. **Take the course** — a modern **step-by-step player** (one interaction per
   screen, microlearning style). Quizzes and scenarios must be answered to
   advance; there's a progress bar, points, and a lesson-complete screen.
   Regenerate any lesson with a plain-language note. Fully responsive — designed
   mobile-first.

## Two modes (switch with the badge in the top-right)

- **Mock mode (default)** — canned course content, no key, no cost, works
  offline. This is what public visitors get, so nobody can run up API charges.
- **Live mode** — tap the badge and paste **your own** Anthropic API key to
  generate real courses from your uploads. The key is stored only in your
  browser (localStorage) and sent only to Anthropic — never to any server.
  Get one at <https://console.anthropic.com/> → API Keys.

> Why "bring your own key" instead of a server? A public demo that called Claude
> from a shared server key would let any visitor spend your credits. Client-side
> BYO-key keeps the public demo free and safe while still allowing real
> generation for anyone who supplies their own key.

## Run locally

```bash
cd demo
npm install
npm run dev        # http://localhost:3000
```

`npm run build` produces a fully static site in `out/` (see deploy below).

## Deploy to Cloudflare Pages

Because it's a static export, deployment is trivial and **won't touch your
existing site** — create a *separate* Pages project pointing at this subfolder:

1. Push this repo to GitHub (the demo lives in its own folder).
2. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git** → pick the repo.
3. Build settings:
   - **Root directory:** the folder that contains this README (e.g. `demo/`)
   - **Framework preset:** Next.js (Static HTML Export) — or set manually:
   - **Build command:** `npm run build`
   - **Build output directory:** `out`
4. Deploy. You get a `*.pages.dev` URL. Add a custom subdomain (e.g.
   `demo.paolodomingo.com`) under the project's **Custom domains** tab, then
   link it from your site with a "Try the live demo" button.

No environment variables are needed — the deployed site runs in mock mode, and
live generation is opt-in per visitor via their own key.

## How it's built

- **Next.js (App Router) + TypeScript**, `output: "export"` → 100% static.
- All generation runs client-side in `lib/engine.ts`: mock content, or real
  generation via the **Anthropic TypeScript SDK** in the browser
  (`dangerouslyAllowBrowser`, the visitor's own key) using **structured
  outputs** so generated courses are always valid JSON.
- **PDF extraction** via `unpdf` (runs in the browser).
- Course state persists in `localStorage`, so a refresh doesn't lose progress.

```
app/
  page.tsx        wizard + course overview + step-by-step player
  globals.css     mobile-first design system
lib/
  engine.ts       client generation (mock + BYO-key real), file extraction
  schemas.ts      shared types, JSON schemas, block normalization
  prompts.ts      outline/lesson/regen prompts (cite-the-source rules)
  mock.ts         canned course for mock mode
  sampleText.ts   bundled ISO 27001 sample document
```

Not included (it's a focused demo of the generator, not the whole product):
auth, database, payments, the learner/admin apps, AI video — those are scoped in
the parent planning package.
