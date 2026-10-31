# zahln

Frontend take-home for Zahln (Mensa lunch rush). npm workspaces.

| Package | What |
|---------|------|
| `packages/api` | Shared types + `ZahlnClient` (idempotency, refresh, versioned GETs) |
| `apps/web` | Studierendenwerk finance dashboard |
| `apps/mobile` | Student app + till in one Expo app (pick mode at login) |

Design notes: [DESIGN.md](./DESIGN.md)

## Deliverables

1. **Repo** — this private GitHub repo (commit history as built)
2. **Android APK** — https://expo.dev/artifacts/eas/NB0aCV14L3fJIQKZ90lBuEp4XLjewCaM5b-LcxnRwnE.apk  
   (fintech-UI build; install on phone as Student, emulator as Till — or both)
3. **Dashboard** — https://zahln-dashboard-c70758.netlify.app  
   Login: `finance` / `test1234`
4. **Design doc** — [DESIGN.md](./DESIGN.md)

Candidate ID: from the take-home email (`c_…`). Live dashboard prefills it from the build env; type the same ID in the mobile app.

## Run locally

```
cp .env.example .env
# set VITE_CANDIDATE_ID and EXPO_PUBLIC_CANDIDATE_ID
npm install
npm run dev:web      # dashboard → http://localhost:5173
npm run android      # native Android (preferred over Expo Go)
```

### Test logins (password always `test1234`)

| Surface | Users |
|---------|--------|
| Dashboard | `finance` |
| Student | `student`, `staff`, `guest` |
| Till | `cashier-campus-1`, `cashier-nord-1`, `cashier-bibliothek-1` |

Pay PIN fallback: `1234`.

**Flow:** till adds items → Show QR → student scans / pastes order id → confirm → till shows paid. Refunds from till **Refund**.

## What we built

- Shared API client with `Idempotency-Key`, 401 re-login, retryable errors, `newerByVersion`
- Student: scan QR (deep link `zahln://pay?order=…`), biometrics/PIN, result polling, history
- Till: menu/cart, QR wait (can start next order while waiting), refunds
- Dashboard: daily totals per mensa/till, needs-attention, search, CSV export, DE/EN
- Installable Android APK (EAS) + live Netlify dashboard

## What we left out (and why)

| Skipped | Why |
|---------|-----|
| Separate student vs till store apps | One APK was enough to prove both flows; split is product packaging |
| Kill-switch / force-update UI | API already has `paymentsEnabled` / `minAppVersion` — described in DESIGN.md |
| Crash reporting / CI | Optional in the brief; correctness first |
| iOS build | Brief asked for installable Android |

## Important libraries

| Lib | Why |
|-----|-----|
| Expo + EAS | Android delivery without fighting local native toolchains |
| React Navigation | Mobile stacks |
| `expo-camera` / `expo-local-authentication` | QR scan + biometrics |
| `react-native-qrcode-svg` | Till QR |
| Vite + React Router | Dashboard SPA |
| `@react-native-async-storage/async-storage` | Session + locale |

## AI tools

Cursor Agent was used for:

- monorepo scaffolding, shared API client, dashboard and mobile screens
- payment idempotency / session refresh / versioned reads
- Expo / EAS / Netlify wiring and UI polish

I review and own the code for the review call. Some commits include `Co-authored-by: Cursor` where the agent wrote the change.
