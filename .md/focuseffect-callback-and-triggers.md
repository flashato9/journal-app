# Does useFocusEffect take an anonymous function, and does it only run on focus?

## Is the argument an anonymous function?

Yes. In `allmemories.tsx` it's `useCallback(() => {...}, [username])` — an anonymous arrow function. Internally, `useFocusEffect` wraps it again in another anonymous function: `React.useEffect(() => {...}, [effect, navigation])` (`@react-navigation/core/src/useFocusEffect.tsx:32`).

## Does it only run when the screen is focused?

No — it reruns on **two separate triggers**, not one:

1. **A real navigation focus event.** You navigate away and back, and React Navigation's `focus` listener fires (`useFocusEffect.tsx:80-93`).
2. **The `effect` argument's identity changing, while the screen is already focused.** This is a plain `useEffect` dependency-array rerun (`useFocusEffect.tsx:32,74-78`) — nothing to do with actual navigation. Since the `effect` passed in is `useCallback(fn, [username])`, any time `username` changes, `useCallback` returns a _new_ function reference. That alone re-triggers the effect if `navigation.isFocused()` is still `true`, with no focus/blur event involved at all.

## Which one causes the logout warning

Trigger #2, not #1. During logout, `allmemories` is never blurred and refocused — `setUsername(null)` just changes `username`'s value while the screen is still sitting there focused, which changes the `useCallback`'s identity and reruns the effect through the dependency-change path, not a real navigation focus event.

See also: [logout-focus-effect-warning.md](logout-focus-effect-warning.md) for the full mechanism and code trace.
