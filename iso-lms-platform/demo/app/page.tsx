"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  Block,
  CourseSettings,
  Flashcard,
  GeneratedLesson,
  Outline,
  ScenarioChoice,
} from "@/lib/schemas";

type Step = "source" | "outline" | "generate" | "review";
type LessonStatus = "queued" | "active" | "done" | "error";

const STORAGE_KEY = "certifyhub-demo-v1";
const fmtUsd = (n: number) => `$${n.toFixed(n < 1 ? 4 : 2)}`;
const fmtInt = (n: number) => n.toLocaleString("en-US");

interface Totals {
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export default function Page() {
  const [mock, setMock] = useState<boolean | null>(null);
  const [model, setModel] = useState<string | null>(null);

  const [step, setStep] = useState<Step>("source");
  const [sourceText, setSourceText] = useState("");
  const [filename, setFilename] = useState("");
  const [pages, setPages] = useState<number | undefined>();
  const [truncated, setTruncated] = useState(false);
  const [settings, setSettings] = useState<CourseSettings>({
    audience: "IT and compliance staff preparing for a certification audit",
    goal: "ISO 27001 certification readiness",
  });

  const [outline, setOutline] = useState<Outline | null>(null);
  const [lessons, setLessons] = useState<Record<string, GeneratedLesson>>({});
  const [status, setStatus] = useState<Record<string, LessonStatus>>({});
  const [totals, setTotals] = useState<Totals>({
    inputTokens: 0,
    outputTokens: 0,
    costUsd: 0,
  });
  const [activeLesson, setActiveLesson] = useState<string>("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [published, setPublished] = useState(false);
  const [toast, setToast] = useState("");

  // --- status + restore ---
  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((d) => {
        setMock(!!d.mock);
        setModel(d.model);
      })
      .catch(() => setMock(true));

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        setStep(s.step ?? "source");
        setSourceText(s.sourceText ?? "");
        setFilename(s.filename ?? "");
        setPages(s.pages);
        setTruncated(!!s.truncated);
        setSettings(s.settings ?? settings);
        setOutline(s.outline ?? null);
        setLessons(s.lessons ?? {});
        setStatus(s.status ?? {});
        setTotals(s.totals ?? { inputTokens: 0, outputTokens: 0, costUsd: 0 });
        setActiveLesson(s.activeLesson ?? "");
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- persist ---
  useEffect(() => {
    if (mock === null) return;
    const snapshot = {
      step,
      sourceText,
      filename,
      pages,
      truncated,
      settings,
      outline,
      lessons,
      status,
      totals,
      activeLesson,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      /* quota — ignore */
    }
  }, [
    mock,
    step,
    sourceText,
    filename,
    pages,
    truncated,
    settings,
    outline,
    lessons,
    status,
    totals,
    activeLesson,
  ]);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2600);
  };

  // ---------- Step 1: source ----------
  const handleFile = useCallback(async (file: File) => {
    setError("");
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/extract", { method: "POST", body: form });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Could not read that file.");
      setSourceText(d.text);
      setFilename(d.filename);
      setPages(d.pages);
      setTruncated(!!d.truncated);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, []);

