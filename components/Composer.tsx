"use client";
import { useRef, useState } from "react";
import { COLORS, type NoteInput } from "@/lib/types";
import { ColorPicker, DraftFields, ListToggle, PinButton, emptyDraft, isBlank, toInput, useOutside, type Draft } from "./NoteEditor";

export default function Composer({ onCreate }: { onCreate: (input: NoteInput) => void }) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const close = () => {
    if (draft && !isBlank(draft)) onCreate(toInput(draft));
    setDraft(null);
  };
  // Pointer/touch: close on tap outside. Keyboard: close when focus leaves (onBlur below).
  useOutside(ref, !!draft, close);

  if (!draft) {
    return (
      <div className="max-w-xl mx-auto my-4 sm:my-6 flex items-center rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-[#202124] shadow-md px-3 sm:px-4 py-1 sm:py-2">
        <input readOnly placeholder="Take a note…" aria-label="Take a note" onFocus={() => setDraft(emptyDraft())} className="flex-1 min-w-0 outline-none text-sm py-2 bg-transparent" />
        <button
          type="button"
          title="New list"
          aria-label="New list"
          onClick={() => setDraft({ ...emptyDraft(), isList: true, items: [{ text: "", done: false }] })}
          className="inline-flex items-center justify-center size-10 shrink-0 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
        >
          ☑️
        </button>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      tabIndex={-1}
      onBlur={(e) => { if (e.relatedTarget && !ref.current?.contains(e.relatedTarget as Node)) close(); }}
      data-editing=""
      style={{ background: COLORS[draft.color] }}
      className="max-w-xl mx-auto my-4 sm:my-6 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-[#202124] shadow-md p-3 relative"
    >
      <div className="absolute top-1 right-1">
        <PinButton pinned={draft.pinned} onToggle={() => setDraft({ ...draft, pinned: !draft.pinned })} />
      </div>
      <DraftFields draft={draft} onChange={setDraft} autoFocusBody={!draft.isList} />
      <div className="mt-2 flex flex-wrap items-center gap-1">
        <ColorPicker value={draft.color} onChange={(color) => setDraft({ ...draft, color })} />
        <ListToggle draft={draft} onChange={setDraft} />
        <button type="button" onClick={close} className="ml-auto text-sm px-3 py-2 rounded hover:bg-black/10 dark:hover:bg-white/10">Close</button>
      </div>
    </div>
  );
}
