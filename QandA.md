# Q&A

# hooks/options/useDebugLogs.ts

## What is the behavior where auto-scroll pauses if you've scrolled up (like a terminal)?

"Stick-to-bottom" scrolling (aka scroll anchoring/autoscroll lock): track whether the user is at the bottom, and only auto-scroll on new content if they are — a manual scroll-up disables it until they return to the bottom.

# hooks/options/useLocationSettings.ts

## What is useCallback and how is it different from useEffect?

`useEffect` runs code (a side effect) after render, when deps change. `useCallback` runs nothing — it returns a memoized _function reference_ that only changes when its deps change, so a function you call from an effect doesn't cause that effect to refire every render.

## Why not just useEffect(() => loadSettings(), [username]) instead of wrapping it in useCallback?

You can, and it's simpler when the function is only used in that one effect (as here) — inline the async function inside the effect and depend on `username` directly. `useCallback` earns its keep only when the function is also called elsewhere (another effect, a button's onPress), so it needs a stable identity outside any single effect.

## Why does a function need to be a dependency at all — why not use an object instead?

Objects are reference types too — a fresh `{}` each render is just as unstable as a fresh function each render, so swapping to an object doesn't help (it'd need `useMemo` for the same reason). Primitives (strings/numbers/booleans) don't have this problem since they compare by value, which is why depending on `username` directly (a primitive) sidesteps the whole issue.

## Why not use useState to persist a function across renders instead of useCallback?

useState only sets its value once on mount (or when you explicitly call the setter) — it wouldn't auto-update when `username` changes, and fixing that would need an effect + setState round-trip (an extra re-render). useCallback recomputes inline during the same render, no extra render needed.

## Why isn't username itself stored in useState?

`username` comes from `useLocalSearchParams()` (the route), which is already reactive and updates automatically — copying it into local state would go stale after the first render and create two sources of truth. Rule: read external data (props/route params/context) directly, don't copy it into state.
