# General

**Q: Where is the record sound option?**
A: In Create Memory's Media Gallery upload button — the picker includes "Take Picture / Record Video / Media Gallery / Record Sound / Cancel"; choosing "Record Sound" opens the audio recorder.

**Q: Why does only the center of the "Create First Memory" button show the shiny effect, not the whole button?**
A: The shine is a moving 60px-wide gradient band (see `useShine.ts`/`Button.tsx`), not a static highlight — it sweeps across in 1 second, then sits off-screen for 2 seconds before repeating, so any single glance usually catches it mid-sweep near the middle. It does cross the full width over the 1s sweep.

# services/llmService.ts

**Q: What is n_predict?**
A: It's llama.cpp/llama.rn's cap on how many new tokens the model may generate for a call (a token ≈ a word-piece, not an exact character count) — generation stops once that many tokens are produced, or sooner if the model emits a stop token. It's not a guaranteed output length, which is why `generateDaySummary` also truncates the result to 100 characters afterward.

**Q: Where is the day-summary prompt stored?**
A: As a plain string constant, `DAY_SUMMARY_INSTRUCTION`, directly in this file — not in the database or a separate config file. It's sent as the `role: "system"` message each time `generateDaySummary` runs.

**Q: Which LLM model are we using?**
A: SmolVLM2-500M-Video-Instruct (Q8_0 quantized GGUF, `ggml-org/SmolVLM2-500M-Video-Instruct-GGUF`) — a 500M-parameter vision/video model, primarily trained for image/video captioning rather than open-ended text summarization.

**Q: How are we interfacing with the model?**
A: Via `llama.rn`, a React Native binding for `llama.cpp`, running fully on-device. `initLlama()` loads the GGUF into a `LlamaContext`, and `llamaContext.completion({...})` runs inference — either with a chat-style `messages` array (auto-templated) or a raw `prompt` string (what `generateDaySummary` uses, to bypass SmolVLM2's broken jinja template).

**Q: Is llama.rn a library with functions?**
A: Yes — it's a normal npm package you `import` and call (`initLlama()`, then `.completion()`/`.release()`/etc. on the returned `LlamaContext`), not a server or CLI. Native C++ code runs underneath, bridged to JS.

**Q: How do we "speak" to the model?**
A: We call `llamaContext.completion({ prompt, n_predict, temperature })` and read the reply from the resolved `result.text`. It's one request/response call per generation, not a persistent chat session — no conversation state is kept between calls.

**Q: A search result showed Llama special tokens (`<|begin_of_text|>`, `<|start_header_id|>`, `<|eot_id|>`) for fixing ignored system prompts — is that what we need?**
A: That's Meta's Llama 3 token syntax, not our model's. We already applied the same underlying fix (manually wrapping the raw prompt in the model's own special tokens) but with SmolVLM2's actual tokens (`<|im_start|>`, `<end_of_utterance>`, `"System:"/"User:"/"Assistant:"`), fetched directly from its `chat_template.json`. Using the Llama 3 tokens instead would make things worse, since our model was never trained on them.

**Q: Is there a Gemma model with image support?**
A: Yes, but only at 4B/12B/27B params (with a separate mmproj file) — the 1B/270M text-only sizes we use for the text model have no vision support. Gemma 3 4B alone is ~2.49GB (Q4_K_M), bigger than the SmolVLM2-2.2B option we already ruled out, so not a lateral swap for the current vision use case.
