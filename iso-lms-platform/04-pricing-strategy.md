# 04 · Pricing Strategy

Global, USD-first. Anchors from [03-competitor-analysis.md](03-competitor-analysis.md): Udemy Business **$30/user/mo**, Coursera **$399/user/yr**, TalentLMS **$69–179/mo** flat, one-off ISO courses **$800–$2,000**, checkbox compliance training **<$1/seat/mo**. We price *between* checkbox training and accredited one-off courses — specialist value at platform prices.

## 1. Tiers

### Personal — $39/mo, or $349/yr (~25% off)
- 1 learner, full catalog access, exams, verifiable certificates.
- Alternative entry point: **single course purchase $149–$249** (lifetime access to that course + its exam). Anchored against IT Governance's $820+ per course — "the same preparation at a fraction of the price."
- Rationale: $39 sits above Coursebox's tool pricing (we sell content + outcome, not a tool) and far below one-off course prices. Annual ($349) beats buying two one-off courses anywhere else.

### Group — $19/user/mo billed annually (min 5 seats) · $24/user/mo monthly
- Everything in Personal + org admin: seat management, course assignment, team analytics, CSV/audit exports, priority support.
- 5 seats annual = **$1,140/yr** — a trivial line item next to the cost of an ISO audit engagement.
- Rationale: **undercuts Udemy Business ($30/user/mo) by ~37%** while being more relevant to the buyer's audit deadline. Per-seat (not flat TalentLMS-style tiers) scales revenue with customer size and is how this buyer expects to be billed.
- Volume steps: 25+ seats −10%, 100+ seats −20% (or nudge to Enterprise).

### Enterprise — custom, from ~$10k/yr
- Everything in Group + **custom AI-generated courses from the client's own policies/ISMS documents**, org-branded certificates, SSO/SAML (Phase 3), security review, invoicing, SLA.
- The custom-course capability is the wedge: "upload your ISMS, get your internal training" is something none of the incumbents sell. Price custom courses as included allotment (e.g. 5/yr) + per-course fee beyond ($1,500–3,000/course — against our ~$10 marginal AI cost, this is the highest-margin item in the business).

### Stage 2 — platform licensing (later, priced when triggered)
- White-label tenant: **$500–$1,500/mo per tenant** by seat band, or per-seat with a platform minimum; schools/marketplaces optionally revenue-share. Comparable: Coursebox's branded platform at ~$210/mo (we justify a premium with the compliance engine + review workflow) and LearnWorlds Learning Center at $299/mo.

### Launch mechanics
- 14-day free trial (no card) for Personal/Group; design partners get 50% year-one "founding customer" pricing in exchange for logo + case study.
- One free "sampler" mini-course (Advisera's freemium lesson: free foundation content is the top-of-funnel in this market).

## 2. Payment integration — recommendation: **Stripe Checkout + Billing**

Requirement: low cost, low friction, global USD. The real choice is *merchant of record (MoR) vs. payment processor*:

| | **Stripe** (processor) | **Paddle** (MoR) | **Lemon Squeezy** (MoR) |
|---|---|---|---|
| Headline fee | **2.9% + $0.30** | 5% + $0.50 | 5% + $0.50 |
| Realistic all-in | ~3.4–5% (with Stripe Tax +0.5%, cross-border/currency +1–2%) | ~5–5.6% flat | ~5.6%; international premium cards reported up to ~7.5% |
| Sales tax / VAT liability | **Yours** (Stripe Tax calculates; you file) | Paddle's — zero tax ops | Lemon Squeezy's — zero tax ops |
| Subscriptions, seats, portal | Best-in-class (Billing + per-seat quantities + Customer Portal) | Good | Adequate |
| B2B invoicing for Enterprise | Native (Stripe Invoicing) | Limited | Limited |
| Local rails later (GCash/PayMongo PH) | Coexists fine as a second processor | Awkward | Awkward |

Sources: [Stripe vs Paddle vs Lemon Squeezy comparisons](https://f3fundit.com/stripe-vs-paddle-vs-lemon-squeezy-micro-saas-2026/), [Dodo Payments gateway comparison](https://dodopayments.com/blogs/payment-gateway-comparison), [saasfeecalc.com](https://saasfeecalc.com/).

**Recommendation:** **Stripe** — lowest fees at every scale, best per-seat subscription tooling (exactly our Group tier shape), native enterprise invoicing, and hosted Checkout keeps friction and PCI burden near zero. Manage tax exposure pragmatically: most jurisdictions have registration thresholds a new B2B SaaS won't hit immediately; enable Stripe Tax monitoring from day 1 and register where thresholds approach.

**When to choose Paddle instead:** if the team decides that *any* tax filing is unacceptable operational load, Paddle's 5% + $0.50 is the honest price of outsourcing it. The switch cost grows with time, so decide before launch. **PayMongo/GCash** stays on the shelf for a future Philippines go-to-market (Phase 2+), added alongside Stripe rather than replacing it.

## 3. Stripe fee impact per tier (net revenue)

| Plan | Gross | Stripe fee (2.9% + $0.30) | Net | Net % |
|---|---|---|---|---|
| Personal monthly | $39.00 | $1.43 | $37.57 | 96.3% |
| Personal annual | $349.00 | $10.42 | $338.58 | 97.0% |
| Single course | $199.00 | $6.07 | $192.93 | 97.0% |
| Group, 5 seats annual | $1,140.00 | $33.36 | $1,106.64 | 97.1% |
| Group, 20 seats annual | $4,560.00 | $132.54 | $4,427.46 | 97.1% |
| Enterprise $10k (invoice via ACH/transfer) | $10,000 | ~$5–15 flat | ~$9,990 | ~99.9% |

(Add ~0.5% where Stripe Tax applies and ~1–2% on non-US cards; annual billing and bank-transfer invoicing keep blended costs ~3–4%.)

## 4. Unit economics sanity check

- Marginal cost per Group org (20 seats): AI content amortized (~$10/course across all customers), infra pennies, support the real cost → **software-class gross margins (~90%+)**.
- One 20-seat Group customer ($4,560/yr) covers roughly a full year of growth-stage infrastructure ([05-tech-stack-and-costs.md](05-tech-stack-and-costs.md)).
- Break-even on the ~$200/mo launch run rate ≈ **6 Personal subscribers or one 5-seat Group org**.
