# Qling

https://qling-hyu-hangyeol.onrender.com/

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
- Deploy Firestore rules with `npx firebase deploy --only firestore:rules`.
- Render must define `FIREBASE_SERVICE_ACCOUNT` as the full service account JSON string.
- Render must define `OPENAI_API_KEY` for the current moderation and AI fallback paths.
- Firebase Auth authorized domains must include the final Render domain.
- Copy `apiKey`, `appId`, `messagingSenderId`, and `measurementId` from Firebase Console -> Project settings -> General -> Web app config into `firebase-applet-config.json` and `public/firebase-messaging-sw.js` before production deployment.
- Do not commit any service account JSON file or private credentials.

Operational setup, environment variables, emulator details, deployment notes, and scheduled-job examples are documented in `docs/ops.md`.

## Project Docs

- `docs/PRD.md`
- `docs/TODO.md`
- `docs/phase.md`
- `docs/matching_algorithm.md`
- `docs/ops.md`
