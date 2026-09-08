import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useRef, useState } from "react";

type DocState = {
  name: string;
  size: number;
  chunks: string[];
};

type Result = {
  chunk: string;
  index: number;
  score: number;
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "Semantic Search — find answers in your documents",
      },
      {
        name: "description",
        content:
          "Upload a document and ask a question. See the most relevant passage and its similarity score.",
      },
      { property: "og:title", content: "Semantic Search" },
      {
        property: "og:description",
        content:
          "Upload a document and ask a question. See the most relevant passage and its similarity score.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SemanticSearch,
});

const STOP = new Set([
  "the","a","an","and","or","but","of","to","in","on","for","is","are","was","were",
  "be","been","being","it","this","that","with","as","at","by","from","into","your",
  "you","i","what","how","why","when","which","do","does","did","can","could","will",
  "would","should","not","no","yes","if","then","than","so","such","also","about",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

// Split raw text into ~chunkSize-char passages on sentence / word boundaries.
function makeChunks(text: string, chunkSize = 320): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const sentences = clean.match(/[^.!?]+[.!?]+|\S[^.!?]*$/g) ?? [clean];
  const chunks: string[] = [];
  let buf = "";
  for (const s of sentences) {
    const piece = s.trim();
    if ((buf + " " + piece).trim().length > chunkSize && buf) {
      chunks.push(buf.trim());
      buf = piece;
    } else {
      buf = (buf + " " + piece).trim();
    }
  }
  if (buf.trim()) chunks.push(buf.trim());
  return chunks;
}

// Mock cosine-like similarity from term overlap.
function similarity(query: string, chunk: string): number {
  const a = tokenize(query);
  const b = tokenize(chunk);
  if (!a.length || !b.length) return 0;
  const sb = new Set(b);
  const shared = a.filter((w) => sb.has(w)).length;
  const raw = shared / Math.sqrt(a.length * b.length);
  // gentle curve so partial overlap still reads as a plausible score
  return Math.round((0.35 + raw * 0.65) * 100) / 100;
}

function SemanticSearch() {
  const [doc, setDoc] = useState<DocState | null>(null);
  const [question, setQuestion] = useState("");
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const ingest = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      const isText =
        file.type === "text/plain" ||
        file.name.toLowerCase().endsWith(".txt");
      const chunks = isText && text.trim()
        ? makeChunks(text)
        : makeChunks(MOCK_PASSAGE.repeat(Math.max(1, Math.ceil(file.size / 900))));
      setDoc({ name: file.name, size: file.size, chunks });
      setResult(null);
    };
    reader.readAsText(file);
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) ingest(file);
  };

  const runSearch = () => {
    if (!doc || !question.trim()) return;
    setSearching(true);
    setResult(null);
    // mock latency
    setTimeout(() => {
      let best: Result | null = null;
      doc.chunks.forEach((chunk, index) => {
        const score = similarity(question, chunk);
        if (!best || score > best.score) best = { chunk, index, score };
      });
      setResult(best);
      setSearching(false);
    }, 420);
  };

  const scoreLabel = (s: number) =>
    s >= 0.85 ? "high" : s >= 0.6 ? "medium" : "low";

  return (
    <main className="min-h-screen px-6 py-14 sm:py-20">
      <div className="mx-auto w-full max-w-2xl">
        {/* Wordmark */}
        <header className="mb-14 flex items-center justify-between">
          <h1 className="font-display text-2xl text-ink">
            semantic<span className="text-coral">.</span>search
          </h1>
          <span className="font-sans text-[11px] uppercase tracking-[0.18em] text-ink-soft">
            mock · client-side
          </span>
        </header>

        {/* Upload */}
        <section
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={[
            "relative mb-8 rounded-2xl border border-dashed p-7 transition-colors",
            dragging ? "border-coral/70 bg-coral/5" : "border-line bg-white/40",
          ].join(" ")}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.txt,text/plain,application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) ingest(f);
            }}
          />
          {!doc ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex w-full flex-col items-center gap-2 text-center"
            >
              <span className="font-display text-2xl text-ink">
                drop a document
              </span>
              <span className="font-sans text-sm text-ink-soft">
                PDF or TXT · or click to browse
              </span>
            </button>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate font-display text-xl text-ink">
                  {doc.name}
                </p>
                <p className="mt-0.5 font-sans text-sm text-ink-soft">
                  {doc.chunks.length} chunks indexed ·{" "}
                  {(doc.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="shrink-0 font-sans text-sm text-ink-soft underline-offset-4 hover:text-coral hover:underline"
              >
                replace
              </button>
            </div>
          )}
        </section>

        {/* Question */}
        <section className="mb-8">
          <label className="mb-2 block font-sans text-[11px] uppercase tracking-[0.18em] text-ink-soft">
            ask a question
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSearch()}
              placeholder="What is this document about?"
              className="flex-1 rounded-xl border border-line bg-white/50 px-4 py-3 font-sans text-base text-ink placeholder:text-ink-soft/60 focus:border-coral/50 focus:outline-none focus:ring-2 focus:ring-coral/15"
            />
            <button
              type="button"
              onClick={runSearch}
              disabled={!doc || !question.trim() || searching}
              className="btn-gradient rounded-xl px-6 py-3 font-sans text-sm font-medium text-white shadow-sm transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            >
              {searching ? "searching…" : "search"}
            </button>
          </div>
        </section>

        {/* Result */}
        {result && (
          <section className="fade-rise rounded-2xl border border-line bg-white/55 p-6">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-sans text-[11px] uppercase tracking-[0.18em] text-ink-soft">
                most relevant · chunk {result.index + 1}
              </span>
              <span className="flex items-baseline gap-2">
                <span className="font-display text-2xl text-ink">
                  {result.score.toFixed(2)}
                </span>
                <span className="font-sans text-[11px] uppercase tracking-[0.18em] text-ink-soft">
                  {scoreLabel(result.score)} match
                </span>
              </span>
            </div>
            <div className="mb-4 h-1 overflow-hidden rounded-full bg-line">
              <div
                className="btn-gradient h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.round(result.score * 100)}%` }}
              />
            </div>
            <p className="font-sans text-[15px] leading-relaxed text-ink">
              {result.chunk}
            </p>
          </section>
        )}

        {!result && doc && !searching && (
          <p className="text-center font-sans text-sm text-ink-soft">
            type a question and press search.
          </p>
        )}

        <footer className="mt-16 text-center font-sans text-[11px] uppercase tracking-[0.18em] text-ink-soft/70">
          demo interface · no data leaves your browser
        </footer>
      </div>
    </main>
  );
}

const MOCK_PASSAGE =
  "Semantic search ranks passages by meaning rather than keyword match. " +
  "Documents are split into overlapping chunks, each turned into a vector embedding. " +
  "When you ask a question, it is embedded the same way and compared to every chunk. " +
  "The closest chunk by cosine similarity is returned as the answer, with its score. ";
