#!/usr/bin/env node
'use strict';

/**
 * Eval runner for the multi-model debate flow.
 *
 * It drives the real backend over HTTP — no mocks, no stubbed providers:
 *
 *   debate    POST /api/llm       once per model, context accumulating,
 *                                 exactly as IntelligentDebateScreen.js does.
 *   synthesis POST /api/debate-flow  full multi-round debate + the party
 *                                 documents synthesized from it.
 *
 * Usage: node evals/runner.js [options]   (see --help)
 */

const fs = require('fs');
const path = require('path');
const { CASES } = require('./cases');
const checks = require('./checks');

// Mirrors the AI_MODELS roster and the persona/flavor rotation in
// frontend/src/components/IntelligentDebateScreen.js.
const MODEL_ROSTER = [
  { id: 'chatgpt', model: 'ChatGPT', party: 'Democrat', persona: 'standard', flavor: 'balanced' },
  { id: 'claude', model: 'Claude', party: 'Republican', persona: 'the_absolutist', flavor: 'aggressive' },
  { id: 'gemini', model: 'Gemini', party: 'Independent', persona: 'the_pragmatist', flavor: 'analytical' },
  { id: 'grok', model: 'Grok', party: 'Democrat', persona: 'the_firebrand', flavor: 'charismatic' },
  { id: 'cohere', model: 'Cohere', party: 'Republican', persona: 'the_diplomat', flavor: 'balanced' }
];

const TURN_WORDS = { min: 12, max: 400 };
const DOC_WORDS = { min: 60, max: 700 };
const GROUNDING_MIN = 0.2; // share of document vocabulary traceable to the debate

const DEFAULTS = {
  baseUrl: process.env.EVAL_BASE_URL || 'http://localhost:5001',
  flow: 'both',            // debate | synthesis | both
  rounds: 1,               // debate rounds for /api/debate-flow
  concurrency: 2,
  timeout: 180000,
  limit: 0,                // 0 = all cases
  only: null,              // comma-separated case ids
  allowFallback: false,    // treat RAG-fallback responses as warnings, not failures
  json: null,              // report path (defaults to evals/results/<stamp>.json)
  quiet: false
};

const HELP = `
Multi-model debate eval suite

  node evals/runner.js [options]

Options
  --base-url <url>     Backend base URL          (default ${DEFAULTS.baseUrl})
  --flow <name>        debate | synthesis | both (default ${DEFAULTS.flow})
  --rounds <n>         Debate rounds for /api/debate-flow (default ${DEFAULTS.rounds})
  --limit <n>          Run only the first n cases
  --only <ids>         Comma-separated case ids (e.g. carbon-tax,wealth-tax)
  --concurrency <n>    Cases in flight at once   (default ${DEFAULTS.concurrency})
  --timeout <ms>       Per-request timeout       (default ${DEFAULTS.timeout})
  --allow-fallback     RAG-fallback responses warn instead of fail
  --json <path>        Write the JSON report here
  --quiet              Only print the final summary
  --help               Show this message
`;

function parseArgs(argv) {
  const opts = { ...DEFAULTS };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = () => {
      const value = argv[++i];
      if (value === undefined) fail(`Missing value for ${arg}`);
      return value;
    };
    switch (arg) {
      case '--base-url': opts.baseUrl = next().replace(/\/$/, ''); break;
      case '--flow': opts.flow = next(); break;
      case '--rounds': opts.rounds = Number(next()); break;
      case '--limit': opts.limit = Number(next()); break;
      case '--only': opts.only = next().split(',').map(s => s.trim()).filter(Boolean); break;
      case '--concurrency': opts.concurrency = Number(next()); break;
      case '--timeout': opts.timeout = Number(next()); break;
      case '--allow-fallback': opts.allowFallback = true; break;
      case '--json': opts.json = next(); break;
      case '--quiet': opts.quiet = true; break;
      case '--help': case '-h': process.stdout.write(HELP); process.exit(0); break;
      default: fail(`Unknown option: ${arg}\n${HELP}`);
    }
  }
  if (!['debate', 'synthesis', 'both'].includes(opts.flow)) fail(`--flow must be debate, synthesis or both`);
  return opts;
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(2);
}

// ---------------------------------------------------------------- HTTP

