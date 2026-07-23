# General

**Q: What is Applitools and how does it compare to Maestro?**
A: Applitools is AI-powered visual regression testing (screenshot diffing against a baseline, tolerant of harmless rendering noise) — a different concern from Maestro's functional testing. It has no native Maestro integration; it plugs into Appium/Selenium/Cypress/Detox instead, so combining it with Maestro would require custom glue.

**Q: Is Playwright a visual-testing alternative to Maestro for this app?**
A: No — Playwright only automates web browsers, not native Android/iOS apps, so it can't drive this app's native build (sqlite, llama.rn, biometrics, etc.) at all. It would only be relevant for testing the app's separate `react-native-web` export, not the Android app Maestro tests.

# patches/llama.rn+0.12.5.patch

**Q: What are these patch files doing, and will I need to redo them for new native dependencies?**
A: `patch-package` captures edits made inside `node_modules` (which isn't committed to git) as diff files, reapplied automatically via the `postinstall` hook on every install. New patches are only needed if you add another native (CMake) dependency you want ccache-accelerated, or if you upgrade one of these 4 packages' version (patch filenames are version-locked).
