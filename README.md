# zahln

Take-home for Zahln. npm workspaces.

- `packages/api` – shared types + fetch client
- `apps/web` – Studierendenwerk dashboard

Student app and till are not in here yet.

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
