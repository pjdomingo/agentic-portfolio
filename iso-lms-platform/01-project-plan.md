# 01 · Project Plan

## 1. Vision

Build the go-to online training platform for **ISO and SOC compliance certification readiness** — where a company that needs its staff trained for ISO 27001, ISO 9001, or SOC 2 audits can subscribe, assign courses, run exams, and track progress; and where course content is produced and maintained at a fraction of normal cost via **AI course generation from instructor-supplied documents**.

## 2. Target customers

| Segment | Who | What they buy |
|---|---|---|
| **Businesses pursuing certification** (primary) | SMEs and mid-market companies preparing for ISO 27001 / 9001 / SOC 2 audits; compliance officers, CISOs, quality managers | Group subscriptions: seats for the teams that must be trained before an audit |
| **Individual professionals** | Auditors-in-training, consultants, IT/security staff upskilling | Personal subscription or single-course purchase |
| **Consultancies & audit firms** | ISO consultants who train their clients | Enterprise: white-label training for their client base, custom courses generated from their own materials |
| **Stage 2: platform licensees** | Companies and schools wanting their own LMS | The platform itself, white-labeled, with their own content |

## 3. Business model — two stages

### Stage 1 (launch): content subscription business
We create the ISO/SOC catalog ourselves using the AI pipeline (upload standard summaries, audit checklists, policy templates → generate courses → expert review → publish). Revenue = subscriptions (Personal / Group / Enterprise — see [04-pricing-strategy.md](04-pricing-strategy.md)).

The AI pipeline is the operating leverage: a catalog of 15–20 courses that would cost $50k–$150k+ in traditional instructional design costs **hundreds of dollars** in API fees plus expert review time.

### Stage 2 (later): platform-as-a-product
Once the platform is proven with our own content, sell it as a **white-label multi-tenant LMS**:

- **Companies** run internal compliance/onboarding training with their own policies (upload their ISMS documents → AI generates their internal courses).
- **Schools/training providers** run their own branded course business on our infrastructure.
- Pricing: per-tenant license (e.g. $500–$1,500/mo) or per-seat, plus optional revenue share for marketplace-style tenants.

**Architectural consequence (decided now):** every table is organization-scoped and branding/theming is per-tenant from day 1, so Stage 2 is a packaging and sales change — not a rewrite. See [02-mvp-spec.md](02-mvp-spec.md).

## 4. Certificates

Platform-issued **certificates of completion/competency** (like Udemy) with a verification ID and public verification page. We are *not* an accredited certification body — courses prepare people and companies for audits and accredited exams, they don't replace them. This is fast to market and legally simple; pursuing accreditation (Exemplar Global / PECB style) can be revisited in Stage 2+ if the market demands it.

> ⚠️ **Content IP note:** ISO standards text is copyrighted by ISO. Courses must teach *about* the standards (interpretations, implementation guidance, audit preparation) without reproducing standard text verbatim. Source PDFs fed to the AI pipeline must be our own or licensed material — this is a review-gate check, not just a legal footnote.

## 5. Roadmap

### Phase 0 — Validation (~2 weeks)
- Generate 2–3 pilot courses with the AI pipeline (can be prototyped with Claude directly before the platform exists).
- Show pilots to 3–5 design-partner companies (ideally existing clients of the boss's network); collect willingness-to-pay signals against the proposed tiers.
- Lock the initial catalog list (suggested: ISO 27001 Foundations, ISO 27001 Internal Auditor, ISO 9001 Foundations, SOC 2 Readiness, Risk Assessment Fundamentals).

### Phase 1 — MVP (~10–12 weeks)
Everything in [02-mvp-spec.md](02-mvp-spec.md):
- Accounts & orgs (multi-tenant), course catalog & player, **AI course generator** (PDF → draft course → instructor review → publish), exam engine, completion certificates with verification, learner/org analytics, Stripe payments with the three tiers.
- Exit criteria: first paying design-partner org onboarded; 5+ published courses; a full generate→review→publish cycle takes < 1 day per course.

### Phase 2 — Engagement & depth (~8 weeks post-launch)
- **AI video**: avatar/narration video per lesson via API (HeyGen/Synthesia) or curated embeds; richer interaction types (scenario branching, drag-drop audit exercises).
- Learning paths (multi-course certification tracks), AI tutor chat inside lessons (answers from course content), reminders/nudges, deeper analytics (exam item analysis, readiness scoring).
- PH-local payment rails (PayMongo/GCash) if local sales channel opens.

### Phase 3 — Enterprise & Stage 2 (~quarter 2 post-launch)
- SSO/SAML, SCIM provisioning, audit logs, API access.
- **White-label packaging**: tenant custom domains, full theming, tenant-owned catalogs — the Stage 2 product.
- Custom-course service: enterprise clients upload their own policies → we generate their private courses.

## 6. Team & effort (MVP)

Lean build assuming heavy AI-assisted development:

| Role | Load | Notes |
|---|---|---|
| Full-stack developer | 1 FTE | Next.js + Supabase + Stripe + Claude API; the whole MVP is buildable by one strong dev with AI coding tools |
| Compliance SME / instructor | 0.3–0.5 FTE | Sources material, reviews every AI-generated course before publish (the quality gate) |
| Product/PM (the boss / you) | 0.2 FTE | Prioritization, design-partner management, pricing |
| Design | contract | Landing page + course-player polish; templates otherwise |

## 7. Risks & mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| **AI hallucination on compliance content** — wrong guidance damages trust in exactly the domain where correctness matters | High if unmitigated | Human-in-the-loop is non-negotiable: no AI draft publishes without SME review; generation prompts require citations to the source PDF; regeneration per-section rather than trusting whole-course output |
| **ISO copyright** — reproducing standard text | Medium | Review gate checks; teach interpretation not reproduction; use own/licensed source material |
| **Thin initial catalog** — buyers compare against Udemy's thousands of courses | Medium | Position as specialist depth, not breadth; certification *tracks* (bundled paths to a goal) rather than course count |
| **Enterprise sales cycle slower than build** | Medium | Personal + Group tiers are self-serve (Stripe Checkout) so revenue doesn't wait on enterprise deals |
| **AI cost creep** (video generation is 10–100× text cost) | Low–Medium | Text-first MVP; video in Phase 2 with per-course budgets; batch API for non-urgent generation (50% discount) |
| **Platform-selling distraction** (Stage 2 too early) | Medium | Stage 2 is explicitly gated on Stage 1 traction (e.g. 20+ paying orgs) — until then it only constrains architecture, not roadmap |

## 8. Success metrics

- **Phase 0:** 3+ design partners with verbal commit at proposed pricing.
- **MVP + 3 months:** 10 paying organizations OR ₱/$ MRR ≥ infra + tooling costs × 10; course generation cost ≤ $10/course all-in; ≥ 70% course completion rate among active learners.
- **MVP + 6 months:** 25+ orgs, first enterprise contract, NPS ≥ 40; go/no-go decision on Stage 2 white-label packaging.
