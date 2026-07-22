# General

**Q: What is Applitools and how does it compare to Maestro?**
A: Applitools is AI-powered visual regression testing (screenshot diffing against a baseline, tolerant of harmless rendering noise) — a different concern from Maestro's functional testing. It has no native Maestro integration; it plugs into Appium/Selenium/Cypress/Detox instead, so combining it with Maestro would require custom glue.

**Q: Is Playwright a visual-testing alternative to Maestro for this app?**
A: No — Playwright only automates web browsers, not native Android/iOS apps, so it can't drive this app's native build (sqlite, llama.rn, biometrics, etc.) at all. It would only be relevant for testing the app's separate `react-native-web` export, not the Android app Maestro tests.
