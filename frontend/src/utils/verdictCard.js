/**
 * Exportable APICONGRESS verdict card — 1200×630 canvas graphic.
 * Matches chamber-poster aesthetic; safe zone for LinkedIn/X crop.
 */

const W = 1200;
const H = 630;

const COLORS = {
  concrete: '#E6E2D9',
  concreteDeep: '#D4CFC4',
  paper: '#F7F5F0',
  ink: '#2A2620',
  inkSoft: '#4A4540',
  hazard: '#F5D547',
  hazardInk: '#2A2408',
  stampRed: '#B33A2B',
  stampBlue: '#2F5BA8',
  stampAmber: '#C48A2A',
  line: 'rgba(42,38,32,0.18)'
};

function partyColor(party) {
  const p = String(party || '').toLowerCase();
  if (p.startsWith('dem')) return COLORS.stampBlue;
  if (p.startsWith('rep')) return COLORS.stampRed;
  return COLORS.stampAmber;
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
    const last = lines[maxLines - 1];
    if (ctx.measureText(last).width > maxWidth || words.length > lines.join(' ').split(' ').length) {
      let clipped = last;
      while (clipped.length > 3 && ctx.measureText(`${clipped}…`).width > maxWidth) {
        clipped = clipped.slice(0, -1);
      }
      lines[maxLines - 1] = `${clipped}…`;
    }
  }
  return lines;
}

function drawNoise(ctx) {
  ctx.save();
  ctx.globalAlpha = 0.055;
  for (let i = 0; i < 9000; i += 1) {
    ctx.fillStyle = Math.random() > 0.5 ? '#2A2620' : '#FFFFFF';
    ctx.fillRect(Math.random() * W, Math.random() * H, 1.6, 1.6);
  }
  ctx.restore();
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

/**
 * @returns {Promise<HTMLCanvasElement>}
 */
export async function renderVerdictCanvas({
  topic,
  winnerName,
  party,
  quote,
  logoSrc,
  site = 'congressai.app'
}) {
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      /* ignore */
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const accent = partyColor(party);

  // Concrete field
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, COLORS.concrete);
  grad.addColorStop(0.55, COLORS.paper);
  grad.addColorStop(1, COLORS.concreteDeep);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Soft hazard wash
  const wash = ctx.createRadialGradient(180, 80, 20, 200, 100, 520);
  wash.addColorStop(0, 'rgba(245,213,71,0.28)');
  wash.addColorStop(1, 'rgba(245,213,71,0)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, H);

  drawNoise(ctx);

  // Outer ink frame + offset stamp shadow
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 8;
  ctx.strokeRect(18, 18, W - 36, H - 36);
  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(28, H - 28, W - 52, 10);
  ctx.fillRect(W - 28, 28, 10, H - 52);

  // Party stamp bar
  ctx.fillStyle = accent;
  ctx.fillRect(42, 42, 18, H - 84);

  // Kicker
  ctx.fillStyle = COLORS.stampRed;
  ctx.font = '800 22px "Libre Franklin", system-ui, sans-serif';
  ctx.letterSpacing = '0.18em';
  ctx.fillText('CHAMBER VERDICT  ·  YOU CROWNED', 84, 88);

  // Brand
  ctx.fillStyle = COLORS.ink;
  ctx.font = '800 92px Syne, "Arial Black", sans-serif';
  ctx.fillText('APICONGRESS', 80, 188);

  // Hazard ticket under brand
  ctx.fillStyle = COLORS.hazard;
  ctx.fillRect(84, 208, 220, 36);
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 3;
  ctx.strokeRect(84, 208, 220, 36);
  ctx.fillStyle = COLORS.hazardInk;
  ctx.font = '800 18px "Libre Franklin", system-ui, sans-serif';
  ctx.fillText('OPEN THE FLOOR', 102, 232);

  // Winner block
  const logo = await loadImage(logoSrc);
  const winnerY = 290;
  if (logo) {
    ctx.fillStyle = COLORS.paper;
    ctx.fillRect(84, winnerY - 8, 88, 88);
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 3;
    ctx.strokeRect(84, winnerY - 8, 88, 88);
    ctx.drawImage(logo, 92, winnerY, 72, 72);
  }

  const textX = logo ? 196 : 84;
  ctx.fillStyle = COLORS.ink;
  ctx.font = '800 56px Syne, "Arial Black", sans-serif';
  ctx.fillText(String(winnerName || 'Winner').slice(0, 18), textX, winnerY + 42);

  // Party pill
  const partyLabel = String(party || 'Independent').toUpperCase();
  ctx.font = '800 18px "Libre Franklin", system-ui, sans-serif';
  const pillW = Math.max(120, ctx.measureText(partyLabel).width + 28);
  ctx.fillStyle = accent;
  ctx.fillRect(textX, winnerY + 56, pillW, 28);
  ctx.fillStyle = COLORS.paper;
  ctx.fillText(partyLabel, textX + 14, winnerY + 76);

  // Topic
  ctx.fillStyle = COLORS.inkSoft;
  ctx.font = '700 26px "Libre Franklin", system-ui, sans-serif';
  const topicLines = wrapLines(ctx, topic || 'The floor', 780, 2);
  topicLines.forEach((ln, i) => {
    ctx.fillText(ln, 84, 440 + i * 34);
  });

  // Quote strip (short, punchy — no decorative wrapping quotes in the graphic)
  const q = String(quote || 'The chamber has spoken.')
    .replace(/^["'\u201c\u201d]+|["'\u201c\u201d]+$/g, '')
    .trim();
  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(84, 510, 6, 56);
  ctx.font = '600 28px "Source Serif 4", Georgia, serif';
  const quoteLines = wrapLines(ctx, q, 720, 2);
  quoteLines.forEach((ln, i) => {
    ctx.fillText(ln, 106, 534 + i * 34);
  });

  // Right stack — CROWNED stamp
  ctx.save();
  ctx.translate(980, 300);
  ctx.rotate(-0.12);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 5;
  ctx.strokeRect(-110, -48, 220, 96);
  ctx.fillStyle = accent;
  ctx.font = '800 36px Syne, "Arial Black", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CROWNED', 0, 8);
  ctx.restore();
  ctx.textAlign = 'left';

  // Footer
  ctx.fillStyle = COLORS.ink;
  ctx.font = '800 22px "Libre Franklin", system-ui, sans-serif';
  ctx.fillText(site, 84, H - 48);
  ctx.fillStyle = COLORS.inkSoft;
  ctx.font = '700 16px "Libre Franklin", system-ui, sans-serif';
  ctx.fillText('Five models. Random parties. You pick the winner.', 280, H - 48);

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

export async function shareVerdictFiles({ blob, title, text, url }) {
  const file = new File([blob], 'apicongress-verdict.png', { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title, text, url });
      return 'shared';
    } catch (err) {
      if (err?.name === 'AbortError') return 'aborted';
    }
  }
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return 'shared-text';
    } catch (err) {
      if (err?.name === 'AbortError') return 'aborted';
    }
  }
  return 'unsupported';
}
