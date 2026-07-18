# Why "Username is not set in AuthContext" logs during logout

## TL;DR

`useFocusEffect` reruns its callback whenever a dependency in the wrapped `useCallback` changes, not only on a real navigation focus event. Logout clears `username` immediately before navigating away, so the memory-fetch effect in `allmemories.tsx` fires one more time with `username` now `null`, and its existing guard clause catches that and skips the fetch.

## Zoom in: the mechanism

- `allmemories.tsx` wraps its memory-fetch effect as `useFocusEffect(useCallback(fn, [username]))`.
- `useFocusEffect` (`@react-navigation/core/src/useFocusEffect.tsx`) is implemented as a `React.useEffect(..., [effect, navigation])`, where `effect` is the memoized callback passed in.
- Because `effect`'s identity is a dependency of that `useEffect`, the effect reruns whenever the callback's identity changes — which happens whenever `username` changes, since it's in the `useCallback` dependency array — in addition to rerunning on real `focus`/`blur` navigation events.
- The logout handler in `allmemories.tsx` calls `setUsername(null)` synchronously, before calling `router.replace("/(welcome)/login")`. At the moment `setUsername(null)` takes effect, `allmemories` is still the focused screen (the navigation transition hasn't completed), so the rerun condition is met and the effect fires again immediately.

## Zoom in further: the exact code path

- `app/(memories)/allmemories.tsx:30-70` — the memory-fetch effect:
  ```tsx
  useFocusEffect(
    useCallback(() => {
      if (!username) {
        console.warn(
          "Username is not set in AuthContext - skipping memory fetch",
        );
        return;
      }
      // ...fetch memories
    }, [username]),
  );
  ```
- `app/(memories)/allmemories.tsx:82-107` — the logout handler that triggers the rerun:
  ```tsx
  onPress: async () => {
    await stopLocationTracking();
    await SecureStore.deleteItemAsync("currentUsername");
    setUsername(null);                     // clears the dependency
    router.replace("/(welcome)/login");    // navigation completes after
  },
  ```
- `node_modules/@react-navigation/core/src/useFocusEffect.tsx:32-112` — the hook's implementation:
  - Line 32: `React.useEffect(() => { ... }, [effect, navigation])`
  - Lines 74-78: on mount/dependency-change, if `navigation.isFocused()` is true, the callback runs immediately — this is the path taken here.
  - Lines 80-93: the separate `focus` event listener, which is the path taken on a genuine screen-focus navigation (not relevant to this case, since no focus event occurs during logout — the effect reruns via the dependency-change path instead).
- Result: the guard clause at `allmemories.tsx:33-38` runs, logs the warning, and returns before any fetch is attempted. All calls inside the fetch branch (`getUserIdByUsername`, `getDayMemoriesByUserId`, etc.) are synchronous, so no in-flight async work is left dangling by this extra run.

## Why `username` is a dependency in the first place

The callback body reads `username` directly (`getUserIdByUsername(username)`). Any value from component scope referenced inside a `useCallback`/`useEffect` must be listed in its dependency array (`react-hooks/exhaustive-deps`), to avoid a stale closure capturing an old value of `username` forever instead of the current one. It's a mechanical consequence of using `username` inside the callback, not a deliberate "refetch when username changes" design choice.

## Could `useFocusEffect(() => {}, [])` fix it?

No — `useFocusEffect` only accepts **one** argument. Passing a second one doesn't get silently ignored; React Navigation explicitly detects it and logs a `console.error` (`useFocusEffect.tsx:17-30`: "You passed a second argument to 'useFocusEffect', but it only accepts one argument..."). Also, the effect callback would then be a plain inline arrow function created fresh every render — its identity would change on **every** re-render (not just when `username` changes), causing the hook to rerun _more_ often, not less.

## What would actually stop the rerun

`useFocusEffect(useCallback(() => {...}, []))` — empty deps on the `useCallback` itself (not on `useFocusEffect`). This gives the callback a permanently stable identity, so it only reruns on genuine navigation focus/blur events, never on a `username` change, eliminating the logout-triggered rerun (and the warning) entirely.

Trade-off: this deliberately captures `username` in a closure frozen at first mount. In this app that's safe today — `login.tsx` sets `AuthContext.username` before pushing to `allmemories`, so the value is already correct by first render, and `allmemories` is never reused across a username change except during the logout-clear moment this avoids reacting to. But it means any future code path that swaps `username` while this screen stays mounted would silently be ignored, and it requires an eslint-disable comment to suppress the exhaustive-deps warning.
