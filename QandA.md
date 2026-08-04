# General

**Q: App Store Connect's "Sign in details" restriction question — how should I answer it for my app?**
A: Answer "Yes" and check "account sign in details" (and "biometric authentication", since you offer fingerprint login). Your login is a fully local username/password system (SecureStore, no backend), so instead of demo credentials you can tell Apple reviewers to create their own free account via the Register screen, and note that biometric is an optional fallback — reviewers should use password login since Face ID/Touch ID won't be set up on review devices.

**Q: What does Play Console's "Save time by using AI to add translations..." message mean?**
A: It's an option to let Google auto-generate store listing translations (title/short/full description) for each language, instead of you writing them by hand.

**Q: What is a Play Console "featured graphic" (1024x500)?**
A: A wide banner image used when Google promotes your app outside your own listing page — homepage, category carousels, search banners, TV/Chromebook listings. Not the app icon or a screenshot.

**Q: Do we need to do anything with the "app signing key" public certificate Play Console shows?**
A: No, not for this app — it's only needed to register with APIs that verify signing certs (Maps, Firebase, Google Sign-In), and this app uses none of those.

**Q: For registering with an API provider, do you want the app signing key certificate or the upload key certificate?**
A: The app signing key certificate — that's what's actually on production installs from the Play Store. The upload key is stripped off during Google's re-signing and never reaches user devices.

**Q: Do I really need 12 opted-in testers before publishing to production?**
A: Yes — new/unverified developer accounts must run a closed test with 12+ opted-in testers for 14 continuous days before Google grants production access.

**Q: If I sign the Play Store release with a new keystore, does that make it "a different app" on my phone?**
A: Not on the Play Store (first upload just establishes the key). Locally, yes — Android blocks installing an update signed with a different cert than what's already installed, so a sideloaded release build with a new key would need the old copy uninstalled first (wiping local data unless exported).

### What does the FOREGROUND_SERVICE_MEDIA_PLAYBACK permission actually allow?

It lets an app run a foreground service typed "mediaPlayback" so audio/video keeps playing with a persistent notification even after the user leaves the app; ordinary in-app playback while the screen is open needs no such permission.
