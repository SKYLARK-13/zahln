# Zahln frontend — design notes

Take-home notes for the Mensa payment flow. Written against what we shipped and what we would do next.

## 1. Architecture

```
                    ┌─────────────────┐
                    │  dev.zahln.de   │
                    │   (mock API)    │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
        apps/mobile     packages/api    apps/web
        (Expo RN)       shared client   (Vite React)
        Student | Till  types + fetch   finance dash
```

**Monorepo (`npm` workspaces)**

| Path | Role |
|------|------|
| `packages/api` | Shared TypeScript types, `ZahlnClient`, `ApiError`, `newerByVersion` |
| `apps/mobile` | One Expo app: pick **Student** or **Till** at login |
| `apps/web` | Studierendenwerk dashboard (totals, attention, search, CSV) |

**What is shared**

- Auth + candidate header (`X-Candidate-Id`)
- Idempotent POSTs (`Idempotency-Key`)
- 401 → re-login with stored credentials, then retry
- Retry of retryable failures on GET and on POST when a key is present
- Versioned resources: never replace UI state with an older `version`

**What is not shared**

- Navigation / screens (RN vs React Router)
- Session storage (AsyncStorage vs `localStorage`)
- Camera / biometrics / QR rendering (mobile only)

Student and till are one binary for this take-home so one APK covers both roles. In production they would be separate apps (or at least separate entry bundles) with different store listings and permission sets.

## 2. Payment flow and failure modes

### Happy path

```
Till                         API                        Student
 │                            │                            │
 │ POST /orders (+Idem-Key)   │                            │
 │───────────────────────────►│                            │
 │ order open + qrPayload     │                            │
 │◄───────────────────────────│                            │
 │ show QR                    │                            │
 │ poll GET /orders/{id}      │   scan QR → order id       │
 │◄───────────────────────────┤◄───────────────────────────│
 │                            │   GET /orders/{id}         │
 │                            │   (amount for price group) │
 │                            │◄───────────────────────────│
 │                            │   confirm biometrics/PIN   │
 │                            │   POST .../payments        │
 │                            │   (+ same Idem-Key)        │
 │                            │◄───────────────────────────│
 │                            │   payment pending|…        │
 │ GET → status paid          │   poll GET /payments/{id}  │
 │◄───────────────────────────┤───────────────────────────►│
```

### States we show (never invent)

| Surface | Source of truth | UI rule |
|---------|-----------------|---------|
| Student confirm | `GET /orders/{id}` | Amount and items from server for this price group |
| Student result | `GET /payments/{id}` | pending → processing; confirmed / declined only when API says so |
| Till wait | `GET /orders/{id}` | open / paying → waiting; paid / expired from API only |
| History / dashboard | list/detail endpoints | badges from `status` + `needsAttention` |

### When things go wrong

1. **Double tap / retry after timeout**  
   Create-order, create-payment, and create-refund keep one `Idempotency-Key` for that intent. Retries send the same key. A new key is only minted after a finished attempt (or a new cart / new pay screen).

2. **Flaky network / 5xx with `retryable`**  
   Client retries once for GET, and for POST when an idempotency key is set. Screens keep polling; they do not flip to “paid” on a local guess.

3. **Stale GET**  
   Responses carry `version`. `newerByVersion` ignores older payloads so a late response cannot overwrite a newer one.

4. **401 mid-flow**  
   Refresh via stored username/password, then retry the request. If refresh fails, session is cleared and the user signs in again.

5. **QR payload**  
   API returns `zahln://pay?order=ord_…`. The student parser extracts the order id (not the path segment `pay`).

6. **Till leaves the QR screen**  
   Allowed: student can still pay with the QR they already saw. Till can start the next order. Confirmation is still whatever `GET /orders/{id}` returns when someone is watching it.

7. **Refund errors**  
   Till shows the API problem text (`refund_exceeds_payment`, window closed, etc.) and keeps the same idempotency key until a successful refund intent completes.

## 3. Shipping releases (no JS hotfix)

