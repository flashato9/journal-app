# services/companionApi.ts

Q: Why do I see "[Companion:popoverRender] Threads ->" logs without a preceding "[Companion:listThreads]" log?
A: Both logs always fire together in code (listThreads() logs internally right before popoverRender logs "Threads ->"). Likely Android logcat is dropping repeated identical log lines when the thread data hasn't changed between renders.

# components/CompanionChatPopover.tsx

Q: Is it possible to run this app in debug mode?
A: Yes — press `j` in the Metro terminal or use the Dev Menu's "Open JS Debugger" to attach Chrome DevTools to Hermes and set breakpoints.

# General

Q: Why did the sidebar behave differently (populating new pages vs not) when the render counter was added vs commented out?
A: The counter itself had no functional effect — the real cause is likely that editing services/companionApi.ts isn't a valid Fast Refresh boundary, so each edit force-reset module state (mockThreads) at a different point in the navigation sequence, not the counter logic.

Q: How do I use breakpoints with the JS debugger?
A: In Chrome DevTools (opened via Metro's `j`), go to Sources, find the file, and click the line-number gutter to set a breakpoint. VS Code's React Native Tools extension can also set breakpoints directly in the editor.

# components/CompanionChatPopover.tsx

Q: Paused at line 129, running getCompanionAPI() in the debugger console returns nothing — why?
A: Check casing — it's getCompanionApi (lowercase "pi"), not getCompanionAPI; a typo would throw ReferenceError, not silently return nothing. Also confirm the console's context dropdown is scoped to the paused call frame, not "top"/global, since the import is a module-local closure binding.

Q: The Watch panel shows "getCompanionApi(): <not available>" — why?
A: VS Code's Watch panel is read-only and generally can't invoke functions during Hermes/React Native debugging. Use the Debug Console tab instead, which supports calling functions while paused.

Q: Why does the sidebar folder only show the login thread after navigating to All Memories?
A: Evidence points to a stale/duplicated companionApi.ts module from Fast Refresh (it exports functions, not components, so it can't hot-swap cleanly) — writes land in one mockThreads Map while reads come from another. Cold restart with `npx expo start -c` to confirm.

# companionApi.ts

Q: Why does the listThreads call/log only fire the first time the companion chat popover renders, not on later renders?
A: listThreads() only runs inside CompanionChatPopover past an early-return guard (isChatOpen && activeThread && status === "ready"). If a later render fails that guard (e.g. chat closed), the call is skipped even though other companion logs still fire.

Q: I assign to listThreadsCallCount with += inside the function - isn't that "accessing" it, so why does eslint still call it unused?
A: eslint's no-unused-vars only counts a variable as used when its value flows somewhere else (returned, logged, passed on). A self-referencing write like x += 1 discards the result, so it doesn't count as a use even though it technically reads the old value.