async function request(opts, method, route, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeout);
  const started = Date.now();
  try {
    const response = await fetch(`${opts.baseUrl}${route}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });
    const raw = await response.text();
    let data = null;
    try { data = JSON.parse(raw); } catch { /* non-JSON body reported below */ }
    return {
      ok: response.ok && data !== null,
      status: response.status,
      data,
      raw,
      ms: Date.now() - started,
      error: response.ok ? (data === null ? 'non-JSON response body' : null) : `HTTP ${response.status}`
    };
  } catch (error) {
    const aborted = error.name === 'AbortError';
    return {
      ok: false,
      status: 0,
      data: null,
      raw: '',
      ms: Date.now() - started,
      error: aborted ? `timeout after ${opts.timeout}ms` : error.message
    };
  } finally {
    clearTimeout(timer);
  }
}

async function preflight(opts) {
  const status = await request(opts, 'GET', '/api/status');
  if (!status.ok || status.data.status !== 'ok') {
    fail(
      `Backend not reachable at ${opts.baseUrl} (${status.error || 'unexpected /api/status body'}).\n` +
      `Start it first:  cd backend && node server.js\n` +
      `Or point the runner elsewhere:  --base-url https://your-host`
    );
  }
  return status.data;
}

// ------------------------------------------------------------- checks

function check(name, pass, detail, { warnOnly = false } = {}) {
  return { name, status: pass ? 'pass' : (warnOnly ? 'warn' : 'fail'), detail: detail || null };
}

/** Flow 1: one debate turn per model, context carried forward. */
async function runDebateFlow(opts, testCase) {
  const turns = [];
  const context = [];

  for (const ai of MODEL_ROSTER) {
    const result = await request(opts, 'POST', '/api/llm', {
      model: ai.model,
      party: ai.party,
      topic: testCase.topic,
      controversyLevel: 100,
      context: context.slice(),
      persona: ai.persona,
      flavor: ai.flavor
    });

    const response = result.ok ? (result.data.response || result.data.message || '') : '';
    turns.push({
      model: ai.model,
      party: ai.party,
      persona: ai.persona,
      flavor: ai.flavor,
      ok: result.ok,
      error: result.error,
      fallback: result.ok ? result.data.mock === true : null,
      ms: result.ms,
      wordCount: checks.wordCount(response),
      response
    });

    if (response) context.push({ speaker: ai.party, message: response });
  }

  const results = [];
  const answered = turns.filter(t => t.ok && t.response.trim().length > 0);

  results.push(check(
    'models_responded',
    answered.length === MODEL_ROSTER.length,
    `${answered.length}/${MODEL_ROSTER.length} responded` +
      (answered.length === MODEL_ROSTER.length ? '' :
        `; failed: ${turns.filter(t => !answered.includes(t)).map(t => `${t.model} (${t.error || 'empty response'})`).join(', ')}`)
  ));

  const offTopic = answered
    .map(t => ({ t, topic: checks.onTopic(t.response, testCase.terms) }))
    .filter(x => !x.topic.pass);
  results.push(check(
    'responses_on_topic',
    offTopic.length === 0 && answered.length > 0,
    offTopic.length ? offTopic.map(x => `${x.t.model} missing ${x.topic.missing.join('/')}`).join('; ') : `${answered.length} on topic`
  ));

  const corrupted = answered
    .map(t => ({ t, res: checks.corruption(t.response) }))
    .filter(x => !x.res.pass);
  results.push(check(
    'responses_clean',
    corrupted.length === 0,
    corrupted.length ? corrupted.map(x => `${x.t.model} ${x.res.reason}`).join('; ') : 'no corruption detected'
  ));

  const disclaiming = answered
    .map(t => ({ t, res: checks.disclaimers(t.response) }))
    .filter(x => !x.res.pass);
  results.push(check(
    'responses_in_character',
    disclaiming.length === 0,
    disclaiming.length ? disclaiming.map(x => `${x.t.model}: ${x.res.hits.join(',')}`).join('; ') : 'no disclaimers or refusals'
  ));

  const badLength = answered
    .map(t => ({ t, res: checks.lengthSane(t.response, TURN_WORDS) }))
    .filter(x => !x.res.pass);
  results.push(check(
    'responses_right_length',
    badLength.length === 0,
    badLength.length
      ? badLength.map(x => `${x.t.model} ${x.res.wordCount}w`).join('; ')
      : `${TURN_WORDS.min}-${TURN_WORDS.max} words each`
  ));

  // Only live responses are compared: the RAG fallback serves the same canned
  // text to every model of a given party, and that is already reported by
  // served_by_live_models rather than being a defect of the debate flow.
  const live = answered.filter(t => t.fallback !== true);
  const distinct = checks.allDistinct(live.map(t => t.response));
  results.push(check(
    'responses_distinct',
    live.length < 2 || distinct.pass,
    live.length < 2
      ? `n/a — ${live.length} live response(s) to compare`
      : (distinct.pass ? 'all live responses differ'
        : distinct.duplicates.map(([i, j]) => `${live[i].model} == ${live[j].model}`).join('; '))
  ));

  const fellBack = turns.filter(t => t.fallback === true);
  results.push(check(
    'served_by_live_models',
    fellBack.length === 0,
    fellBack.length ? `${fellBack.length} served by RAG fallback: ${fellBack.map(t => t.model).join(', ')}` : 'all live provider calls',
    { warnOnly: opts.allowFallback }
  ));

  return { checks: results, turns, ms: turns.reduce((sum, t) => sum + t.ms, 0) };
}

