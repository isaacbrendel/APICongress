/**
 * Debate casting — random partisan assignments each bout.
 */

export const BASE_FIGHTERS = [
  { id: 'chatgpt', name: 'ChatGPT', model: 'ChatGPT', logo: '/logos/chatgpt.png' },
  { id: 'claude', name: 'Claude', model: 'Claude', logo: '/logos/claude.png' },
  { id: 'gemini', name: 'Gemini', model: 'Gemini', logo: '/logos/gemini.png' },
  { id: 'grok', name: 'Grok', model: 'Grok', logo: '/logos/grok.png' },
  { id: 'cohere', name: 'Cohere', model: 'Cohere', logo: '/logos/cohere.png' }
];

export const PARTIES = ['Democrat', 'Republican', 'Independent'];

export const PERSONAS = ['the_firebrand', 'the_absolutist', 'the_pragmatist', 'the_diplomat', 'standard'];
export const FLAVORS = ['aggressive', 'analytical', 'charismatic', 'balanced', 'aggressive'];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Assign parties so every bout has rivalry (at least 2 Dem + 2 Rep when possible).
 */
export function castFighters(seedFighters = BASE_FIGHTERS) {
  const pool = [];
  // Weighted toward two-party clash with one swing Independent
  while (pool.length < seedFighters.length) {
    if (pool.filter((p) => p === 'Democrat').length < 2) pool.push('Democrat');
    else if (pool.filter((p) => p === 'Republican').length < 2) pool.push('Republican');
    else pool.push('Independent');
  }
  const parties = shuffle(pool).slice(0, seedFighters.length);
  const personas = shuffle(PERSONAS);
  const flavors = shuffle(FLAVORS);

  return seedFighters.map((f, i) => ({
    ...f,
    party: parties[i],
    persona: personas[i % personas.length],
    flavor: flavors[i % flavors.length]
  }));
}

export function partyClass(party) {
  return `party-${String(party || 'independent').toLowerCase()}`;
}

export function bestQuote(argumentsList = [], winnerModel) {
  const winnerArgs = argumentsList.filter((a) => a.model === winnerModel);
  const pool = winnerArgs.length ? winnerArgs : argumentsList;
  if (!pool.length) return 'The chamber has spoken.';
  const text = pool[0].argument || '';
  const clipped = text.length > 180 ? `${text.slice(0, 177).trim()}…` : text;
  return clipped;
}
