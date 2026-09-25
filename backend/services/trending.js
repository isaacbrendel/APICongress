/**
 * Trending debate topics — political-adjacent only.
 * X when credentials exist; otherwise Google Trends (filtered) + curated.
 */

const CACHE_TTL_MS = 8 * 60 * 1000;
let cache = { topics: null, fetchedAt: 0, sources: [] };

const CURATED = [
  { topic: 'Should AI companies be liable for model harm?', heat: 92, source: 'curated' },
  { topic: 'Should the US ban TikTok?', heat: 88, source: 'curated' },
  { topic: 'Should Congress regulate frontier AI models?', heat: 91, source: 'curated' },
  { topic: 'Should billionaires face a wealth tax?', heat: 90, source: 'curated' },
  { topic: 'Is nuclear power the only real climate fix?', heat: 86, source: 'curated' },
  { topic: 'Do social media platforms owe users free speech?', heat: 85, source: 'curated' },
  { topic: 'Should student debt be canceled?', heat: 83, source: 'curated' },
  { topic: 'Should the voting age be lowered to 16?', heat: 79, source: 'curated' },
  { topic: 'Are police body cams enough accountability?', heat: 80, source: 'curated' },
  { topic: 'Should the US adopt ranked-choice voting?', heat: 74, source: 'curated' },
  { topic: 'Is remote work killing American cities?', heat: 84, source: 'curated' },
  { topic: 'Should college athletes be paid like pros?', heat: 81, source: 'curated' },
  { topic: 'Should Section 230 be repealed?', heat: 82, source: 'curated' },
  { topic: 'Does the Fed care more about Wall Street than wages?', heat: 78, source: 'curated' },
  { topic: 'Should the US reinstate a military draft?', heat: 76, source: 'curated' },
  { topic: 'Is antitrust the right tool for Big Tech?', heat: 87, source: 'curated' }
];

const POLITICAL_HINT =
  /\b(tax|taxes|tariff|vote|voting|election|ballot|congress|senate|house\b|president|white house|scotus|supreme court|immigra|border|asylum|climate|carbon|green new|healthcare|health care|medicare|medicaid|obamacare|gun|second amendment|war\b|nato|ukraine|israel|gaza|palestine|tiktok|ai\b|a\.i\.|artificial intelligence|regulat|policy|legislation|bill\b|democrat|republican|gop\b|biden|trump|harris|governor|mayor|police|crime|defund|debt|deficit|inflation|federal reserve|\bfed\b|crypto|bitcoin|wealth tax|minimum wage|union|labor|student (loan|debt)|abortion|roe\b|rights|free speech|censorship|section 230|antitrust|monopoly|china|trade war|nuclear|energy policy|oil|gas prices|housing|rent control|homeless|public school|education|college tuition|vaccine|pandemic|surveillance|privacy|fbi|cia|nsa|pentagon|military|draft|sanctions|constitution|filibuster|impeach|cabinet|epa|irs|doj|dhs|campaign finance|lobby|gerrymander|voting rights|civil rights|abortion|trans|dei\b|woke|maga|shutdown|budget|appropriations|fcc|ftc|sec\b|doj|justice department|attorney general|supreme|court packing|term limits|citizenship|visa|deport|refugee|sanctuary|police reform|qualified immunity|death penalty|prison|criminal justice|foreign aid|embassy|state department|national security|espionage|whistleblower|pardon|executive order|filibuster|cloture)\b/i;

const REJECT_HINT =
  /\b(nfl|nba|mlb|nhl|mls|soccer|premier league|red wings|penguins|lakers|yankees|patriots|cowboys|chiefs|packers|flyers|bruins|celtics|warriors|dodgers|mets|weather|forecast|humidity|tornado|hurricane watch|box score|final score|touchdown|home run|hat trick|playoffs|world series|super bowl|march madness|ufc|wwe|netflix|hulu|disney\+|spotify|album drop|music video|trailer|episode|season \d|birthday|obituary|horoscope|lottery|recipe|cooking|tiktok dance|celebrity|dating app|fashion week|met gala|oscars|grammys|emmys|duramax|robinhood app|stock tip|crypto pump|meme coin|football|basketball|hockey|baseball|tennis|golf|f1\b|nascar|olympics medal|injury report|trade deadline|free agency|roster|coach fired|qb\b|point guard)\b/i;

