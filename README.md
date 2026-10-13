# APICONGRESS

**[congressai.app](https://congressai.app)** — also known as CongressAI.

Pick a political topic. Five models (ChatGPT, Claude, Gemini, Grok, Cohere) get cast as random parties, take the floor one by one, and **you** crown the winner. Then share the verdict.

## How a bout works

1. **Home** — type a topic or tap a trending chip; set intensity; **Open Floor**
2. **Cast** — each model gets Democrat / Republican / Independent (2–2–1, shuffled)
3. **Debate** — one speaker at a time. After each take, read it (or tap the card for the full text). Hit **Next speaker**, or wait for the reading-time auto-advance. Last take → **Proceed to crown winner**
4. **Crown** — reaction points (Fire / Clap / Burn) are a scoreboard only. **You pick the winner**, then confirm
5. **Share** — Export a 1200×630 chamber verdict PNG (Save / Share card). LinkedIn & X link previews use that graphic via `/v/:id`. Optional bill sign/veto is secondary

## Trending topics

`GET /api/trending` pulls political-adjacent prompts only (sports/celeb noise filtered out):

- **X / Twitter** US trends when `X_BEARER_TOKEN` or `TWITTER_BEARER_TOKEN` is set
- Otherwise **Google Trends**, **Google News**, Reddit politics feeds, plus curated chamber seeds

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19 (Create React App) — `frontend/` |
| Backend | Node + Express — `backend/server.js` |
| Models | OpenAI, Anthropic, Google, xAI, Cohere |
| Deploy | Docker → Fly.io (`apicongress`, region `ord`); live at congressai.app |

UI design notes live in [`.impeccable.md`](.impeccable.md). LinkedIn Featured / OG image: `https://congressai.app/og-card.png` (1200×630).

## Quick start

```bash
# Backend (default http://localhost:5001)
cd backend
cp .env.example .env   # add API keys
npm install
node server.js

# Frontend (http://localhost:3000 → API on :5001)
cd frontend
npm install
npm start
```

Production/Docker serves the CRA build from Express on port **5000** (see `Dockerfile`, `fly.toml`).

### Environment

Copy `backend/.env.example` → `backend/.env`:

```
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_API_KEY=
XAI_API_KEY=
COHERE_API_KEY=
PORT=5001
NODE_ENV=development

# Optional — live X trends
X_BEARER_TOKEN=
# TWITTER_BEARER_TOKEN=   # alias

# Optional — frontend override (defaults: localhost:5001 in dev, same-origin in prod)
# REACT_APP_API_URL=http://localhost:5001
```

## Project layout

```
frontend/src/components/   HomeScreen, IntelligentDebateScreen, BackgroundVideo
frontend/src/utils/        casting, share
backend/server.js          API + static prod serve
backend/services/          trending, chamber voice, etc.
docs/                      older design notes (not product truth)
```

## Scripts

| Where | Command | What |
|-------|---------|------|
| `frontend/` | `npm start` | Dev UI |
| `frontend/` | `npm run build` | Production bundle |
| `frontend/` | `npm run test:e2e:share` | Playwright: debate → crown → graphic share (no `?topic=` dumps) |
| `backend/` | `node server.js` | API (and prod static) |
| root | `docker compose up` | Optional container on host `:8080` |

Proof screenshots from the last local E2E run live in `test-proof/` (home → casting → voting → verdict graphic → LinkedIn/X coach).