  const useSample = useCallback(async () => {
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/extract?sample=1", { method: "POST" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Sample unavailable.");
      setSourceText(d.text);
      setFilename(d.filename);
      setPages(undefined);
      setTruncated(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, []);

  // ---------- Step 2: outline ----------
  const genOutline = async () => {
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/outline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: sourceText, settings }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Outline generation failed.");
      setOutline(d.outline);
      setStep("outline");
    } catch (e) {
      setError((e as Error).message);
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

  const totalLessons = outline
    ? outline.modules.reduce((n, m) => n + m.lessons.length, 0)
    : 0;

  // ---------- Step 3: generate (SSE) ----------
  const approveAndGenerate = async () => {
    if (!outline) return;
    setError("");
    setLessons({});
    setStatus(
      Object.fromEntries(
        outline.modules.flatMap((m) =>
          m.lessons.map((l) => [l.id, "queued" as LessonStatus]),
        ),
      ),
    );
    setTotals({ inputTokens: 0, outputTokens: 0, costUsd: 0 });
    setStep("generate");
    setBusy(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: sourceText, outline, settings }),
      });
      if (!res.body) throw new Error("No response stream.");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let firstDone = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() || "";
        for (const part of parts) {
          const line = part.split("\n").find((l) => l.startsWith("data: "));
          if (!line) continue;
          const ev = JSON.parse(line.slice(6));
          if (ev.type === "lesson_start") {
            setStatus((s) => ({ ...s, [ev.lessonId]: "active" }));
          } else if (ev.type === "lesson_done") {
            if (!firstDone) firstDone = ev.lessonId;
            setLessons((ls) => ({ ...ls, [ev.lessonId]: ev.lesson }));
            setStatus((s) => ({ ...s, [ev.lessonId]: "done" }));
            setTotals(ev.totals);
          } else if (ev.type === "lesson_error") {
            setStatus((s) => ({ ...s, [ev.lessonId]: "error" }));
          } else if (ev.type === "complete") {
            setTotals(ev.totals);
          }
        }
      }
      setActiveLesson((cur) => cur || firstDone);
      setTimeout(() => setStep("review"), 600);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // ---------- Step 4: regenerate ----------
  const [regenText, setRegenText] = useState("");
  const [regenBusy, setRegenBusy] = useState(false);
  const regenerate = async (lessonId: string) => {
    if (!outline || !regenText.trim()) return;
    let moduleTitle = "";
    let ol = null;
    for (const m of outline.modules) {
      const found = m.lessons.find((l) => l.id === lessonId);
      if (found) {
        moduleTitle = m.title;
        ol = found;
      }
    }
    if (!ol) return;
    setRegenBusy(true);
    setError("");
    try {
      const res = await fetch("/api/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: sourceText,
          courseTitle: outline.courseTitle,
          moduleTitle,
          lesson: ol,
          settings,
          instruction: regenText.trim(),
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Regeneration failed.");
      setLessons((ls) => ({ ...ls, [lessonId]: d.lesson }));
      setTotals((t) => ({
        inputTokens: t.inputTokens + (d.usage?.inputTokens || 0),
        outputTokens: t.outputTokens + (d.usage?.outputTokens || 0),
        costUsd: t.costUsd + (d.usage?.costUsd || 0),
      }));
      setRegenText("");
      flash("Lesson regenerated");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRegenBusy(false);
    }
  };

  const resetAll = () => {
    localStorage.removeItem(STORAGE_KEY);
    setStep("source");
    setSourceText("");
    setFilename("");
    setPages(undefined);
    setTruncated(false);
    setOutline(null);
    setLessons({});
    setStatus({});
    setTotals({ inputTokens: 0, outputTokens: 0, costUsd: 0 });
    setActiveLesson("");
    setPublished(false);
    setError("");
  };

  const generatedCount = Object.keys(lessons).length;

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">
          Certify<b>Hub</b> <span className="dim small">· Course Studio</span>
        </div>
        {mock !== null &&
          (mock ? (
            <span className="badge-mode mock" title="No API key configured — running on canned content">
              ● Mock mode
            </span>
          ) : (
            <span className="badge-mode live" title={`Live — ${model}`}>
              ● Live · {model}
            </span>
          ))}
      </div>

      <div className="wrap">
        <Stepper step={step} />

        {error && <div className="err-banner">{error}</div>}

        {step === "source" && (
          <SourceStep
            busy={busy}
            filename={filename}
            pages={pages}
            truncated={truncated}
            sourceLen={sourceText.length}
            settings={settings}
            setSettings={setSettings}
            onFile={handleFile}
            onSample={useSample}
            onNext={genOutline}
            mock={mock}
          />
        )}

        {step === "outline" && outline && (
          <OutlineStep
            outline={outline}
            totalLessons={totalLessons}
            onRename={renameLesson}
            onDelete={deleteLesson}
            onBack={() => setStep("source")}
            onApprove={approveAndGenerate}
            busy={busy}
          />
        )}

        {step === "generate" && outline && (
          <GenerateStep outline={outline} status={status} totals={totals} />
        )}

        {step === "review" && outline && !published && (
          <ReviewStep
            outline={outline}
            lessons={lessons}
            active={activeLesson || Object.keys(lessons)[0] || ""}
            setActive={setActiveLesson}
            totals={totals}
            generatedCount={generatedCount}
            regenText={regenText}
            setRegenText={setRegenText}
            regenBusy={regenBusy}
            onRegenerate={regenerate}
            onPublish={() => setPublished(true)}
          />
        )}

        {published && outline && (
          <Published
            outline={outline}
            totals={totals}
            count={generatedCount}
            onReset={resetAll}
          />
        )}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

/* ---------------- Stepper ---------------- */
function Stepper({ step }: { step: Step }) {
  const order: Step[] = ["source", "outline", "generate", "review"];
  const labels: Record<Step, string> = {
    source: "Source",
    outline: "Outline",
    generate: "Generate",
    review: "Review & publish",
  };
  const idx = order.indexOf(step);
  return (
    <div className="steps">
      {order.map((s, i) => (
        <div
          key={s}
          className={`step-pill ${i === idx ? "active" : ""} ${i < idx ? "done" : ""}`}
        >
          <span className="num">{i < idx ? "✓" : i + 1}</span>
          {labels[s]}
        </div>
      ))}
    </div>
  );
}

/* ---------------- Step 1 ---------------- */
function SourceStep(props: {
  busy: boolean;
  filename: string;
  pages?: number;
  truncated: boolean;
  sourceLen: number;
  settings: CourseSettings;
  setSettings: (s: CourseSettings) => void;
  onFile: (f: File) => void;
  onSample: () => void;
  onNext: () => void;
  mock: boolean | null;
}) {
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    busy,
    filename,
    pages,
    truncated,
    sourceLen,
    settings,
    setSettings,
    onFile,
    onSample,
    onNext,
    mock,
  } = props;

  return (
    <>
      <h1 className="title">Turn a document into a course</h1>
      <p className="sub">
        Upload a standard summary, an internal policy, or training notes.
        {mock
          ? " This build has no API key, so it runs on a canned ISO 27001 course — the full flow, offline."
          : " Claude reads it and drafts a complete interactive course, ready for expert review."}
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
              <div className="mut small">or click to browse · max ~50k characters</div>
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
            <button className="btn" onClick={onSample} disabled={busy}>
              {busy ? <span className="spin-inline" /> : "📘"} Use sample document
              (ISO 27001 primer)
            </button>
          </>
        ) : (
          <div className="filechip">
            <span className="fi">📄</span>
            <div className="meta">
              <b>{filename}</b>
              <span>
                {fmtInt(sourceLen)} characters
                {pages ? ` · ${pages} pages` : ""}
                {truncated ? " · trimmed to fit" : ""}
              </span>
            </div>
            <div className="spacer" />
            <button
              className="btn ghost sm"
              onClick={() => window.location.reload()}
            >
              Change
            </button>
          </div>
        )}

        {filename && (
          <>
            <label className="fld">Target audience</label>
            <input
              className="txt"
              value={settings.audience}
              onChange={(e) =>
                setSettings({ ...settings, audience: e.target.value })
              }
            />
            <label className="fld">Course goal</label>
            <input
              className="txt"
              value={settings.goal}
              onChange={(e) =>
                setSettings({ ...settings, goal: e.target.value })
              }
            />
            <div className="row" style={{ marginTop: 22 }}>
              <div className="spacer" />
              <button className="btn primary" onClick={onNext} disabled={busy}>
                {busy ? <span className="spin-inline" /> : null} Generate outline →
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

/* ---------------- Step 2 ---------------- */
function OutlineStep(props: {
  outline: Outline;
  totalLessons: number;
  onRename: (mi: number, li: number, t: string) => void;
  onDelete: (mi: number, li: number) => void;
  onBack: () => void;
  onApprove: () => void;
  busy: boolean;
}) {
  const { outline, totalLessons, onRename, onDelete, onBack, onApprove, busy } =
    props;
  const [editing, setEditing] = useState<string>("");

  return (
    <>
      <h1 className="title">{outline.courseTitle}</h1>
      <p className="sub">{outline.summary}</p>
      <p className="note-inline" style={{ marginTop: -14, marginBottom: 20 }}>
        Review the structure and edit lesson titles before generating. In the
        real product this is where the subject-matter expert shapes the course.
      </p>

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
                  <div
                    className="ltitle"
                    onClick={() => setEditing(key)}
                    title="Click to edit"
                    style={{ cursor: "text" }}
                  >
                    <b>{l.title}</b>
                    <span>{l.objective}</span>
                  </div>
                )}
                <button
                  className="iconbtn"
                  onClick={() => onDelete(mi, li)}
                  title="Remove lesson"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      ))}

      <div className="row" style={{ marginTop: 22 }}>
        <button className="btn ghost" onClick={onBack}>
          ← Back
        </button>
        <div className="spacer" />
        <button
          className="btn primary"
          onClick={onApprove}
          disabled={busy || totalLessons === 0}
        >
          Approve &amp; generate {totalLessons} lesson
          {totalLessons === 1 ? "" : "s"} →
        </button>
      </div>
    </>
  );
}

