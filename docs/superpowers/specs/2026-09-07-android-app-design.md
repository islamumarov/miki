# Android app (Capacitor) — design

Date: 2026-09-07. Approved in chat.

## Goal

Ship Keep as an installable Android APK. Notes live on the phone, offline, no server.

## Approach

Wrap a Next.js static export in Capacitor. UI components untouched; only the storage seam changes.

- `lib/local.ts` — `localStorage`-backed implementation of the same four functions as the remote `api`
  (list/create/update/remove). Mirrors server semantics: case-insensitive substring search over
  title/content/items/labels, ordering pinned → updated_at → id, label trim + dedupe, incremental ids.
- `lib/api.ts` — picks `local` when `NEXT_PUBLIC_STORAGE=local` at build time, else the fetch client.
- `next.config.ts` — same env flag turns on `output: "export"` and `pageExtensions: ["tsx"]`
  (excludes `route.ts` API handlers, which static export forbids). Web dev/build unchanged.
- `capacitor.config.json` — `webDir: "out"`, appId `com.miki.keep`. `android/` Gradle project committed.
- `npm run build:android` — export + `cap sync android`.
- `.github/workflows/android.yml` — builds debug APK on push to main / manual dispatch, uploads as artifact.

## Rejected

- Expo/React Native rewrite: only types reusable; weeks of work.
- Bubblewrap TWA / PWA: requires a hosted server; user wants on-device data.

## Deferred

- Sync/backup between devices.
- SQLite plugin: localStorage (~5MB) is ample for notes; `ponytail:` comment in `lib/local.ts` marks the upgrade.

## Testing

`lib/local.test.ts` runs under existing `npm test` with a fake `localStorage`; covers create/order/search/archive/delete.
