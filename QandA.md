# services/database/database.ts

**Q: Are SQLite connections dropped when I close the app, remove it from background, and reload?**

A force-stop drops them all — locks live in the OS process, so killing it releases them. A JS bundle reload does not: the native process and expo-sqlite's connection cache survive it, and a registered background task can keep its own process (and connection) alive after a swipe-away.
