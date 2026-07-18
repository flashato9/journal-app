# Debugging an Android device over Wi-Fi (ADB)

1. Connect the device via USB and make sure debugging is working.
2. `adb tcpip 5555` — makes the device start listening for connections on port 5555.
3. Look up the device IP address:
   - `adb shell netcfg`, or
   - `adb shell ifconfig` (Android 6.0+), or
   - `adb shell ip -f inet addr show` (Android 10+)
4. You can disconnect the USB now.
5. `adb connect <DEVICE_IP_ADDRESS>:5555` — connects to the server set up on the device in step 2.
6. Now you have a device over the network with which you can debug as usual.

# Creating a standalone (non-development) build

A standalone build is an installable APK/AAB that runs on its own — no Metro/dev server connection needed (unlike a development build, which is a client that still talks to your dev server). `eas.json` has profiles for this: `preview` (internal distribution — installable APK, no store submission) and `production` (store-ready AAB).

## Local build (matches current keystore setup)

```
npx expo run:android --variant release
```

Runs `expo prebuild` to regenerate the gitignored `/android` folder, then builds a release APK locally via Gradle — no EAS account or cloud upload needed. The APK lands under `android/app/build/outputs/apk/release/`. Requires Android Studio/SDK installed locally. Uses the local debug keystore, so it stays consistent with the existing installed app (avoids `INSTALL_FAILED_UPDATE_INCOMPATIBLE`).

## Cloud build (EAS)

```
eas build --platform android --profile preview
```

Builds on Expo's servers and gives a download link/QR code to install directly on a phone. Needs a free Expo account; no local Android SDK required.
