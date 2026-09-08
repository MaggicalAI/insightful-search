import { createFileRoute } from "@tanstack/react-router";
import type { DragEvent } from "react";
import { useCallback, useRef, useState } from "react";
import { File as FileIcon } from "lucide-react";

type DocState = {
  name: string;
  size: number;
  chunks: number;
};

type Result = {
  chunk: string;
  index: number;
  score: number;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "Semantic Search - find answers in your documents",
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

function SemanticSearch() {
  const [doc, setDoc] = useState<DocState | null>(null);
  const [question, setQuestion] = useState("");
  const [indexing, setIndexing] = useState(false);
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const ingest = useCallback(async (file: globalThis.File) => {
    setIndexing(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_BASE_URL}/index`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to index document.");
      }

      setDoc({ name: data.filename, size: file.size, chunks: data.chunks });
    } catch (err) {
      setDoc(null);
      setError(err instanceof Error ? err.message : "Failed to index document.");
    } finally {
      setIndexing(false);
    }
  }, []);

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) ingest(file);
  };

  const runSearch = async () => {
    if (!doc || !question.trim()) return;

    setSearching(true);
    setResult(null);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Search failed.");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed.");
    } finally {
      setSearching(false);
    }
  };

  const scoreLabel = (score: number) =>
    score >= 0.85 ? "high" : score >= 0.6 ? "medium" : "low";

  return (
    <main className="min-h-screen px-6 py-14 sm:py-20">
      <div className="mx-auto w-full max-w-2xl">
        <section
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={[
            "grad-border relative mb-8 rounded-2xl p-7 transition-shadow",
            dragging ? "ring-2 ring-coral/25" : "",
          ].join(" ")}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.txt,text/plain,application/pdf"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) ingest(file);
            }}
          />
          {!doc ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={indexing}
              className="flex w-full flex-col items-center gap-2 text-center disabled:cursor-wait"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-white/70">
                <FileIcon className="h-5 w-5 text-ink-soft" strokeWidth={1.5} />
              </span>
              <span className="font-display text-2xl text-ink">
                {indexing ? "Indexing document" : "Drop a PDF or text file"}
              </span>
              <span className="font-sans text-sm text-ink-soft">
                {indexing ? "creating embeddings" : "or click to browse"}
              </span>
            </button>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate font-display text-xl text-ink">{doc.name}</p>
                <p className="mt-0.5 font-sans text-sm text-ink-soft">
                  {doc.chunks} chunks indexed - {(doc.size / 1024).toFixed(1)} KB
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

        <section className="mb-8">
          <label
            htmlFor="search-input"
            className="mb-2 block font-sans text-[11px] uppercase tracking-[0.18em] text-ink-soft"
          >
            Ask a question
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              id="search-input"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && runSearch()}
              placeholder="What is this document about?"
              className="flex-1 rounded-xl border border-line bg-white/50 px-4 py-3 font-sans text-base text-ink placeholder:text-ink-soft/60 focus:border-coral/50 focus:outline-none focus:ring-2 focus:ring-coral/15"
            />
            <button
              type="button"
              onClick={runSearch}
              disabled={!doc || !question.trim() || searching || indexing}
              className="btn-gradient rounded-xl px-6 py-3 font-sans text-sm font-medium text-white shadow-sm transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            >
              {searching ? "searching..." : "search"}
            </button>
          </div>
        </section>

        {error && (
          <p className="mb-8 rounded-xl border border-coral/20 bg-white/60 px-4 py-3 font-sans text-sm text-coral">
            {error}
          </p>
        )}

        {result && (
          <section className="fade-rise rounded-2xl border border-line bg-white/55 p-6">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-sans text-[11px] uppercase tracking-[0.18em] text-ink-soft">
                Most relevant - chunk {result.index + 1}
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
                className="h-full rounded-full bg-coral/55 transition-all duration-500"
                style={{ width: `${Math.round(result.score * 100)}%` }}
              />
            </div>
            <p className="font-sans text-[15px] leading-relaxed text-ink">{result.chunk}</p>
          </section>
        )}

        {!result && doc && !searching && !error && (
          <p className="text-center font-sans text-sm text-ink-soft">
            Type a question and press search.
          </p>
        )}
      </div>
    </main>
  );
}
