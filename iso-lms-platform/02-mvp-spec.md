# 02 · MVP Specification

## 1. Scope statement

The MVP is a multi-tenant LMS where **we** (Stage 1) create AI-generated ISO/SOC courses, businesses buy seats, learners take courses and exams, and admins track progress. The AI generator ships in the MVP because it *is* the content-production system — without it there is no catalog.

Out of scope for MVP (Phase 2+): AI video, AI tutor chat, learning paths, SSO/SAML, mobile apps, PH-local payment rails, marketplace features, white-label custom domains.

## 2. Roles

| Role | Can do |
|---|---|
| **Learner** | Browse assigned/purchased courses, take lessons & exams, earn certificates, see own progress |
| **Org admin** | Buy/manage seats, invite members, assign courses, view team analytics, download reports |
| **Instructor/Author** (internal for Stage 1) | Upload source docs, run AI generation, edit/review drafts, publish courses, manage question banks |
| **Platform admin** (us) | Manage tenants, catalog, pricing, refunds, feature flags |

## 3. Core features

### 3.1 Accounts & organizations (multi-tenant from day 1)
- Email/password + Google OAuth (Supabase Auth).
- Every user belongs to one or more **organizations**; personal-tier users get an implicit single-member org — this keeps one code path for all tiers and makes Stage 2 white-labeling a config change.
- Org: members, roles, seat count, branding fields (logo, colors — used lightly now, fully in Stage 2), billing customer ID.
- **Row-level security scoped by `org_id` on every tenant-owned table** (Supabase RLS) — this is the multi-tenancy enforcement mechanism.

### 3.2 Course catalog & player
- Catalog page with categories (ISO 27001, ISO 9001, SOC 2, Auditing skills).
- Course = ordered **modules** → **lessons**. A lesson is a sequence of typed content blocks:
  - `text` (rich text), `image`, `video_embed` (YouTube/Vimeo/Mux — curated in MVP, AI-generated in Phase 2)
  - **Interactions:** `quiz_check` (inline knowledge check), `flashcards`, `scenario` (situation → choose response → feedback), `sorting/matching` (e.g. match control to ISO clause)
- Player: progress bar, resume where you left off, block-level completion tracking, keyboard/mobile friendly.

### 3.3 AI course generator (the differentiator)
Pipeline (all steps human-reviewable, nothing auto-publishes):

```
PDF upload → extract & chunk → outline generation → per-lesson generation
→ quiz/exam generation → instructor review & edit → publish
```

1. **Upload & extract** — instructor uploads PDF(s) (max ~150 pages each to start). Text extraction server-side (`pdf-parse`/`unpdf`); for scanned PDFs, send pages to Claude as document input (native PDF support).
2. **Outline generation** — one Claude call: source text + target audience + course goals → proposed course outline (modules, lessons, learning objectives) as **structured JSON** (`output_config.format` with a JSON schema — guarantees parseable output). Instructor edits/approves the outline before any lesson is written.
3. **Per-lesson generation** — one call per lesson: relevant source chunks + approved outline + house style guide → lesson content blocks as JSON conforming to the block schema (text, interactions, quiz checks). Generating per-lesson (not whole-course) keeps outputs reviewable, retryable, and cheap to regenerate.
4. **Assessment generation** — question banks per module (MCQ, multi-select, true/false, scenario questions) with per-question source references so the reviewer can verify correctness against the PDF.
5. **Review UI** — side-by-side: generated content vs. source excerpts it cites. Per-block actions: edit inline, regenerate (with an instruction, e.g. "simpler language", "add an example for a bank"), delete. Course-level status: `draft → in_review → published`.
6. **Publish** — versioned; learners always see the latest published version; in-flight attempts pin to their started version.

**Anti-hallucination measures (required, not optional):** generation prompts instruct the model to only teach what the source supports and to flag gaps rather than invent; every lesson/question carries source-chunk references; SME review is a hard gate before publish.

Model choice and per-course cost: see [05-tech-stack-and-costs.md](05-tech-stack-and-costs.md) — roughly **$1.50–$3 per course** in direct API cost, **$5–$10** including review-driven regenerations.

### 3.4 Exam engine
- Question banks per course/module; exams assembled from banks (fixed or randomized N-of-M).
- Timed exams, passing score, attempt limits, shuffled options, per-attempt result breakdown.
- Item stats for authors (per-question correct rate) — feeds quality review.
- Anti-cheat (light-touch MVP): question order randomization, no back-navigation option, copy-paste discouragement. Proctoring is explicitly out of scope.

### 3.5 Certificates
- Auto-issued on completion criteria (all lessons + final exam ≥ passing score).
- PDF certificate (learner name, course, date, score band) + **verification ID** and public verify page (`/verify/{id}`) — lets employers/auditors confirm authenticity.
- Org-branded in Enterprise tier (logo swap — trivially enabled by the tenant branding fields).

