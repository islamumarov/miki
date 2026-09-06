// On-device storage for the Android build. Same shape as the remote `api` in ./api.ts.
import type { Note, NoteInput } from "./types.ts";

const KEY = "notes";

// ponytail: localStorage (~5MB) holds thousands of notes; swap for @capacitor-community/sqlite if it ever fills.
const load = (): Note[] => {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
};
const save = (ns: Note[]) => localStorage.setItem(KEY, JSON.stringify(ns));

// Mirrors parseNoteInput's label cleanup in db.ts.
const normalize = (i: NoteInput): NoteInput =>
  i.labels ? { ...i, labels: [...new Set(i.labels.map((l) => l.trim()).filter(Boolean))] } : i;

// Mirrors the LIKE search in listNotes: case-insensitive substring over title, content, items, labels.
const matches = (n: Note, q: string) =>
  q === "" || [n.title, n.content, JSON.stringify(n.items), JSON.stringify(n.labels)].some((s) => s.toLowerCase().includes(q.toLowerCase()));

export const local = {
  list: async (archived: boolean, q: string): Promise<Note[]> =>
    load()
      .filter((n) => n.archived === archived && matches(n, q))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updated_at.localeCompare(a.updated_at) || b.id - a.id),

  create: async (input: NoteInput): Promise<Note> => {
    const ns = load();
    const now = new Date().toISOString();
    const n: Note = {
      title: "", content: "", items: [], labels: [], color: "default", pinned: false, archived: false,
      ...normalize(input),
      id: Math.max(0, ...ns.map((x) => x.id)) + 1,
      created_at: now,
      updated_at: now,
    };
    save([...ns, n]);
    return n;
  },

  update: async (id: number, input: NoteInput): Promise<Note> => {
    const ns = load();
    const i = ns.findIndex((n) => n.id === id);
    if (i < 0) throw new Error("404 not found");
    ns[i] = { ...ns[i], ...normalize(input), updated_at: new Date().toISOString() };
    save(ns);
    return ns[i];
  },

  remove: async (id: number): Promise<void> => {
    save(load().filter((n) => n.id !== id));
  },
};
