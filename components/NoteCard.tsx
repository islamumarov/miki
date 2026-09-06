"use client";
import { useRef, useState } from "react";
import { COLORS, type Note, type NoteInput } from "@/lib/types";
import Checklist from "./Checklist";
import { ColorPicker, DraftFields, ListToggle, PinButton, chip, fmtReminder, isBlank, isOverdue, toInput, type Draft } from "./NoteEditor";

type Props = { note: Note; onUpdate: (patch: NoteInput) => void; onDelete: () => void };

const iconBtn = "p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 text-base leading-none";

export default function NoteCard({ note, onUpdate, onDelete }: Props) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const startEdit = () =>
    setDraft({ title: note.title, content: note.content, items: note.items, labels: note.labels, reminder: note.reminder, color: note.color, pinned: note.pinned, isList: note.items.length > 0 });

  const commit = () => {
    if (!draft) return;
    if (isBlank(draft)) onDelete();
    else onUpdate(toInput(draft));
    setDraft(null);
  };

  const onBlur = (e: React.FocusEvent) => {
    if (draft && !ref.current?.contains(e.relatedTarget as Node)) commit();
  };

  return (
    <div
      ref={ref}
      tabIndex={-1}
      onBlur={onBlur}
      style={{ background: COLORS[draft?.color ?? note.color] }}
      className={`break-inside-avoid mb-4 rounded-lg border border-gray-300 dark:border-gray-600 p-3 shadow-sm hover:shadow-md group relative ${draft ? "ring-2 ring-gray-400 dark:ring-gray-500" : "cursor-default"}`}
    >
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100">
        <PinButton pinned={draft?.pinned ?? note.pinned} onToggle={() => (draft ? setDraft({ ...draft, pinned: !draft.pinned }) : onUpdate({ pinned: !note.pinned }))} />
      </div>

      {draft ? (
        <DraftFields draft={draft} onChange={setDraft} />
      ) : (
        <div onClick={startEdit} className="min-h-6 pr-8">
          {note.title && <div className="font-medium text-base mb-2 break-words">{note.title}</div>}
          {note.items.length ? (
            <Checklist items={note.items} editable={false} onChange={(items) => onUpdate({ items })} />
          ) : (
            <div className="text-sm whitespace-pre-wrap break-words">{note.content}</div>
          )}
          {note.reminder && (
            <div className="mt-2">
              <span className={`${chip} ${isOverdue(note.reminder) ? "text-red-700 dark:text-red-300 bg-red-500/20" : ""}`}>⏰ {fmtReminder(note.reminder)}</span>
            </div>
          )}
          {note.labels.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {note.labels.map((l) => <span key={l} className={chip}>{l}</span>)}
            </div>
          )}
        </div>
      )}

      <div className="mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100">
        <ColorPicker value={draft?.color ?? note.color} onChange={(color) => (draft ? setDraft({ ...draft, color }) : onUpdate({ color }))} />
        {draft && <ListToggle draft={draft} onChange={setDraft} />}
        <button type="button" className={iconBtn} title={note.archived ? "Unarchive" : "Archive"} onClick={() => onUpdate({ archived: !note.archived })}>
          {note.archived ? "📤" : "📥"}
        </button>
        <button type="button" className={iconBtn} title="Delete" onClick={onDelete}>🗑️</button>
        {draft && <button type="button" onClick={commit} className="ml-auto text-sm px-3 py-1 rounded hover:bg-black/10 dark:hover:bg-white/10">Close</button>}
      </div>
    </div>
  );
}
