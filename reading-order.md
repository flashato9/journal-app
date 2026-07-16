# App Reading Order

Following the execution/navigation flow is exactly how the app actually runs. Here's the order to read the files, grouped by the user's journey through the app.

> Note: paths reflect the refactor that moved non-route components out of `app/` into a root-level `components/` folder.

## 1. Startup (what runs first)

The entry point and initial routing:

- `app/_layout.tsx` — the **root**. Runs first (remember `main` → expo-router → this). Wraps the app in the Providers (`AuthProvider`, `OptionsMenuProvider`) and decides which stack to show.
- `app/index.tsx` — the initial route (`/`). Usually a redirect that sends you to login or memories based on auth.

## 2. The Welcome flow (before you're logged in)

The `(welcome)` group — first thing a new user sees:

- `app/(welcome)/_layout.tsx` — the navigation stack for the welcome screens
- `app/(welcome)/login.tsx` — logging in
- `app/(welcome)/register.tsx` — creating an account
- `app/(welcome)/register-fingerprint.tsx` — biometric setup

## 3. The Memories flow (the main app, after login)

The `(memories)` group — the core experience:

- `app/(memories)/_layout.tsx` — the navigation stack for memory screens
- `app/(memories)/allmemories.tsx` — the home list of all memories
- `app/(memories)/daymemories.tsx` — one day's memories
- `app/(memories)/creatememory.tsx` — making a new memory
- `app/(memories)/readoreditmemory.tsx` — viewing/editing one

## 4. Shared UI (used across many screens)

Read these when you hit them referenced above:

- `components/Header.tsx`
- `components/LoadingIndicator.tsx`
- `components/OptionsMenu.tsx` + `context/OptionsMenuContext.tsx`

## 5. Memory building blocks (the smaller pieces)

The components that make up the memory screens (all in `components/memories/`):

- `MemoryForm` → `QuestionnaireCard` → `SummaryCard` → `FullDayMemoryCard` / `TimeOfDayMemoryCard` → `MediaGallery/` (`UploadMedia`, `MediaCard`, `MediaPreviewModal`, `RecordAudioModal`)

## 6. Settings & debug (side screens)

Reachable from the options menu:

- `app/location-settings.tsx`
- `app/debug-logs.tsx`

---

**The guiding principle:** start at `app/_layout.tsx` (the root that boots everything), then follow the user's path — land → log in → see memories → create/edit one — reading each screen's child components as you encounter them.
