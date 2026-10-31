# Open Zahln on a physical Android phone

This project uses **Expo SDK 58**. The Expo Go from Google Play is often still an older SDK, so opening the project shows **"Something went wrong"** / incompatible project.

## 1. Install the matching Expo Go (SDK 58)

1. On your phone, uninstall the Play Store Expo Go (optional but cleaner).
2. Open this on the phone browser:
   https://expo.dev/go?sdkVersion=58&platform=android
3. Download / install that Expo Go build.

## 2. Connect to Metro

### Option A — USB (most reliable on Windows)

1. Enable **Developer options** + **USB debugging** on the phone.
2. Plug the phone into the PC (accept the USB debug prompt).
3. On the PC, with Expo already running (`npm run dev:mobile`), run:

```powershell
adb reverse tcp:8081 tcp:8081
```

4. In Expo Go → **Enter URL manually**:

```text
exp://127.0.0.1:8081
```

### Option B — same Wi‑Fi

1. Phone and PC on the **same Wi‑Fi** (not phone hotspot unless PC is also on that hotspot).
2. Start Expo: `npm run dev:mobile`
3. Scan the QR **inside Expo Go** (not with the normal camera app), or type the `exp://IP:8081` URL shown in the terminal.

### Option C — tunnel (needs Expo login)

```powershell
npx expo login
npm run dev:mobile:tunnel
```

Then scan the new QR.

## Still failing?

- Windows Firewall may block port `8081` — allow Node.js when prompted.
- Emulator works because Expo downloads the matching Expo Go for the emulator automatically. The physical phone needs the matching APK from step 1.
