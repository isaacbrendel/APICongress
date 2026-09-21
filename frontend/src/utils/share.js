/**
 * Share + URL helpers — LinkedIn / X / rematch friendly.
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

export function buildSharePayload({ topic, winner, party, quote }) {
  const rematch = buildRematchUrl(topic, winner);
  const cleanQuote = (quote || 'The chamber has spoken.').replace(/\s+/g, ' ').trim();

  const text = [
    `APICONGRESS chamber verdict`,
    `${winner} (${party}) carried the floor.`,
    ``,
    `Topic: ${topic}`,
    `"${cleanQuote}"`,
    ``,
    `Open the rematch → ${rematch}`
  ].join('\n');

  const xIntent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `APICONGRESS: ${winner} (${party}) on "${topic}"\n\n"${cleanQuote.slice(0, 160)}${cleanQuote.length > 160 ? '…' : ''}"\n\n${rematch}`
  )}`;

  // LinkedIn share-offsite — Featured / feed grab the og: tags from the URL
  const linkedInIntent = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(rematch)}`;

  return { text, rematch, xIntent, linkedInIntent };
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

export async function nativeShare({ title, text, url }) {
  if (!navigator.share) return false;
  try {
    await navigator.share({ title, text, url });
    return true;
  } catch {
    return false;
  }
}
