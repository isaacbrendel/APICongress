/**
 * Strip LLM packaging: wrapping quotes, paren-quotes, code fences.
 * Safe for debate prose — only removes whole-response wrappers.
 */

const OPEN_QUOTES = '["\'\u201c\u201d\u2018\u2019\u00ab\u00bb`]';
const CLOSE_QUOTES = '["\'\u201c\u201d\u2018\u2019\u00ab\u00bb`]';

export function stripWrappingQuotes(raw) {
  if (raw == null) return '';
  let text = String(raw).replace(/^\uFEFF/, '').trim();
  if (!text) return '';

  // Whole-response markdown fence
  const fence = text.match(/^```(?:\w+)?\s*\n?([\s\S]*?)\n?```$/);
  if (fence) text = fence[1].trim();

  // Peel nested wrappers: "…", “…”, ("…"), '…'
  for (let i = 0; i < 4; i += 1) {
    const before = text;

    // ("response") or (“response”)
    const parenQuote = text.match(
      new RegExp(`^\\(\\s*(${OPEN_QUOTES})([\\s\\S]*?)(${CLOSE_QUOTES})\\s*\\)$`)
    );
    if (parenQuote) {
      text = parenQuote[2].trim();
      continue;
    }

    // "response" / “response” / 'response'
    const quoted = text.match(new RegExp(`^(${OPEN_QUOTES})([\\s\\S]*?)(${CLOSE_QUOTES})$`));
    if (quoted && quoted[2].length >= 8) {
      text = quoted[2].trim();
      continue;
    }

    if (text === before) break;
  }

  // Leading/trailing orphan quote chars left by models
  text = text.replace(new RegExp(`^${OPEN_QUOTES}+`), '').replace(new RegExp(`${CLOSE_QUOTES}+$`), '').trim();

  return text;
}

export function sanitizeArgumentText(raw) {
  let text = stripWrappingQuotes(raw);
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}
