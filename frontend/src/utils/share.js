/**
 * Share + URL helpers for viral rematch loops.
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

export function buildSharePayload({ topic, winner, party, quote }) {
  const rematch = buildRematchUrl(topic, winner);
  const text = [
    `APICONGRESS verdict: ${winner} (${party}) took the floor.`,
    ``,
    `Topic: ${topic}`,
    quote ? `"${quote}"` : null,
    ``,
    `Rematch → ${rematch}`
  ]
    .filter((line) => line !== null)
    .join('\n');

  const xIntent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `APICONGRESS: ${winner} (${party}) won on "${topic}"\n\n"${quote || 'The chamber has spoken.'}"\n\n${rematch}`
  )}`;

  return { text, rematch, xIntent };
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
