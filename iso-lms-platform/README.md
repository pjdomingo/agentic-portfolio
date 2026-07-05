# ISO/SOC Compliance Training LMS — Planning Package

**Working name:** CertifyHub *(placeholder — rename freely)*
**Status:** Planning (pre-build) · **Date:** July 2026

## Executive summary

A Udemy/Coursera-style learning platform focused on **ISO and SOC compliance training** (ISO 27001, ISO 9001, SOC 2, internal audit frameworks), sold to businesses preparing their teams for certification readiness. The differentiator is **AI course generation**: an instructor uploads a PDF (a standard summary, an internal policy, training notes) and the platform generates a complete interactive course — lessons, engaging interactions, quizzes, and exams — which the instructor reviews and publishes. This makes the platform cheap to maintain and fast to fill with content.

**Business model in two stages:**

1. **Launch (Stage 1):** We author the ISO/SOC course catalog ourselves using the AI pipeline and sell subscriptions to companies — Personal, Group, and Enterprise tiers.
2. **Later (Stage 2):** Sell the platform itself — a white-label LMS that companies and schools license to run their own branded training. The architecture is multi-tenant from day 1 so this requires no rewrite.

**Why this wins:** nobody in the market combines a niche ISO/SOC catalog + AI course authoring + business-grade team management at mid-market pricing. Generic platforms (Udemy Business ~$360/user/yr, Coursera $399/user/yr) have no compliance depth; compliance specialists (IT Governance, GRC Solutions) sell one-off courses at $800–$2,000 each with no platform; AI course builders (Coursebox, TalentLMS) have no compliance content.

## Documents in this package

| Doc | Contents |
|---|---|
| [01-project-plan.md](01-project-plan.md) | Vision, business model, phased roadmap, team, risks, success metrics |
| [02-mvp-spec.md](02-mvp-spec.md) | MVP feature spec, multi-tenant architecture, AI course-generation pipeline |
| [03-competitor-analysis.md](03-competitor-analysis.md) | Feature & pricing matrix across LMS platforms, AI course builders, and compliance-training specialists |
| [04-pricing-strategy.md](04-pricing-strategy.md) | Personal / Group / Enterprise tier design, payment-integration recommendation |
| [05-tech-stack-and-costs.md](05-tech-stack-and-costs.md) | Tech stack, AI API cost model, domain/server costing at three growth stages |
| [presentation.html](presentation.html) | One-page visual pitch of the plan (open in a browser) |
| [demo/](demo/) | **Working AI demo** — a real Next.js app that generates an interactive course from an uploaded document (`cd demo && npm i && npm run dev`) |

## Headline numbers

- **Cost to generate one course with AI:** roughly **$2–$10** in API costs (including review iterations) — vs. thousands of dollars for manual instructional design.
- **Infrastructure run rate:** ~**$20–50/mo** during build, ~**$150–250/mo** at launch, ~**$350–800/mo** at 1,000+ learners.
- **Proposed pricing:** Personal **$39/mo**, Group **$19/user/mo** (annual, 5-seat min), Enterprise **from $10k/yr** — undercutting Udemy Business ($30/user/mo) and one-off ISO courses ($800+) while being far more specialized than either.
- **Payments:** Stripe Checkout + Billing (2.9% + $0.30) — lowest-cost at scale; Paddle documented as the zero-tax-ops alternative.
