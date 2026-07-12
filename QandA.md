# Q&A

# services/locationService.ts

## In stage1DistanceFilter, what is the current point compared against, and what happens with no recorded points yet?

It compares against `getLatestLocation(userId)` — the last location row actually written to the DB (not necessarily the previous GPS ping, since filtered-out points never get inserted). If there's no recorded point yet, `previousLocation` is `null` and the function returns `true` immediately, so the first-ever point is always recorded with no distance check.

## In stage2NotificationThresholdCheck, what happens if there's no recent memory (or none with a location)?

`getLatestTimeMemoryWithLocation` returns `null` or a row with null lat/long, so the `!latestMemory || !latestMemory.latitude || !latestMemory.longitude` guard catches it and returns `shouldProceed: false`. The task handler then returns immediately — Stage 3 never runs, no notification is sent (though Stage 1's location recording is unaffected, since it's independent).

# components/Header.tsx

## Why fall back to a placeholder circle when profileImagePath is falsy — doesn't registration always store something (the picture or the placeholder PNG)?

Registration does always write a real path to the DB, but `useUserSession()`'s fetch is async — `profileImagePath` is `null` in state for the brief moment before its effect resolves the SQLite query. The fallback covers that transient loading gap, not a "no picture was provided" case.

## After changing the profile picture, why doesn't it update on a screen I navigate back to?

`useUserSession()` fetches from the DB only once, in a `useEffect` on mount. If that screen's `Header` was already mounted before you opened Profile Settings, navigating back doesn't remount it — React Navigation just re-shows the existing instance, so the effect never re-runs and it keeps the picture it fetched the first time. Flagged as a known limitation, deferred, when the profile picture feature was built.

# General

## Where does the app store its data locally on the phone (DB, images, credentials)?

`journal.db` (SQLite, all metadata incl. `imageUri`/`profileImagePath` strings) lives in the app's private document directory. Actual memory photo bytes go to `<Documents>/memories/` in dev builds or the OS Photo Library in production (`services/imageStorage.ts`). Login credentials/tokens live in the OS secure keychain via `expo-secure-store`, not a plain file.

# hooks/options/useDebugLogs.ts

## What is the behavior where auto-scroll pauses if you've scrolled up (like a terminal)?

"Stick-to-bottom" scrolling (aka scroll anchoring/autoscroll lock): track whether the user is at the bottom, and only auto-scroll on new content if they are — a manual scroll-up disables it until they return to the bottom.

# services/avatarStorage.ts

## Why key avatar files by username instead of userId (why not create the DB row at registration to get a userId)?

You could create the row at registration, but username is still the better key: the returning-user screen reads the avatar before login with no DB lookup, username is a stable natural key while userId is an autoincrement surrogate that can desync/change on a DB reset, and username is already the identity key used everywhere in SecureStore.

# app/index.tsx

## When the app loads, does it have to show a page, or can it load nothing?

Some screen must always be mounted — React Navigation has no "blank" state — but that screen doesn't have to be a dedicated placeholder/redirect page. The root layout already picks the real first screen (`(memories)` or `(welcome)`) based on auth state, so a separate redirect-only `index.tsx` is unnecessary.

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

# hooks/welcome/useWelcomeRouting.ts

## Do we have any mechanism currently to know if a user is already registered?

Only per-username checks exist (`SecureStore` key `login.<username>` in `useRegister.ts`, and `isUserExists(username)` against the SQLite `User` table) — both need a username to check. There's no device-level "has anyone registered on this device" flag, so the random pick in this hook has nothing real to replace it with yet.

# app/(welcome)/login.tsx

## Is there a better way to display the profile image than passing the path, or is the path fine?

Passing the path as a URI to `<Image source={{ uri }} />` is the standard, correct approach — nothing better exists for that. The only real alternative is swapping RN's core `Image` for `expo-image` (adds caching/placeholders), but the rest of the app (`ImageCard.tsx`) already uses plain `Image`, so staying consistent is reasonable.

## Why does `useEffect(() => { if (username) setLoginUsername(username); }, ...)` check that username exists — shouldn't it exist on launch?

`useUserSession`'s DB lookup is async, so `username` is `null` on the very first render and only becomes the real string after its internal effect resolves. The `if` just skips that transient null render; it re-fires once the value arrives.

## Why is `setLoginUsername` also in the dependency array — it's a function, does it change?

It's a `useState` setter, which React guarantees keeps the same identity across renders, so it never actually triggers a re-run. It's listed only because ESLint's `exhaustive-deps` rule requires every outside variable used inside the effect to be declared as a dependency.

# app/(welcome)/register-fingerprint.tsx

## Does this fingerprint scanner register a new fingerprint, or just use ones the phone already knows?

Just uses ones the phone already knows — `LocalAuthentication.authenticateAsync()` can only verify against biometrics already enrolled in OS Settings; apps can't enroll new biometric templates themselves. "Registration" here just confirms the device owner via an existing fingerprint, then stores an app-side token in `SecureStore` tied to the username.
