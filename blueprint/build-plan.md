# Build Plan

> One of the two planning docs you provide. Write it yourself or with the AI's help.

The features that make up this project, high level and in rough build order, one
line each, no detail (that comes per feature). Rough is fine at first, but before
`/overview` runs this file should be shaped into a checkbox list the build loop
can track.

Keep it as a checklist. Run `/feature` with no number to spec the **next
unchecked** item, or `/feature 3` / `/feature "login"` to pick a specific one.
Completed features get checked off here, so the build plan doubles as your
progress tracker. A big item gets split into sub-items (4a, 4b, etc.) when you
spec it.

## Continuing after the initial build

This is a living roadmap, not a plan that freezes when the first release is
done. Keep completed items checked, then append new unchecked features as the
project grows. Optional milestone headings such as `## MVP` and `## Post-MVP`
keep a longer plan readable without changing how `/feature` finds the next
unchecked item.

Do not renumber completed features because their archived specs refer back to
those numbers. Continue with the next unused number. If a new feature materially
changes the product direction, users, data, stack, monetization, UI/UX, or
deployment, update the relevant part of `project-plan.md` too. Then re-run
`/overview` before spec'ing the feature.

You can edit this file directly or ask the AI to start a new feature by name. If
`/feature "team workspaces"` does not match an existing item, it will propose the
new build-plan line and any necessary project-plan changes, wait for approval,
refresh the overview, and then write the feature spec.

Scaffolding the app (create-next-app, etc.) and prototyping the look are
pre-build steps, not features (see the README), so don't list them here. Start
with your first real slice of functionality.

## Shipped

Adopted from the existing codebase (see `blueprint/history/features/README.md` -
none of this was built through the Blueprint loop, so there are no archived
specs for these; they're checked off because the code already exists and works).

- [x] 1. **Auth & onboarding** - username/password registration and login,
  biometric login, profile picture capture at registration, hidden
  reviewer-unlock flow for Play Store review
- [x] 2. **Daily journal entries** - day-based memory structure; All Memories,
  Day Memories, Create Memory, and Read/Edit Memory screens
- [x] 3. **Media attachments** - photo/video/audio attached to entries, media
  gallery, pinch-zoom and slide navigation between memories
- [x] 4. **Q&A journaling prompts** - question/answer pairs attached to an entry
- [x] 5. **Location capture** - per-entry location, configurable tracking
  settings, background rest-threshold detection
- [x] 6. **On-device AI summaries** - day and per-moment AI-generated summaries
  via local `llama.rn` models, debug screen for model download/activate/test
- [x] 7. **Break-reminder notifications** - location-based local notifications
  prompting a new entry
- [x] 8. **Profile settings** - change picture/username/password/auth method,
  location settings
- [x] 9. **Backup export/import** - zip archive of all data and media
- [x] 10. **Debug logs viewer**
- [x] 11. **Share-intent integration** - receive shared photos/videos from other apps
- [x] 12. **Android release signing** - config plugin and signed AAB build pipeline

## Next up

- [ ] 13. **AI companion** - replace the current mock `companionApi.ts` (fake
  connect delay, in-memory thread map) with a real backend/cloud LLM connection
  and a real chat UI, beyond the sleeping/awake `CompanionIcon` indicator.
  Split by the requirement groups in `.md/ai-features-brainstorm.md`, in build
  order:
  - [x] 13a. **Companion presence & threads** - `CompanionIcon`,
    `CompanionContext`, mock `companionApi.connect()`/`getOrCreateThread()`,
    `useCompanionThread`. Pre-existing scaffolding built before this spec loop
    covered the feature; no archived spec, kept as the foundation rather than
    rebuilt.
  - [x] 13b. **Page state reading** - each screen exposes an explicit,
    hand-authored snapshot of its own state for the companion to read on load,
    not a tree-walk scraper
  - [ ] 13c. **Remark thinking** - ideal-self model, drift detection,
    opinionated `{ mood, text }` generation (real backend call)
  - [ ] 13d. **Remark display** - trigger on page change while chat is closed,
    popup near the icon, expression synced to mood
  - [ ] 13e. **Chat mode** - tapping the icon opens the page's persistent
    thread as a real chat UI
  - [ ] 13f. **Acting via chat** - chat replies can edit real page fields
    (`update_field`), constrained by a per-screen settable-fields registry
  - [ ] 13g. **Real backend** - replace the mock `companionApi` with a real
    network client/API
- [ ] 14. **Ask your journal** - Q&A screen where the user asks a question and
  the LLM answers using their memory entries as context (`askQuestion()`)
- [ ] 15. **Auto photo captions** - caption a photo on add using `describeImage()`
- [ ] 16. **Weekly/monthly auto-summary** of memories ("here's what happened this week")
- [ ] 17. **Mood/sentiment tagging** of entries with a trend view over time
- [ ] 18. **Full-text search** across memory titles/bodies
- [ ] 19. **Tags/categories** for memories, with filtering
- [ ] 20. **Favorites/pinning** for memories
- [ ] 21. **Calendar/timeline view** to jump to a date
- [ ] 22. **"On this day"** - resurface memories from the same date in past years
- [ ] 23. **Daily/weekly reminder notification** to write a new memory
- [ ] 24. **Write streaks** - consecutive days journaled
- [ ] 25. **Map view** showing memory pins by location
- [ ] 26. **"Memories near me"** - surface past memories near current location
- [ ] 27. **Share a single memory** out to another app (text + photos, or a
  rendered image/PDF card)
- [ ] 28. **Export a date range or the whole journal as a PDF** photo book
- [ ] 29. **App-level lock** (biometric/PIN) after backgrounding, not just at login
- [ ] 30. **Per-memory private flag** hiding it from a shared/exported view
- [ ] 31. **Audio-memory transcription** to searchable text
- [ ] 32. **Multi-photo carousel** per memory instead of a grid only
- [ ] 33. **iOS release readiness** - config, signing, and store submission for iOS
- [ ] 34. **Suspense-based read loading** (exploratory) - replace scattered
  `isLoading` + `useEffect` patterns with `<Suspense>` + `use()` for read
  states only, not action states like `isSaving`; not yet approved as scope

## Format

Use checkboxes. Each item should be a feature-sized outcome, not a loose task or
a whole product area.

Good:

- [ ] 1. **Skill submission** - upload a skill package and save its metadata
- [ ] 2. **Validation result** - run checks and show pass/fail status for a skill
- [ ] 3. **Directory listing** - browse and filter published skills
- [ ] 4. **Deployment readiness** - configure Render or Vercel and verify the
  production build

Avoid:

- Upload stuff
- Database
- Make it look nice
- Auth, billing, dashboard, validation, and deploy
