"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getSavedForms,
  saveFormEntry,
  removeSavedForm,
  type SavedForm,
} from "@/lib/local-store";
import { EmptyState } from "@/components/empty-state";

export default function SavedFormsPage() {
  const [forms, setForms] = useState<SavedForm[]>([]);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refresh = () => setForms(getSavedForms());

  useEffect(() => {
    refresh();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/parse-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to parse");

      saveFormEntry({
        url: url.trim(),
        title: data.data.title,
        questionCount: data.data.questions.length,
      });
      setUrl("");
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save form");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur p-5 md:p-6">
        <h1 className="text-lg font-semibold text-white">Saved forms</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Bookmark Google Forms you use often — one tap to start a new voice session.
        </p>

        <form onSubmit={handleSave} className="mt-4 flex flex-col sm:flex-row gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://docs.google.com/forms/..."
            className="flex-1 rounded-xl border border-white/10 bg-zinc-950/60 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-zinc-950 hover:bg-amber-400 disabled:opacity-50 transition shrink-0"
          >
            {loading ? "Parsing…" : "Save form"}
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      </div>

      {forms.length === 0 ? (
        <EmptyState
          title="No saved forms"
          description="Paste a Google Form URL above to parse and save it for quick access later."
          actionLabel="Start a call instead"
          actionHref="/new-call"
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {forms.map((f) => (
            <li
              key={f.id}
              className="rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur p-4 flex flex-col hover-lift transition"
            >
              <p className="font-semibold text-white line-clamp-2">{f.title}</p>
              <p className="text-xs text-zinc-500 mt-1">{f.questionCount} questions</p>
              <p className="text-[10px] text-zinc-600 mt-2 font-mono truncate">{f.url}</p>
              <div className="mt-auto pt-4 flex gap-2">
                <Link
                  href={`/?url=${encodeURIComponent(f.url)}`}
                  className="flex-1 text-center rounded-lg bg-rose-600 py-2 text-xs font-semibold text-white hover:bg-rose-500 transition"
                >
                  Voice fill
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    removeSavedForm(f.id);
                    refresh();
                  }}
                  className="rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-400 hover:text-red-300 hover:border-red-500/30 transition"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
