# zahln

Take-home for Zahln. npm workspaces.

- `packages/api` – shared types + fetch client
- `apps/web` – Studierendenwerk dashboard
- `apps/mobile` – student app (Expo)

Till app is not in here yet.

## Dashboard

```
cp .env.example .env
```

Set `VITE_CANDIDATE_ID` in `.env`, then:

```
npm install
npm run dev:web
```

Login: `finance` / `test1234`

## Student app

Same `.env` can also set `EXPO_PUBLIC_CANDIDATE_ID` (optional — you can type it in the app).

**Recommended (real Android app, like `react-native run-android` — no Expo Go):**

```
npm run android
```

That builds a native debug APK, installs it on the emulator/USB phone, and starts Metro. Camera/QR work in this build.

Pick `student`, `staff` or `guest`. Password is always `test1234`.
PIN fallback for payments: `1234`.

For a physical phone: enable USB debugging, plug in, then `npm run android`.

Expo Go notes (optional): see `apps/mobile/CONNECT-PHONE.md`.
