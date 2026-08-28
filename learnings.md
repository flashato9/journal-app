# Learnings

## Companion: don't read async-populated state synchronously inline in render

`services/companionApi.ts`'s `listThreads()` was a synchronous function reading a module-level `Map` (`mockThreads`) that gets written to by async functions (`getOrCreateThread`, `generateRemark`, `sendUserMessage`). It was called directly inline in `CompanionChatPopover`'s render body (`const threads = getCompanionApi().listThreads();`).

Symptom: the array returned sometimes didn't reflect thread mutations that had already completed, and the function's own internal `console.log` intermittently appeared to not fire even though the call demonstrably ran (bracketing debug logs before/after it always printed). Root cause was never fully pinned down with certainty — competing theories were a stale Fast Refresh bundle vs. some render-phase side-effect timing quirk — but converting `listThreads()` to return a `Promise` and moving the call into a dedicated hook (`useCompanionThreadList`, using `useEffect` + `useState`) made the behavior reliable regardless of which theory was right.

**Takeaway:** if a value comes from I/O or shared mutable state populated elsewhere (not derived from this component's own props/state), don't call it inline in the render body — even if the call happens to be synchronous today. Wrap it in a hook that fetches via `useEffect`. This sidesteps render-phase side-effect ordering issues entirely, rather than requiring a correct diagnosis of exactly why the inline version was unreliable.

## SQLite schema changes need their own connection — drizzle leaks read cursors

Startup DDL in `services/database/database.ts` failed twice for two different reasons, and both are easy to hit again:

1. `UNIQUE constraint failed: AppSettings.userId, AppSettings.settingSchemaId` — the one-shot legacy cleanup script re-ran on every launch because its `DROP`s had never completed, and its plain `INSERT INTO AppSettings` statements had no conflict handling. **Any migration script that can be retried must be idempotent** (`INSERT OR IGNORE`, or `ON CONFLICT … DO UPDATE`), and must guard each source table with an existence check so a half-finished previous run doesn't fail on `no such table`. Note that `INSERT … SELECT … ON CONFLICT` needs a `WHERE` clause (`WHERE true` if there's no real filter) or SQLite can't parse the upsert — see <https://sqlite.org/lang_upsert.html>.

2. `database table is locked` on `DROP TABLE` — SQLITE_LOCKED, meaning _this same connection_ still holds an unfinalized read cursor. Drizzle never finalizes its statements (drizzle-orm#4519), and app code (the background location task) queries through drizzle before `initializeDatabase` finishes, so the shared connection is permanently unable to run DDL. Expo's `getFirstSync`/`getAllSync` are **not** the culprit — they finalize in a `finally` — so switching a statement from drizzle to `expo.execSync` does not help; the leak already happened elsewhere on that connection.

**Takeaway:** run `DROP TABLE` / `ALTER TABLE` on a short-lived second connection opened with `SQLite.openDatabaseSync(name, { useNewConnection: true })`, closed in a `finally`. WAL mode allows that writer alongside the main connection's readers. The `useNewConnection` flag is mandatory — expo-sqlite caches connections by database path, so without it you get the same locked connection back and nothing changes (expo's own `withExclusiveTransactionAsync` uses the same flag for the same reason).

Also worth keeping: run multi-statement migration scripts one statement at a time and log the failing statement. As a single `execSync` blob the error was just "execSync has been rejected", which hid the real failure for two rounds.
