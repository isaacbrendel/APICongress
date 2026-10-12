/**
 * Ephemeral verdict card store for dynamic OG / LinkedIn / X previews.
 * In-memory + disk under storage/verdicts (survives short restarts).
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_CARDS = 400;
const DIR = path.join(__dirname, '..', 'storage', 'verdicts');

const memory = new Map();

function ensureDir() {
  try {
    fs.mkdirSync(DIR, { recursive: true });
  } catch {
    /* ignore */
  }
}

function id() {
  return crypto.randomBytes(6).toString('hex');
}

function prune() {
  const now = Date.now();
  for (const [key, card] of memory.entries()) {
    if (now - card.createdAt > TTL_MS) {
      memory.delete(key);
      try {
        fs.unlinkSync(path.join(DIR, `${key}.json`));
        fs.unlinkSync(path.join(DIR, `${key}.png`));
      } catch {
        /* ignore */
      }
    }
  }
  if (memory.size <= MAX_CARDS) return;
  const sorted = [...memory.entries()].sort((a, b) => a[1].createdAt - b[1].createdAt);
  const drop = sorted.slice(0, memory.size - MAX_CARDS);
  drop.forEach(([key]) => {
    memory.delete(key);
    try {
      fs.unlinkSync(path.join(DIR, `${key}.json`));
      fs.unlinkSync(path.join(DIR, `${key}.png`));
    } catch {
      /* ignore */
    }
  });
}

function persist(card) {
  ensureDir();
  try {
    fs.writeFileSync(
      path.join(DIR, `${card.id}.json`),
      JSON.stringify({
        id: card.id,
        topic: card.topic,
        winner: card.winner,
        party: card.party,
        quote: card.quote,
        createdAt: card.createdAt
      })
    );
    if (card.png) {
      fs.writeFileSync(path.join(DIR, `${card.id}.png`), card.png);
    }
  } catch (err) {
    console.warn('[VERDICT CARD] persist failed:', err.message);
  }
}

function loadFromDisk(cardId) {
  try {
    const metaPath = path.join(DIR, `${cardId}.json`);
    const pngPath = path.join(DIR, `${cardId}.png`);
    if (!fs.existsSync(metaPath)) return null;
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    if (Date.now() - meta.createdAt > TTL_MS) return null;
    const png = fs.existsSync(pngPath) ? fs.readFileSync(pngPath) : null;
    const card = { ...meta, png };
    memory.set(cardId, card);
    return card;
  } catch {
    return null;
  }
}

function saveVerdictCard({ topic, winner, party, quote, pngBase64 }) {
  prune();
  ensureDir();
  const cardId = id();
  let png = null;
  if (pngBase64) {
    const raw = String(pngBase64).replace(/^data:image\/\w+;base64,/, '');
    png = Buffer.from(raw, 'base64');
    if (png.length > 4.5 * 1024 * 1024) {
      throw new Error('Card image too large');
    }
  }
  const card = {
    id: cardId,
    topic: String(topic || '').slice(0, 200),
    winner: String(winner || '').slice(0, 40),
    party: String(party || '').slice(0, 24),
    quote: String(quote || '').slice(0, 280),
    png,
    createdAt: Date.now()
  };
  memory.set(cardId, card);
  persist(card);
  return card;
}

function getVerdictCard(cardId) {
  if (!cardId) return null;
  if (memory.has(cardId)) {
    const card = memory.get(cardId);
    if (Date.now() - card.createdAt > TTL_MS) {
      memory.delete(cardId);
      return null;
    }
    return card;
  }
  return loadFromDisk(cardId);
}

module.exports = { saveVerdictCard, getVerdictCard };
