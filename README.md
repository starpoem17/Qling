# Qling

https://qling-hangyeol-hyu.onrender.com/

Qling is an Express/Vite/Firebase PWA for anonymous worry publication, human replies, feedback, rematching, and internal operational jobs.

## Local Setup

```sh
npm install
npm run dev
```

## Verification

```sh
npm test
npm run lint
npm run build
npm run test:rules
```

## Firebase/Render Deployment Configuration

- Firebase project ID: `qling-hyu`.
- Production URL: `https://qling-hangyeol-hyu.onrender.com`.
- Deploy Firestore rules with `npx firebase deploy --only firestore:rules`.
- Firebase Auth authorized domains must include `qling-hangyeol-hyu.onrender.com`.
- Render service type: Web Service, not Static Site.
- Render build command: `npm install && npm run build`.
- Render start command: `npm start`.
- Required Render environment variables: `NODE_ENV=production`, `NODE_VERSION=22`, `FIREBASE_SERVICE_ACCOUNT=<full Firebase service account JSON string>`, `OPENAI_API_KEY=<server-side API key>`.
- Do not commit any service account JSON file or private credentials.

Operational setup, environment variables, emulator details, deployment notes, and scheduled-job examples are documented in `docs/ops.md`.

## Project Docs

- `docs/PRD.md`
- `docs/TODO.md`
- `docs/phase.md`
- `docs/matching_algorithm.md`
- `docs/ops.md`
