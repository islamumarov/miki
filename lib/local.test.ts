import { test } from "node:test";
import assert from "node:assert/strict";

// Minimal localStorage stand-in for Node.
const store = new Map<string, string>();
(globalThis as { localStorage?: unknown }).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
};

const { local } = await import("./local.ts");

test("create, order, search, archive, delete (mirrors db.test)", async () => {
  const a = await local.create({ title: "a", content: "first" });
  const b = await local.create({ title: "b", items: [{ text: "x", done: false }], labels: [" Work ", "work", ""] });
  const c = await local.create({ title: "c", pinned: true });
  assert.deepEqual((await local.list(false, "")).map((n) => n.title), ["c", "b", "a"]);
  assert.deepEqual(b.labels, ["Work", "work"]);
  assert.deepEqual([a.id, b.id, c.id], [1, 2, 3]);

  await local.update(a.id, { archived: true });
  assert.deepEqual((await local.list(false, "")).map((n) => n.title), ["c", "b"]);
  assert.deepEqual((await local.list(true, "")).map((n) => n.title), ["a"]);

  await local.update(b.id, { title: "bee" });
  assert.deepEqual((await local.list(false, "BEE")).map((n) => n.title), ["bee"]);
  assert.deepEqual((await local.list(false, "x")).map((n) => n.title), ["bee"]); // item text
  assert.equal((await local.list(false, "zzz")).length, 0);

  await local.remove(c.id);
  assert.deepEqual((await local.list(false, "")).map((n) => n.title), ["bee"]);
  await assert.rejects(local.update(999, { title: "x" }));
});
