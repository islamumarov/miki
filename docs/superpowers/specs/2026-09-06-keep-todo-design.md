# Keep-style TODO app — design

## Goal
Single-user Google Keep clone: notes and checklists in a masonry grid, with pin, color, archive, delete, search.

## Stack
- Next.js (App Router), TypeScript end to end.
- Backend: Next.js Route Handlers under `app/api/notes`.
- Database: SQLite via Node's built-in `node:sqlite` (Node ≥ 22). File `data/notes.db`, created on first run.
- UI: React client components, Tailwind for styling, CSS columns for masonry.

## Data model
One table, `notes`:

| column     | type    | notes                                  |
|------------|---------|----------------------------------------|
| id         | INTEGER | primary key                            |
| title      | TEXT    | may be empty                           |
| content    | TEXT    | free text; empty for checklists        |
| items      | TEXT    | JSON `[{text, done}]`; `[]` for notes  |
| labels     | TEXT    | JSON `string[]`, trimmed + deduped     |
| reminder   | TEXT    | ISO datetime or NULL                   |
| color      | TEXT    | Keep palette key, default `default`    |
| pinned     | INTEGER | 0/1                                    |
| archived   | INTEGER | 0/1                                    |
| created_at | TEXT    | ISO                                    |
| updated_at | TEXT    | ISO                                    |

Checklist items live as JSON on the note. No separate table: items are only ever read or written with their note.

## API
- `GET /api/notes?archived=0|1&q=text` → list, pinned first, then by updated_at desc.
- `POST /api/notes` → create; body is a partial note.
- `PATCH /api/notes/:id` → update any subset of fields.
- `DELETE /api/notes/:id` → hard delete.

Validation at the boundary: title/content strings, items array of `{text: string, done: boolean}`, color in palette, pinned/archived booleans. Bad input → 400.

## UI
- Top bar: search input, toggle Notes / Archive.
- "Take a note…" composer that expands on focus; switch between text and checklist.
- Grid: pinned section then others. Each card: title, content or checklist with checkboxes, hover toolbar (pin, color, archive, delete).
- Click card → edit inline (same card turns editable; blur saves).
- All mutations optimistic: update local state, then call API; on failure, refetch.

## Testing
One test file for the DB layer (`lib/db.test.ts`) run with `node --test`: create, list ordering, update, delete, validation rejects bad items.

## Out of scope
Auth, images, drag reorder, collaboration.
