// Canned course used in MOCK mode (no API key, or DEMO_MODE=mock). The same UI
// and SSE flow run against this content with simulated delays, so the demo
// works fully offline for pitching. Content mirrors what the real pipeline
// produces from the bundled ISO 27001 sample document.

import type { GeneratedLesson, Outline, Usage } from "./schemas";

export const MOCK_OUTLINE: Outline = {
  courseTitle: "ISO 27001 Readiness: From Framework to Audit",
  summary:
    "A practical primer that takes IT and compliance staff from 'what is ISO 27001?' to being ready to support a certification audit — covering the ISMS, risk assessment, Annex A controls, and what auditors actually look for.",
  modules: [
    {
      id: "m1",
      title: "Foundations of an ISMS",
      lessons: [
        {
          id: "l1",
          title: "What ISO 27001 Actually Requires",
          objective:
            "Explain the purpose of an ISMS and distinguish the management-system clauses from the Annex A controls.",
        },
        {
          id: "l2",
          title: "Scope, Context, and Leadership",
          objective:
            "Define an appropriate ISMS scope and describe the leadership commitments the standard demands.",
        },
      ],
    },
    {
      id: "m2",
      title: "Risk, Controls, and the Audit",
      lessons: [
        {
          id: "l3",
          title: "Running a Defensible Risk Assessment",
          objective:
            "Carry out an information-security risk assessment and justify risk-treatment decisions.",
        },
        {
          id: "l4",
          title: "Annex A Controls and the Statement of Applicability",
          objective:
            "Map risks to Annex A controls and explain the role of the Statement of Applicability.",
        },
        {
          id: "l5",
          title: "What Certification Auditors Look For",
          objective:
            "Anticipate common auditor questions and evidence requests during a Stage 1 and Stage 2 audit.",
        },
      ],
    },
  ],
};

