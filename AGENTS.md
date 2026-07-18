# Refresh Before Responding

Since this file gets edited directly mid-session (including by you), re-read AGENTS.md before responding to any prompt so you're always acting on its current contents, not a stale copy from earlier in the conversation.

# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

# Post-Edit Build & Lint

After updating any files with a non-.md extension (code files), always run `npm run build` yourself and read the output — do not just ask the user to run it. If there are linting errors in the output, fix them in the affected files.

# Model Selection

When the user asks a question, decide (using the currently running model — no need to switch first) which model best fits the task: Haiku for simple/fast lookups, Sonnet for standard coding work, Opus for complex/architecturally significant or correctness-critical work, Fable for creative/narrative writing. State a one-line recommendation before answering non-trivial questions, biased toward correctness, so the user can run `/model` to switch if they want the recommended model to actually handle it.

# QandA

NEVER read the contents of QandA.md.

When the user asks a theory question that did not require you to update the code base then write down their question and its answer in the QandA.md file. Keep the question short (1 sentence) and the answer short (1 to 2 sentences max).

Organize QandA.md by the file the user was looking at when they asked the question. Each file gets its own `#` header (e.g. `# app.json`). Add the question and answer under that file's header. If a header for that file does not exist yet, create it and add the question under it. If the user was not looking at a specific file, use a `# General` header.

QandA.md only ever holds today's questions. When a new day's question comes in and QandA.md still holds a previous day's content, first move that existing content into `QandA_M_D_YYYY.md` (the date it was written), then start QandA.md fresh for today.

Dated QandA archive files (`QandA_M_D_YYYY.md`) go in the `.md/` folder, not the repo root. `QandA.md` itself stays at the repo root — it's today's active file.

# File Deletion

Always ask for permission before removing a file, even if it seems clearly unused or the task otherwise implies deletion.

# Implementation Workflow

Do not edit code files directly until the plan is approved. When asked to implement a change:

1. Present a plan first (use plan mode) and wait for the user to thoroughly review and explicitly approve it.
2. While the plan is pending approval, write the exact code changes (before/after snippets or diffs) into the plan file — do not touch the actual source files yet.
3. Only once the user has explicitly and thoroughly approved the plan, you may edit the actual source files yourself to implement it.
4. Always wrap code snippets in fenced code blocks with the correct language tag (e.g. `ts, `tsx, ```json) so they render with syntax highlighting/colors — never as plain, untagged text.
5. This workflow applies to code files only. You can create and directly modify any `.md` file — including this one (AGENTS.md) — without presenting a plan first.
6. Each distinct task gets its own plan file. Do not append a new, unrelated task onto an existing plan file that already covers a different task — start a fresh one instead.

# Code Style

Apply these rules to all plans (and any code you write):

1. Never use anonymous immediately-invoked function expressions (IIFEs), e.g. `(async () => { ... })();`. Define a named function and call it separately instead.
2. No closures until you absolutely need one. Prefer functions that take their dependencies as explicit parameters over functions that read them from an enclosing scope, so a function's signature always shows everything it depends on. Only close over outer scope when there's no way around it (e.g. a callback handed to an external API that only invokes it with a fixed argument list, like an event emitter's listener).
3. Never return an expression directly. Assign it to a named variable first, then return that variable on its own line — including for arrow-function/callback values (e.g. `const cleanup = () => foo(); return cleanup;` instead of `return () => foo();`) and JSX (e.g. `const content = (<View>...</View>); return content;` instead of `return (<View>...</View>);`).
4. Never export a plain constant value (`export const X = ...` where `X` is a primitive/literal). Export a function that returns it instead, e.g. `export const getX = (): T => { ... return x; };`.
5. Boolean-returning functions must be named with an `is` prefix (e.g. `isLoggedIn`, `isSendNotificationsEnabled`) — not `should`, `has`, `can`, or similar.
6. Comments are only allowed as a single line directly above a function/method definition. No comments anywhere else — not on variables, not inline inside a function body, not above types/imports/etc.
7. No inline styles. Define styles in a `const styles = StyleSheet.create({...})` object (at the bottom of the file) and reference them via `styles.xxx` in JSX.
8. Never pass an anonymous object literal directly as a function argument (e.g. `useState({...})`). Assign it to a named variable first, then pass that variable, e.g. `const initialState = {...}; useState(initialState);`.

# When to Extract a Hook

Not every `useEffect`/`useFocusEffect`/`useCallback` needs its own hook file. Extract one into `hooks/<feature>/use*.ts` only when at least one of these is true:

1. **The effect body is more than a handful of lines**, or needs a helper function, `try`/`catch`, or multiple `await`s to read cleanly.
2. **It's a self-contained concern separate from what the component renders** — data fetching, event-listener/subscription wiring, navigation side effects — as opposed to a one-or-two-line effect that's tightly coupled to the component's own local UI state (e.g. syncing a prop into local state).
3. **The same effect logic is reused, or plausibly will be, across more than one screen.**

If none of these apply — the effect is a couple of lines, directly tied to this component's own state, and not conceptually reusable — leave it inline. Don't extract just because an effect exists; extract when pulling it out actually makes the component's job (rendering) easier to see at a glance.

# Where should you write Long Explanations?

If an explanation is long, then put it in an .md file inside the `.md/` folder (create the folder if it doesn't exist yet) and ask the user to open it.

# How to write the explanations in md files?

In the md file always use a three phase approach. First present the TDLR at the top. Then zoom in to provide more details. Then in the third phase zoom in again to provide the exact code lines that are causing the issue. Make sure all code lines have correct SYNTAX HIGHLITING.

# Best Practices Reference

Before writing, modifying, or refactoring any React code in this repo:

1. Search `book-reference/book_index.json` for keywords related to the task.
2. Read the matched chapter file(s) under `book-reference/chapters/`.
3. Apply the best practices described there.
4. In your explanation, cite which chapter/section you followed.

If `book-reference/` doesn't exist (e.g. a fresh clone), skip this — it's a local, gitignored reference and not required for the repo to function.
