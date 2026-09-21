/**
 * Trending debate topics — X (Twitter) when credentials exist,
 * otherwise Reddit + curated seeds. Cached in-memory.
 */

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
let cache = { topics: null, fetchedAt: 0, sources: [] };

const CURATED = [
  { topic: 'Should AI companies be liable for model harm?', heat: 92, source: 'curated' },
  { topic: 'Should the US ban TikTok?', heat: 88, source: 'curated' },
  { topic: 'Is remote work killing American cities?', heat: 84, source: 'curated' },
  { topic: 'Should college athletes be paid like pros?', heat: 81, source: 'curated' },
  { topic: 'Should the voting age be lowered to 16?', heat: 79, source: 'curated' },
  { topic: 'Is nuclear power the only real climate fix?', heat: 86, source: 'curated' },
  { topic: 'Should billionaires face a wealth tax?', heat: 90, source: 'curated' },
  { topic: 'Do social media platforms owe users free speech?', heat: 85, source: 'curated' },
  { topic: 'Should student debt be canceled?', heat: 83, source: 'curated' },
  { topic: 'Is crypto a public good or a casino?', heat: 77, source: 'curated' },
  { topic: 'Should the US adopt ranked-choice voting?', heat: 74, source: 'curated' },
  { topic: 'Are police body cams enough accountability?', heat: 80, source: 'curated' }
];

function normalizeTopic(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let t = raw.replace(/^#/, '').replace(/\s+/g, ' ').trim();
  if (t.length < 3 || t.length > 140) return null;
  // Turn hashtag camelCase into words when possible
  if (!/\s/.test(t) && /[a-z][A-Z]/.test(t)) {
    t = t.replace(/([a-z])([A-Z])/g, '$1 $2');
  }
  if (/[?]/.test(t)) return t;
  // Already a long headline — debate-ify lightly
  if (t.split(' ').length >= 8) return `${t.replace(/\.*$/, '')}?`;
  // Short trend strings → punchy fight prompt
  return `${t}: cultural moment or overblown?`;
}

function dedupeTopics(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = item.topic.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

async function fetchXTrends() {
  const token = process.env.X_BEARER_TOKEN || process.env.TWITTER_BEARER_TOKEN;
  if (!token) return { topics: [], ok: false, reason: 'no_token' };

  // WOEID 23424977 = United States
  const url = 'https://api.twitter.com/1.1/trends/place.json?id=23424977';
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.warn(`[TRENDING] X API ${res.status}: ${body.slice(0, 200)}`);
      return { topics: [], ok: false, reason: `http_${res.status}` };
    }
    const data = await res.json();
    const trends = data?.[0]?.trends || [];
    const topics = trends
      .slice(0, 15)
      .map((tr, i) => {
        const topic = normalizeTopic(tr.name);
        if (!topic) return null;
        return {
          topic,
          heat: Math.max(50, 98 - i * 3),
          source: 'x',
          tweetVolume: tr.tweet_volume || null
        };
      })
      .filter(Boolean);
    return { topics, ok: topics.length > 0, reason: topics.length ? 'ok' : 'empty' };
  } catch (err) {
    console.warn('[TRENDING] X fetch failed:', err.message);
    return { topics: [], ok: false, reason: err.message };
  }
}

async function fetchRedditHot(subreddit) {
  const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=12&raw_json=1`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'APICongress/1.0 (debate topic discovery)' }
    });
    if (!res.ok) return [];
    const data = await res.json();
    const posts = data?.data?.children || [];
    return posts
      .map((p) => {
        const title = p?.data?.title;
        if (!title || p?.data?.stickied) return null;
        if (/^\[?(mega|daily|discussion)/i.test(title)) return null;
        const topic = normalizeTopic(title.length > 110 ? `${title.slice(0, 107)}...` : title);
        if (!topic) return null;
        return {
          topic,
          heat: Math.min(95, 70 + Math.floor((p.data.score || 0) / 500)),
          source: `reddit/${subreddit}`,
          score: p.data.score || 0
        };
      })
      .filter(Boolean);
  } catch (err) {
    console.warn(`[TRENDING] Reddit r/${subreddit} failed:`, err.message);
    return [];
  }
}

/**
 * Google Daily Trends RSS — no API key, strong "what's hot" signal.
 */
async function fetchGoogleTrends(geo = 'US') {
  const url = `https://trends.google.com/trending/rss?geo=${encodeURIComponent(geo)}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'APICongress/1.0' }
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const titles = [...xml.matchAll(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/gi)]
      .map((m) => m[1])
      .filter((t) => t && !/^Daily Search Trends$/i.test(t));

    return titles.slice(0, 12).map((title, i) => {
      const topic = normalizeTopic(title);
      if (!topic) return null;
      return {
        topic,
        heat: Math.max(55, 96 - i * 3),
        source: 'google_trends'
      };
    }).filter(Boolean);
  } catch (err) {
    console.warn('[TRENDING] Google Trends failed:', err.message);
    return [];
  }
}

/**
 * Public entry — returns trending debate topics with source metadata.
 */
async function getTrendingTopics({ force = false } = {}) {
  const now = Date.now();
  if (!force && cache.topics && now - cache.fetchedAt < CACHE_TTL_MS) {
    return {
      topics: cache.topics,
      sources: cache.sources,
      cached: true,
      updatedAt: new Date(cache.fetchedAt).toISOString()
    };
  }

  const sources = [];
  let collected = [];

  const x = await fetchXTrends();
  if (x.ok) {
    sources.push('x');
    collected = collected.concat(x.topics);
  } else {
    sources.push(`x:${x.reason}`);
  }

  const google = await fetchGoogleTrends('US');
  if (google.length) {
    sources.push('google_trends');
    collected = collected.concat(google);
  }

  const [politics, news, technology] = await Promise.all([
    fetchRedditHot('politics'),
    fetchRedditHot('news'),
    fetchRedditHot('technology')
  ]);
  if (politics.length || news.length || technology.length) {
    sources.push('reddit');
    collected = collected.concat(politics, news, technology);
  }

  // Always blend curated so the rail never looks empty/weird
  sources.push('curated');
  collected = collected.concat(CURATED);

  const topics = dedupeTopics(collected)
    .sort((a, b) => (b.heat || 0) - (a.heat || 0))
    .slice(0, 16);

  cache = { topics, fetchedAt: now, sources };

  return {
    topics,
    sources,
    cached: false,
    xLive: x.ok,
    updatedAt: new Date(now).toISOString()
  };
}

module.exports = { getTrendingTopics, CURATED };