const LESSONS: Record<string, GeneratedLesson> = {
  l1: {
    id: "l1",
    title: "What ISO 27001 Actually Requires",
    objective:
      "Explain the purpose of an ISMS and distinguish the management-system clauses from the Annex A controls.",
    blocks: [
      {
        type: "text",
        heading: "The ISMS is the product, not the paperwork",
        markdown:
          "ISO 27001 certifies an **Information Security Management System (ISMS)** — an ongoing system for managing information risk, not a one-time checklist. The certificate says an organization has a working process to identify risks, decide what to do about them, and keep improving.\n\nThe standard has two parts that people constantly confuse:\n\n- **Clauses 4–10** — the *management system* requirements (context, leadership, planning, support, operation, evaluation, improvement). These are mandatory.\n- **Annex A** — a catalogue of **93 controls** you select from based on your risks. You are not required to implement all of them.",
        sourceRef:
          "\"ISO 27001 certifies a management system (the ISMS), not a fixed set of controls... Clauses 4 through 10 are mandatory; Annex A is a menu of controls selected by risk.\"",
      },
      {
        type: "quiz_check",
        question:
          "An auditor asks which Annex A controls are mandatory for every organization. What is the correct answer?",
        options: [
          "All 93 controls are mandatory.",
          "None are inherently mandatory — controls are selected based on the risk assessment.",
          "Only the controls in the first domain are mandatory.",
          "The auditor decides which controls are mandatory.",
        ],
        correctIndex: 1,
        explanation:
          "Annex A is a menu. You select controls that treat the risks you identified, and justify inclusions/exclusions in the Statement of Applicability.",
        sourceRef:
          "\"Annex A is a menu of controls selected by risk... inclusions and exclusions are justified in the Statement of Applicability.\"",
      },
      {
        type: "flashcards",
        cards: [
          {
            front: "ISMS",
            back: "Information Security Management System — the ongoing system of policies, processes, and controls that ISO 27001 certifies.",
          },
          {
            front: "Clauses 4–10",
            back: "The mandatory management-system requirements: context, leadership, planning, support, operation, performance evaluation, and improvement.",
          },
          {
            front: "Annex A",
            back: "A catalogue of 93 controls (in the 2022 revision) that you select from based on your risk assessment.",
          },
        ],
        sourceRef:
          "\"The 2022 revision reorganized Annex A into 93 controls across four themes.\"",
      },
      {
        type: "text",
        heading: "Why this distinction matters for the audit",
        markdown:
          "Auditors spend most of their time on Clauses 4–10 — they want to see the *system* working: risks assessed, decisions recorded, management reviews happening, nonconformities corrected. A pile of controls with no management system behind it does not pass. Get the management system right and the controls follow from it.",
        sourceRef:
          "\"Certification assesses whether the management system operates as intended, not merely whether controls exist.\"",
      },
    ],
  },
  l2: {
    id: "l2",
    title: "Scope, Context, and Leadership",
    objective:
      "Define an appropriate ISMS scope and describe the leadership commitments the standard demands.",
    blocks: [
      {
        type: "text",
        heading: "Scope: draw the boundary deliberately",
        markdown:
          "The **scope** defines which parts of the organization the ISMS covers — which services, locations, teams, and information assets. A scope that is too broad is expensive to maintain; one that is too narrow (carving out the systems that actually hold the risk) is a red flag to auditors and customers.\n\nA defensible scope statement names the boundary and the justification, and accounts for interfaces and dependencies with anything left outside it.",
        sourceRef:
          "\"Clause 4.3 requires the organization to determine the boundaries and applicability of the ISMS... interfaces and dependencies with out-of-scope functions must be considered.\"",
      },
      {
        type: "scenario",
        situation:
          "A SaaS company wants to certify quickly, so it proposes an ISMS scope covering only its corporate IT team — excluding the engineering team that builds and operates the customer-facing product.",
        choices: [
          {
            text: "Approve it — a narrow scope means a faster, cheaper audit.",
            correct: false,
            feedback:
              "Excluding the team that operates the product carves out where the customer-data risk actually lives. Auditors (and customers reading the certificate) will see the scope as not credible.",
          },
          {
            text: "Push back — the scope should cover the systems and teams that handle the information the ISMS is meant to protect.",
            correct: true,
            feedback:
              "Correct. Scope should follow the risk. Excluding the product-operating team makes the certificate misleading and undermines its value.",
          },
          {
            text: "Leave scope undefined and let the auditor decide.",
            correct: false,
            feedback:
              "Defining scope is the organization's responsibility under Clause 4.3; an undefined scope fails immediately.",
          },
        ],
        sourceRef:
          "\"Scope should follow the risk; excluding systems that hold protected information undermines the credibility of certification.\"",
      },
      {
        type: "text",
        heading: "Leadership is a requirement, not a courtesy",
        markdown:
          "Clause 5 puts specific obligations on **top management**: establish the information security policy, ensure resources, assign roles and responsibilities, and demonstrate active commitment. 'Management support' is not a slogan here — auditors look for evidence: approved policy, funded roles, and management-review meeting minutes.",
        sourceRef:
          "\"Clause 5 requires top management to demonstrate leadership and commitment, including establishing the policy and ensuring resources.\"",
      },
      {
        type: "quiz_check",
        question:
          "What evidence best demonstrates leadership commitment under Clause 5?",
        options: [
          "A verbal assurance from the CEO during the audit.",
          "An approved security policy, funded security roles, and documented management reviews.",
          "A large firewall budget.",
          "A copy of the ISO 27001 standard on the shared drive.",
        ],
        correctIndex: 1,
        explanation:
          "Leadership is evidenced by concrete artifacts: an approved policy, resourced roles, and records of management engagement — not statements or technology spend alone.",
        sourceRef:
          "\"Auditors seek evidence of leadership: an approved policy, assigned and resourced roles, and management review records.\"",
      },
    ],
  },
  l3: {
    id: "l3",
    title: "Running a Defensible Risk Assessment",
    objective:
      "Carry out an information-security risk assessment and justify risk-treatment decisions.",
    blocks: [
      {
        type: "text",
        heading: "A repeatable method beats a perfect one",
        markdown:
          "Clause 6.1.2 requires a **defined, repeatable** risk-assessment process — one that produces consistent, comparable results each time it runs. The standard does not mandate a specific methodology; it requires that you have one, apply it, and can repeat it.\n\nA typical flow: identify information assets and the risks to them → assess likelihood and impact → prioritize → decide treatment. The key word auditors care about is *repeatable*: run it twice and get comparable results.",
        sourceRef:
          "\"Clause 6.1.2 requires a defined and repeatable risk assessment process producing consistent, comparable results.\"",
      },
      {
        type: "flashcards",
        cards: [
          {
            front: "Risk treatment options",
            back: "Modify (apply controls), retain (accept), avoid (stop the activity), or share (e.g. insurance / transfer to a third party).",
          },
          {
            front: "Risk owner",
            back: "The person accountable for a given risk and for the decision on how it is treated.",
          },
          {
            front: "Residual risk",
            back: "The risk that remains after treatment. Residual risk must be accepted by the risk owner.",
          },
        ],
        sourceRef:
          "\"Treatment options are to modify, retain, avoid, or share the risk; residual risk must be accepted by the risk owner.\"",
      },
      {
        type: "scenario",
        situation:
          "Your team identifies a high risk that customer backups are stored unencrypted. The project manager says 'we accept that risk for now' and moves on, with no sign-off recorded.",
        choices: [
          {
            text: "That's fine — accepting risk is a valid treatment option.",
            correct: false,
            feedback:
              "Acceptance IS valid — but a high residual risk must be formally accepted and recorded by the risk owner, not waved off in passing.",
          },
          {
            text: "Require the risk owner to formally accept the residual risk in writing, or fund treatment.",
            correct: true,
            feedback:
              "Correct. Acceptance is legitimate only when the accountable risk owner records the decision. An unrecorded acceptance of a high risk is a classic audit finding.",
          },
          {
            text: "Delete the risk from the register so it doesn't fail the audit.",
            correct: false,
            feedback:
              "Removing a known risk from the register to avoid a finding is exactly the kind of thing that turns a minor finding into a major one.",
          },
        ],
        sourceRef:
          "\"Residual risk must be accepted by the risk owner; unrecorded acceptance of significant risk is a common nonconformity.\"",
      },
    ],
  },
  l4: {
    id: "l4",
    title: "Annex A Controls and the Statement of Applicability",
    objective:
      "Map risks to Annex A controls and explain the role of the Statement of Applicability.",
    blocks: [
      {
        type: "text",
        heading: "The Statement of Applicability ties it together",
        markdown:
          "The **Statement of Applicability (SoA)** is the document auditors reach for first. For every Annex A control it states: whether it is **applicable**, whether it is **implemented**, and the **justification**. It is the bridge between your risk assessment and your controls — it shows *why* each control is in or out.\n\nIn the 2022 revision, Annex A has **93 controls** grouped into four themes: organizational, people, physical, and technological.",
        sourceRef:
          "\"The Statement of Applicability records, for each control, applicability, implementation status, and justification... the 2022 revision groups 93 controls into organizational, people, physical, and technological themes.\"",
      },
      {
        type: "quiz_check",
        question: "What is the primary purpose of the Statement of Applicability?",
        options: [
          "To list every employee with system access.",
          "To justify which Annex A controls apply, their status, and why — linking controls back to risk.",
          "To replace the risk assessment.",
          "To record firewall rules.",
        ],
        correctIndex: 1,
        explanation:
          "The SoA justifies control inclusion/exclusion and status, connecting the risk assessment to the controls actually in place.",
        sourceRef:
          "\"The SoA justifies inclusion and exclusion of controls and links them to the risk assessment.\"",
      },
      {
        type: "flashcards",
        cards: [
          {
            front: "Annex A themes (2022)",
            back: "Organizational, People, Physical, and Technological controls — 93 in total.",
          },
          {
            front: "Applicable vs implemented",
            back: "A control can be applicable (relevant to your risks) but not yet implemented — the SoA must show both states honestly.",
          },
        ],
        sourceRef:
          "\"A control may be marked applicable but not yet implemented; the SoA must reflect the true status.\"",
      },
    ],
  },
  l5: {
    id: "l5",
    title: "What Certification Auditors Look For",
    objective:
      "Anticipate common auditor questions and evidence requests during a Stage 1 and Stage 2 audit.",
    blocks: [
      {
        type: "text",
        heading: "Two stages, two different questions",
        markdown:
          "Certification happens in two stages:\n\n- **Stage 1** is a documentation and readiness review — is the ISMS designed and are the required documents in place? Auditors check scope, policy, risk assessment, SoA, and whether you're actually running the system.\n- **Stage 2** tests *effectiveness* — auditors gather evidence that the ISMS operates in practice: sampling records, interviewing staff, and tracing risks through to controls and evidence.",
        sourceRef:
          "\"Stage 1 reviews design and documentation; Stage 2 tests the effectiveness of the operating ISMS through sampling and interviews.\"",
      },
      {
        type: "scenario",
        situation:
          "During Stage 2, an auditor asks a support engineer to explain what they do if they spot a security incident. The engineer says, 'I'm not sure, I think there's a policy somewhere.'",
        choices: [
          {
            text: "No problem — the policy exists, which is what matters.",
            correct: false,
            feedback:
              "Stage 2 tests whether the system works in practice. A documented process that staff can't follow is evidence the ISMS isn't operating — a likely finding.",
          },
          {
            text: "This is a gap — staff awareness and the ability to follow the incident process is itself audit evidence.",
            correct: true,
            feedback:
              "Correct. Effectiveness includes people. If staff can't follow the incident-response process, the control isn't operating regardless of the document.",
          },
          {
            text: "Ask the auditor to interview someone else instead.",
            correct: false,
            feedback:
              "Auditors sample deliberately; steering them away signals exactly the weakness they're probing for.",
          },
        ],
        sourceRef:
          "\"Stage 2 effectiveness testing includes staff interviews; inability to follow a documented process is evidence the control is not operating.\"",
      },
      {
        type: "quiz_check",
        question:
          "What is the main difference between a Stage 1 and a Stage 2 audit?",
        options: [
          "Stage 1 is cheaper; Stage 2 is more expensive.",
          "Stage 1 reviews whether the ISMS is designed and documented; Stage 2 tests whether it operates effectively.",
          "Stage 1 is for small companies; Stage 2 is for large ones.",
          "There is no meaningful difference.",
        ],
        correctIndex: 1,
        explanation:
          "Stage 1 is a readiness/design review; Stage 2 gathers evidence that the ISMS actually works in practice.",
        sourceRef:
          "\"Stage 1 reviews design and documentation; Stage 2 tests effectiveness.\"",
      },
      {
        type: "text",
        heading: "Bring evidence, not assertions",
        markdown:
          "The through-line across every lesson: auditors trust **evidence** over claims. Records of risk decisions, management reviews, corrected nonconformities, training completion, and access reviews are what carry an audit. If it isn't recorded, to an auditor it didn't happen.",
        sourceRef:
          "\"Auditors rely on records as evidence; undocumented activity is treated as not having occurred.\"",
      },
    ],
  },
};

export function mockLesson(lessonId: string): GeneratedLesson {
  return (
    LESSONS[lessonId] || {
      id: lessonId,
      title: "Lesson",
      objective: "",
      blocks: [
        {
          type: "text",
          heading: "Lesson content",
          markdown: "Generated lesson content would appear here.",
          sourceRef: "sample source",
        },
      ],
    }
  );
}

// Plausible per-lesson usage/cost for the mock cost tally (looks like a real run).
export function mockUsage(): Usage {
  const inputTokens = 11000 + Math.floor(Math.random() * 3000);
  const outputTokens = 1400 + Math.floor(Math.random() * 900);
  const costUsd = (inputTokens / 1e6) * 3 + (outputTokens / 1e6) * 15;
  return { inputTokens, outputTokens, costUsd };
}
