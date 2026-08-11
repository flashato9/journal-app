# Project Plan

> One of the two planning docs you provide. Answer each section in a line or two
> (a worksheet, not an essay). Draft it yourself or let the AI help you expand and
> sharpen it; either way, the content is yours to direct. When it's filled in, run
> `/overview` to generate the project overview from this plus `build-plan.md`.

## 1. Problem - What problem are we solving?

A private, media-rich daily journal: capture moments through the day (text,
photo, video, audio, location) grouped into day-based memories, with an
on-device AI that summarizes entries and (moving forward) a conversational AI
companion.

## 2. Users - Who is this for?

General public journaling users. Intended for a real public release (Play
Store), not just personal use - the app has a hidden reviewer-unlock flow
(5 taps on the register title) built specifically for store review.

## 3. Features - What does the MVP need?

Already shipped, see `build-plan.md` for the full checklist:

- Username/password auth with biometric login and profile pictures
- Day-based journal entries with photo/video/audio attachments and Q&A prompts
- Per-entry location capture and break-reminder notifications
- On-device AI (llama.rn) day/moment summaries and a debug model-management screen
- Profile settings, zip backup/export/import, debug log viewer, share-intent import
- Android release-signing pipeline

Next up (see `build-plan.md`): a real AI companion (chat UI + backend, moving
from the current on-device model toward a cloud LLM), then the broader AI
journal assistant and organization/resurfacing backlog.

## 4. Data - What are we storing?

SQLite via Drizzle ORM. Core tables: `User`, `DayMemory`, `TimeMemory`,
`TimeMemoryQA`, `TimeMemoryMedia`, `Location`, `LocationSettings`,
`Notification`, `AIDaySummary`, `AITimeSummary`, `CompanionFieldVisibility`.
Relational shape: User -> DayMemory -> TimeMemory -> (QA, media, location),
with AI summaries as separate linked tables.

## 5. Tech - What stack are we using?

Expo (React Native 0.81 / React 19) with `expo-router` file-based routing,
TypeScript strict mode, npm. Drizzle ORM + `expo-sqlite` for storage. On-device
LLM inference today via `llama.rn` (Gemma-3-1B text, SmolVLM2-500M vision).

> TODO (confirm): the companion feature is moving toward a cloud LLM (Gemini,
> per `@google/genai` spike scripts under `scripts/test-gemini-*.ts`) rather
> than staying fully on-device - confirm the target provider, whether a proxy
> backend is needed to hold the API key, and whether on-device inference stays
> for the existing summary features or gets replaced too.

## 6. Monetize - How will this make money?

> TODO (confirm): no monetization mechanism found in the codebase.

## 7. UI/UX - How should this look and feel?

Single fixed theme (no dark/light toggle currently) driven by
`constants/colors.ts`. Photo/journal aesthetic - Polaroid-style photo frames,
card-based day/moment lists.

> TODO (confirm): any deeper style direction, reference images, or a
> dark-mode plan beyond what's already built.

## 8. Deployment - Where and how will this ship?

Android via Play Store: release-signing config plugin, signed AAB build script
(`npm run build:release-aab`), EAS credentials under `eas-creds`. CI runs a
scheduled/on-push E2E smoke suite (Maestro) against a release APK, not a
PR-gated check.

> TODO (confirm): iOS release plans, target release date, and whether the
> future cloud-LLM companion needs its own backend/hosting.
