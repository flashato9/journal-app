# login.tsx

Q: If the app is removed from the recent-apps/background list, does location tracking keep running?
A: Depends on OS. Android: swiping from Recents doesn't stop it, since the foreground-service notification keeps the task alive (aggressive OEM battery managers may still kill it). iOS: force-quitting via the App Switcher does stop it, with no auto-relaunch, since the app uses continuous background updates rather than the "significant location change" API.

Q: Does SecureStore data (e.g. currentUsername) get wiped after some time?
A: No, neither platform expires it by time. Android deletes it only on app uninstall; iOS Keychain data can even survive uninstall/reinstall (undocumented, not guaranteed).

# logger.ts

Q: Why do we have logger.ts, and what does it do that appLogger.ts doesn't?
A: logger.ts is the old hand-rolled file-persistence logger (powers the Debug Logs screen); appLogger.ts is the new react-native-logs wrapper. Since we removed logger.ts's console hook, nothing currently writes to its file — pending the fileAsyncTransport task to fix.

Q: What is https://github.com/getsentry/sentry-react-native?
A: The official Sentry SDK for React Native — crash/error tracking and performance monitoring. It appeared in react-native-logs' README as an optional transport; not used in this app.

Q: Is Sentry a paid log management service?
A: Both — a free single-user Developer tier exists, then paid plans starting at Team ($26/mo) and Business ($80/mo), plus custom Enterprise pricing.
