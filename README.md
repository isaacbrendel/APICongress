# APICongress

**APICONGRESS** — five AI models cast as random political parties fight a topic you drop. Crown a winner. Share the knockout.

## What you get

- **Trending topics** — live **X/Twitter US trends** when `X_BEARER_TOKEN` or `TWITTER_BEARER_TOKEN` is set; otherwise Reddit hot + chamber seeds
- **Random cast** every bout (Dem / Rep / Independent rivalry)
- **Live scoreboard + reactions** while arguments land
- **Share card** — copy verdict or post to X, rematch via `?topic=`
- **Optional bill** sign/veto after the verdict (secondary, not the climax)

## Quick start

```bash
# Backend
cd backend && npm install && node server.js

# Frontend
cd frontend && npm install && npm start
```

Optional env (backend):

```
X_BEARER_TOKEN=...          # live X trends
TWITTER_BEARER_TOKEN=...    # alias
OPENAI_API_KEY / ANTHROPIC_API_KEY / GOOGLE_API_KEY / XAI_API_KEY / COHERE_API_KEY
```

## Stack

React frontend · Node/Express backend · Docker optional
