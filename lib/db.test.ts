import { test } from "node:test";
import assert from "node:assert/strict";
import { openDb, listNotes, createNote, updateNote, deleteNote, parseNoteInput } from "./db.ts";

const db = openDb(":memory:");

test("create, order, update, delete", () => {
  const a = createNote(db, { title: "a", content: "first" });
  const b = createNote(db, { title: "b", items: [{ text: "x", done: false }] });
  const c = createNote(db, { title: "c", pinned: true });
  assert.deepEqual(listNotes(db).map((n) => n.title), ["c", "b", "a"]);
  assert.deepEqual(b.items, [{ text: "x", done: false }]);

  updateNote(db, a.id, { archived: true });
  assert.deepEqual(listNotes(db).map((n) => n.title), ["c", "b"]);
  assert.deepEqual(listNotes(db, { archived: true }).map((n) => n.title), ["a"]);

  updateNote(db, b.id, { title: "bee" });
  assert.deepEqual(listNotes(db, { q: "bee" }).map((n) => n.title), ["bee"]);
  assert.equal(listNotes(db, { q: "zzz" }).length, 0);

  assert.equal(deleteNote(db, c.id), true);
  assert.equal(deleteNote(db, c.id), false);
  assert.equal(updateNote(db, 999, { title: "x" }), null);
});

test("validation", () => {
  assert.throws(() => parseNoteInput({ items: [{ text: 1 }] }));
  assert.throws(() => parseNoteInput({ color: "neon" }));
  assert.throws(() => parseNoteInput({ pinned: "yes" }));
  assert.deepEqual(parseNoteInput({ title: "t", pinned: true }), { title: "t", pinned: true });
});

test("labels", () => {
  const n = createNote(db, parseNoteInput({ title: "l", labels: [" work ", "work", "home", ""] }));
  assert.deepEqual(n.labels, ["work", "home"]);
  assert.deepEqual(listNotes(db, { q: "home" }).map((x) => x.id), [n.id]);
  assert.deepEqual(updateNote(db, n.id, { labels: [] })!.labels, []);
  assert.throws(() => parseNoteInput({ labels: [1] }));
});