function isPoliticalAdjacent(text) {
  const t = String(text || '');
  if (!t.trim()) return false;
  if (REJECT_HINT.test(t) && !POLITICAL_HINT.test(t)) return false;
  if (POLITICAL_HINT.test(t)) return true;
  // Curated-style questions starting with Should/Is/Do/Does/Are/Can
  if (/^(should|is|are|do|does|can|will|would|what if)\b/i.test(t) && t.length > 28) {
    // Still reject pure sports phrasings
    if (REJECT_HINT.test(t)) return false;
    return true;
  }
  return false;
}

function normalizeTopic(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let t = raw.replace(/^#/, '').replace(/\s+/g, ' ').trim();
  // Strip publisher suffixes: "Headline - The Atlantic"
  t = t.replace(/\s[-–—]\s+[^-–—]{2,40}$/u, '').trim();
  t = t.replace(/^PODCAST:\s*/i, '').trim();
  t = t.replace(/^Op-Ed:\s*/i, '').trim();
  if (t.length < 8 || t.length > 140) return null;
  if (!/\s/.test(t) && /[a-z][A-Z]/.test(t)) {
    t = t.replace(/([a-z])([A-Z])/g, '$1 $2');
  }
  if (!isPoliticalAdjacent(t)) return null;

  if (/[?]/.test(t)) return t;
  if (t.split(' ').length >= 8) return `${t.replace(/\.*$/, '')}?`;
  return `Should policymakers act on ${t}?`;
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
      .slice(0, 25)
      .map((tr, i) => {
        const topic = normalizeTopic(tr.name);
        if (!topic) return null;
        return {
          topic,
          heat: Math.max(55, 98 - i * 2),
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
  const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=20&raw_json=1`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'APICongress/1.0 (political debate topics)' }
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

    return titles
      .map((title, i) => {
        const topic = normalizeTopic(title);
        if (!topic) return null;
        return {
          topic,
          heat: Math.max(60, 94 - i * 3),
          source: 'google_trends'
        };
      })
      .filter(Boolean);
  } catch (err) {
    console.warn('[TRENDING] Google Trends failed:', err.message);
    return [];
  }
}

/**
 * Google News RSS — politics / nation (more on-brief than raw search trends).
 */
async function fetchGoogleNews(topicQuery) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(topicQuery)}&hl=en-US&gl=US&ceid=US:en`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'APICongress/1.0' } });
    if (!res.ok) return [];
    const xml = await res.text();
    const titles = [...xml.matchAll(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/gi)]
      .map((m) => m[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'").trim())
      .filter((t) => t && !/^Google News$/i.test(t));

    return titles.slice(0, 14).map((title, i) => {
      // Skip feed chrome / query echo
      if (/^Google News/i.test(title)) return null;
      if (/when:\d|OR Congress OR|site:/i.test(title)) return null;
      if (title.length < 24) return null;
      const topic = normalizeTopic(title);
      if (!topic) return null;
      return {
        topic,
        heat: Math.max(58, 90 - i * 2),
        source: 'google_news'
      };
    }).filter(Boolean);
  } catch (err) {
    console.warn('[TRENDING] Google News failed:', err.message);
    return [];
  }
}

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

  const [google, newsPolitics, newsCongress] = await Promise.all([
    fetchGoogleTrends('US'),
    fetchGoogleNews('US politics OR Congress OR election when:1d'),
    fetchGoogleNews('AI regulation OR antitrust OR immigration policy when:2d')
  ]);
  if (google.length) {
    sources.push('google_trends');
    collected = collected.concat(google);
  }
  if (newsPolitics.length || newsCongress.length) {
    sources.push('google_news');
    collected = collected.concat(newsPolitics, newsCongress);
  }

  const [politics, news, technology, neoliberal] = await Promise.all([
    fetchRedditHot('politics'),
    fetchRedditHot('news'),
    fetchRedditHot('technology'),
    fetchRedditHot('neoliberal')
  ]);
  if (politics.length || news.length || technology.length || neoliberal.length) {
    sources.push('reddit');
    collected = collected.concat(politics, news, technology, neoliberal);
  }

  sources.push('curated');
  collected = collected.concat(CURATED);

  // Final belt-and-suspenders political filter
  const topics = dedupeTopics(collected)
    .filter((t) => isPoliticalAdjacent(t.topic))
    .sort((a, b) => (b.heat || 0) - (a.heat || 0))
    .slice(0, 14);

  // Never ship an empty rail
  const finalTopics = topics.length ? topics : CURATED.slice(0, 10);

  cache = { topics: finalTopics, fetchedAt: now, sources };

  return {
    topics: finalTopics,
    sources,
    cached: false,
    xLive: x.ok,
    updatedAt: new Date(now).toISOString()
  };
}

module.exports = { getTrendingTopics, CURATED, isPoliticalAdjacent, normalizeTopic };
