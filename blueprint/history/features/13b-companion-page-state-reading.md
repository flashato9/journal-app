# Feature: Companion page state reading

**From build-plan:** feature 13b (sub-feature of 13. AI companion)
**Status:** complete

## Goal

Give each screen a way to hand the companion an explicit, hand-authored
snapshot of its own current state, readable the moment the companion looks at
the page - not just the field that most recently changed. This is the read
side of "the assistant sees" from `.md/ai-features-brainstorm.md`; nothing
consumes the snapshot yet (no remarks, no chat, no popups - that's 13c/13d).

## In scope

- A shared `CompanionPageSnapshot` type: an explicit, hand-authored
  `Record<string, unknown>` a screen builds itself - never a tree-walk over
  rendered output.
- A `useCompanionPageSnapshot` hook that observes a snapshot object and logs
  it (via the existing `console.log` -> `services/logger.ts` pipeline) on
  first mount and on every subsequent change, standing in for "the companion
  reads this" until remark generation exists in 13c.
- Wiring that hook into the Register screen (`useRegister.ts` /
  `app/(welcome)/register.tsx`), projecting exactly `{ username,
  profileImageUri }` - matching the two worked examples in the brainstorm doc
  (no picture / picture uploaded).
- Wiring the same hook into the Login screen (`app/(welcome)/login.tsx`),
  projecting `{ username }` - the only other screen with a companion thread
  today (`useCompanionThread("login")`).
- Deleting `services/pageContentExtractor.ts` (`extractVisibleText`) - dead
  code from the abandoned tree-walk approach, confirmed unused anywhere in
  the app.

## Out of scope

- Remark generation, `{ mood, text }` output, ideal-self/drift logic (13c).
- Popup display or any UI that reacts to the snapshot (13d).
- Chat mode, tapping the icon, or field-editing via chat (13e/13f).
- The real network backend (13g) - the mock `companionApi` stays as-is.
- User-facing narrowing of the companion's field of view (a later "sees"
  requirement) - the only exclusion enforced here is the permanent one:
  passwords are never in a snapshot, by construction.
- Wiring a snapshot into every other screen - Register and Login only, since
  they're the two the brainstorm doc and the existing thread wiring already
  cover. Extending to `(memories)`/`(options)` screens rides along with
  whichever later step first needs a remark there.

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight
   on. Checkpoints are optional; `/complete` makes the real feature-level
   commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the
step was too big, so split it.

## Build steps

- [x] **Step 1 - Snapshot type and hook** - Add `CompanionPageSnapshot` (a
  `Record<string, unknown>` alias) to `services/companionApi.ts`. Add
  `hooks/companion/useCompanionPageSnapshot.ts`: takes `(threadKey: string,
  snapshot: CompanionPageSnapshot)`, and in a `useEffect` keyed on
  `[threadKey, snapshot]`, logs
  `console.log("[Companion:sees]", threadKey, snapshot)`. *Done when:*
  `npm run build:typecheck` passes and the hook has no consumers yet (it's
  inert until Step 2).
- [x] **Step 2 - Wire into Register** - In `useRegister.ts`, build a
  `companionSnapshot: CompanionPageSnapshot` object from `{ username,
  profileImageUri }` and call `useCompanionPageSnapshot("register",
  companionSnapshot)`. *Done when:* opening Register and checking Debug Logs
  shows one `[Companion:sees] register { username: "", profileImageUri:
  null }` line on load; typing a username or picking a picture adds a new
  log line with the updated values; no log line ever contains `password` or
  `confirmPassword`.
- [x] **Step 3 - Wire into Login** - In the Login screen, build `{ username
  }` from existing login state and call `useCompanionPageSnapshot("login",
  companionSnapshot)`, alongside the existing `useCompanionThread("login")`
  call. *Done when:* Debug Logs shows a `[Companion:sees] login { username:
  "" }` line on load and an updated line as the username field changes; no
  log line ever contains `password`.
- [x] **Step 4 - Remove dead tree-walk code** - Delete
  `services/pageContentExtractor.ts`. *Done when:* the file is gone,
  `npm run build:typecheck` and `npm run lint` still pass (confirming
  nothing imported it), and a search for `extractVisibleText` returns no
  results.
- [x] **Step 5 - Wire into Day Memories (added mid-build, user request)** -
  `useCompanionThread("daymemories")` + `useCompanionPageSnapshot("daymemories",
  { day, daySummary, memoryCount })` in `daymemories.tsx`, replacing Login as
  the test screen (Login/Register wiring stays). *Done when:* Debug Logs shows
  `[Companion:sees] daymemories {...}` on load and on day-summary change;
  typecheck clean.

## Files / areas

- `services/companionApi.ts` - add `CompanionPageSnapshot` type
- `hooks/companion/useCompanionPageSnapshot.ts` - new
- `hooks/welcome/useRegister.ts`, `app/(welcome)/register.tsx` - wire snapshot
- `app/(welcome)/login.tsx` - wire snapshot
- `app/(memories)/daymemories.tsx` - wire snapshot (Step 5)
- `context/CompanionContext.tsx` - reworded sleeping/online console logs
- `services/pageContentExtractor.ts` - deleted

## Data / contracts

- `CompanionPageSnapshot = Record<string, unknown>`, exported from
  `services/companionApi.ts` alongside `CompanionApi`/`CompanionThread`.
  **Load-bearing**: 13c (remark thinking) will take this same type as
  `generateRemark`'s page-data input, so the shape and location aren't
  incidental to this step - don't rename or move it later without checking
  13c's spec.

## Testing

No test runner is configured (`coding-standards.md` Testing section), so
there's no automated test gate to satisfy. `useCompanionPageSnapshot`'s only
logic is a `useEffect` dependency comparison, which is exercised directly by
the manual verification below rather than a unit test.

- Run `npm run build:typecheck` and `npm run lint` after every step.
- Run the app (`npm start` / `npm run android`), open Register, then Login,
  and confirm the Debug Logs screen (`(options)/debug-logs.tsx`) shows the
  `[Companion:sees]` lines described in each step's done-when, and that no
  logged snapshot ever includes a password field.

## Notes for the AI

- Passwords are a hard exclusion (Step 10 in the brainstorm doc): don't add
  `password`/`confirmPassword` to either screen's snapshot, even temporarily.
  This isn't the configurable narrowing feature (out of scope) - it's a
  permanent floor that narrowing can never lift.
- Reuse `services/logger.ts`'s existing `console.log` hook - don't add a
  second logging path or import `logger.ts` directly; a plain `console.log`
  is enough since the logger patches it globally.
- One shared hook, not per-screen copies - `useRegister.ts` and
  `login.tsx` both call the same `useCompanionPageSnapshot`.
- Match existing conventions: hook lives under `hooks/companion/` per
  `coding-standards.md`'s File Organization section, camelCase, no global
  state library.
- `services/pageContentExtractor.ts` has no other callers anywhere in the
  repo (confirmed by grep) - Step 4's deletion is safe.
- "Sees" requirement 2 (react only to real change) is already satisfied by
  this hook's diff check; no polling exists anywhere in companion code.
