# 03 · Competitor Analysis

Three competitor sets matter, and the gap sits at their intersection: (A) generic course platforms/marketplaces, (B) AI course builders / corporate LMS, (C) compliance & ISO training specialists. Pricing was checked July 2026; sources linked per entry — treat figures as directionally accurate (vendors change pricing and often hide it behind sales).

## A. Generic course platforms & marketplaces

| Platform | Pricing | Strengths | Weaknesses vs. us |
|---|---|---|---|
| **Udemy Business** | Team plan **$30/user/mo** ($360/user/yr, 2–20 users); Enterprise custom, typically ~$150–290/user/yr at volume ([TrustRadius](https://www.trustradius.com/products/udemy-for-business/pricing), [PricingNow](https://pricingnow.com/question/udemy-for-business-pricing/), [SoftwareFinder](https://softwarefinder.com/resources/how-much-is-udemy-business)) | Huge catalog, brand recognition, self-serve teams | Generic catalog; ISO/SOC content is shallow, inconsistent, third-party; no exam/certification workflow tuned for audit readiness; no custom content from client documents |
| **Coursera for Business** | Teams **$399/user/yr** (5–499 users); Enterprise custom ~$300–500/user/yr ([Coursera](https://www.coursera.org/business/compare-plans), [TrainingCost](https://trainingcost.com/lms-pricing/coursera-business)) | University-brand credentials, polished content | Expensive per seat; almost no ISO/SOC-specific depth; content fixed — can't reflect a client's own policies |
| **LearnWorlds** | Starter **$29/mo** (+$5/enrollment), Pro Trainer **$99/mo**, Learning Center **$299/mo**, Corporate custom ([LearnWorlds](https://www.learnworlds.com/pricing/), [Learning Revolution](https://www.learningrevolution.net/learnworlds-pricing/)) | Strong course-creator tooling, white-label options, AI assists | It's a tool for creators, not a content business — buyer still has to make all the content; no compliance domain |

## B. AI course builders & corporate LMS

| Platform | Pricing | AI capability | Weaknesses vs. us |
|---|---|---|---|
| **Coursebox AI** | Free (3 courses, watermarked); Creator ~**$21–30/mo**; Expert ~$83/mo (annual); Branded platform ~**$210/mo** ([Coursebox](https://www.coursebox.ai/pricing), [eLearning Industry](https://elearningindustry.com/directory/elearning-software/coursebox/pricing)) | Closest AI analog: file/PDF → course with quizzes, AI tutor, AI avatar video | Horizontal tool — no compliance content, no SME review workflow, no audit-readiness positioning; quality of ungated AI output is the known complaint |
| **TalentLMS (+ TalentCraft AI)** | Free (5 users/10 courses); Core **$69/mo**, Grow **$109/mo**, Pro **$179/mo**, Enterprise custom ([TalentLMS](https://www.talentlms.com/prices), [CoursePlatformsReview](https://www.courseplatformsreview.com/blog/talentlms-pricing/)) | TalentCraft generates course drafts from prompts/documents | Corporate-training generalist; buyer supplies content and expertise; flat tiers get expensive at scale |
| **Docebo, Absorb, 360Learning** | Custom enterprise (commonly five figures/yr; not published) | AI-assisted authoring modules | Heavy enterprise LMS: long sales cycles, high cost, still content-agnostic |
| **Coassemble / Mini Course Generator** | Low-cost ($0–50/mo range) | Doc → microcourse | Microlearning toys relative to certification-prep depth; no exams/certificates at audit grade |

## C. Compliance & ISO training specialists

| Provider | Pricing | Strengths | Weaknesses vs. us |
|---|---|---|---|
| **IT Governance / GRC Solutions** | One-off courses: ISO 27001 Foundation **£645** (~$820); Foundation + Lead Implementer self-paced **£1,695**; US arm lists Foundation at **$855** ([IT Governance](https://www.itgovernance.co.uk/shop/category/iso-27001-training-courses), [GRC Solutions](https://us.grcsolutions.io/category/iso-27001-training-courses)) | Accredited, credible, deep | Very expensive per learner; one-off purchases, no team platform, no analytics, no subscription; content updates slow |
| **Advisera** | Free foundation courses; revenue from paid accredited exams/certificates and toolkits ([Advisera](https://advisera.com/training/)) | Free tier funnels huge audiences; accredited paths | Freemium ceiling; course experience is conventional; no team/seat management story |
| **KnowBe4 Compliance Plus** | ~**$0.54–0.93/seat/mo** (~$6.50–11/seat/yr), 101-seat minimum ([G2](https://www.g2.com/products/knowbe4-compliance-plus/pricing), [TrustRadius](https://www.trustradius.com/products/knowbe4-compliance-plus/pricing)) | Cheap at volume, strong compliance-awareness library | Awareness-level content (annual HR/security training), not certification-readiness depth; sets the floor for "checkbox training" pricing — we must sell above it on depth |
| **Skillcast, SC Training (EdApp)** | Per-seat, low single digits/mo | Compliance modules, mobile-first | Same: awareness depth, not audit/certification prep |
| **Certification bodies (PECB etc.)** | Courses + exams $500–2,000+ | The accreditation itself | Not a platform play; we position as *preparation* for these, not competition |

## The gap (our positioning)

```
                    Compliance depth
                          ▲
   IT Governance ●        │        ★ US: ISO/SOC catalog
   (deep, $800+/course,   │          + AI authoring
    no platform)          │          + team platform
   Advisera ●             │          + mid-market price
   KnowBe4 ●              │
   (cheap, shallow)       │
  ────────────────────────┼────────────────────────▶
                          │            Platform & AI capability
        Coursera ●        │   ● TalentLMS
        Udemy Business ●  │   ● Coursebox (AI, no domain)
```

1. **Vs. generic platforms:** we win on domain depth, audit-ready records, and price (Group tier undercuts Udemy Business per-seat).
2. **Vs. AI builders:** we win because we sell *outcomes* (a ready catalog + certification readiness), not a tool the buyer must operate; our SME review gate answers the AI-quality objection.
3. **Vs. compliance specialists:** we win on price-per-learner (subscription vs. $800+ one-offs), team management/analytics, and modern interactive delivery — while conceding accreditation (we prepare people for accredited exams; Stage 2+ may pursue partnerships).
4. **Stage 2 flank:** none of the compliance specialists can sell their engine as a white-label LMS; Coursebox can but has no compliance credibility. Proving Stage 1 gives us both.

## Feature matrix

| Feature | Us (MVP) | Udemy Biz | Coursera Biz | TalentLMS | Coursebox | IT Governance | KnowBe4 |
|---|---|---|---|---|---|---|---|
| ISO/SOC certification-prep catalog | ✅ core | ⚠️ shallow | ⚠️ minimal | ❌ | ❌ | ✅ deep | ⚠️ awareness only |
| AI course generation from documents | ✅ core | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| SME review gate on AI content | ✅ | — | — | ❌ | ❌ | — | — |
| Team seats, assignment, analytics | ✅ | ✅ | ✅ | ✅ | ⚠️ | ❌ | ✅ |
| Timed exams, question banks, attempts | ✅ | ⚠️ | ✅ | ✅ | ⚠️ | ✅ | ⚠️ |
| Verifiable completion certificates | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (accredited) | ✅ |
| Custom courses from client's own policies | ✅ (Enterprise) | ❌ | ❌ | DIY | DIY | ❌ | ❌ |
| White-label / sell-the-platform path | ✅ (Stage 2) | ❌ | ❌ | ⚠️ | ✅ | ❌ | ❌ |
| Accredited certification | ❌ (by design) | ❌ | ⚠️ | ❌ | ❌ | ✅ | ❌ |
| AI video lessons | Phase 2 | ❌ | ❌ | ⚠️ | ✅ | ❌ | ❌ |