### 3.6 Analytics
- **Learner:** own progress, exam history, certificates.
- **Org admin:** seat usage, per-member progress/completion, exam pass rates, exportable CSV (auditors love evidence exports — position this as "audit-ready training records").
- **Platform (us):** courses started/completed, conversion, churn, AI generation spend per course.

### 3.7 Payments & subscriptions
- Stripe Checkout (hosted — minimal PCI surface, supports cards + wallets) + Stripe Billing for subscriptions + Customer Portal for self-serve plan changes/cancellations.
- Tiers wired to entitlements: Personal (1 seat), Group (per-seat quantity, min 5), Enterprise (invoiced manually at first — do not build custom invoicing in MVP).
- Webhooks → entitlement sync (`checkout.session.completed`, `customer.subscription.updated/deleted`).
- Full rationale + alternatives in [04-pricing-strategy.md](04-pricing-strategy.md).

## 4. Architecture

```
Browser ── Next.js (Vercel) ── Supabase (Postgres + Auth + Storage, RLS by org_id)
                 │                        │
                 ├── Stripe (Checkout/Billing/webhooks)
                 ├── Claude API (generation pipeline; batch API for bulk jobs)
                 └── Resend (transactional email)
```

- **Next.js (App Router) on Vercel** — one app: marketing site, learner app, admin, author studio. Server actions/route handlers for API.
- **Supabase** — Postgres (all app data), Auth, Storage (source PDFs, certificate PDFs, images). RLS policies enforce tenancy.
- **AI generation jobs** — long-running generation runs as queued jobs (Supabase cron/queues or Inngest) rather than inside a request; per-lesson calls stream progress to the review UI. Non-urgent bulk generation goes through the Batch API at 50% cost.
- **Certificates** — server-rendered PDF (e.g. `react-pdf`) stored in Supabase Storage.

### 4.1 Data model (core tables, all org-scoped where tenant-owned)

```
orgs(id, name, tier, seat_limit, branding jsonb, stripe_customer_id)
org_members(org_id, user_id, role)
courses(id, org_id*, title, status, version, category)        * owner org; Stage 1 = our platform org
modules(id, course_id, position, title)
lessons(id, module_id, position, title, blocks jsonb, source_refs jsonb)
question_banks(id, course_id) / questions(id, bank_id, type, body jsonb, answer jsonb, source_ref)
exams(id, course_id, config jsonb) / exam_attempts(id, exam_id, user_id, org_id, score, detail jsonb)
enrollments(org_id, user_id, course_id, assigned_by)
progress(user_id, lesson_id, block_progress jsonb, completed_at)
certificates(id, user_id, course_id, org_id, verify_code, pdf_path, issued_at)
gen_jobs(id, org_id, course_id, kind, status, input_refs, model, token_usage jsonb, cost_usd)
source_documents(id, org_id, course_id, storage_path, extracted_text_path)
```

`gen_jobs.token_usage/cost_usd` gives us per-course AI cost accounting from day 1 — needed for the Stage 2 story ("your tenant's generation spend") and our own margins.

### 4.2 Multi-tenancy decisions (Stage 2 insurance)
- Single database, shared schema, `org_id` + RLS (simplest; scales far enough; Supabase-native).
- Courses have an **owner org**: Stage 1 catalog is owned by our platform org and granted to subscriber orgs; Stage 2 tenants own their own courses. Same tables, different grants.
- Branding/theme JSON per org; UI reads theme from org context. Custom domains deferred to Phase 3 (Vercel supports per-domain mapping when needed).

## 5. Non-functional requirements
- **Security/privacy:** RLS everywhere; secrets in env; training records treated as personal data (GDPR-aware: export + delete). We're selling to compliance buyers — our own posture is part of the pitch (target our own ISO 27001 alignment as we grow; eat the dog food by generating our own ISMS training).
- **Performance:** course player LCP < 2.5s; generation jobs async with progress.
- **Cost guardrails:** per-org monthly AI budget caps; job-level token accounting.

## 6. MVP verification / acceptance
1. Upload a 100-page ISO 27001 guide PDF → generated outline → approve → full course draft generated in < 30 min wall-clock and < $5 API cost (visible in `gen_jobs`).
2. SME edits two lessons, regenerates one with an instruction, publishes.
3. A Group org buys 10 seats via Stripe Checkout (test mode), invites 3 members, assigns the course.
4. A learner completes the course, passes the timed exam (second attempt allowed), receives a PDF certificate whose verify URL resolves publicly.
5. Org admin sees the member's progress and exports the CSV report.
6. RLS check: a user from org A cannot read org B's data via the API (automated test).
