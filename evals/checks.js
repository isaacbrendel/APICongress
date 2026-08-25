/**
 * Scoring primitives for the debate eval suite.
 *
 * Everything here is deterministic — no LLM judging. The checks answer three
 * questions: did the model actually answer, is the answer about the topic that
 * was asked, and is the text usable (not corrupted, not a canned disclaimer,
 * not truncated to nothing).
 */

// Token-corruption patterns, mirrored from validateAndCleanResponse() in
// backend/server.js so the eval rejects exactly what the server rejects.
const GLITCH_PATTERNS = [
  { name: 'bracket-loop', re: /(\([0-9A-Za-z]{2,6}){3,}/ },
  { name: 'mojibake', re: /(aâ|\(aâ|â\^|â|Ã|Â){3,}/ },
  { name: 'entity-spam', re: /(APPP|AM&#|&amp;){2,}/ },
  { name: 'repeat-loop', re: /(.{2,10})\1{4,}/ }
];

const ENCODING_SYMBOLS =
  /[\^\~\\\/\{\}\[\]\|`âÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/g;

// Phrases the debate flow is explicitly built to avoid: assistant self-talk,
// refusals, and empty-both-sides hedging in place of an argument.
const DISCLAIMER_PATTERNS = [
  { name: 'ai-self-reference', re: /\b(as an ai|i am an ai|i'm an ai|as a language model|language model)\b/i },
  { name: 'refusal', re: /\b(i cannot (assist|help|provide)|i can't (assist|help|provide)|i'm not able to (assist|help)|i must decline)\b/i },
  { name: 'non-answer', re: /\b(both sides have merit|i (don't|do not) have (an )?opinion|as an assistant)\b/i }
];

const STOPWORDS = new Set(
  ('the a an and or but if then than that this these those of to in on for with without by from as at is are was were be been being it its ' +
   'we our us you your they their them he she his her i my me not no so such can could should would will shall may might must do does did ' +
   'have has had here there what which who whom when where why how all any both each few more most other some only own same too very just ' +
   'about into over under again further once because while during against between above below out up down off over under').split(' ')
);

function text(value) {
  return typeof value === 'string' ? value : '';
}

function words(value) {
  return text(value).trim().split(/\s+/).filter(Boolean);
}

function wordCount(value) {
  return words(value).length;
}

/** Distinctive (non-stopword, 4+ char) lowercase tokens, deduped. */
function contentTokens(value) {
  const seen = new Set();
  for (const raw of text(value).toLowerCase().match(/[a-z][a-z'-]{3,}/g) || []) {
    const token = raw.replace(/'s$/, '');
    if (!STOPWORDS.has(token)) seen.add(token);
  }
  return seen;
}

/**
 * On-topic check: every term group must have at least one hit.
 * Returns { pass, missing } where `missing` lists the unmatched groups.
 */
function onTopic(value, termGroups) {
  const haystack = text(value).toLowerCase();
  const missing = termGroups
    .filter(group => !group.some(term => haystack.includes(term.toLowerCase())))
    .map(group => group[0]);
  return { pass: missing.length === 0, missing };
}

/** Corruption check: glitch loops plus encoding-symbol density. */
function corruption(value) {
  const value_ = text(value);
  for (const { name, re } of GLITCH_PATTERNS) {
    const match = value_.match(re);
    if (match) return { pass: false, reason: `${name}: ${JSON.stringify(match[0].slice(0, 40))}` };
  }
  const symbols = value_.match(ENCODING_SYMBOLS);
  if (symbols && symbols.length > 5) {
    return { pass: false, reason: `encoding-density: ${symbols.length} symbols` };
  }
  return { pass: true, reason: null };
}

/** Assistant boilerplate / refusal / non-answer check. */
function disclaimers(value) {
  const hits = DISCLAIMER_PATTERNS.filter(p => p.re.test(text(value))).map(p => p.name);
  return { pass: hits.length === 0, hits };
}

/** Length sanity: long enough to be an argument, short enough to be a turn. */
function lengthSane(value, { min, max }) {
  const count = wordCount(value);
  return { pass: count >= min && count <= max, wordCount: count, min, max };
}

/**
 * Grounding: what share of the synthesis document's distinctive vocabulary
 * also appears in the debate arguments it was supposedly built from.
 * Topic words are excluded so a document can't score by echoing the prompt.
 */
function groundedIn(document, sourceText, topic) {
  const topicTokens = contentTokens(topic);
  const docTokens = [...contentTokens(document)].filter(t => !topicTokens.has(t));
  if (docTokens.length === 0) return { ratio: 0, shared: 0, total: 0 };
  const sourceTokens = contentTokens(sourceText);
  const shared = docTokens.filter(t => sourceTokens.has(t)).length;
  return { ratio: shared / docTokens.length, shared, total: docTokens.length };
}

/** Are these responses meaningfully different from each other? */
function allDistinct(values) {
  const normalized = values.map(v => text(v).toLowerCase().replace(/\s+/g, ' ').trim());
  const duplicates = [];
  for (let i = 0; i < normalized.length; i++) {
    for (let j = i + 1; j < normalized.length; j++) {
      if (normalized[i] && normalized[i] === normalized[j]) duplicates.push([i, j]);
    }
  }
  return { pass: duplicates.length === 0, duplicates };
}

module.exports = {
  wordCount,
  contentTokens,
  onTopic,
  corruption,
  disclaimers,
  lengthSane,
  groundedIn,
  allDistinct
};