Store apps cannot be patched like a website.

**What we would do**

1. **Versioned binaries** — `versionCode` / `CFBundleVersion` bump every store build; EAS profiles for preview vs production.
2. **Remote config gate** — already on the API as `GET /config` → `minAppVersion`, `paymentsEnabled`. On launch (and before pay):
   - if `appVersion < minAppVersion` → blocking “update required” screen (store link), no pay UI
   - if `!paymentsEnabled` → soft kill: browse history ok, pay / new order disabled with clear copy
3. **Staged rollout** — Play staged release + TestFlight; kill switch first if a bad build ships.
4. **Dashboard** — Netlify (or similar) can ship independently; no store lag.
5. **Observability** — crash reporting (e.g. Sentry) + payment funnel events (`order_created`, `pay_started`, `pay_confirmed`, `pay_failed`) before relying on user reports.

Not wired end-to-end in this take-home; the hooks exist on the API and belong in the client before production traffic.

## 4. Security and data on the device

- **Tokens**: access token in AsyncStorage / `localStorage` with username + password for the mock’s short-lived token refresh. For production: refresh tokens in the OS secure store (Keychain / Keystore), never persist the password, prefer biometric unlock of the session.
- **Candidate ID**: sandbox tenancy header only; not a user secret, but still not logged to third parties.
- **Pay confirm**: biometrics when available, PIN fallback for the mock (`1234`). Production PIN would be server-verified or replaced by bank / wallet auth.
- **TLS**: HTTPS only to `dev.zahln.de` / production API.
- **Least privilege**: student build should not need till APIs in a split-app world; camera only on scan screens.
- **No personal production data** in this exercise — mock users only.

## 5. Technology choices

| Choice | Why | Would change |
|--------|-----|--------------|
| npm workspaces + shared `@zahln/api` | One client contract for all surfaces | Keep; maybe add generated types from OpenAPI CI |
| Expo (SDK 58) + EAS APK | Fast Android ship without local NDK pain on Windows | Split student/till apps for store |
| Vite + React for dashboard | Simple SPA deploy | Fine; RSC not needed here |
| React Navigation / React Router | Standard for each platform | Keep |
| Netlify for web | Zero-ops static host + SPA redirects | Fine for this scope |
| i18n de/en in-app dictionaries | Brief asks DE+EN | Move to a proper catalog if copy grows |

**About the API (yours)** — solid for a take-home: explicit problem objects, idempotency, version fields, attention flags, and config for kill-switch / min version. That matches how we structured the client.

## 6. What the API is missing (and what I would change)

1. **Webhooks or till push** — polling works; SSE/websocket for “order paid” would cut till load and battery.
2. **Official deep-link schema** — document `zahln://pay?order=` (or issue a signed short code) so clients do not guess.
3. **Refresh tokens** — avoid storing passwords on device for session renewal.
4. **Idempotency key TTL / replay docs** — how long the server remembers a key; client UX for “key expired, safe to mint new?”.
5. **Config polling interval** — how often clients must re-check `paymentsEnabled` / `minAppVersion`.
6. **Pagination cursors** — already there; cursor expiry rules would help offline dashboards.
7. **Receipt / PDF** — finance often wants a stable receipt URL per payment.

**Client changes I would still make with more time**

- Enforce `minAppVersion` / `paymentsEnabled` on launch and before pay
- Split student and till apps
- Secure store for tokens; drop password persistence
- Automated tests around idempotency and `newerByVersion`
- Crash + funnel analytics
- Stronger a11y pass (screen reader labels, contrast audit)

## 7. What we built vs left out

**Built:** shared client, student pay + history, till order/QR/refunds, finance dashboard (totals, attention, search, CSV), Android APK via EAS, live Netlify dashboard, DE/EN.

**Left out on purpose (time / ranking):** separate till binary, crash reporting, CI, full kill-switch UI, forced-update UI, offline queue. Correctness of money movement beat those; the design above is how we would add them without changing the API shape much.
