# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

# Post-Edit Build & Lint

After updating any files with a non-.md extension (code files), always run `npm run build` yourself and read the output — do not just ask the user to run it. If there are linting errors in the output, fix them in the affected files.

# Model Selection

When the user asks a question, decide (using the currently running model — no need to switch first) which model best fits the task: Haiku for simple/fast lookups, Sonnet for standard coding work, Opus for complex/architecturally significant or correctness-critical work, Fable for creative/narrative writing. State a one-line recommendation before answering non-trivial questions, biased toward correctness, so the user can run `/model` to switch if they want the recommended model to actually handle it.

# QandA

When the user asks a theory question that did not require you to update the code base then write down their question and its answer in the QandA.md file. Keep the question short (1 sentence) and the answer short (1 to 2 sentences max).

Organize QandA.md by the file the user was looking at when they asked the question. Each file gets its own `#` header (e.g. `# app.json`). Add the question and answer under that file's header. If a header for that file does not exist yet, create it and add the question under it. If the user was not looking at a specific file, use a `# General` header.

QandA.md only ever holds today's questions. When a new day's question comes in and QandA.md still holds a previous day's content, first move that existing content into `QandA_M_D_YYYY.md` (the date it was written), then start QandA.md fresh for today.

# File Deletion

Always ask for permission before removing a file, even if it seems clearly unused or the task otherwise implies deletion.
