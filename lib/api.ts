import type { Note, NoteInput } from "./types";
import { local } from "./local";

const json = (body: unknown) => ({ headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

async function ok<T>(p: Promise<Response>): Promise<T> {
  const r = await p;
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.status === 204 ? (undefined as T) : r.json();
}

const remote = {
  list: (archived: boolean, q: string) =>
    ok<Note[]>(fetch(`/api/notes?archived=${archived ? 1 : 0}&q=${encodeURIComponent(q)}`)),
  create: (input: NoteInput) => ok<Note>(fetch("/api/notes", { method: "POST", ...json(input) })),
  update: (id: number, input: NoteInput) => ok<Note>(fetch(`/api/notes/${id}`, { method: "PATCH", ...json(input) })),
  remove: (id: number) => ok<void>(fetch(`/api/notes/${id}`, { method: "DELETE" })),
};

// Android build (NEXT_PUBLIC_STORAGE=local) stores notes on-device; web build talks to the Next.js API.
export const api: typeof remote = process.env.NEXT_PUBLIC_STORAGE === "local" ? local : remote;
