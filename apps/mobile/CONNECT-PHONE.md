# Running on a phone / Android

## What works today

- **Android emulator + Expo Go** — works for day-to-day coding.
- Enter order ID manually on the Scan screen if you don’t want camera.

## Expo Go on a physical phone

This project is **Expo SDK 58**. Play Store Expo Go is often older, so you get “Something went wrong”.

1. Install matching Expo Go: https://expo.dev/go?sdkVersion=58&platform=android  
2. USB debugging on, then:

```powershell
npm run dev:mobile:usb
adb reverse tcp:8081 tcp:8081
```

3. In Expo Go → Enter URL: `exp://127.0.0.1:8081`

## Native build (like `react-native run-android`)

```powershell
npm run android
```

That is Expo’s equivalent of `npx react-native run-android` (`expo run:android`).

**Note (Windows):** Expo SDK 58 / RN 0.88 currently fails local CMake/`ninja` builds on many Windows machines (safe-area-context codegen paths). If `npm run android` fails with a `ninja` / `mkdir` error:

- Keep using the **emulator** for development, or
- Build the installable APK later with **EAS Build** (cloud Linux) for the assignment deliverable.

Do not switch the whole app to bare `react-native init` — same native modules, same Windows issue, more setup.
