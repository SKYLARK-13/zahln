# zahln

Take-home for Zahln. npm workspaces.

- `packages/api` – shared types + fetch client
- `apps/web` – Studierendenwerk dashboard
- `apps/mobile` – student app + till (one Expo app, pick mode at start)

Install once, open as **Student** on one device and **Till** on another (or emulator).

## Dashboard

**Live:** https://zahln-dashboard-c70758.netlify.app  
Login: `finance` / `test1234` (candidate ID is prefilled on the live build)

Local:

```
cp .env.example .env
```

Set `VITE_CANDIDATE_ID` in `.env`, then:

```
npm install
npm run dev:web
```

## Student app

Same `.env` can also set `EXPO_PUBLIC_CANDIDATE_ID` (optional — you can type it in the app).

**Recommended (real Android app, like `react-native run-android` — no Expo Go):**

```
npm run android
```

That builds a native debug APK, installs it on the emulator/USB phone, and starts Metro. Camera/QR work in this build.

At start pick **Student app** or **Till**.

- Student: `student` / `staff` / `guest`
- Till: `cashier-campus-1` (or other cashiers)

Password is always `test1234`. PIN fallback for payments: `1234`.

Flow to test: till rings up → show QR → student scans / pastes order id → pay → till shows paid. Refunds from till menu.

For a physical phone: enable USB debugging, plug in, then `npm run android` (or use emulator). See `apps/mobile/CONNECT-PHONE.md`.

## AI tools

Cursor Agent helped with scaffolding, API client, dashboard, student/till screens, and Expo notes. I own the code for the review call.

## AI tools

Cursor Agent was used while building this take-home:

- scaffolding the monorepo, shared API client, dashboard and student app
- wiring payment idempotency / session refresh / versioned reads
- Expo / Android setup notes and small UI cleanup

I review and own the code; the review call is on me. Commits show `Co-authored-by: Cursor` because the agent helped write them — that matches “use any AI tools you want, say which and for what.”
