# Q&A

# General

## What does `npx expo run:android --device` do?

It generates the APK, installs it on the device, and launches it.

## When I first ran that command I got an error, what was that error?

`INSTALL_FAILED_VERSION_DOWNGRADE` — the phone already had `versionCode 2` installed, but `app.json` had no explicit `versionCode` so it defaulted to `1`.

## Before running `npx expo run:android --device`, do I need to increment versionCode?

Not always — only if the currently-installed build's `versionCode` is equal to or higher than the one in `app.json`.

## How do I check the versionCode for the APK on my phone?

`adb shell dumpsys package com.relentless.memory_journal | Select-String versionCode` → e.g. `versionCode=3 minSdk=24 targetSdk=36`

## What does "adb" stand for / mean?

Android Debug Bridge — a command-line tool that lets your PC talk to a connected Android device (install apps, run shell commands, pull logs, etc.).

## Is adb like ssh but for Android?

Similar idea (remote shell), but over USB instead of network, with Android-specific commands like `install` and `logcat`.

## What does `adb shell` mean?

Opens an interactive shell on the device — subsequent commands run there, not on your PC.

## What does `adb shell <command>` do?

Runs that command on the device and returns the output (no interactive shell).

## What does `adb devices` do?

Lists all Android devices currently connected via USB or Wi-Fi.

## What does `adb logcat` do?

Streams logs from the device's log buffer to your PC. Apps and the OS write logs on the device; logcat reads and displays them on your computer.

## Why doesn't `adb logcat` stop?

It's a live stream — logs keep coming as they happen. Press Ctrl+C to stop.

## Does `adb reboot` reboot my computer?

No, it reboots the Android device — fully restarts the OS and all apps.

## What do `adb push` and `adb pull` do?

`push` copies files from your PC to the device. `pull` copies files from the device to your PC.

## What's the difference between public and private storage on Android?

Public storage (Downloads, Pictures) is visible when you plug in via USB and accessible to all apps. App-private storage (`/data/data/app-name/`) is hidden and only that app can access it — you need `adb pull` to copy it.

## How do I list the file system on the phone?

Use `adb shell ls <path>` — for example, `adb shell ls /data/data/` lists all app folders, or `adb shell ls /sdcard/` lists public storage.

## Why do I get "Permission denied" for `/data/data/`?

Android's security — adb runs as a limited user and can't access other apps' private folders. You can access your own app's folder: `adb shell ls /data/data/com.relentless.memory_journal/`. To access all folders, you'd need to root the device.

## What is `pm`?

Package manager — handles app installation, uninstallation, and queries. Use `adb shell pm list packages | Select-String memory` (PowerShell) to list and filter apps.

## How do I access my app's private data without rooting?

Use `adb shell run-as <package-name>` to run commands as your app. For example, `adb shell run-as com.relentless.memory_journal ls` lists your app's data folder.

## What does `run-as` do?

Executes a command with the same permissions/access level as a specific app — so you can read/write files that only that app normally can access.

## What is `dumpsys`?

Dumps diagnostic info from Android system services. For example, `dumpsys package` shows app info, `dumpsys battery` shows battery status, `dumpsys meminfo` shows memory usage.

## What is a package?

In Android, a package is an installed app identified by a unique name like `com.relentless.memory_journal`. More broadly, "package" means a software bundle (npm packages, apt packages, etc.).

## Does each package have its own folder?

Yes — each app has a private folder at `/data/data/<package-name>/` for databases, preferences, cache, and other private data.

## What's the difference between `/data/data/<package>/` and `/data/user/0/<package>/`?

Same folder, different paths. `/data/user/0/` is the actual location on modern Android; `/data/data/` is kept for backwards compatibility. The `0` is the primary user ID.

## What is the `0` in `/data/user/0/`?

Primary user ID — Android supports multiple users (mainly on tablets). Each user gets `/data/user/1/`, `/data/user/2/`, etc. User `0` is the main owner.

## Is everything the app needs in `/data/user/0/<package>/`?

Mostly — the folder contains databases, preferences, cache, and runtime data. The app's code (APK) is stored separately in `/data/app/`.

## Where does the APK code live vs app data?

`/data/app/` has the APK (app code, JavaScript, resources). `/data/user/0/<package>/` has app-generated data (databases, preferences, files).

## What does APK stand for?

Android Package Kit (or Android Application Package) — the file format for Android apps, like .exe on Windows.

## Can I use `run-as` to access `/data/app/`?

No — `run-as` only works for a specific app's private data. `/data/app/` is a system directory requiring root access.

## How can I see what's in `/data/app/` without root?

Use `adb shell pm path <package-name>` to find the APK path, then `adb pull <path> .` to copy it to your PC. Or check your Expo build output — it already generated the APK locally.

## What's actually in the `/data/app/` folder?

Each app has its own folder containing the APK, compiled code (.oat/.odex files), and resources.

## What folders are in `/data/user/0/<package>/`?

**databases** — SQLite databases (structured data). **shared_prefs** — key-value settings. **files** — app-created files. **cache** — temporary data. **app_bridgeless_dev_js_split_bundles** — your JavaScript code. **code_cache** — compiled code. **no_backup** — excluded from backup. **app_webview, app_textures** — WebView/texture caches.

## Can SQLite databases be in both `databases/` and `files/` folders?

Yes — `databases/` is for databases created via Android's standard API. `files/` is for general app files, which can include SQLite databases your app explicitly saves there.

## What is `ProfileInstaller`?

An Android library that optimizes your app's performance based on runtime profiling. The files track whether a profile was installed and when. You don't need to manage these — the system handles it.

## Which files in `/files/` are app-created vs system-generated?

App-created: SQLite database, images, sounds. System-generated: profileInstalled, app-logs, profileinstaller_* metadata.

## What does `INSTALL_FAILED_UPDATE_INCOMPATIBLE` signature error mean?

The old app on your device was signed with a different certificate than the new APK. Android won't replace it. Uninstall first: `adb uninstall com.relentless.memory_journal` then reinstall.

## Does `npx expo run:android --device` sign the APK?

Yes — it builds an APK and automatically signs it with a debug certificate (Expo manages this). If the signature changes, you get the incompatibility error.

## How does the EAS signing plugin prevent signature mismatches?

`plugins/withEasDebugSigning.js` configures the build to sign with a consistent EAS-managed keystore instead of random debug keys. So signatures always match and Android allows updates without errors.

## Do I need the EAS signing plugin for local development?

No — just put the EAS keystore at `~/.android/debug.keystore`, change its password to `android`, and Gradle uses it automatically. The plugin is overkill for local builds — it's for teams/CI needing consistent signing across machines.
