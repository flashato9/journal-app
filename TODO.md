# Feature Backlog

Ideas for what to build next in the memories/journal app. Checked items are done; everything else is unstarted. Grounded in what's already in the codebase — see the note under each section for what to build on top of.

## AI Journal Assistant

`services/llmService.ts` already has a working on-device model (llama.rn) with `askQuestion()` and `describeImage()`, model download/activate/deactivate lifecycle — but it's currently wired to nothing except the debug screen (`app/(options)/debug-llm.tsx`). This is the biggest "already built, not yet exposed" opportunity.

- [ ] Auto-generate a photo caption/description when a photo is added to a memory, using `describeImage()`
- [ ] "Ask your journal" — a Q&A screen where the user asks a question and the LLM answers using their memory entries as context (`askQuestion()`)
- [ ] Weekly/monthly auto-summary of memories ("Here's what happened this week")
- [ ] Mood/sentiment tagging of entries, surfaced as a simple trend over time

## Search & Organization

- [ ] Full-text search across memory titles/bodies
- [ ] Tags or categories for memories, with filtering
- [ ] Favorites/pinning for memories you want to find again quickly
- [ ] A calendar/timeline view to jump directly to a date (currently only day-by-day and all-memories list views exist)

## Memory Resurfacing & Notifications

`expo-notifications` is already installed and used (see `hooks/notifications/`) — this extends that.

- [ ] "On this day" — resurface memories from the same date in past years
- [ ] Daily/weekly reminder notification to write a new memory
- [ ] Write streaks (consecutive days journaled)

## Location & Maps

`services/locationService.ts` already tracks/stores location per memory (657 lines — this is mature) but nothing currently visualizes it.

- [ ] Map view showing memory pins by location
- [ ] "Memories near me" — surface past memories tied to your current location

## Sharing & Export

Import (via `expo-share-intent`) and full backup export/import (`services/backupService.ts`, wired up in `hooks/options/useExportImport.ts`) already exist.

- [ ] Share a single memory out to another app (as text + photos, or a rendered image/PDF card)
- [ ] Export a date range or the whole journal as a PDF "photo book"

## Security & Privacy

Biometric login already exists in the welcome flow (`app/(welcome)/login.tsx`).

- [ ] Optional app-level lock (biometric/PIN) to re-enter the app after backgrounding, not just at login
- [ ] Per-memory "private" flag that hides it from a shared/exported view

## Media

- [ ] Audio-memory transcription to searchable text (could reuse the on-device LLM setup)
- [ ] Multiple photos per memory shown as a swipeable carousel, not just the grid

## Onboarding / Welcome

- [ ] **Profile picture capture during login/registration** — `profileImagePath` on the `User` table exists but nothing writes to it yet, so the profile photo always shows a placeholder. (Explicitly the next planned task as of the last welcome-flow work.)

## Technical / Architecture (exploratory, not committed)

- [ ] Replace scattered `isLoading` + `useEffect` data-loading patterns with `<Suspense>` + `use()` for _read_ states only (not action states like `isSaving`) — raised as an idea to consider, not yet prototyped or approved.

## Housekeeping

- [ ] Take time to solve some issues (2026-08-10 — no specifics recorded yet, revisit and break this out into concrete items).

## Reference Notes

### What is Zustand? What is Redux?

**TLDR:** Both are state-management libraries for sharing state outside the component tree without prop-drilling. Zustand is minimal and hook-based, almost no boilerplate. Redux is more structured (actions/reducers/dispatch), more ceremony, but stronger conventions at large scale and time-travel debugging via Redux DevTools.

**Redux:** you define **actions** (plain objects describing what happened), **reducers** (pure functions computing new state from the old state + an action), and a single store. Components read state via a selector hook and dispatch actions to change it. Modern Redux is almost always written with Redux Toolkit to cut the historical boilerplate down.

```ts
// Redux Toolkit sketch
const counterSlice = createSlice({
  name: "counter",
  initialState: { value: 0 },
  reducers: {
    incremented: (state) => {
      state.value += 1;
    },
  },
});

// in a component
const count = useSelector((state) => state.counter.value);
const dispatch = useDispatch();
dispatch(counterSlice.actions.incremented());
```

**Zustand:** `create()` returns a hook backed by a plain store object — no actions, no reducers, no dispatch. You read and write state directly.

```ts
const useCounterStore = create((set) => ({
  value: 0,
  increment: () => set((state) => ({ value: state.value + 1 })),
}));

// in a component
const value = useCounterStore((state) => state.value);
const increment = useCounterStore((state) => state.increment);
```

**In this codebase:** neither is used — shared state (e.g. the companion feature's `CompanionContext`) is handled with plain React Context + `useState`, which is the built-in alternative to both for state that doesn't need Redux-scale structure or Zustand's external-store ergonomics.
