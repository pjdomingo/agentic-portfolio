# 05 · Tech Stack & Costing

Optimized for the stated constraint: **easy to maintain by a very small team**. Managed services everywhere, one language (TypeScript) end-to-end, no servers to patch.

## 1. Stack

| Layer | Choice | Why | Cost basis |
|---|---|---|---|
| Web app (learner, admin, author studio, marketing) | **Next.js on Vercel** | One codebase; zero-ops deploys; scales automatically | Free (Hobby, dev) → Pro $20/mo |
| Database, auth, file storage | **Supabase** (Postgres + Auth + Storage) | Multi-tenant RLS is native; auth included; PDFs & certificates in Storage | Free → Pro $25/mo |
| AI course generation | **Claude API** — `claude-sonnet-5` default; `claude-haiku-4-5` for cheap subtasks (chunk cleanup, tagging); Opus-tier optional for premium enterprise custom courses | Structured JSON output for course blocks; native PDF input for scanned docs; Batch API 50% discount for bulk jobs | Usage-based — model below |
| Payments | **Stripe** Checkout + Billing + Customer Portal | See [04-pricing-strategy.md](04-pricing-strategy.md) | 2.9% + $0.30 per charge (no monthly fee) |
| Transactional email | **Resend** | Invites, receipts, reminders, certificates | Free (3k/mo) → $20/mo (50k) |
| DNS/CDN/domain | **Cloudflare** (registrar + DNS) | At-cost domains, free CDN/DDoS | Domain ~$10–20/yr; services free |
| Background jobs | Supabase cron/queues (or Inngest free tier) | Generation pipeline runs async | $0 at MVP scale |
| Monitoring | Sentry + Vercel analytics (free tiers) | Error + performance visibility | $0 → $26/mo |
| Phase 2: AI video | HeyGen/Synthesia API | Avatar lesson videos | ~$1–5 per video-minute (budgeted per course, not per month) |
| Phase 2: video hosting | Mux or YouTube-unlisted (start free) | Streaming without ops | $0 → usage-based |

No Kubernetes, no VMs, no self-hosted anything. A single developer can operate this entire stack.

## 2. AI API cost model

Pricing basis (Claude API, July 2026): **claude-sonnet-5 $3 input / $15 output per million tokens** (introductory $2/$10 through Aug 31, 2026), claude-haiku-4-5 $1/$5, Opus-tier $5/$25. **Batch API = 50% off**; prompt-cache reads ≈ 0.1× input price. Source: Anthropic published pricing.

### Worked example: one course from a 100-page PDF

Assumptions: ~100 pages ≈ 50k words ≈ **~70k tokens** of source text; course of 5 modules / 20 lessons; Sonnet 5 at standard (non-intro) pricing.

| Pipeline step | Input tokens | Output tokens | Cost |
|---|---|---|---|
| Outline generation (full source + instructions) | ~75k | ~4k | $0.29 |
| Lesson generation (20 × ~10k in / ~3k out — relevant chunks + outline + style guide) | ~200k | ~60k | $1.50 |
| Quiz & exam generation (question banks per module) | ~40k | ~12k | $0.30 |
| **Direct generation total** | ~315k | ~76k | **≈ $2.10** |

- With the **Batch API** (bulk catalog builds aren't latency-sensitive): **≈ $1.05/course**.
- With review-driven **regenerations** (assume 30–50% of lessons redone once or twice, plus outline iterations): 2–3× direct cost → **realistic all-in ≈ $4–7 per course; budget $10**.
- Prompt caching the shared prefix (style guide + outline, reused across 20 lesson calls) shaves a further ~10–20% — nice-to-have, not load-bearing.

**The economic point:** a 20-course catalog costs **~$100–200 in API fees** plus SME review time — versus $3k–10k+ *per course* for traditional instructional design. Content production is effectively free relative to its sale price; the scarce input is expert review.

### Ongoing monthly AI spend

| Stage | Activity | Est. monthly |
|---|---|---|
| Build (pre-launch) | Catalog build ~20 courses + prompt iteration | $100–200 total (one-time-ish) |
| Launch | 3–5 new/updated courses/mo + enterprise pilots | **$25–75/mo** |
| Growth | 10+ courses/mo incl. enterprise custom courses + **AI tutor chat** (Phase 2: with cached course context, well under $0.01/learner question; 1,000 active learners ≈ $50–150/mo) | **$150–400/mo** |

### Phase 2: AI video (why it's not in the MVP)
Avatar video runs ~**$1–5 per finished minute** via HeyGen/Synthesia APIs. A 20-lesson course with 3-minute videos ≈ 60 minutes ≈ **$60–300/course** — 30–100× the text-generation cost. Affordable per course, but it's a per-course budget decision made after content is validated, not a default pipeline step.

## 3. Infrastructure costing by stage

### Stage A — Build/MVP (months 0–3)
| Item | Cost/mo |
|---|---|
| Vercel Hobby (dev), Supabase Free, Resend Free, Cloudflare Free | $0 |
| Domain (amortized) | ~$1.50 |
| AI API (prompt development, pilot courses) | $20–50 |
| **Total** | **≈ $20–50/mo** |

### Stage B — Launch (first paying customers)
| Item | Cost/mo |
|---|---|
| Vercel Pro (commercial use) | $20 |
| Supabase Pro | $25 |
| Resend Pro | $20 |
| Domain, Cloudflare | ~$1.50 |
| AI API (catalog + updates) | $25–75 |
| Monitoring (free tiers) | $0 |
| **Total** | **≈ $90–150/mo** — call it **$150–250/mo** with headroom |

### Stage C — Growth (1,000+ learners, multiple enterprise orgs)
| Item | Cost/mo |
|---|---|
| Vercel Pro + usage (bandwidth/functions) | $40–100 |
| Supabase Pro + compute upgrade + backups | $75–150 |
| Resend (50k–100k emails) | $20–90 |
| AI API (generation + tutor) | $150–400 |
| Sentry team, misc tooling | $30–60 |
| **Total** | **≈ $350–800/mo** |

**Cost to reach launch (ex-labor):** ~3 months × $50 + ~$150 catalog generation + $15 domain ≈ **under $500 total**. The business is overwhelmingly a labor-and-content play, not an infrastructure play.

### Payment fees (variable, not infra)
Stripe takes 2.9% + $0.30 per charge (~3–4% blended with tax/cross-border) — netted against revenue, per-tier impact table in [04-pricing-strategy.md](04-pricing-strategy.md).

## 4. Cost guardrails to build in (day 1)

- `gen_jobs` table records token usage + USD cost per generation job → per-course and per-tenant AI cost is always visible.
- Per-org monthly AI budget cap (matters for Stage 2 tenants and enterprise custom-course allotments).
- Batch API by default for anything not interactive.
- Alerting on Vercel/Supabase usage at 80% of plan limits.

## 5. Stage 2 note (selling the platform)

The same stack white-labels cleanly: per-tenant branding is data (org theme JSON), custom domains are Vercel domain mappings, tenant isolation is already enforced by RLS, and per-tenant AI spend is already metered by `gen_jobs`. Incremental infra cost per white-label tenant is dollars per month — which is what makes $500–1,500/mo tenant licensing (see [04-pricing-strategy.md](04-pricing-strategy.md)) attractive.
