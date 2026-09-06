# ARWEEN: Superior Operations Management Cycle

> Turn invisible daily efforts into transparent project progress and fair merit recognition.

**Hack2Skill / Gen AI Academy APAC — `#AccelerateAIWithCloudRun`**

| | |
|---|---|
| **Live app (Cloud Run)** | https://arween-app-619248313782.asia-southeast1.run.app |
| **Public repo** | https://github.com/thanamethawat-cmyk/arween |
| **Region** | `asia-southeast1` |

---

## What judges should click (4 steps)

1. Open the Live URL → **Sign in** with Google or Email/Password.
2. Create a project (or open an existing one).
3. Add a **daily work log** → Gemini returns a **Merit Score (0–10)** with rationale.
4. Use the **multi-turn AI chat** and optional **Google Docs / Sheets / Drive / Meet / Slides** links.

If the page is empty after login, create one sample project and add 1–2 logs so scoring and chat have context.

---

## Problem

Daily contributions (especially behind-the-scenes work) are hard to see. Managers score from memory; HR systems sit apart from the workspace. ARWEEN records project evidence, lets Gemini evaluate impact with an audit trail, and rolls progress into a live dashboard — humans still decide rewards.

---

## Architecture (submitted path)

```
[ Next.js 14 + Tailwind ]
        │
        ├── Auth ──────> Firebase Authentication (Google / Email)
        ├── Data ──────> Cloud Firestore (user-isolated: users/{uid}/...)
        ├── AI ────────> Google Gemini (multi-turn + merit evaluation)
        └── Secrets ───> Google Cloud Secret Manager → Cloud Run
```

### Mandatory checklist (implemented)

- [x] User authentication via Firebase
- [x] Multi-turn interaction with the Gemini API
- [x] User-isolated Firestore document storage (`users/{uid}/projects/...`)
- [x] Secure API key retrieval via Google Cloud Secret Manager

### Not the submitted path

This repository also contains an **experimental organization layer** (Prisma / PostgreSQL / NextAuth, invites, disputes). That code is **not** what is deployed on the Live URL. Judges should evaluate the **Firebase + Firestore + Gemini** path only.

---

## Features (MVP)

1. Project workspace + daily logs (tasks, blockers, progress)
2. Invisible AI Observer — Merit Score with transparent rationale
3. Progress % and cumulative merit on the dashboard
4. Team / project AI summary
5. Google Workspace link hub (Docs, Sheets, Drive, Meet, Slides)
6. Cloud Run deploy with Secret Manager for `GEMINI_API_KEY`

---

## Run locally

```bash
npm install
cp .env.example .env
# Fill GEMINI_API_KEY and NEXT_PUBLIC_FIREBASE_*
npm run dev
```

Open http://localhost:3000

### Environment

```env
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.0-flash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Never commit `.env`. Keep the Gemini API key only in Secret Manager for Cloud Run.

---

## Deploy (Cloud Run)

```bash
gcloud run deploy arween-app \
  --source . \
  --region asia-southeast1 \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest
```

Requires build-time Firebase public client vars (see `Dockerfile` / Cloud Build) and a Secret Manager secret named `GEMINI_API_KEY`.

---

## Google AI Studio continuation

This repo is the source of truth for importing into **Google AI Studio Build Mode** (Import from GitHub → iterate → Publish). Keep Firebase Auth, user-isolated Firestore, Gemini multi-turn, and Secret Manager. Do not replace this path with the older MeritSpace prototype.

---

## Product docs (Thai)

- [Blueprint](docs/พิมพ์เขียว-ARWEEN.md)
- [Platform status](docs/สถานะแพลตฟอร์ม.md)
- [Master data](docs/ข้อมูลหลัก-ARWEEN.md)

---

## Author

Thanamethawat Sriphithak — System Architect & AI Solution Designer
