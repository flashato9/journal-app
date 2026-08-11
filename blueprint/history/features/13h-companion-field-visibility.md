# Feature: Companion field-of-view narrowing

**From build-plan:** feature 13h (sub-feature of 13. AI companion)
**Status:** complete

## Goal

Let the user hide specific fields from the companion's page snapshot, per
screen, on top of the permanent password exclusion from 13b. A Settings
toggle drives a DB-backed preference; `useCompanionPageSnapshot` strips
hidden fields before logging.

## In scope

- `companionFieldVisibility` table (Drizzle): `userId`, `screenKey`,
  `fieldKey`, unique on `(userId, screenKey, fieldKey)`. A row's presence
  means that field is hidden; no row means visible.
- `services/database/tables/companionFieldVisibility.ts`:
  `getHiddenFields(userId, screenKey): string[]`,
  `setFieldHidden(userId, screenKey, fieldKey, hidden)`.
- Hand-authored registry of narrowable fields per screen, in
  `constants/companionFields.ts`: register (`username`, `profileImageUri`),
  login (`username`), daymemories (`day`, `daySummary`, `memoryCount`).
- `useCompanionPageSnapshot` resolves `userId` via
  `UserTable.getRegisteredUserId()` (the device's one registered user - works
  pre-login, unlike `AuthContext.username`) and strips hidden fields before
  `console.log`.
- Settings toggle UI: `components/options/CompanionVisibilitySettings.tsx`
  + `hooks/options/useCompanionFieldVisibility.ts`, listing every registry
  entry with a `Switch`, wired as a new section in
  `app/(options)/profile-settings.tsx`.

## Out of scope

- Chat writing to the same store (13f - chat doesn't exist yet).
- Narrowing past the password exclusion - never possible, unchanged from 13b.
- 13c's future `generateRemark` reading filtered snapshots - that's 13c's job.
- Auto-deriving the registry from actual snapshot objects - hand-maintained,
  same philosophy as the snapshots themselves.

Build loop: one small step at a time, diff review before commit - see
`blueprint/context/ai-interaction.md`.

## Build steps

- [x] **Step 1 - DB table + migration** - Add `companionFieldVisibility`
  schema, run `npx drizzle-kit generate` to produce the migration, add
  `services/database/tables/companionFieldVisibility.ts` with
  `getHiddenFields`/`setFieldHidden`. *Done when:* typecheck passes and the
  migration file exists.
- [x] **Step 2 - Narrowable-fields registry** - Add
  `constants/companionFields.ts` exporting the per-screen list above. *Done
  when:* typecheck passes.
- [x] **Step 3 - Filter in the hook** - `useCompanionPageSnapshot` resolves
  `userId`, loads hidden fields for `threadKey` on mount, strips them from
  the snapshot before logging. *Done when:* a field marked hidden directly
  in the DB is missing from its `[Companion:sees]` log line; other fields
  still show.
- [x] **Step 4 - Settings toggle UI** - New component + hook list every
  registry entry with a `Switch`, reading/writing via Step 1's table
  functions; wire into `profile-settings.tsx`. *Done when:* toggling a
  switch off, then revisiting that screen, removes the key from the next
  `[Companion:sees]` log line; toggling back on restores it.

## Files / areas

- `services/database/schema/companionFieldVisibility.ts` - new
- `services/database/tables/companionFieldVisibility.ts` - new
- `services/database/migrations/` - new migration
- `constants/companionFields.ts` - new
- `hooks/companion/useCompanionPageSnapshot.ts` - add filtering
- `components/options/CompanionVisibilitySettings.tsx` - new
- `hooks/options/useCompanionFieldVisibility.ts` - new
- `app/(options)/profile-settings.tsx` - wire new section

## Data / contracts

- `companionFieldVisibility`: `{ id, userId (FK, cascade delete), screenKey:
  text, fieldKey: text }`, unique on `(userId, screenKey, fieldKey)`.
- Registry: `Record<string, string[]>` keyed by screen/thread key.

## Testing

No test runner configured. Verify with `npm run build:typecheck` +
`npm run lint`, plus the manual Debug Logs check in each step's done-when.

## Notes for the AI

- Uses `UserTable.getRegisteredUserId()`, not `useLocationSettings.ts`'s
  `AuthContext.username` pattern - Register/Login run pre-login, so
  `AuthContext.username` is unset there. Register can't actually have
  preferences until an account exists, so narrowing has no effect there in
  practice until the user has registered once.
- `Switch` is a plain `react-native` primitive - first use of it in the app;
  no custom toggle component exists yet.
- Registry is hand-authored, not derived - matches 13b's "no tree-walk"
  approach.
