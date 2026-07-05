"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  extractFile,
  generateCourse,
  generateOutline,
  getApiKey,
  regenerateLesson,
  sampleSource,
  setApiKey,
  type LessonProgressEvent,
} from "@/lib/engine";
import type {
  Block,
  CourseSettings,
  Flashcard,
  GeneratedLesson,
  Outline,
  OutlineLesson,
  ScenarioChoice,
} from "@/lib/schemas";

type Step = "source" | "outline" | "generate" | "review";
type GStatus = "queued" | "active" | "done" | "error";
type LessonProg = { done: boolean };

const STORAGE_KEY = "certifyhub-demo-v2";
const POINTS_PER_LESSON = 10;
const fmtUsd = (n: number) => `$${n.toFixed(n < 1 ? 4 : 2)}`;
const fmtInt = (n: number) => n.toLocaleString("en-US");

interface Totals {
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export default function Page() {
  const [hasKey, setHasKey] = useState(false);
  const [step, setStep] = useState<Step>("source");

  const [source, setSource] = useState("");
  const [filename, setFilename] = useState("");
  const [pages, setPages] = useState<number | undefined>();
  const [truncated, setTruncated] = useState(false);
  const [settings, setSettings] = useState<CourseSettings>({
    audience: "IT and compliance staff preparing for a certification audit",
    goal: "ISO 27001 certification readiness",
  });

  const [outline, setOutline] = useState<Outline | null>(null);
  const [lessons, setLessons] = useState<Record<string, GeneratedLesson>>({});
  const [gstatus, setGstatus] = useState<Record<string, GStatus>>({});
  const [totals, setTotals] = useState<Totals>({ inputTokens: 0, outputTokens: 0, costUsd: 0 });
  const [progress, setProgress] = useState<Record<string, LessonProg>>({});

  const [player, setPlayer] = useState<string | null>(null); // open lesson id
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [published, setPublished] = useState(false);
  const [toast, setToast] = useState("");
  const [keyModal, setKeyModal] = useState(false);

  // restore
  useEffect(() => {
    setHasKey(!!getApiKey());
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        setStep(s.step ?? "source");
        setSource(s.source ?? "");
        setFilename(s.filename ?? "");
        setPages(s.pages);
        setTruncated(!!s.truncated);
        setSettings(s.settings ?? settings);
        setOutline(s.outline ?? null);
        setLessons(s.lessons ?? {});
        setGstatus(s.gstatus ?? {});
        setTotals(s.totals ?? { inputTokens: 0, outputTokens: 0, costUsd: 0 });
        setProgress(s.progress ?? {});
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // persist
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ step, source, filename, pages, truncated, settings, outline, lessons, gstatus, totals, progress }),
      );
    } catch {
      /* ignore */
    }
  }, [step, source, filename, pages, truncated, settings, outline, lessons, gstatus, totals, progress]);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2600);
  };

  // ---- source ----
  const onFile = useCallback(async (file: File) => {
    setError("");
    setBusy(true);
    try {
      const r = await extractFile(file);
      if (!r.text.trim()) throw new Error("Couldn't extract text (a scanned-image PDF needs OCR).");
      setSource(r.text);
      setFilename(r.filename);
      setPages(r.pages);
      setTruncated(r.truncated);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, []);

  const onSample = useCallback(() => {
    const r = sampleSource();
    setSource(r.text);
    setFilename(r.filename);
    setPages(undefined);
    setTruncated(false);
    setError("");
  }, []);

  // ---- outline ----
  const doOutline = async () => {
    setError("");
    setBusy(true);
    try {
      const { outline: o } = await generateOutline(source, settings);
      setOutline(o);
      setStep("outline");
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const renameLesson = (mi: number, li: number, title: string) => {
    if (!outline) return;
    const next = structuredClone(outline);
    next.modules[mi].lessons[li].title = title;
    setOutline(next);
  };
  const deleteLesson = (mi: number, li: number) => {
    if (!outline) return;
    const next = structuredClone(outline);
    next.modules[mi].lessons.splice(li, 1);
    if (next.modules[mi].lessons.length === 0) next.modules.splice(mi, 1);
    setOutline(next);
  };
  const totalLessons = outline ? outline.modules.reduce((n, m) => n + m.lessons.length, 0) : 0;

  // ---- generate ----
  const doGenerate = async () => {
    if (!outline) return;
    setError("");
    setLessons({});
    setProgress({});
    setPublished(false);
    setGstatus(Object.fromEntries(outline.modules.flatMap((m) => m.lessons.map((l) => [l.id, "queued" as GStatus]))));
    setTotals({ inputTokens: 0, outputTokens: 0, costUsd: 0 });
    setStep("generate");
    setBusy(true);
    try {
      await generateCourse(source, outline, settings, (e: LessonProgressEvent) => {
        if (e.phase === "start") {
          setGstatus((s) => ({ ...s, [e.lessonId]: "active" }));
        } else if (e.phase === "done" && e.lesson) {
          setLessons((ls) => ({ ...ls, [e.lessonId]: e.lesson! }));
          setGstatus((s) => ({ ...s, [e.lessonId]: "done" }));
          if (e.usage)
            setTotals((t) => ({
              inputTokens: t.inputTokens + e.usage!.inputTokens,
              outputTokens: t.outputTokens + e.usage!.outputTokens,
              costUsd: t.costUsd + e.usage!.costUsd,
            }));
        } else if (e.phase === "error") {
          setGstatus((s) => ({ ...s, [e.lessonId]: "error" }));
        }
      });
      setTimeout(() => setStep("review"), 650);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  // ---- player / progress ----
  const completeLesson = (lessonId: string) => {
    setProgress((p) => (p[lessonId]?.done ? p : { ...p, [lessonId]: { done: true } }));
  };
  const lessonsDone = Object.values(progress).filter((p) => p.done).length;
  const generatedCount = Object.keys(lessons).length;
  const points = lessonsDone * POINTS_PER_LESSON;

  const orderedLessonIds = outline ? outline.modules.flatMap((m) => m.lessons.map((l) => l.id)).filter((id) => lessons[id]) : [];
  const nextLessonId = (id: string): string | null => {
    const i = orderedLessonIds.indexOf(id);
    return i >= 0 && i < orderedLessonIds.length - 1 ? orderedLessonIds[i + 1] : null;
  };

  // ---- regenerate ----
  const doRegenerate = async (lessonId: string, instruction: string) => {
    if (!outline || !instruction.trim()) return;
    let moduleTitle = "";
    let ol: OutlineLesson | null = null;
    for (const m of outline.modules) {
      const f = m.lessons.find((l) => l.id === lessonId);
      if (f) {
        moduleTitle = m.title;
        ol = f;
      }
    }
    if (!ol) return;
    const r = await regenerateLesson(source, outline.courseTitle, moduleTitle, ol, settings, instruction.trim());
    setLessons((ls) => ({ ...ls, [lessonId]: r.lesson }));
    setTotals((t) => ({
      inputTokens: t.inputTokens + r.usage.inputTokens,
      outputTokens: t.outputTokens + r.usage.outputTokens,
      costUsd: t.costUsd + r.usage.costUsd,
    }));
    flash("Lesson regenerated");
  };

  const resetAll = () => {
    localStorage.removeItem(STORAGE_KEY);
    setStep("source");
    setSource("");
    setFilename("");
    setPages(undefined);
    setTruncated(false);
    setOutline(null);
    setLessons({});
    setGstatus({});
    setTotals({ inputTokens: 0, outputTokens: 0, costUsd: 0 });
    setProgress({});
    setPublished(false);
    setPlayer(null);
    setError("");
  };

  const saveKey = (k: string) => {
    setApiKey(k.trim());
    setHasKey(!!k.trim());
    setKeyModal(false);
    flash(k.trim() ? "Live mode on — real generation enabled" : "Switched to mock mode");
  };

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">
          Certify<b>Hub</b> <span className="tagline">· Course Studio</span>
        </div>
        <button
          className={`badge-mode ${hasKey ? "live" : "mock"}`}
          onClick={() => setKeyModal(true)}
          title={hasKey ? "Live — using your Anthropic key. Tap to manage." : "Mock mode — tap to add your key for real generation"}
        >
          ● {hasKey ? "Live" : "Mock"}
        </button>
      </div>

      <div className="wrap">
        <Stepper step={step} />
        {error && <div className="err-banner">{error}</div>}

        {step === "source" && (
          <SourceStep
            busy={busy}
            hasKey={hasKey}
            filename={filename}
            pages={pages}
            truncated={truncated}
            sourceLen={source.length}
            settings={settings}
            setSettings={setSettings}
            onFile={onFile}
            onSample={onSample}
            onChange={() => {
              setFilename("");
              setSource("");
            }}
            onNext={doOutline}
          />
        )}

        {step === "outline" && outline && (
          <OutlineStep
            outline={outline}
            totalLessons={totalLessons}
            onRename={renameLesson}
            onDelete={deleteLesson}
            onBack={() => setStep("source")}
            onApprove={doGenerate}
            busy={busy}
          />
        )}

        {step === "generate" && outline && <GenerateStep outline={outline} gstatus={gstatus} totals={totals} />}

        {step === "review" && outline && !published && (
          <CourseOverview
            outline={outline}
            lessons={lessons}
            progress={progress}
            totals={totals}
            generatedCount={generatedCount}
            lessonsDone={lessonsDone}
            points={points}
            onOpen={(id) => setPlayer(id)}
            onPublish={() => setPublished(true)}
          />
        )}

        {published && outline && (
          <Published outline={outline} totals={totals} count={generatedCount} points={points} onReset={resetAll} />
        )}
      </div>

      {player && lessons[player] && outline && (
        <LessonPlayer
          lesson={lessons[player]}
          moduleTitle={moduleTitleFor(outline, player)}
          hasNext={!!nextLessonId(player)}
          onClose={() => setPlayer(null)}
          onComplete={() => completeLesson(player)}
          onNext={() => {
            const n = nextLessonId(player);
            setPlayer(n);
          }}
          onRegenerate={(instr) => doRegenerate(player, instr)}
        />
      )}

      {keyModal && <KeyModal hasKey={hasKey} onSave={saveKey} onClose={() => setKeyModal(false)} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function errMsg(e: unknown): string {
  const m = (e as Error).message || "Something went wrong.";
  if (/api key|authentication|401/i.test(m)) return "That Anthropic API key was rejected. Check it in the Live/Mock badge, or switch back to mock mode.";
  return m;
}
function moduleTitleFor(outline: Outline, lessonId: string): string {
  for (const m of outline.modules) if (m.lessons.some((l) => l.id === lessonId)) return m.title;
  return "";
}

/* ---------------- Stepper ---------------- */
function Stepper({ step }: { step: Step }) {
  const order: Step[] = ["source", "outline", "generate", "review"];
  const labels: Record<Step, string> = { source: "Source", outline: "Outline", generate: "Generate", review: "Review" };
  const idx = order.indexOf(step);
  return (
    <div className="steps">
      {order.map((s, i) => (
        <div key={s} className={`step-pill ${i === idx ? "active" : ""} ${i < idx ? "done" : ""}`}>
          <span className="num">{i < idx ? "✓" : i + 1}</span>
          <span className="lbl">{labels[s]}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Step 1: source ---------------- */
function SourceStep(props: {
  busy: boolean;
  hasKey: boolean;
  filename: string;
  pages?: number;
  truncated: boolean;
  sourceLen: number;
  settings: CourseSettings;
  setSettings: (s: CourseSettings) => void;
  onFile: (f: File) => void;
  onSample: () => void;
  onChange: () => void;
  onNext: () => void;
}) {
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { busy, hasKey, filename, pages, truncated, sourceLen, settings, setSettings, onFile, onSample, onChange, onNext } = props;

  return (
    <>
      <h1 className="title">Turn a document into a course</h1>
      <p className="sub">
        Upload a standard summary, an internal policy, or training notes.{" "}
        {hasKey ? "Claude reads it and drafts a complete interactive course." : "Try it on a bundled ISO 27001 primer — no setup needed."}
      </p>

      <div className="card">
        {!filename ? (
          <>
            <div
              className={`drop ${over ? "over" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(true);
              }}
              onDragLeave={() => setOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setOver(false);
                const f = e.dataTransfer.files?.[0];
                if (f) onFile(f);
              }}
              onClick={() => inputRef.current?.click()}
              role="button"
            >
              <div className="icon">📄</div>
              <div className="big">Drop a PDF, Markdown, or text file</div>
              <div className="mut small">or tap to browse · up to ~50k characters</div>
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.md,.markdown,.txt,application/pdf,text/plain,text/markdown"
                style={{ display: "none" }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onFile(f);
                }}
              />
            </div>
            <div className="orline">or</div>
            <button className="btn block" onClick={onSample} disabled={busy}>
              📘 Use sample document (ISO 27001 primer)
            </button>
          </>
        ) : (
          <div className="filechip">
            <span className="fi">📄</span>
            <div className="meta">
              <b>{filename}</b>
              <span>
                {fmtInt(sourceLen)} chars{pages ? ` · ${pages} pages` : ""}
                {truncated ? " · trimmed" : ""}
              </span>
            </div>
            <div className="spacer" />
            <button className="btn ghost sm" onClick={onChange}>
              Change
            </button>
          </div>
        )}

        {filename && (
          <>
            <label className="fld">Target audience</label>
            <input className="txt" value={settings.audience} onChange={(e) => setSettings({ ...settings, audience: e.target.value })} />
            <label className="fld">Course goal</label>
            <input className="txt" value={settings.goal} onChange={(e) => setSettings({ ...settings, goal: e.target.value })} />
          </>
        )}
      </div>

      {filename && (
        <div className="actionbar">
          <div className="spacer" />
          <button className="btn primary" onClick={onNext} disabled={busy}>
            {busy ? <span className="spin-inline" /> : null} Generate outline →
          </button>
        </div>
      )}
    </>
  );
}

/* ---------------- Step 2: outline ---------------- */
function OutlineStep(props: {
  outline: Outline;
  totalLessons: number;
  onRename: (mi: number, li: number, t: string) => void;
  onDelete: (mi: number, li: number) => void;
  onBack: () => void;
  onApprove: () => void;
  busy: boolean;
}) {
  const { outline, totalLessons, onRename, onDelete, onBack, onApprove, busy } = props;
  const [editing, setEditing] = useState("");

  return (
    <>
      <h1 className="title">{outline.courseTitle}</h1>
      <p className="sub">{outline.summary}</p>

      {outline.modules.map((m, mi) => (
        <div className="mod" key={m.id}>
          <div className="mod-head">
            <span className="mtag">Module {mi + 1}</span>
            {m.title}
          </div>
          {m.lessons.map((l, li) => {
            const key = `${mi}-${li}`;
            return (
              <div className={`lesson-row ${editing === key ? "editing" : ""}`} key={l.id}>
                <span className="lnum">{li + 1}</span>
                {editing === key ? (
                  <input
                    autoFocus
                    defaultValue={l.title}
                    onBlur={(e) => {
                      onRename(mi, li, e.target.value || l.title);
                      setEditing("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        onRename(mi, li, (e.target as HTMLInputElement).value || l.title);
                        setEditing("");
                      }
                    }}
                  />
                ) : (
                  <div className="ltitle" onClick={() => setEditing(key)} style={{ cursor: "text" }}>
                    <b>{l.title}</b>
                    <span>{l.objective}</span>
                  </div>
                )}
                <button className="iconbtn" onClick={() => onDelete(mi, li)} aria-label="Remove lesson">
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      ))}

      <p className="note-inline">Tap a lesson title to edit it. In the real product this is where a subject-matter expert shapes the course before generation.</p>

      <div className="actionbar">
        <button className="btn ghost" onClick={onBack}>
          ← Back
        </button>
        <div className="spacer" />
        <button className="btn primary" onClick={onApprove} disabled={busy || totalLessons === 0}>
          Generate {totalLessons} lesson{totalLessons === 1 ? "" : "s"} →
        </button>
      </div>
    </>
  );
}

/* ---------------- Step 3: generate ---------------- */
function GenerateStep(props: { outline: Outline; gstatus: Record<string, GStatus>; totals: Totals }) {
  const { outline, gstatus, totals } = props;
  const flat = outline.modules.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleTitle: m.title })));
  const doneCount = Object.values(gstatus).filter((s) => s === "done").length;
  return (
    <>
      <h1 className="title">Generating the course</h1>
      <p className="sub">Each lesson is generated individually and grounded in your source — reviewable, cheap to regenerate, and traceable.</p>
      <div className="gen-grid">
        <div className="prog-list">
          {flat.map((l, i) => {
            const st = gstatus[l.id] || "queued";
            return (
              <div className={`prog-item ${st}`} key={l.id}>
                <span className={`st ${st}`}>{st === "done" ? "✓" : st === "error" ? "!" : st === "queued" ? i + 1 : ""}</span>
                <div className="pt">
                  <b>{l.title}</b>
                  <span>
                    {l.moduleTitle} · {st === "active" ? "generating…" : st === "done" ? "ready" : st === "error" ? "failed" : "queued"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="meter">
          <h4>Live generation cost</h4>
          <div className="cost">{fmtUsd(totals.costUsd)}</div>
          <div className="costsub">
            {doneCount} / {flat.length} lessons
          </div>
          <div className="kv">
            <span>Input tokens</span>
            <b>{fmtInt(totals.inputTokens)}</b>
          </div>
          <div className="kv">
            <span>Output tokens</span>
            <b>{fmtInt(totals.outputTokens)}</b>
          </div>
          <div className="kv">
            <span>Per lesson</span>
            <b>{fmtUsd(doneCount ? totals.costUsd / doneCount : 0)}</b>
          </div>
          <p className="note-inline">Traditional instructional design runs $3,000–$10,000 per course.</p>
        </div>
      </div>
    </>
  );
}

/* ---------------- Step 4: course overview ---------------- */
function CourseOverview(props: {
  outline: Outline;
  lessons: Record<string, GeneratedLesson>;
  progress: Record<string, LessonProg>;
  totals: Totals;
  generatedCount: number;
  lessonsDone: number;
  points: number;
  onOpen: (id: string) => void;
  onPublish: () => void;
}) {
  const { outline, lessons, progress, totals, generatedCount, lessonsDone, points, onOpen, onPublish } = props;
  const pct = generatedCount ? Math.round((lessonsDone / generatedCount) * 100) : 0;

  return (
    <>
      <div className="ov-head">
        <div>
          <h1 className="title">{outline.courseTitle}</h1>
          <p className="sub" style={{ marginBottom: 0 }}>
            {generatedCount} lessons generated for {fmtUsd(totals.costUsd)}. Tap a lesson to take it — the quizzes and scenarios really work.
          </p>
        </div>
        <div className="ov-progress">
          <div className="top">
            <span className="pct">{pct}% complete</span>
            <span className="pts">★ {points} pts</span>
          </div>
          <div className="pbar">
            <div className="fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="dim small" style={{ marginTop: 8 }}>
            {lessonsDone} of {generatedCount} lessons done
          </div>
        </div>
      </div>

      {outline.modules.map((m, mi) => (
        <div className="ov-mod" key={m.id}>
          <div className="omtag">
            Module {mi + 1} · {m.title}
          </div>
          {m.lessons.map((l, li) => {
            if (!lessons[l.id]) return null;
            const done = progress[l.id]?.done;
            const steps = lessons[l.id].blocks.length;
            return (
              <button key={l.id} className={`lcard ${done ? "done" : ""}`} onClick={() => onOpen(l.id)}>
                <span className="lc-ic">{done ? "✓" : li + 1}</span>
                <span className="lc-body">
                  <b>{l.title}</b>
                  <span>
                    {steps} steps{done ? " · completed" : ""}
                  </span>
                </span>
                <span className="lc-go">{done ? "↻" : "→"}</span>
              </button>
            );
          })}
        </div>
      ))}

      <div className="actionbar">
        <div className="spacer" />
        <button className="btn primary" onClick={onPublish}>
          ✓ Publish course
        </button>
      </div>
    </>
  );
}

/* ---------------- Lesson player (step-by-step) ---------------- */
function LessonPlayer(props: {
  lesson: GeneratedLesson;
  moduleTitle: string;
  hasNext: boolean;
  onClose: () => void;
  onComplete: () => void;
  onNext: () => void;
  onRegenerate: (instruction: string) => Promise<void>;
}) {
  const { lesson, moduleTitle, hasNext, onClose, onComplete, onNext, onRegenerate } = props;
  const blocks = lesson.blocks;
  const total = blocks.length;
  const [stepIdx, setStepIdx] = useState(0); // 0..total-1, then total = complete screen
  const [satisfied, setSatisfied] = useState<Record<number, boolean>>({});
  const [regen, setRegen] = useState("");
  const [regenBusy, setRegenBusy] = useState(false);

  useEffect(() => {
    setStepIdx(0);
    setSatisfied({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id]);

  const atComplete = stepIdx >= total;
  const block = atComplete ? null : blocks[stepIdx];
  const requiresInteraction = block ? block.type === "quiz_check" || block.type === "scenario" : false;
  const canContinue = !requiresInteraction || satisfied[stepIdx];
  const progressPct = Math.round(((atComplete ? total : stepIdx) / total) * 100);

  const markSatisfied = () => setSatisfied((s) => ({ ...s, [stepIdx]: true }));

  const next = () => {
    if (stepIdx + 1 >= total) {
      onComplete();
      setStepIdx(total);
    } else {
      setStepIdx(stepIdx + 1);
    }
  };
  const back = () => {
    if (stepIdx === 0) onClose();
    else setStepIdx(Math.max(0, stepIdx - 1));
  };

  const doRegen = async () => {
    if (!regen.trim()) return;
    setRegenBusy(true);
    try {
      await onRegenerate(regen.trim());
      setRegen("");
      setStepIdx(0);
      setSatisfied({});
    } finally {
      setRegenBusy(false);
    }
  };

  return (
    <div className="player">
      <div className="pl-top">
        <button className="pl-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <div className="pl-titlewrap">
          <b>{lesson.title}</b>
          <div className="pl-step">{atComplete ? "Complete" : `Step ${stepIdx + 1} of ${total} · ${moduleTitle}`}</div>
        </div>
      </div>
      <div className="pl-progressline">
        <div className="fill" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="pl-body">
        <div className="pl-inner" key={atComplete ? "done" : stepIdx}>
          {atComplete ? (
            <div className="pl-complete">
              <div className="medal">★</div>
              <h2>Lesson complete</h2>
              <div className="earn">+{POINTS_PER_LESSON} points</div>
              <p className="mut" style={{ marginBottom: 20 }}>
                Nice work. You finished <b>{lesson.title}</b>.
              </p>
              <div className="regenbar" style={{ justifyContent: "center", marginBottom: 16 }}>
                <input placeholder='Regenerate this lesson: e.g. "simpler language"' value={regen} onChange={(e) => setRegen(e.target.value)} disabled={regenBusy} />
                <button className="btn sm" onClick={doRegen} disabled={regenBusy || !regen.trim()}>
                  {regenBusy ? <span className="spin-inline" /> : "↻"} Regenerate
                </button>
              </div>
              <div className="row" style={{ justifyContent: "center" }}>
                <button className="btn" onClick={onClose}>
                  Back to course
                </button>
                {hasNext && (
                  <button className="btn primary" onClick={onNext}>
                    Next lesson →
                  </button>
                )}
              </div>
            </div>
          ) : (
            <StepBlock block={block!} index={stepIdx} onSatisfied={markSatisfied} />
          )}
        </div>
      </div>

      {!atComplete && (
        <div className="pl-bottom">
          <button className="btn back" onClick={back}>
            {stepIdx === 0 ? "✕" : "←"}
          </button>
          <button className="btn primary" onClick={next} disabled={!canContinue}>
            {stepIdx + 1 >= total ? "Finish lesson ✓" : "Continue →"}
          </button>
        </div>
      )}
      {!atComplete && requiresInteraction && !satisfied[stepIdx] && <div className="gate-hint" style={{ paddingBottom: 10 }}>Answer to continue</div>}
    </div>
  );
}

/* ---------------- one step ---------------- */
function StepBlock({ block, index, onSatisfied }: { block: Block; index: number; onSatisfied: () => void }) {
  if (block.type === "text")
    return (
      <div className="pblock">
        <StepKicker label="Learn" sourceRef={block.sourceRef} />
        {block.heading && <h3>{block.heading}</h3>}
        <div className="prose">
          <MarkdownLite text={block.markdown || ""} />
        </div>
      </div>
    );
  if (block.type === "quiz_check") return <QuizStep block={block} onSatisfied={onSatisfied} key={index} />;
  if (block.type === "flashcards")
    return (
      <div className="pblock">
        <StepKicker label="Key terms" sourceRef={block.sourceRef} />
        <h3>Flip to learn the key terms</h3>
        <div className="cards">
          {(block.cards || []).map((c, i) => (
            <FlashcardView key={i} card={c} />
          ))}
        </div>
        <div className="flip-hint">Tap a card to flip it, then continue.</div>
      </div>
    );
  if (block.type === "scenario") return <ScenarioStep block={block} onSatisfied={onSatisfied} key={index} />;
  return null;
}

function StepKicker({ label, sourceRef }: { label: string; sourceRef?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="pl-kicker">
        {label}
        {sourceRef && (
          <button className="srcref src" onClick={() => setOpen((o) => !o)}>
            {open ? "hide source" : "source"}
          </button>
        )}
      </div>
      {open && sourceRef && (
        <div className="srcpop">
          <b>Grounded in source</b>
          {sourceRef}
        </div>
      )}
    </>
  );
}

function QuizStep({ block, onSatisfied }: { block: Block; onSatisfied: () => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  const options = block.options || [];
  const correct = block.correctIndex ?? 0;
  return (
    <div className="pblock">
      <StepKicker label="Quick check" sourceRef={block.sourceRef} />
      <div className="q">{block.question}</div>
      {options.map((o, i) => {
        const cls = picked === null ? "" : i === correct ? "correct" : i === picked ? "wrong" : "";
        const mark = picked === null ? "" : i === correct ? "✓" : i === picked ? "✕" : "";
        return (
          <button
            key={i}
            className={`opt ${cls}`}
            disabled={picked !== null}
            onClick={() => {
              setPicked(i);
              onSatisfied();
            }}
          >
            <span className="mark">{mark}</span>
            {o}
          </button>
        );
      })}
      {picked !== null && block.explanation && (
        <div className={`explain ${picked === correct ? "good" : "bad"}`}>
          {picked === correct ? "Correct. " : "Not quite. "}
          {block.explanation}
        </div>
      )}
    </div>
  );
}

function ScenarioStep({ block, onSatisfied }: { block: Block; onSatisfied: () => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  const choices: ScenarioChoice[] = block.choices || [];
  return (
    <div className="pblock">
      <StepKicker label="Scenario" sourceRef={block.sourceRef} />
      <div className="sit">{block.situation}</div>
      {choices.map((c, i) => {
        const isPicked = picked === i;
        const cls = isPicked ? `picked ${c.correct ? "good" : "bad"}` : "";
        return (
          <div key={i}>
            <button
              className={`choice ${cls}`}
              disabled={picked !== null}
              onClick={() => {
                setPicked(i);
                onSatisfied();
              }}
            >
              {c.text}
            </button>
            {isPicked && (
              <div className={`feedback ${c.correct ? "good" : "bad"}`}>
                {c.correct ? "✓ " : "✗ "}
                {c.feedback}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function FlashcardView({ card }: { card: Flashcard }) {
  const [flip, setFlip] = useState(false);
  return (
    <div className={`fcard ${flip ? "flip" : ""}`} onClick={() => setFlip(!flip)}>
      <div className="fcard-in">
        <div className="fface front">{card.front}</div>
        <div className="fface back">{card.back}</div>
      </div>
    </div>
  );
}

function MarkdownLite({ text }: { text: string }) {
  const lines = text.split("\n");
  const out: React.ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length) {
      out.push(
        <ul key={`ul-${out.length}`}>
          {list.map((it, i) => (
            <li key={i}>{renderInline(it)}</li>
          ))}
        </ul>,
      );
      list = [];
    }
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^\s*[-*]\s+/.test(line)) list.push(line.replace(/^\s*[-*]\s+/, ""));
    else if (line.trim() === "") flush();
    else {
      flush();
      out.push(<p key={`p-${out.length}`}>{renderInline(line)}</p>);
    }
  }
  flush();
  return <>{out}</>;
}
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) return <strong key={i}>{p.slice(2, -2)}</strong>;
    if (p.startsWith("*") && p.endsWith("*") && p.length > 2) return <em key={i}>{p.slice(1, -1)}</em>;
    return <span key={i}>{p}</span>;
  });
}

/* ---------------- key modal ---------------- */
function KeyModal({ hasKey, onSave, onClose }: { hasKey: boolean; onSave: (k: string) => void; onClose: () => void }) {
  const [val, setVal] = useState("");
  return (
    <div className="player" style={{ background: "rgba(6,10,15,.86)", justifyContent: "center", alignItems: "center", padding: 18 }} onClick={onClose}>
      <div className="card" style={{ maxWidth: 460, width: "100%" }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontFamily: "var(--serif)", fontSize: 20, marginBottom: 8 }}>{hasKey ? "Live mode is on" : "Enable live generation"}</h3>
        <p className="mut small" style={{ marginBottom: 4 }}>
          By default this demo runs in <b>mock mode</b> (canned content, no cost). To generate real courses from your uploads, paste your own Anthropic API key. It&apos;s stored only in this browser and sent only to Anthropic — never to any server.
        </p>
        <p className="note-inline" style={{ marginTop: 8 }}>
          Get a key at console.anthropic.com → API Keys.
        </p>
        <label className="fld">Anthropic API key</label>
        <input className="txt" type="password" placeholder="sk-ant-..." value={val} onChange={(e) => setVal(e.target.value)} autoFocus />
        <div className="row" style={{ marginTop: 18 }}>
          {hasKey && (
            <button className="btn danger" onClick={() => onSave("")}>
              Switch to mock
            </button>
          )}
          <div className="spacer" />
          <button className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" onClick={() => onSave(val)} disabled={!val.trim()}>
            Save key
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- published ---------------- */
function Published(props: { outline: Outline; totals: Totals; count: number; points: number; onReset: () => void }) {
  const { outline, totals, count, onReset } = props;
  return (
    <div className="card">
      <div className="published">
        <div className="chk">✓</div>
        <h2>Course published</h2>
        <p className="mut" style={{ maxWidth: 460, margin: "0 auto 20px" }}>
          <b>{outline.courseTitle}</b> — {count} interactive lessons with quizzes, scenarios, and exams, generated and reviewed for {fmtUsd(totals.costUsd)}. In production it would now be assignable to learners with verifiable certificates.
        </p>
        <button className="btn" onClick={onReset}>
          Generate another course
        </button>
      </div>
    </div>
  );
}
