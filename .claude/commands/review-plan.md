---
description: Review a plan file against AGENTS.md and the book reference, then rewrite it for mechanical implementation
---

Review the plan at: $ARGUMENTS

Work through these steps in order. Do not skip any.

## 1. Load the rules

- Re-read `AGENTS.md` in full (its first rule requires this every time — it changes mid-session).
- Read the plan file at the path above.
- Read every source file the plan says it will touch. Never review a plan against remembered file contents.

## 2. Check the book reference

- Search `book-reference/book_index.json` for keywords matching the plan's task (animation, hooks, forms, composition, state, errors, performance…).
- Read the matched chapter file(s) under `book-reference/chapters/`.
- Cite the specific chapter and quoted practice for anything you flag or endorse.
- If `book-reference/` doesn't exist, skip this step.

## 3. Audit the plan's code against AGENTS.md Code Style

Go through all 8 rules explicitly. The ones most often violated:

- **Rule 3** — every `return` must assign to a named variable first, including inside `useAnimatedStyle`/callbacks and for JSX.
- **Rule 8** — no anonymous object literals as function arguments (`withTiming(x, { duration: 50 })`, `console.error("msg", { ctx })`, `useState({})`).
- **Rule 6** — comments only on a single line directly above a function definition.
- **Rule 7** — no inline styles, except values that genuinely must be computed at runtime (assign those to a named variable).
- **Rule 5** — boolean-returning functions are `is`-prefixed.

Also check the "When to Extract a Hook" rules — especially whether logic is being duplicated across two or more components, which means it should become a shared hook.

## 4. Hunt for functional gaps

This is the highest-value part. Specifically:

- **Grep for every call site** of any component/hook/function the plan modifies. Plans routinely miss a third or fourth usage.
- **Look for touch-responder conflicts** — adding a `TouchableOpacity`/`Pressable` inside something already wrapped in one silently kills the outer handler.
- **Look for stale-reference bugs** — a function recreated each render used as a `useEffect` dependency will refire that effect every render.
- **Look for regressions** in behaviour the plan doesn't mention but its change would alter.
- **Verify every FIND anchor** matches the current file byte-for-byte.

## 5. Ask about judgment calls

Per AGENTS.md rule 8, use `AskUserQuestion` for anything with a real fork in it — don't silently decide and present a finished plan. Ask before finalizing, not after.

## 6. Rewrite the plan crystal-clear for Sonnet

Rewrite the plan file so a fresh Sonnet session can implement it mechanically with no judgment calls left:

- Layer it high-level → low-level per AGENTS.md rule 7 (Context → approach → rationale → exact code). Never lead with diffs.
- Give **complete file contents** for new files and heavily-changed files; **exact FIND/REPLACE blocks** for targeted edits, verified byte-accurate against the current file.
- Add a numbered **execution checklist** and a table of every file touched.
- Add a **"Decisions already settled — do not re-litigate"** section capturing the user's answers.
- Add a **Guardrails** section listing what NOT to do, with the reason each trap bites.
- Add a **Verification** section: `npm run build` first, then the on-device checks for the user (never run the emulator yourself).

## 7. Finish

Summarise your findings in chat — lead with anything blocking — then call `ExitPlanMode` for approval.
