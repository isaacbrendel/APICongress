#!/usr/bin/env node
/**
 * Production proof: Claude Sonnet 5 migration is live and Claude itself answers.
 *
 * Usage:
 *   node scripts/prove-claude-sonnet5.js
 *   BASE_URL=https://congressai.app node scripts/prove-claude-sonnet5.js
 */

const BASE_URL = (process.env.BASE_URL || 'https://congressai.app').replace(/\/$/, '');

async function getJson(path) {
  const res = await fetch(`${BASE_URL}${path}`);
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON from ${path}: ${res.status} ${text.slice(0, 200)}`);
  }
  return { status: res.status, body };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  console.log(`[prove] BASE_URL=${BASE_URL}`);

  const status = await getJson('/api/status');
  console.log('[prove] /api/status', JSON.stringify(status.body, null, 2));
  assert(status.status === 200, `status HTTP ${status.status}`);
  assert(status.body.status === 'ok', 'status not ok');
  assert(
    status.body.claudeModel === 'claude-sonnet-5',
    `expected claudeModel=claude-sonnet-5, got ${status.body.claudeModel}`
  );
  assert(status.body.providersConfigured?.Claude === true, 'Claude API key not configured in production');

  const topic = encodeURIComponent(
    `PROOF ${Date.now()}: Should Congress fund rural broadband expansion?`
  );
  const llm = await getJson(
    `/api/llm?model=Claude&party=Democrat&topic=${topic}&controversyLevel=55`
  );
  console.log('[prove] /api/llm Claude', {
    http: llm.status,
    providerUsed: llm.body.providerUsed,
    engine: llm.body.engine,
    responseChars: (llm.body.response || '').length,
    snippet: (llm.body.response || '').slice(0, 220)
  });

  assert(llm.status === 200, `llm HTTP ${llm.status}`);
  assert(typeof llm.body.response === 'string' && llm.body.response.length > 40, 'empty Claude response');
  assert(llm.body.providerUsed === 'Claude', `expected providerUsed=Claude, got ${llm.body.providerUsed}`);
  assert(llm.body.engine === 'provider', `expected engine=provider, got ${llm.body.engine}`);
  assert(!/morality without consequences is just branding/i.test(llm.body.response), 'chamber-voice fingerprint detected');

  console.log('[prove] PASS — production Claude Sonnet 5 path is live and answering as Claude');
}

main().catch((err) => {
  console.error('[prove] FAIL', err.message);
  process.exit(1);
});
