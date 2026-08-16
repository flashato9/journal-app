# Learnings

## Companion: don't read async-populated state synchronously inline in render

`services/companionApi.ts`'s `listThreads()` was a synchronous function reading a module-level `Map` (`mockThreads`) that gets written to by async functions (`getOrCreateThread`, `generateRemark`, `sendUserMessage`). It was called directly inline in `CompanionChatPopover`'s render body (`const threads = getCompanionApi().listThreads();`).

Symptom: the array returned sometimes didn't reflect thread mutations that had already completed, and the function's own internal `console.log` intermittently appeared to not fire even though the call demonstrably ran (bracketing debug logs before/after it always printed). Root cause was never fully pinned down with certainty — competing theories were a stale Fast Refresh bundle vs. some render-phase side-effect timing quirk — but converting `listThreads()` to return a `Promise` and moving the call into a dedicated hook (`useCompanionThreadList`, using `useEffect` + `useState`) made the behavior reliable regardless of which theory was right.

**Takeaway:** if a value comes from I/O or shared mutable state populated elsewhere (not derived from this component's own props/state), don't call it inline in the render body — even if the call happens to be synchronous today. Wrap it in a hook that fetches via `useEffect`. This sidesteps render-phase side-effect ordering issues entirely, rather than requiring a correct diagnosis of exactly why the inline version was unreliable.
