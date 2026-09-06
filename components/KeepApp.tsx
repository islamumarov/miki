"use client";
import { useCallback, useEffect, useState } from "react";
import type { Note, NoteInput } from "@/lib/types";
import { api } from "@/lib/api";
import Composer from "./Composer";
import NoteCard from "./NoteCard";

const toggleTheme = () => {
  const dark = document.documentElement.classList.toggle("dark");
  try { localStorage.theme = dark ? "dark" : "light"; } catch {}
};

export default function KeepApp() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [view, setView] = useState<"notes" | "archive" | "reminders">("notes");
  const archived = view === "archive";
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [label, setLabel] = useState("");

  const refresh = useCallback(() => api.list(archived, q).then(setNotes).catch((e) => setError(String(e))), [archived, q]);

  useEffect(() => {
    const t = setTimeout(refresh, q ? 200 : 0);
    return () => clearTimeout(t);
  }, [refresh, q]);

  // Optimistic: apply locally, call API, refetch on failure.
  const run = (local: (ns: Note[]) => Note[], remote: () => Promise<unknown>) => {
    setNotes(local);
    remote().then(refresh).catch((e) => { setError(String(e)); refresh(); });
  };

  const create = (input: NoteInput) =>
    run(
      (ns) => [{ id: -Date.now(), title: "", content: "", items: [], labels: [], reminder: null, color: "default", pinned: false, archived: false, created_at: "", updated_at: "", ...input }, ...ns],
      () => api.create(archived ? { ...input, archived: true } : input),
    );
  const update = (id: number, patch: NoteInput) =>
    run((ns) => ns.map((n) => (n.id === id ? { ...n, ...patch } : n)).filter((n) => !!n.archived === archived), () => api.update(id, patch));
  const remove = (id: number) => run((ns) => ns.filter((n) => n.id !== id), () => api.remove(id));

  // Fire a browser notification once per note when its reminder comes due while the page is open.
  useEffect(() => {
    const tick = () => {
      if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
      let done: number[] = [];
      try { done = JSON.parse(localStorage.notified ?? "[]"); } catch {}
      for (const n of notes) {
        if (n.reminder && n.id > 0 && !done.includes(n.id) && new Date(n.reminder).getTime() <= Date.now()) {
          new Notification(n.title || "Reminder", { body: n.content || n.items.map((i) => i.text).join(", ") });
          done.push(n.id);
        }
      }
      try { localStorage.notified = JSON.stringify(done); } catch {}
    };
    tick();
    const t = setInterval(tick, 30000);
    return () => clearInterval(t);
  }, [notes]);

  const allLabels = [...new Set(notes.flatMap((n) => n.labels))].sort();
  const byLabel = label ? notes.filter((n) => n.labels.includes(label)) : notes;
  const shown = view === "reminders" ? byLabel.filter((n) => n.reminder).sort((a, b) => a.reminder!.localeCompare(b.reminder!)) : byLabel;
  const pinned = shown.filter((n) => n.pinned);
  const others = shown.filter((n) => !n.pinned);

  const grid = (list: Note[]) => (
    <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4">
      {list.map((n) => (
        <NoteCard key={n.id} note={n} onUpdate={(p) => update(n.id, p)} onDelete={() => remove(n.id)} />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 bg-white/95 dark:bg-[#202124]/95 backdrop-blur border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center gap-4">
        <span className="text-xl font-medium text-gray-700 dark:text-gray-200">Keep</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search"
          className="flex-1 max-w-2xl bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2 outline-none focus:bg-white dark:focus:bg-gray-700 focus:shadow"
        />
        <nav className="flex gap-1 text-sm">
          {([["Notes", "notes"], ["Reminders", "reminders"], ["Archive", "archive"]] as const).map(([label, v]) => (
            <button key={v} onClick={() => setView(v)} className={`px-3 py-1 rounded-full ${view === v ? "bg-amber-100 dark:bg-amber-900/50 font-medium" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}>
              {label}
            </button>
          ))}
        </nav>
        <button
          type="button"
          title="Toggle dark theme"
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          🌗
        </button>
      </header>

      {allLabels.length > 0 && (
        <div className="px-4 pt-3 flex flex-wrap gap-2 text-sm">
          {allLabels.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLabel(label === l ? "" : l)}
              className={`px-3 py-1 rounded-full border border-gray-300 dark:border-gray-600 ${label === l ? "bg-amber-100 dark:bg-amber-900/50 font-medium" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
            >
              {l}
            </button>
          ))}
        </div>
      )}
      <main className="px-4 pb-10">
        <Composer onCreate={create} />
        {error && (
          <div className="max-w-xl mx-auto mb-4 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950 rounded p-2 flex justify-between">
            <span>{error}</span><button onClick={() => setError("")}>×</button>
          </div>
        )}
        {pinned.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Pinned</h2>
            {grid(pinned)}
          </section>
        )}
        {pinned.length > 0 && others.length > 0 && <h2 className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Others</h2>}
        {grid(others)}
        {shown.length === 0 && <p className="text-center text-gray-400 dark:text-gray-500 mt-16">{q || label ? "No matching notes" : archived ? "Archived notes appear here" : view === "reminders" ? "Notes with upcoming reminders appear here" : "Notes you add appear here"}</p>}
      </main>
    </div>
  );
}
