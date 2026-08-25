# Debate Eval Suite

A small, real eval for the multi-model debate flow. It drives the actual backend
over HTTP — the same endpoints the app calls — and scores what comes back. No
mocks, no stubbed providers: if the eval passes, the flow really worked.

## What it runs

12 fixed debate topics (`cases.js`) through two flows:

| Flow | Endpoint | What it exercises |
| --- | --- | --- |
| `debate` | `POST /api/llm` | One debate turn per model — ChatGPT, Claude, Gemini, Grok, Cohere — with context accumulating turn by turn, mirroring the roster and persona/flavor rotation in `IntelligentDebateScreen.js`. |
| `synthesis` | `POST /api/debate-flow` | A full multi-round debate plus the Democrat / Republican / Independent policy documents synthesized from it, and the Independent coalition decision. |

Default is `--flow both`.

## Running it

The runner needs a backend to talk to. Start one:

```bash
cd backend
cp .env.example .env      # add real provider keys — see "API keys" below
npm install
npm start                 # listens on 5001
```

Then, from the repo root:

```bash
npm run eval --prefix backend        # all 12 cases, both flows
node evals/runner.js --limit 3       # quick smoke run
node evals/runner.js --flow debate   # per-model turns only (fastest)
node evals/runner.js --only carbon-tax,wealth-tax
node evals/runner.js --base-url https://your-deployment
```

Exit code is `0` when every case passes and `1` when any case fails, so it drops
into CI as-is. Every run writes a full JSON report to `evals/results/` (plus
`latest.json`) with each response, timing, and check verdict.

| Option | Default | |
| --- | --- | --- |
| `--base-url <url>` | `http://localhost:5001` | Backend to test (`EVAL_BASE_URL` also works) |
| `--flow <name>` | `both` | `debate`, `synthesis`, or `both` |
| `--rounds <n>` | `1` | Debate rounds for `/api/debate-flow` |
| `--limit <n>` | all | First n cases only |
| `--only <ids>` | all | Comma-separated case ids |
| `--concurrency <n>` | `2` | Cases in flight at once |
| `--timeout <ms>` | `180000` | Per-request timeout |
| `--allow-fallback` | off | RAG-fallback responses warn instead of fail |
| `--json <path>` | `evals/results/<stamp>.json` | Report location |
| `--quiet` | off | Summary only |

## The checks

All scoring is deterministic — no LLM judge. Each case runs every check and
fails if any check fails; `warn` is reported but does not fail the run.

**Per-model debate turns**

| Check | Passes when |
| --- | --- |
| `models_responded` | All 5 models returned HTTP 200 with non-empty text |
| `responses_on_topic` | Every response hits each of the case's term groups (e.g. a carbon-tax answer mentions carbon/emissions **and** tax/price) |
| `responses_clean` | No token corruption — same glitch patterns `validateAndCleanResponse()` uses in `server.js` |
| `responses_in_character` | No "as an AI", refusals, or "both sides have merit" non-answers |
| `responses_right_length` | 12–400 words — catches truncation and runaway output |
| `responses_distinct` | No two models returned byte-identical text |
| `served_by_live_models` | No response came from the RAG fallback (`mock: true`) |

**Synthesis**

| Check | Passes when |
| --- | --- |
| `debate_flow_completed` | `/api/debate-flow` returned 200 |
| `all_parties_argued` | `rounds × 3` arguments, with Democrat, Republican and Independent all represented |
| `documents_present` | All three party documents have content |
| `synthesis_on_topic` | Each document hits the case's term groups — the "did the final synthesis stay on topic" check |
| `synthesis_clean` | No token corruption in the documents |
| `synthesis_right_length` | 60–700 words for LLM-written documents (templated coalition statements are exempt) |
| `synthesis_grounded_in_debate` | *(warn)* ≥20% of a document's distinctive vocabulary, topic words excluded, also appears in that party's debate arguments — i.e. the synthesis was actually built from the debate rather than from the topic string alone |
| `independent_strategy_resolved` | `independentStrategy.strategy` is `coalition` or `independent` |

`synthesis_grounded_in_debate` is a warning rather than a failure because it is a
vocabulary heuristic, not a proof. As a reference point: a document genuinely
built from the debate scores ~40%, one written from the topic alone scores 0–3%.

## API keys

Without provider keys in `backend/.env`:

- `/api/llm` still answers, but every turn comes from the political RAG
  fallback, so `served_by_live_models` fails on all cases. Use
  `--allow-fallback` if you want to exercise the plumbing without keys.
- `/api/debate-flow` returns **HTTP 500**. `synthesizeDebateIntoDocument()`
  calls `executeLLMCall('Cohere', …)` directly, which throws when
  `COHERE_API_KEY` is missing — there is no fallback on the synthesis path the
  way there is on the debate path.

So a keyless run is a plumbing check; a meaningful run needs at least
`COHERE_API_KEY` (synthesis) plus keys for whichever debate models you care
about. Note that `callLLM()` fails over to any provider with a configured key,
so a model can "respond" via a different provider than the one requested —
`served_by_live_models` tells you the response was live, not which vendor served it.

## Adding cases

Append to `CASES` in `cases.js`; don't edit existing ones, or results stop being
comparable across runs. A case is an id, the topic exactly as a user would type
it, and `terms`: a list of groups where a response must match at least one term
per group to count as on-topic. Keep groups generous enough that a real argument
passes and specific enough that generic filler doesn't.
