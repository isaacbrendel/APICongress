/**
 * Exportable APICONGRESS verdict card — 1200×630.
 * Strava/Spotify lesson: the IMAGE is the post. One composition, brand-hero,
 * safe margins for LinkedIn/X crop, zero clipping, chamber-poster aesthetic.
 */

const W = 1200;
const H = 630;
/** Content safe zone — platforms crop edges differently */
const SAFE = { l: 72, r: 1128, t: 56, b: 574 };

const COLORS = {
  concrete: '#E6E2D9',
  concreteDeep: '#D4CFC4',
  paper: '#F7F5F0',
  ink: '#2A2620',
  inkSoft: '#4A4540',
  mute: '#6B655C',
  hazard: '#F5D547',
  hazardInk: '#2A2408',
  stampRed: '#B33A2B',
  stampBlue: '#2F5BA8',
  stampAmber: '#C48A2A'
};

function partyColor(party) {
  const p = String(party || '').toLowerCase();
  if (p.startsWith('dem')) return COLORS.stampBlue;
  if (p.startsWith('rep')) return COLORS.stampRed;
  return COLORS.stampAmber;
}

function partyBg(party) {
  const p = String(party || '').toLowerCase();
  if (p.startsWith('dem')) return 'rgba(47,91,168,0.12)';
  if (p.startsWith('rep')) return 'rgba(179,58,43,0.12)';
  return 'rgba(196,138,42,0.14)';
}

