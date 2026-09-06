"use client";
import { useState } from "react";
import { COLORS, type Color, type Item, type NoteInput } from "@/lib/types";
import Checklist from "./Checklist";

export type Draft = { title: string; content: string; items: Item[]; labels: string[]; reminder: string | null; color: Color; pinned: boolean; isList: boolean };

export const emptyDraft = (): Draft => ({ title: "", content: "", items: [], labels: [], reminder: null, color: "default", pinned: false, isList: false });

export const toInput = (d: Draft): NoteInput => ({
  title: d.title.trim(),
  content: d.isList ? "" : d.content.trim(),
  items: d.isList ? d.items.filter((i) => i.text.trim()) : [],
  labels: d.labels,
  reminder: d.reminder,
  color: d.color,
  pinned: d.pinned,
});

export const isBlank = (d: Draft) => !toInput(d).title && !toInput(d).content && !toInput(d).items!.length;

const iconBtn = "p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 text-base leading-none";

export function ColorPicker({ value, onChange }: { value: Color; onChange: (c: Color) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative">
      <button type="button" className={iconBtn} title="Background color" onClick={() => setOpen(!open)}>🎨</button>
      {open && (
        <div className="absolute z-10 left-0 top-full mt-1 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-2 flex gap-1 flex-wrap w-44" onMouseLeave={() => setOpen(false)}>
          {(Object.keys(COLORS) as Color[]).map((c) => (
            <button
              key={c}
              type="button"
              title={c}
              onClick={() => { onChange(c); setOpen(false); }}
              style={{ background: COLORS[c] }}
              className={`w-7 h-7 rounded-full border-2 ${c === value ? "border-gray-800 dark:border-gray-100" : "border-gray-300 dark:border-gray-600"}`}
            />
          ))}
        </div>
      )}
    </span>
  );
}

export function PinButton({ pinned, onToggle }: { pinned: boolean; onToggle: () => void }) {
  return (
    <button type="button" className={`${iconBtn} ${pinned ? "opacity-100" : "opacity-60"}`} title={pinned ? "Unpin" : "Pin"} onClick={onToggle}>
      {pinned ? "📌" : "📍"}
    </button>
  );
}

/** Editable fields shared by composer and in-place card editing. */
export function DraftFields({ draft, onChange, autoFocusBody }: { draft: Draft; onChange: (d: Draft) => void; autoFocusBody?: boolean }) {
  const set = (patch: Partial<Draft>) => onChange({ ...draft, ...patch });
  return (
    <>
      <input
        value={draft.title}
        onChange={(e) => set({ title: e.target.value })}
        placeholder="Title"
        className="w-full bg-transparent outline-none font-medium text-base mb-2"
      />
      {draft.isList ? (
        <Checklist items={draft.items} editable onChange={(items) => set({ items })} />
      ) : (
        <textarea
          value={draft.content}
          autoFocus={autoFocusBody}
          onChange={(e) => set({ content: e.target.value })}
          placeholder="Take a note…"
          rows={Math.max(2, draft.content.split("\n").length)}
          className="w-full bg-transparent outline-none text-sm resize-none"
        />
      )}
      <LabelEditor labels={draft.labels} onChange={(labels) => set({ labels })} />
      <ReminderInput value={draft.reminder} onChange={(reminder) => set({ reminder })} />
    </>
  );
}

export function ListToggle({ draft, onChange }: { draft: Draft; onChange: (d: Draft) => void }) {
  const toList = () =>
    onChange({
      ...draft,
      isList: true,
      items: draft.items.length ? draft.items : draft.content.split("\n").filter(Boolean).map((text) => ({ text, done: false })),
    });
  const toText = () =>
    onChange({ ...draft, isList: false, content: draft.content || draft.items.map((i) => i.text).join("\n") });
  return (
    <button type="button" className={iconBtn} title={draft.isList ? "Plain text" : "Checklist"} onClick={draft.isList ? toText : toList}>
      {draft.isList ? "📝" : "☑️"}
    </button>
  );
}

export const chip = "inline-flex items-center gap-1 rounded-full bg-black/10 dark:bg-white/15 px-2 py-0.5 text-xs";

export function LabelEditor({ labels, onChange }: { labels: string[]; onChange: (labels: string[]) => void }) {
  const [text, setText] = useState("");
  const add = () => {
    const l = text.trim();
    if (l && !labels.includes(l)) onChange([...labels, l]);
    setText("");
  };
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1">
      {labels.map((l) => (
        <span key={l} className={chip}>
          {l}
          <button type="button" onClick={() => onChange(labels.filter((x) => x !== l))} className="hover:text-red-600" aria-label={`Remove label ${l}`}>×</button>
        </span>
      ))}
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); }
          if (e.key === "Backspace" && !text && labels.length) onChange(labels.slice(0, -1));
        }}
        placeholder="Add label"
        className="bg-transparent outline-none text-xs min-w-20 flex-1"
      />
    </div>
  );
}

// datetime-local wants local "YYYY-MM-DDTHH:mm"; we store ISO (UTC).
const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
export const fmtReminder = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
export const isOverdue = (iso: string) => new Date(iso).getTime() < Date.now();

export function ReminderInput({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  return (
    <div className="mt-2 flex items-center gap-1 text-xs">
      <span title="Reminder">⏰</span>
      <input
        type="datetime-local"
        value={value ? toLocalInput(value) : ""}
        onChange={(e) => {
          if (e.target.value && typeof Notification !== "undefined" && Notification.permission === "default") Notification.requestPermission();
          onChange(e.target.value ? new Date(e.target.value).toISOString() : null);
        }}
        className="bg-transparent outline-none"
      />
      {value && <button type="button" onClick={() => onChange(null)} className="px-1 hover:text-red-600" aria-label="Clear reminder">×</button>}
    </div>
  );
}
