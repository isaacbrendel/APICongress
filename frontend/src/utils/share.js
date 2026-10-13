/**
 * Share helpers — graphic-first.
 * LinkedIn/X web intents cannot attach images. On phones, open the NATIVE app
 * (OS share sheet with PNG, or Android intent / same-tab universal link) —
 * never a browser tab that dumps you on linkedin.com sign-in.
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

export function getDeviceKind() {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
  if (/android/i.test(ua)) return 'android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  return 'desktop';
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

export function linkedInComposeWebUrl(caption) {
  return `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(
    caption || ''
  )}`;
}

export function xComposeWebUrl(caption) {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(caption || '')}`;
}

/**
 * URL that prefers opening the native LinkedIn app (compose / Start a post).
 * Android: intent:// → com.linkedin.android
 * iOS: linkedin:// scheme (falls back to HTTPS universal link in openNetworkCompose)
 * Desktop: HTTPS feed composer
 */
export function linkedInAppComposeUrl(caption) {
  const web = linkedInComposeWebUrl(caption);
  const kind = getDeviceKind();
  const path = `www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(caption || '')}`;
  if (kind === 'android') {
    return `intent://${path}#Intent;scheme=https;package=com.linkedin.android;S.browser_fallback_url=${encodeURIComponent(
      web
    )};end`;
  }
  if (kind === 'ios') {
    return `linkedin://${path}`;
  }
  return web;
}

export function xAppComposeUrl(caption) {
  const web = xComposeWebUrl(caption);
  const kind = getDeviceKind();
  const text = encodeURIComponent(caption || '');
  if (kind === 'android') {
    return `intent://twitter.com/intent/tweet?text=${text}#Intent;scheme=https;package=com.twitter.android;S.browser_fallback_url=${encodeURIComponent(
      web
    )};end`;
  }
  if (kind === 'ios') {
    return `twitter://post?message=${text}`;
  }
  return web;
}

/**
 * Open LinkedIn / X for a new post.
 * Mobile: same-tab navigation so the OS can hand off to the installed app
 * (window.open → in-browser LinkedIn → sign-in wall).
 * Desktop: new tab to the web composer with shareActive=true (Start a post).
 */
export function openNetworkCompose(target, caption) {
  const kind = getDeviceKind();
  const web =
    target === 'linkedin' ? linkedInComposeWebUrl(caption) : xComposeWebUrl(caption);
  const app =
    target === 'linkedin' ? linkedInAppComposeUrl(caption) : xAppComposeUrl(caption);

  if (kind === 'desktop') {
    window.open(web, '_blank', 'noopener,noreferrer');
    return { opened: web, mode: 'desktop-tab' };
  }

  // iOS custom schemes: try app, fall back to HTTPS if still in Safari
  if (kind === 'ios' && (target === 'x' || target === 'linkedin')) {
    const started = Date.now();
    window.location.href = app;
    window.setTimeout(() => {
      if (Date.now() - started < 1600) {
        window.location.href = web;
      }
    }, 700);
    return { opened: app, mode: 'ios-scheme' };
  }

  // Android intent — MUST be same-tab (not window.open)
  window.location.href = app;
  return { opened: app, mode: 'android-intent' };
}

export function buildSharePayload({ topic, winner, party, shareUrl }) {
  const caption = buildShareCaption({ winner, party, topic });
  const rematch = shareUrl || 'https://congressai.app/';
  return {
    text: caption,
    rematch,
    caption,
    xIntent: xComposeWebUrl(caption),
    linkedInIntent: linkedInComposeWebUrl(caption)
  };
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

export async function copyImageToClipboard(blob) {
  if (!blob || typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) {
    return false;
  }
  try {
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    return true;
  } catch {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': Promise.resolve(blob) })
      ]);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * OS share sheet with the PNG — only reliable way to land an image inside
 * the LinkedIn / X apps from a website. Pick LinkedIn in the sheet → app opens
 * on a new post with the card attached.
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

  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file] });
      return 'shared';
    }
  } catch (err) {
    if (err?.name === 'AbortError') return 'aborted';
  }

  // Last resort on phones that share text/files poorly: still surface the sheet
  try {
    await navigator.share({ title: 'APICONGRESS', text: text || 'APICONGRESS verdict' });
    return 'shared-text';
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
