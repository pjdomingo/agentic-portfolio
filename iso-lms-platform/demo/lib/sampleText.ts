// The bundled sample source document, as an importable string so the demo works
// with no server and no filesystem (deployable as a fully static site).
// Original explanatory material — it teaches the concepts behind ISO 27001 and
// does not reproduce the copyrighted text of the standard.

export const SAMPLE_FILENAME = "iso27001-primer.md";

export const SAMPLE_PRIMER = `# ISO/IEC 27001: A Practical Readiness Primer

## 1. What ISO 27001 is — and what it is not

ISO/IEC 27001 is the international standard for an Information Security Management System (ISMS). The single most important idea is this: ISO 27001 certifies a management system, not a fixed set of controls. The certificate says an organization has a working, ongoing process for identifying information risks, deciding what to do about them, implementing those decisions, and continually improving. It is a statement about a living system, not a snapshot of technology.

The standard has two distinct parts, and confusing them is the most common source of wasted effort:

- Clauses 4 through 10 contain the mandatory management-system requirements: context, leadership, planning, support, operation, performance evaluation, and improvement. Every certified organization must satisfy these clauses.
- Annex A is a catalogue of controls that you select from based on your risks. In the 2022 revision, Annex A contains 93 controls grouped into four themes: organizational, people, physical, and technological. You are not required to implement all of them — you choose the ones that treat the risks you identified, and you justify your inclusions and exclusions in a document called the Statement of Applicability.

Certification assesses whether the management system operates as intended, not merely whether controls exist. A pile of security tools with no management system behind them will not pass an audit.

## 2. Context and scope (Clause 4)

Clause 4 asks the organization to understand its context — the internal and external issues relevant to information security, and the needs of interested parties (customers, regulators, partners, staff). Clause 4.3 then requires determining the boundaries and applicability of the ISMS — its scope.

Getting scope right is a balancing act. A scope that is too broad is expensive to maintain. A scope that is too narrow — one that carves out the systems that actually hold the risk — is a red flag to auditors and customers. Scope should follow the risk. A frequent mistake: a software company scoping its ISMS to cover only corporate IT while excluding the engineering team that builds and operates the customer-facing product. That excludes the very place where customer-data risk lives, and it makes the certificate misleading.

## 3. Leadership (Clause 5)

Clause 5 places specific obligations on top management. Leadership is a requirement, not a courtesy. Top management must establish the information security policy, ensure resources, assign roles and responsibilities, and actively support the system. Auditors look for concrete evidence of leadership: an approved policy, security roles that are assigned and funded, and records showing management engagement — most importantly, the minutes of management review meetings. A verbal assurance from an executive during the audit is not evidence, and a large technology budget is not evidence of leadership either.

## 4. Planning and risk assessment (Clause 6)

Clause 6 requires a defined and repeatable risk-assessment process that produces consistent, comparable results each time it runs. The standard does not mandate a specific methodology — it requires that you have one, apply it, and can repeat it. A typical flow: identify information assets and the risks to them; assess likelihood and impact; prioritize; decide treatment. Every risk should have a risk owner — the person accountable for that risk and its treatment.

There are four recognized ways to treat a risk: modify it by applying controls, retain (accept) it, avoid it by not doing the activity, or share it (for example through insurance). Acceptance is legitimate — but a significant residual risk (the risk that remains after treatment) must be formally accepted and recorded by the risk owner. An unrecorded acceptance of a high risk is one of the most common nonconformities auditors find.

The Statement of Applicability (SoA) is the document auditors reach for first. For every Annex A control, the SoA records whether the control is applicable, whether it is implemented, and the justification. The SoA is the bridge between the risk assessment and the controls — it shows why each control is in or out. A control can be marked applicable but not yet implemented; the SoA must reflect the true status honestly.

## 5. Support, operation, evaluation, improvement (Clauses 7–10)

Clause 7 covers resources: competence, awareness, communication, and documented information. Staff who operate the ISMS must be competent, and the workforce must be aware of the policy and their role. Documented information must be controlled. Clause 8 (operation) is where plans become action — the risk assessment runs at planned intervals and whenever significant changes occur. Clause 9 (performance evaluation) requires monitoring, internal audit, and management review. Clause 10 (improvement) closes the loop: when something goes wrong, the organization corrects it and takes corrective action to stop it recurring. Continual improvement is the expectation.

## 6. Annex A controls in brief

The 2022 revision reorganized Annex A into 93 controls across four themes: organizational (policies, roles, supplier relationships, incident management), people (screening, awareness, responsibilities), physical (facilities, equipment, media), and technological (access control, cryptography, logging, secure development). Annex A is a menu of controls selected by risk. None of the 93 controls are inherently mandatory for every organization. The auditor does not decide which controls apply — that is the organization's job, driven by its risk assessment.

## 7. The certification audit

An accredited certification body assesses the ISMS in two stages. Stage 1 is a documentation and readiness review — the auditor checks whether the ISMS is designed and whether required documents are in place: scope, policy, risk assessment and methodology, the Statement of Applicability, and evidence the organization is running the system. Stage 2 tests effectiveness — the auditor gathers evidence that the ISMS operates in practice, sampling records, tracing risks through to controls, and interviewing staff. Effectiveness includes people: if a support engineer cannot explain what to do when they spot a security incident, the incident-response control is not operating in practice, no matter how polished the written procedure is.

Auditors rely on records as evidence; undocumented activity is treated as not having occurred. The through-line across every clause is the same: bring evidence, not assertions. After a successful Stage 2 audit, certification is granted for a three-year cycle with surveillance audits in the intervening years and a full recertification at the end. Certification is not a finish line — it is a commitment to keep the management system running and improving.

## 8. A readiness checklist

An organization is broadly ready for a certification audit when it can produce, and speak confidently to: a clear, risk-aligned scope statement; an approved information security policy with visible top-management ownership; a repeatable risk-assessment methodology and a current risk assessment with named risk owners; a risk-treatment plan and recorded acceptance of residual risks; a complete Statement of Applicability; evidence the system is operating (internal audit results, management-review minutes, incident and corrective-action records, training completion); and staff who can describe, in their own words, what they do to keep information secure.

The organizations that pass smoothly are not the ones with the most technology. They are the ones that can show a management system that genuinely runs — that finds risks, decides deliberately, keeps records, and improves.
`;
