# General

Q: What does "expo@54.0.35 - expected version: ~54.0.36" mean?
A: `npx expo install --check` (or `expo-doctor`) found that the installed `expo` package version doesn't match the version range that SDK 54 expects; running `npx expo install --fix` (or `npm install expo@~54.0.36`) resolves it.

Q: Why not just run `npm install` to fix the expo version mismatch?
A: Plain `npm install` only re-syncs to whatever's already pinned in package.json/lock file, so it won't bump the version; `npx expo install expo` (or `npm install expo@~54.0.36`) is needed to actually target the SDK-expected version.

Q: Why use `npx expo install` instead of `npm install`?
A: `npx` runs the Expo CLI itself (SDK-aware, knows the correct version), while `npm install` is generic package resolution with no knowledge of Expo SDK compatibility.

Will converting a ~700-page PDF book with markitdown take long?
Depends on whether the PDF has a real text layer or is a scan. This is a born-digital Packt ebook, so text extraction should finish in a couple of minutes; only scanned/OCR-needed PDFs would be slow, and markitdown's default PDF converter doesn't OCR at all.

# locationService.ts

Q: How do I make Ctrl+H open global search (find in files) in VS Code?
A: In Keyboard Shortcuts, bind `workbench.action.findInFiles` to Ctrl+H, and remove/rebind the conflicting default `editor.action.startFindReplaceAction` binding on Ctrl+H.

# app/_layout.tsx

Q: Why does the useEffect always return `() => subscription?.remove()`?
A: That's useEffect's cleanup function, called before the effect reruns (deps changed) or on unmount; without it, each rerun would register a new notification listener on top of old ones, causing duplicate/stale-closure firings.

# components/options/ExportImport.tsx

Q: What does the book say about hooks, and are we using them right?
A: Chapter 8 (React Hooks) says: only call hooks at the top level (never in loops/conditions/nested functions) and only from components or custom `use*` hooks, list every value an effect reads in its dependency array, and don't reach for `memo`/`useMemo`/`useCallback` until you've observed an actual performance problem. We follow all of this — hooks are always top-level and unconditional, dependency arrays are exhaustive, `useCallback` only appears where `useFocusEffect` requires a memoized callback, and we don't use `memo`/`useMemo` anywhere since nothing in this app has shown a real re-render performance problem.

# services/database/migrations/migrations.js

Q: Is adopting Drizzle ORM a native module change?
A: No — drizzle-orm/drizzle-kit are pure JS/TS, layered on the expo-sqlite native module the app already had. Only the Metro/Babel bundler config changed (new .sql source extension, new inline-import plugin), which needs a dev-server cache-clear restart, not a native rebuild.

# General

Q: What is Babel?
A: A JS/TS compiler that transforms newer/non-standard syntax (JSX, TypeScript, custom plugins) into code the target runtime can run. This project's new babel.config.js uses it for babel-preset-expo plus the inline-import plugin that lets Drizzle's generated .sql migrations be imported as strings.

Q: What does "database is locked" mean in the location-tracking error?
A: SQLITE_BUSY — a different connection already held the write lock on journal.db at that instant. Likely cause: Android's background location task can run in a separate headless JS context that re-opens its own SQLite connection to the same file, so it can race the foreground app's connection. Pre-existing risk, not introduced by the Drizzle refactor; fixable with WAL mode + a busy timeout.
