"use client";
import type { Item } from "@/lib/types";

type Props = { items: Item[]; onChange: (items: Item[]) => void; editable: boolean };

export default function Checklist({ items, onChange, editable }: Props) {
  const set = (i: number, patch: Partial<Item>) => onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  const remove = (i: number) => onChange(items.filter((_, j) => j !== i));
  const add = () => onChange([...items, { text: "", done: false }]);

  return (
    <ul className="space-y-1">
      {items.map((it, i) => (
        <li key={i} className="flex items-center gap-2 group/item">
          <input
            type="checkbox"
            checked={it.done}
            onChange={(e) => set(i, { done: e.target.checked })}
            onClick={(e) => e.stopPropagation()}
            className="accent-gray-600"
          />
          {editable ? (
            <input
              value={it.text}
              autoFocus={it.text === ""}
              placeholder="List item"
              onChange={(e) => set(i, { text: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); add(); }
                if (e.key === "Backspace" && it.text === "") { e.preventDefault(); remove(i); }
              }}
              className={`flex-1 bg-transparent outline-none text-sm ${it.done ? "line-through text-gray-400 dark:text-gray-500" : ""}`}
            />
          ) : (
            <span className={`flex-1 text-sm ${it.done ? "line-through text-gray-400 dark:text-gray-500" : ""}`}>{it.text}</span>
          )}
          {editable && (
            <button type="button" onClick={() => remove(i)} className="opacity-0 group-hover/item:opacity-100 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-1" aria-label="Remove item">×</button>
          )}
        </li>
      ))}
      {editable && (
        <li>
          <button type="button" onClick={add} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 pl-6">+ List item</button>
        </li>
      )}
    </ul>
  );
}