/* ---------------- Step 3 ---------------- */
function GenerateStep(props: {
  outline: Outline;
  status: Record<string, LessonStatus>;
  totals: Totals;
}) {
  const { outline, status, totals } = props;
  const flat = outline.modules.flatMap((m) =>
    m.lessons.map((l) => ({ ...l, moduleTitle: m.title })),
  );
  const doneCount = Object.values(status).filter((s) => s === "done").length;

  return (
    <>
      <h1 className="title">Generating the course</h1>
      <p className="sub">
        Each lesson is generated individually and grounded in the source — so
        it&apos;s reviewable, cheap to regenerate, and every claim traces back to
        your document.
      </p>

      <div className="gen-grid">
        <div className="prog-list">
          {flat.map((l, i) => {
            const st = status[l.id] || "queued";
            return (
              <div className={`prog-item ${st}`} key={l.id}>
                <span className={`st ${st}`}>
                  {st === "done" ? "✓" : st === "error" ? "!" : st === "queued" ? i + 1 : ""}
                </span>
                <div className="pt">
                  <b>{l.title}</b>
                  <span>
                    {l.moduleTitle} ·{" "}
                    {st === "active"
                      ? "generating…"
                      : st === "done"
                        ? "ready"
                        : st === "error"
                          ? "failed"
                          : "queued"}
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
            {doneCount} / {flat.length} lessons · real API spend
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
          <p className="note-inline">
            Traditional instructional design runs $3,000–$10,000 per course.
          </p>
        </div>
      </div>
    </>
  );
}

/* ---------------- Step 4: review ---------------- */
function ReviewStep(props: {
  outline: Outline;
  lessons: Record<string, GeneratedLesson>;
  active: string;
  setActive: (id: string) => void;
  totals: Totals;
  generatedCount: number;
  regenText: string;
  setRegenText: (s: string) => void;
  regenBusy: boolean;
  onRegenerate: (id: string) => void;
  onPublish: () => void;
}) {
  const {
    outline,
    lessons,
    active,
    setActive,
    totals,
    generatedCount,
    regenText,
    setRegenText,
    regenBusy,
    onRegenerate,
    onPublish,
  } = props;

  const lesson = lessons[active];

  return (
    <>
      <div className="row" style={{ alignItems: "baseline" }}>
        <div>
          <h1 className="title">{outline.courseTitle}</h1>
          <p className="sub" style={{ marginBottom: 14 }}>
            {generatedCount} lessons generated for {fmtUsd(totals.costUsd)}. Try
            the interactions — they really work. Hover any{" "}
            <span className="mut">“source”</span> tag to see the passage a block
            was grounded in.
          </p>
        </div>
        <div className="spacer" />
        <button className="btn primary" onClick={onPublish}>
          ✓ Publish course
        </button>
      </div>

      <div className="review-grid">
        <nav className="side">
          {outline.modules.map((m) => (
            <div key={m.id}>
              <div className="smod">{m.title}</div>
              {m.lessons.map((l) =>
                lessons[l.id] ? (
                  <button
                    key={l.id}
                    className={`sitem ${active === l.id ? "active" : ""}`}
                    onClick={() => setActive(l.id)}
                  >
                    <span className="dot">●</span>
                    {l.title}
                  </button>
                ) : null,
              )}
            </div>
          ))}
        </nav>

        <main className="lesson-main">
          {lesson ? (
            <>
              <h2>{lesson.title}</h2>
              <div className="lobj">{lesson.objective}</div>
              {lesson.blocks.map((b, i) => (
                <BlockView key={i} block={b} />
              ))}

              <div className="regenbar">
                <input
                  placeholder='Regenerate this lesson: e.g. "simpler language", "add a banking example"'
                  value={regenText}
                  onChange={(e) => setRegenText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onRegenerate(lesson.id);
                  }}
                  disabled={regenBusy}
                />
                <button
                  className="btn sm"
                  onClick={() => onRegenerate(lesson.id)}
                  disabled={regenBusy || !regenText.trim()}
                >
                  {regenBusy ? <span className="spin-inline" /> : "↻"} Regenerate
                </button>
              </div>
            </>
          ) : (
            <p className="mut">Select a lesson.</p>
          )}
        </main>
      </div>
    </>
  );
}

/* ---------------- Blocks ---------------- */
function BlockView({ block }: { block: Block }) {
  if (block.type === "text") {
    return (
      <div className="block">
        {block.heading && (
          <div className="bhead">
            {block.heading}
            <SourceRef text={block.sourceRef} />
          </div>
        )}
        <div className="prose">
          <MarkdownLite text={block.markdown || ""} />
        </div>
        {!block.heading && block.sourceRef && (
          <div style={{ textAlign: "right", marginTop: 4 }}>
            <SourceRef text={block.sourceRef} />
          </div>
        )}
      </div>
    );
  }
  if (block.type === "quiz_check") return <QuizCheck block={block} />;
  if (block.type === "flashcards") return <Flashcards block={block} />;
  if (block.type === "scenario") return <Scenario block={block} />;
  return null;
}

function SourceRef({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <span className="srcref">
      source
      <span className="pop">
        <b>Grounded in source</b>
        {text}
      </span>
    </span>
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
    if (/^\s*[-*]\s+/.test(line)) {
      list.push(line.replace(/^\s*[-*]\s+/, ""));
    } else if (line.trim() === "") {
      flush();
    } else {
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
    if (p.startsWith("**") && p.endsWith("**"))
      return <strong key={i}>{p.slice(2, -2)}</strong>;
    if (p.startsWith("*") && p.endsWith("*") && p.length > 2)
      return <em key={i}>{p.slice(1, -1)}</em>;
    return <span key={i}>{p}</span>;
  });
}

function QuizCheck({ block }: { block: Block }) {
  const [picked, setPicked] = useState<number | null>(null);
  const options = block.options || [];
  const correct = block.correctIndex ?? 0;
  return (
    <div className="block">
      <div className="quiz">
        <div className="q">
          <span className="qtag">Quiz</span>
          <span>{block.question}</span>
          <SourceRef text={block.sourceRef} />
        </div>
        {options.map((o, i) => {
          const cls =
            picked === null
              ? ""
              : i === correct
                ? "correct"
                : i === picked
                  ? "wrong"
                  : "";
          return (
            <button
              key={i}
              className={`opt ${cls}`}
              disabled={picked !== null}
              onClick={() => setPicked(i)}
            >
              {o}
            </button>
          );
        })}
        {picked !== null && block.explanation && (
          <div className="explain">
            {picked === correct ? "✓ Correct. " : "Not quite. "}
            {block.explanation}
          </div>
        )}
      </div>
    </div>
  );
}

function Flashcards({ block }: { block: Block }) {
  return (
    <div className="block">
      <div className="bhead">
        Key terms
        <SourceRef text={block.sourceRef} />
      </div>
      <div className="cards">
        {(block.cards || []).map((c, i) => (
          <FlashcardView key={i} card={c} />
        ))}
      </div>
      <div className="flip-hint">Click a card to flip it.</div>
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

function Scenario({ block }: { block: Block }) {
  const [picked, setPicked] = useState<number | null>(null);
  const choices: ScenarioChoice[] = block.choices || [];
  return (
    <div className="block">
      <div className="bhead">
        Scenario
        <SourceRef text={block.sourceRef} />
      </div>
      <div className="scen">
        <div className="sit">{block.situation}</div>
        {choices.map((c, i) => {
          const isPicked = picked === i;
          const cls = isPicked ? `picked ${c.correct ? "good" : "bad"}` : "";
          return (
            <div key={i}>
              <button
                className={`choice ${cls}`}
                disabled={picked !== null}
                onClick={() => setPicked(i)}
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
    </div>
  );
}

/* ---------------- Published ---------------- */
function Published(props: {
  outline: Outline;
  totals: Totals;
  count: number;
  onReset: () => void;
}) {
  const { outline, totals, count, onReset } = props;
  return (
    <div className="card">
      <div className="published">
        <div className="chk">✓</div>
        <h2>Course published</h2>
        <p className="mut" style={{ maxWidth: 480, margin: "0 auto 20px" }}>
          <b>{outline.courseTitle}</b> — {count} lessons with working
          interactions and exams, generated and reviewed for a total of{" "}
          <span style={{ color: "var(--teal)" }}>{fmtUsd(totals.costUsd)}</span>.
          In production it would now be assignable to learners with verifiable
          certificates.
        </p>
        <button className="btn" onClick={onReset}>
          Generate another course
        </button>
      </div>
    </div>
  );
}
