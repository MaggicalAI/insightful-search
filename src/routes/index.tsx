import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Loader2, Paperclip, Send } from "lucide-react";

type DocState = {
  name: string;
  size: number;
  chunks: number;
};

type Result = {
  chunk: string;
  index: number;
  page?: number;
  score: number;
};

type Message = {
  id: number;
  role: "user" | "assistant";
  text: string;
  score?: number;
  chunkIndex?: number;
  page?: number;
  error?: boolean;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8001";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Insightful - chat with your documents" },
      {
        name: "description",
        content:
          "Drop in a document, then ask questions in a conversation. Insightful surfaces the most relevant passage with a confidence score.",
      },
      { property: "og:title", content: "Insightful" },
      {
        property: "og:description",
        content:
          "Drop in a document, then ask questions in a conversation. Insightful surfaces the most relevant passage with a confidence score.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SemanticSearch,
});

function SemanticSearch() {
  const [doc, setDoc] = useState<DocState | null>(null);
  const [indexing, setIndexing] = useState(false);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);

  const nextId = () => ++idRef.current;

  // Keep the thread scrolled to the newest message.
  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, indexing]);

  const ingest = useCallback(async (file: globalThis.File) => {
    setIndexing(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${API_BASE_URL}/index`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to index document.");
      }
      setDoc({ name: data.filename, size: file.size, chunks: data.chunks });
      setMessages([]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          id: nextId(),
          role: "assistant",
          text:
            err instanceof Error
              ? err.message
              : "Could not index that document. Is the backend running?",
          error: true,
        },
      ]);
    } finally {
      setIndexing(false);
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) ingest(file);
    },
    [ingest],
  );

  const runSearch = async () => {
    const q = question.trim();
    if (!q || !doc || busy) return;
    setQuestion("");
    setBusy(true);
    const userMsg: Message = { id: nextId(), role: "user", text: q };
    setMessages((m) => [...m, userMsg]);
    try {
      const res = await fetch(`${API_BASE_URL}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Search failed.");
      }
      const result = data as Result;
      setMessages((m) => [
        ...m,
        {
          id: nextId(),
          role: "assistant",
          text: result.chunk,
          score: result.score,
          chunkIndex: result.index,
          page: result.page,
        },
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          id: nextId(),
          role: "assistant",
          text: err instanceof Error ? err.message : "Something went wrong while searching.",
          error: true,
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const fileExt = doc?.name.split(".").pop()?.toUpperCase();

  return (
    <main className="app-shell mx-auto flex h-screen max-w-5xl flex-col px-4 sm:px-8">
      {/* Thread */}
      <div
        ref={threadRef}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className="chat-thread flex-1 overflow-y-auto py-8 sm:py-10"
      >
        {!doc && messages.length === 0 && (
          <div className="mx-auto flex min-h-full max-w-2xl flex-col items-center justify-center text-center">
            <h1 className="font-display text-3xl font-medium tracking-[-0.035em] text-ink sm:text-4xl">
              Ask about your document.
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-ink-soft">
              Upload a PDF or text file, then ask a question to find the right passage.
            </p>
          </div>
        )}

        {messages.length > 0 && (
          <div className="flex flex-col gap-4">
            {messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="flex justify-end">
                  <div className="bubble-user max-w-[80%] px-4 py-3 text-[15px] leading-relaxed">
                    {m.text}
                  </div>
                </div>
              ) : (
                <div key={m.id} className="flex justify-start">
                  <div className="answer-card max-w-[88%] px-5 py-4 sm:px-6 sm:py-5">
                    {m.error ? (
                      <p className="text-[15px] leading-relaxed text-coral">{m.text}</p>
                    ) : (
                      <>
                        <div className="mb-3 text-xs font-medium text-ink-faint">
                          Source passage
                        </div>
                        <p className="text-[15px] leading-relaxed text-ink/85">{m.text}</p>
                        {typeof m.score === "number" && (
                          <div className="mt-3 flex items-center gap-3">
                            <span className="font-display text-sm font-semibold tabular-nums text-ink">
                              {(m.score * 100).toFixed(0)}% match
                            </span>
                            <div className="h-1 flex-1 overflow-hidden rounded-full bg-line">
                              <div
                                className="score-fill h-full rounded-full transition-all duration-700"
                                style={{ width: `${Math.round(m.score * 100)}%` }}
                              />
                            </div>
                            <span className="shrink-0 text-xs text-ink-faint">
                              {typeof m.page === "number"
                                ? `page ${m.page}`
                                : typeof m.chunkIndex === "number"
                                  ? `passage ${m.chunkIndex + 1}`
                                  : "confidence"}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ),
            )}
          </div>
        )}

        {indexing && (
          <div className="flex items-center gap-2 py-2 text-sm text-ink-faint">
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
            Indexing document...
          </div>
        )}

        {busy && (
          <div className="flex justify-start">
            <div className="answer-card flex items-center gap-1.5 px-5 py-4">
              <span className="h-2 w-2 animate-bounce rounded-full bg-ink-faint/50" />
              <span
                className="h-2 w-2 animate-bounce rounded-full bg-ink-faint/50"
                style={{ animationDelay: "0.12s" }}
              />
              <span
                className="h-2 w-2 animate-bounce rounded-full bg-ink-faint/50"
                style={{ animationDelay: "0.24s" }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="composer-wrap py-4 sm:py-5">
        <div className="composer grad-ring-soft flex items-center gap-2 rounded-2xl p-2.5">
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
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={indexing}
            aria-label="Attach a document"
            title={doc ? "Replace document" : "Attach a document"}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-ink-soft transition-colors hover:bg-zinc-100 hover:text-ink disabled:cursor-wait disabled:opacity-40"
          >
            {indexing ? (
              <Loader2 className="h-5 w-5 animate-spin" strokeWidth={1.8} />
            ) : doc ? (
              <Check className="h-5 w-5 text-green-600" strokeWidth={2} />
            ) : (
              <Paperclip className="h-5 w-5" strokeWidth={1.8} />
            )}
          </button>

          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
            placeholder={
              doc ? "Ask a question about your document..." : "Attach a document to start"
            }
            className="min-w-0 flex-1 bg-transparent px-1 text-[15px] text-ink outline-none placeholder:text-ink-faint"
            disabled={!doc}
          />

          <button
            type="button"
            onClick={runSearch}
            disabled={!doc || !question.trim() || busy}
            aria-label="Send"
            className="send-button flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#3a3638] text-white transition-all hover:bg-[#2f2b2d] disabled:cursor-not-allowed disabled:opacity-30 active:scale-95"
          >
            <Send className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
        {doc && (
          <p className="mt-2 flex items-center justify-between px-1 text-xs text-ink-faint">
            {doc.name} - {doc.chunks} indexed passages
            <span className="hidden sm:inline">Press Enter to search</span>
          </p>
        )}
      </div>
    </main>
  );
}
