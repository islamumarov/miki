import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

import { COLORS, type Color, type Item, type Note, type NoteInput } from "./types.ts";
export { COLORS, type Color, type Item, type Note, type NoteInput };

export function openDb(file: string): DatabaseSync {
  if (file !== ":memory:") fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(`CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    items TEXT NOT NULL DEFAULT '[]',
    labels TEXT NOT NULL DEFAULT '[]',
    color TEXT NOT NULL DEFAULT 'default',
    pinned INTEGER NOT NULL DEFAULT 0,
    archived INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`);
  // Migration for DBs created before labels existed.
  const cols = (db.prepare("PRAGMA table_info(notes)").all() as { name: string }[]).map((c) => c.name);
  if (!cols.includes("labels")) db.exec("ALTER TABLE notes ADD COLUMN labels TEXT NOT NULL DEFAULT '[]'");
  return db;
}

// One shared connection per process, lazily opened.
let shared: DatabaseSync | undefined;
export function getDb(): DatabaseSync {
  return (shared ??= openDb(process.env.NOTES_DB ?? path.join(process.cwd(), "data", "notes.db")));
}

type Row = Omit<Note, "items" | "labels" | "pinned" | "archived"> & { items: string; labels: string; pinned: number; archived: number };
const fromRow = (r: Row): Note => ({ ...r, items: JSON.parse(r.items), labels: JSON.parse(r.labels), pinned: !!r.pinned, archived: !!r.archived });

export function parseNoteInput(body: unknown): NoteInput {
  if (typeof body !== "object" || body === null) throw new Error("body must be an object");
  const b = body as Record<string, unknown>;
  const out: NoteInput = {};
  if ("title" in b) { if (typeof b.title !== "string") throw new Error("title"); out.title = b.title; }
  if ("content" in b) { if (typeof b.content !== "string") throw new Error("content"); out.content = b.content; }
  if ("color" in b) { if (typeof b.color !== "string" || !(b.color in COLORS)) throw new Error("color"); out.color = b.color as Color; }
  if ("pinned" in b) { if (typeof b.pinned !== "boolean") throw new Error("pinned"); out.pinned = b.pinned; }
  if ("archived" in b) { if (typeof b.archived !== "boolean") throw new Error("archived"); out.archived = b.archived; }
  if ("items" in b) {
    if (!Array.isArray(b.items)) throw new Error("items");
    out.items = b.items.map((i) => {
      if (typeof i !== "object" || i === null || typeof i.text !== "string" || typeof i.done !== "boolean") throw new Error("items");
      return { text: i.text, done: i.done };
    });
  }
  if ("labels" in b) {
    if (!Array.isArray(b.labels) || !b.labels.every((l) => typeof l === "string")) throw new Error("labels");
    out.labels = [...new Set((b.labels as string[]).map((l) => l.trim()).filter(Boolean))];
  }
  return out;
}

export function listNotes(db: DatabaseSync, opts: { archived?: boolean; q?: string } = {}): Note[] {
  const rows = db
    .prepare(
      `SELECT * FROM notes WHERE archived = ? AND (? = '' OR title LIKE ? OR content LIKE ? OR items LIKE ? OR labels LIKE ?)
       ORDER BY pinned DESC, updated_at DESC, id DESC`,
    )
    .all(opts.archived ? 1 : 0, opts.q ?? "", ...Array(4).fill(`%${opts.q ?? ""}%`)) as Row[];
  return rows.map(fromRow);
}

export function getNote(db: DatabaseSync, id: number): Note | null {
  const row = db.prepare("SELECT * FROM notes WHERE id = ?").get(id) as Row | undefined;
  return row ? fromRow(row) : null;
}

export function createNote(db: DatabaseSync, input: NoteInput): Note {
  const now = new Date().toISOString();
  const r = db
    .prepare(
      `INSERT INTO notes (title, content, items, labels, color, pinned, archived, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.title ?? "",
      input.content ?? "",
      JSON.stringify(input.items ?? []),
      JSON.stringify(input.labels ?? []),
      input.color ?? "default",
      input.pinned ? 1 : 0,
      input.archived ? 1 : 0,
      now,
      now,
    );
  return getNote(db, Number(r.lastInsertRowid))!;
}

export function updateNote(db: DatabaseSync, id: number, input: NoteInput): Note | null {
  const sets: string[] = [];
  const vals: (string | number)[] = [];
  for (const [k, v] of Object.entries(input)) {
    sets.push(`${k} = ?`);
    vals.push(k === "items" || k === "labels" ? JSON.stringify(v) : typeof v === "boolean" ? (v ? 1 : 0) : (v as string));
  }
  sets.push("updated_at = ?");
  vals.push(new Date().toISOString());
  const r = db.prepare(`UPDATE notes SET ${sets.join(", ")} WHERE id = ?`).run(...vals, id);
  return r.changes ? getNote(db, id) : null;
}

export function deleteNote(db: DatabaseSync, id: number): boolean {
  return db.prepare("DELETE FROM notes WHERE id = ?").run(id).changes > 0;
}