/** Flow 2: full debate + document synthesis via /api/debate-flow. */
async function runSynthesisFlow(opts, testCase) {
  const result = await request(opts, 'POST', '/api/debate-flow', {
    topic: testCase.topic,
    model: 'ChatGPT',
    controversyLevel: 100,
    documentType: 'policy_proposal',
    rounds: opts.rounds
  });

  if (!result.ok) {
    return {
      checks: [check('debate_flow_completed', false, result.error || `HTTP ${result.status}`)],
      ms: result.ms,
      documents: null
    };
  }

  const payload = result.data;
  const debateArgs = (payload.debate && payload.debate.arguments) || [];
  const documents = payload.documents || {};
  const results = [check('debate_flow_completed', true, `${result.ms}ms`)];

  const expectedArgs = opts.rounds * 3;
  const parties = ['Democrat', 'Republican', 'Independent'];
  const missingParties = parties.filter(p => !debateArgs.some(a => a.party === p && (a.content || '').trim()));
  results.push(check(
    'all_parties_argued',
    debateArgs.length === expectedArgs && missingParties.length === 0,
    missingParties.length
      ? `no argument from ${missingParties.join(', ')}`
      : `${debateArgs.length}/${expectedArgs} arguments`
  ));

  const docEntries = parties.map(party => [party, documents[party.toLowerCase()]]);
  const emptyDocs = docEntries.filter(([, doc]) => !doc || !(doc.content || '').trim());
  results.push(check(
    'documents_present',
    emptyDocs.length === 0,
    emptyDocs.length ? `missing: ${emptyDocs.map(([p]) => p).join(', ')}` : 'all three party documents produced'
  ));

  const liveDocs = docEntries.filter(([, doc]) => doc && (doc.content || '').trim());

  const offTopicDocs = liveDocs
    .map(([party, doc]) => ({ party, topic: checks.onTopic(doc.content, testCase.terms) }))
    .filter(x => !x.topic.pass);
  results.push(check(
    'synthesis_on_topic',
    offTopicDocs.length === 0 && liveDocs.length > 0,
    offTopicDocs.length
      ? offTopicDocs.map(x => `${x.party} missing ${x.topic.missing.join('/')}`).join('; ')
      : `${liveDocs.length} documents on topic`
  ));

  const corruptedDocs = liveDocs
    .map(([party, doc]) => ({ party, res: checks.corruption(doc.content) }))
    .filter(x => !x.res.pass);
  results.push(check(
    'synthesis_clean',
    corruptedDocs.length === 0,
    corruptedDocs.length ? corruptedDocs.map(x => `${x.party} ${x.res.reason}`).join('; ') : 'no corruption detected'
  ));

  // Coalition documents are templated, so only LLM-synthesized ones are
  // length-checked against the prompt's 200-350 word target.
  const synthesized = liveDocs.filter(([, doc]) => !doc.isCoalition);
  const badLength = synthesized
    .map(([party, doc]) => ({ party, res: checks.lengthSane(doc.content, DOC_WORDS) }))
    .filter(x => !x.res.pass);
  results.push(check(
    'synthesis_right_length',
    badLength.length === 0,
    badLength.length
      ? badLength.map(x => `${x.party} ${x.res.wordCount}w`).join('; ')
      : `${DOC_WORDS.min}-${DOC_WORDS.max} words each`
  ));

  // Grounding: does each document reuse the vocabulary of its own party's
  // arguments, or was it written from the topic alone?
  const grounding = synthesized.map(([party, doc]) => {
    const partyText = debateArgs.filter(a => a.party === party).map(a => a.content || '').join(' ');
    return { party, ...checks.groundedIn(doc.content, partyText, testCase.topic) };
  });
  const ungrounded = grounding.filter(g => g.ratio < GROUNDING_MIN);
  results.push(check(
    'synthesis_grounded_in_debate',
    ungrounded.length === 0,
    grounding.map(g => `${g.party} ${(g.ratio * 100).toFixed(0)}%`).join(', ') +
      ` (min ${GROUNDING_MIN * 100}%)`,
    { warnOnly: true }
  ));

  const strategy = payload.independentStrategy || {};
  results.push(check(
    'independent_strategy_resolved',
    ['coalition', 'independent'].includes(strategy.strategy),
    strategy.strategy
      ? `${strategy.strategy}${strategy.coalitionWith ? ` with ${strategy.coalitionWith}` : ''}`
      : 'no independentStrategy in response'
  ));

  return {
    checks: results,
    ms: result.ms,
    documents: Object.fromEntries(
      docEntries.map(([party, doc]) => [party, doc ? {
        wordCount: checks.wordCount(doc.content || ''),
        isCoalition: !!doc.isCoalition,
        preview: (doc.content || '').slice(0, 240)
      } : null])
    ),
    grounding,
    debateArguments: debateArgs.map(a => ({
      party: a.party, round: a.round, wordCount: checks.wordCount(a.content || '')
    }))
  };
}

