# Keep

Google Keep–style notes and checklists. TypeScript end to end: Next.js (App Router) for UI and API, SQLite via Node's built-in `node:sqlite`.

Requires Node ≥ 22.

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # DB layer tests
npm run build && npm start
```

Theme follows the OS setting; the 🌗 button in the header overrides it (saved in localStorage).

Database file: `data/notes.db` (created on first request; override with `NOTES_DB=/path/to.db`).

## Android app

Capacitor wraps a static export; notes are stored on the device (`localStorage`), no server needed.

```bash
npm run build:android   # static export → out/, synced into android/
npx cap open android    # then Build ▸ Build APK in Android Studio
```

CI: `.github/workflows/android.yml` builds a debug APK on every push to `main` (Actions ▸ artifact `keep-debug-apk`).

## Layout

- `lib/types.ts` — Note/Item types and color palette (shared client/server). Labels are a JSON string array on the note; the header filter bar is derived from the loaded notes.
- `lib/local.ts` — on-device storage used by the Android build (+ `local.test.ts`)
- `lib/db.ts` — SQLite schema, queries, input validation (+ `db.test.ts`)
- `app/api/notes` — REST routes: `GET/POST /api/notes`, `PATCH/DELETE /api/notes/:id`
- `components/` — `KeepApp` (state, search, archive), `Composer`, `NoteCard`, `Checklist`, `NoteEditor` (shared editing widgets)
