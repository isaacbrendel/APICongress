/**
 * Share + URL helpers — LinkedIn / X / rematch friendly.
 * Prefer graphic verdict cards over wall-of-text quotes.
 */

export function readTopicFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const topic = params.get('topic');
    return topic ? decodeURIComponent(topic).trim() : '';
  } catch {
    return '';
  }
}

export function writeTopicToUrl(topic) {
  try {
    const url = new URL(window.location.href);
    if (topic) url.searchParams.set('topic', topic);
    else url.searchParams.delete('topic');
    url.searchParams.delete('winner');
    url.searchParams.delete('champ');
    window.history.replaceState({}, '', url.toString());
  } catch {
    /* ignore */
  }
}

export function buildRematchUrl(topic, winnerName) {
  const url = new URL(window.location.origin + window.location.pathname);
  if (topic) url.searchParams.set('topic', topic);
  if (winnerName) url.searchParams.set('champ', winnerName);
  return url.toString();
}

/**
 * Short caption for X/LinkedIn — the graphic carries the spectacle.
 */
export function buildSharePayload({ topic, winner, party, quote, shareUrl }) {
  const rematch = shareUrl || buildRematchUrl(topic, winner);
  const cleanQuote = String(quote || '')
    .replace(/^["'\u201c\u201d]+|["'\u201c\u201d]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const hook = `${winner} (${party}) just took the chamber.`;
  const text = [
    `APICONGRESS`,
    hook,
    topic ? `Topic: ${topic}` : '',
    rematch
  ]
    .filter(Boolean)
    .join('\n');

  const xText = [
    `APICONGRESS — ${winner} crowned`,
    topic ? `${topic}` : '',
    cleanQuote ? cleanQuote.slice(0, 120) + (cleanQuote.length > 120 ? '…' : '') : '',
    rematch
  ]
    .filter(Boolean)
    .join('\n\n');

  const xIntent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(xText)}`;

  // LinkedIn share-offsite — scrape /v/:id OG tags (dynamic verdict PNG)
  const linkedInIntent = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(rematch)}`;

  return { text, rematch, xIntent, linkedInIntent, hook };
}

export async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export async function nativeShare({ title, text, url, files }) {
  if (!navigator.share) return false;
  try {
    const payload = { title, text, url };
    if (files?.length && navigator.canShare?.({ files })) {
      payload.files = files;
    }
    await navigator.share(payload);
    return true;
  } catch {
    return false;
  }
}