// ------------------------------------------------------------ driving

async function runCase(opts, testCase) {
  const started = Date.now();
  const record = { id: testCase.id, topic: testCase.topic, checks: [], flows: {} };

  if (opts.flow === 'debate' || opts.flow === 'both') {
    const debate = await runDebateFlow(opts, testCase);
    record.flows.debate = { turns: debate.turns, ms: debate.ms };
    record.checks.push(...debate.checks);
  }
  if (opts.flow === 'synthesis' || opts.flow === 'both') {
    const synthesis = await runSynthesisFlow(opts, testCase);
    const { checks: synthesisChecks, ...rest } = synthesis;
    record.flows.synthesis = rest;
    record.checks.push(...synthesisChecks);
  }

  record.ms = Date.now() - started;
  record.failed = record.checks.filter(c => c.status === 'fail').length;
  record.warned = record.checks.filter(c => c.status === 'warn').length;
  record.passed = record.checks.filter(c => c.status === 'pass').length;
  record.status = record.failed > 0 ? 'FAIL' : 'PASS';
  return record;
}

async function runAll(opts, cases, onDone) {
  const results = new Array(cases.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.max(1, opts.concurrency) }, async () => {
    while (cursor < cases.length) {
      const index = cursor++;
      results[index] = await runCase(opts, cases[index]);
      onDone(results[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

// ------------------------------------------------------------- output

const MARK = { pass: '✓', warn: '!', fail: '✗' };

function printCase(record) {
  const head = record.status === 'PASS' ? (record.warned ? '! ' : '✓ ') : '✗ ';
  process.stdout.write(`\n${head}${record.id}  (${(record.ms / 1000).toFixed(1)}s)  "${record.topic}"\n`);
  for (const c of record.checks) {
    process.stdout.write(`    ${MARK[c.status]} ${c.name.padEnd(30)} ${c.detail || ''}\n`);
  }
}

function printSummary(opts, results, reportPath) {
  const passed = results.filter(r => r.status === 'PASS');
  const failed = results.filter(r => r.status === 'FAIL');

  const byCheck = new Map();
  for (const record of results) {
    for (const c of record.checks) {
      const entry = byCheck.get(c.name) || { pass: 0, warn: 0, fail: 0 };
      entry[c.status]++;
      byCheck.set(c.name, entry);
    }
  }

  const turns = results.flatMap(r => (r.flows.debate ? r.flows.debate.turns : []));
  const fallbacks = turns.filter(t => t.fallback === true).length;
  const totalMs = results.reduce((sum, r) => sum + r.ms, 0);

  process.stdout.write(`\n${'='.repeat(72)}\nSUMMARY\n${'='.repeat(72)}\n`);
  for (const [name, counts] of byCheck) {
    const total = counts.pass + counts.warn + counts.fail;
    const mark = counts.fail ? MARK.fail : (counts.warn ? MARK.warn : MARK.pass);
    process.stdout.write(
      `  ${mark} ${name.padEnd(30)} ${String(counts.pass).padStart(2)}/${total} pass` +
      `${counts.warn ? `, ${counts.warn} warn` : ''}${counts.fail ? `, ${counts.fail} fail` : ''}\n`
    );
  }

  if (turns.length) {
    const byModel = new Map();
    for (const turn of turns) {
      const entry = byModel.get(turn.model) || { ok: 0, total: 0, ms: 0 };
      entry.total++;
      entry.ms += turn.ms;
      if (turn.ok && turn.response.trim()) entry.ok++;
      byModel.set(turn.model, entry);
    }
    process.stdout.write('\n  Per model (debate turns):\n');
    for (const [model, entry] of byModel) {
      process.stdout.write(
        `    ${model.padEnd(10)} ${entry.ok}/${entry.total} responded, ` +
        `avg ${(entry.ms / entry.total / 1000).toFixed(1)}s\n`
      );
    }
  }

  process.stdout.write(
    `\n  Cases:     ${passed.length}/${results.length} passed` +
    `${failed.length ? ` — failing: ${failed.map(r => r.id).join(', ')}` : ''}\n`
  );
  if (turns.length) {
    process.stdout.write(`  Fallback:  ${fallbacks}/${turns.length} turns served by RAG fallback` +
      `${fallbacks && !opts.allowFallback ? ' (counts as failure; --allow-fallback to downgrade)' : ''}\n`);
  }
  process.stdout.write(`  Wall time: ${(totalMs / 1000).toFixed(1)}s of request time\n`);
  process.stdout.write(`  Report:    ${reportPath}\n`);
  process.stdout.write(`\n  RESULT: ${failed.length ? 'FAIL' : 'PASS'}\n\n`);

  return failed.length === 0;
}

// --------------------------------------------------------------- main

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  let selected = CASES;
  if (opts.only) {
    const known = new Set(CASES.map(c => c.id));
    const unknown = opts.only.filter(id => !known.has(id));
    if (unknown.length) fail(`Unknown case id(s): ${unknown.join(', ')}`);
    selected = CASES.filter(c => opts.only.includes(c.id));
  }
  if (opts.limit > 0) selected = selected.slice(0, opts.limit);

  const status = await preflight(opts);

  process.stdout.write(
    `Debate eval — ${selected.length} case(s), flow=${opts.flow}, rounds=${opts.rounds}, ` +
    `concurrency=${opts.concurrency}\n` +
    `Backend: ${opts.baseUrl} (${status.environment})\n`
  );

  const startedAt = new Date();
  const results = await runAll(opts, selected, record => {
    if (!opts.quiet) printCase(record);
  });

  const reportPath = opts.json
    ? path.resolve(opts.json)
    : path.join(__dirname, 'results', `${startedAt.toISOString().replace(/[:.]/g, '-')}.json`);
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  const report = {
    startedAt: startedAt.toISOString(),
    finishedAt: new Date().toISOString(),
    options: { ...opts },
    backend: status,
    cases: results
  };
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  const latest = path.join(__dirname, 'results', 'latest.json');
  fs.mkdirSync(path.dirname(latest), { recursive: true });
  fs.writeFileSync(latest, JSON.stringify(report, null, 2));

  const ok = printSummary(opts, results, reportPath);
  process.exit(ok ? 0 : 1);
}

main().catch(error => {
  process.stderr.write(`\nEval runner crashed: ${error.stack || error.message}\n`);
  process.exit(2);
});