function wrapLines(ctx, text, maxWidth, maxLines) {
  const words = String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
  const lines = [];
  let line = '';
  for (let i = 0; i < words.length; i += 1) {
    const test = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = words[i];
      if (lines.length >= maxLines) break;
    } else {
      line = test;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  if (lines.length === maxLines) {
    const used = lines.join(' ').split(' ').length;
    if (used < words.length || ctx.measureText(lines[maxLines - 1]).width > maxWidth) {
      let clipped = lines[maxLines - 1];
      while (clipped.length > 3 && ctx.measureText(`${clipped}…`).width > maxWidth) {
        clipped = clipped.slice(0, -1).trim();
      }
      lines[maxLines - 1] = `${clipped}…`;
    }
  }
  return lines;
}

function fitFontSize(ctx, text, maxWidth, family, weight, maxPx, minPx) {
  for (let size = maxPx; size >= minPx; size -= 1) {
    ctx.font = `${weight} ${size}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth) return size;
  }
  return minPx;
}

/** Site one-liner — same plain line as the home kicker. */
export const SITE_LINE = 'Five models. Random parties. One verdict.';

function drawConcreteField(ctx) {
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, COLORS.concrete);
  grad.addColorStop(0.45, COLORS.paper);
  grad.addColorStop(1, COLORS.concreteDeep);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Hazard wash (top-left) — atmospheric, not the hero
  const wash = ctx.createRadialGradient(160, 40, 10, 220, 120, 480);
  wash.addColorStop(0, 'rgba(245,213,71,0.32)');
  wash.addColorStop(1, 'rgba(245,213,71,0)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, H);

  // Deterministic grit (same card every render for a bout)
  ctx.save();
  ctx.globalAlpha = 0.04;
  for (let i = 0; i < 6000; i += 1) {
    const x = (i * 67) % W;
    const y = (i * 41) % H;
    ctx.fillStyle = i % 2 ? '#2A2620' : '#FFFFFF';
    ctx.fillRect(x, y, 1.4, 1.4);
  }
  ctx.restore();
}

function drawFrame(ctx, accent) {
  // Offset stamp shadow
  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(22, H - 22, W - 40, 10);
  ctx.fillRect(W - 22, 22, 10, H - 40);

  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 7;
  ctx.strokeRect(16, 16, W - 32, H - 32);

  // Inner hairline
  ctx.strokeStyle = 'rgba(42,38,32,0.2)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(28, 28, W - 56, H - 56);

  // Party stamp rail
  ctx.fillStyle = accent;
  ctx.fillRect(34, 34, 16, H - 68);
}

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawCrownedStamp(ctx, accent, cx, cy) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.14);

  // Soft paper under-stamp
  ctx.fillStyle = COLORS.paper;
  ctx.fillRect(-118, -52, 236, 104);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 6;
  ctx.strokeRect(-118, -52, 236, 104);
  ctx.lineWidth = 2;
  ctx.strokeRect(-108, -42, 216, 84);

  ctx.fillStyle = accent;
  ctx.font = '800 40px Syne, "Arial Black", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('CROWNED', 0, 2);
  ctx.restore();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

/**
 * @returns {Promise<HTMLCanvasElement>}
 */
export async function renderVerdictCanvas({
  topic,
  winnerName,
  party,
  logoSrc,
  site = 'congressai.app'
}) {
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    try {
      await Promise.race([
        document.fonts.ready,
        new Promise((r) => setTimeout(r, 1200))
      ]);
      // Warm the faces we need
      await document.fonts.load('800 72px Syne');
      await document.fonts.load('800 20px "Libre Franklin"');
      await document.fonts.load('600 28px "Source Serif 4"');
    } catch {
      /* ignore */
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const accent = partyColor(party);
  const name = String(winnerName || 'Winner');
  const partyLabel = String(party || 'Independent').toUpperCase();
  const siteLabel = String(site || 'congressai.app');

  drawConcreteField(ctx);
  drawFrame(ctx, accent);

  const x0 = SAFE.l;
  const contentW = SAFE.r - SAFE.l;

  // —— Kicker row ——
  ctx.fillStyle = COLORS.stampRed;
  ctx.font = '800 18px "Libre Franklin", system-ui, sans-serif';
  ctx.fillText('CHAMBER VERDICT  ·  YOU CROWNED', x0, SAFE.t + 18);

  // Site chip top-right
  ctx.font = '800 16px "Libre Franklin", system-ui, sans-serif';
  const chipPadX = 14;
  const chipW = ctx.measureText(siteLabel).width + chipPadX * 2;
  const chipX = SAFE.r - chipW;
  const chipY = SAFE.t - 4;
  ctx.fillStyle = COLORS.paper;
  ctx.fillRect(chipX, chipY, chipW, 32);
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 2;
  ctx.strokeRect(chipX, chipY, chipW, 32);
  ctx.fillStyle = COLORS.ink;
  ctx.fillText(siteLabel, chipX + chipPadX, chipY + 22);

  // —— Brand (must fully fit — Syne is wide) ——
  const brand = 'APICONGRESS';
  const brandMaxW = contentW - 8;
  const brandSize = fitFontSize(ctx, brand, brandMaxW, 'Syne, "Arial Black", sans-serif', '800', 78, 48);
  ctx.font = `800 ${brandSize}px Syne, "Arial Black", sans-serif`;
  ctx.fillStyle = COLORS.ink;
  const brandY = SAFE.t + 88;
  ctx.fillText(brand, x0, brandY);
  // Prove no clip for tests / debug
  canvas.__brandWidth = ctx.measureText(brand).width;
  canvas.__brandMaxWidth = brandMaxW;

  // —— Winner plate ——
  const plateY = brandY + 28;
  const plateH = 168;
  const plateW = contentW;
  ctx.fillStyle = COLORS.paper;
  ctx.fillRect(x0, plateY, plateW, plateH);
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 3;
  ctx.strokeRect(x0, plateY, plateW, plateH);
  // Left accent on plate
  ctx.fillStyle = accent;
  ctx.fillRect(x0, plateY, 10, plateH);

  const logo = await loadImage(logoSrc);
  const logoSize = 96;
  const logoX = x0 + 28;
  const logoY = plateY + (plateH - logoSize) / 2;
  if (logo) {
    ctx.fillStyle = COLORS.concrete;
    ctx.fillRect(logoX, logoY, logoSize, logoSize);
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(logoX, logoY, logoSize, logoSize);
    ctx.drawImage(logo, logoX + 6, logoY + 6, logoSize - 12, logoSize - 12);
  }

  const nameX = logo ? logoX + logoSize + 22 : x0 + 28;
  const nameMaxW = 520;
  const nameSize = fitFontSize(ctx, name, nameMaxW, 'Syne, "Arial Black", sans-serif', '800', 56, 32);
  ctx.font = `800 ${nameSize}px Syne, "Arial Black", sans-serif`;
  ctx.fillStyle = COLORS.ink;
  ctx.fillText(name, nameX, plateY + 72);

  // Party pill
  ctx.font = '800 17px "Libre Franklin", system-ui, sans-serif';
  const pillW = Math.max(110, ctx.measureText(partyLabel).width + 28);
  const pillY = plateY + 92;
  ctx.fillStyle = partyBg(party);
  ctx.fillRect(nameX, pillY, pillW, 30);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.strokeRect(nameX, pillY, pillW, 30);
  ctx.fillStyle = accent;
  ctx.fillText(partyLabel, nameX + 14, pillY + 21);

  // CROWNED stamp — right side of plate, clear of name
  drawCrownedStamp(ctx, accent, x0 + plateW - 150, plateY + plateH / 2);

  // —— Topic ——
  const topicY = plateY + plateH + 52;
  ctx.fillStyle = COLORS.ink;
  ctx.font = '700 32px "Source Serif 4", Georgia, serif';
  const topicLines = wrapLines(ctx, topic || 'The floor', contentW - 20, 2);
  topicLines.forEach((ln, i) => {
    ctx.fillText(ln, x0, topicY + i * 38);
  });

  // —— Site one-liner (same plain line as the product — not a quote) ——
  const lineTop = topicY + topicLines.length * 38 + 28;
  ctx.fillStyle = accent;
  ctx.fillRect(x0, lineTop, 5, 28);
  ctx.fillStyle = COLORS.inkSoft;
  ctx.font = '600 26px "Source Serif 4", Georgia, serif';
  ctx.fillText(SITE_LINE, x0 + 18, lineTop + 22);
  canvas.__siteLine = SITE_LINE;

  // —— Bottom hazard bar ——
  const barH = 52;
  const barY = H - 16 - 10 - barH;
  ctx.fillStyle = COLORS.hazard;
  ctx.fillRect(34, barY, W - 68, barH);
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(34, barY, W - 68, barH);

  ctx.fillStyle = COLORS.hazardInk;
  ctx.font = '800 18px "Libre Franklin", system-ui, sans-serif';
  ctx.fillText('OPEN THE FLOOR', 52, barY + 33);
  ctx.font = '700 16px "Libre Franklin", system-ui, sans-serif';
  ctx.fillText(siteLabel, 280, barY + 33);

  return canvas;
}

export async function verdictCardToBlob(opts) {
  const canvas = await renderVerdictCanvas(opts);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to export verdict card'));
    }, 'image/png');
  });
}

export async function verdictCardToDataUrl(opts) {
  const canvas = await renderVerdictCanvas(opts);
  return canvas.toDataURL('image/png');
}

/** Layout metrics for Playwright proof */
export async function measureVerdictCard(opts) {
  const canvas = await renderVerdictCanvas(opts);
  return {
    width: canvas.width,
    height: canvas.height,
    brandWidth: canvas.__brandWidth,
    brandMaxWidth: canvas.__brandMaxWidth,
    brandFits: canvas.__brandWidth <= canvas.__brandMaxWidth + 0.5,
    siteLine: canvas.__siteLine,
    dataUrl: canvas.toDataURL('image/png')
  };
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export async function shareVerdictFiles({ blob, title, text }) {
  const file = new File([blob], 'apicongress-verdict.png', { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title, text });
      return 'shared';
    } catch (err) {
      if (err?.name === 'AbortError') return 'aborted';
    }
  }
  return 'unsupported';
}
