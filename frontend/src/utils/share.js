/**
 * Share helpers — graphic-first. Intent URLs cannot attach images;
 * never dump raw ?topic= links into someone's feed.
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

/** Ultra-short caption — the PNG is the post. */
export function buildShareCaption({ winner, party, topic, site = 'congressai.app' }) {
  const lines = [
    `APICONGRESS — ${winner} crowned`,
    party ? `${party}` : null,
    topic ? String(topic).slice(0, 90) : null,
    site
  ].filter(Boolean);
  return lines.join('\n');
}

export function buildSharePayload({ topic, winner, party, shareUrl }) {
  const caption = buildShareCaption({ winner, party, topic });
  const rematch = shareUrl || 'https://congressai.app/';
  // Keep intents as last-resort text-only shells (never include ugly query dumps)
  const xIntent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(caption)}`;
  const linkedInIntent = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    rematch.startsWith('http') ? rematch : 'https://congressai.app/'
  )}`;
  return { text: caption, rematch, xIntent, linkedInIntent, caption };
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

/** Copy PNG to clipboard so user can paste into LinkedIn/X composers. */
export async function copyImageToClipboard(blob) {
  if (!blob || typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) {
    return false;
  }
  try {
    // Some browsers require a Promise-valued ClipboardItem for images
    await navigator.clipboard.write([
      new ClipboardItem({
        'image/png': blob
      })
    ]);
    return true;
  } catch {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': Promise.resolve(blob)
        })
      ]);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Share the verdict PNG via the OS sheet (only path that attaches an image
 * to LinkedIn / X without their APIs). Do NOT pass a ugly rematch URL —
 * targets often drop the file and keep only the link.
 */
export async function sharePngNative({ blob, filename = 'apicongress-verdict.png', text }) {
  if (!blob || !navigator.share) return 'unsupported';
  const file = new File([blob], filename, { type: 'image/png' });
  const withFiles = { files: [file], title: 'APICONGRESS', text: text || 'APICONGRESS verdict' };

  try {
    if (navigator.canShare?.(withFiles)) {
      await navigator.share(withFiles);
      return 'shared';
    }
  } catch (err) {
    if (err?.name === 'AbortError') return 'aborted';
  }

  // Some iOS versions want files alone
  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file] });
      return 'shared';
    }
  } catch (err) {
    if (err?.name === 'AbortError') return 'aborted';
  }

  return 'unsupported';
}

export async function nativeShare({ title, text, url, files }) {
  if (!navigator.share) return false;
  try {
    const payload = { title, text };
    if (url) payload.url = url;
    if (files?.length && navigator.canShare?.({ files })) {
      payload.files = files;
    }
    await navigator.share(payload);
    return true;
  } catch {
    return false;
  }
}
