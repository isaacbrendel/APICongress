import React, { useEffect, useRef, useState } from 'react';
import { getApiUrl, API_ENDPOINTS } from '../config/api';
import './HomeScreen.css';

const FALLBACK_TRENDS = [
  { topic: 'Should AI companies be liable for model harm?', heat: 92, source: 'curated' },
  { topic: 'Should the US ban TikTok?', heat: 88, source: 'curated' },
  { topic: 'Is nuclear power the only real climate fix?', heat: 86, source: 'curated' },
  { topic: 'Should billionaires face a wealth tax?', heat: 90, source: 'curated' },
  { topic: 'Do social media platforms owe users free speech?', heat: 85, source: 'curated' },
  { topic: 'Should student debt be canceled?', heat: 83, source: 'curated' }
];

const HomeScreen = ({ onBeginDebate, initialTopic = '' }) => {
  const inputRef = useRef(null);
  const [topic, setTopic] = useState(initialTopic);
  const [heat, setHeat] = useState(85);
  const [trends, setTrends] = useState(FALLBACK_TRENDS);
  const [trendMeta, setTrendMeta] = useState({ sources: ['curated'], xLive: false, loading: true });

  useEffect(() => {
    if (initialTopic) setTopic(initialTopic);
  }, [initialTopic]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(getApiUrl(API_ENDPOINTS.TRENDING));
        if (!res.ok) throw new Error(`trending ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        if (Array.isArray(data.topics) && data.topics.length) {
          setTrends(data.topics.slice(0, 12));
          setTrendMeta({
            sources: data.sources || [],
            xLive: !!data.xLive,
            loading: false,
            updatedAt: data.updatedAt
          });
        } else {
          setTrendMeta((m) => ({ ...m, loading: false }));
        }
      } catch {
        if (!cancelled) setTrendMeta((m) => ({ ...m, loading: false }));
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = (topic || inputRef.current?.value || '').trim();
    if (!text) {
      inputRef.current?.focus();
      return;
    }
    onBeginDebate(text, { controversyLevel: heat });
  };

  const pickTrend = (t) => {
    setTopic(t.topic);
    onBeginDebate(t.topic, { controversyLevel: Math.max(heat, t.heat || 80), fromTrend: t.source });
  };

  const sourceLabel = trendMeta.xLive
    ? 'Live from X · US trends'
    : trendMeta.sources.includes('google_trends')
      ? 'Google Trends US · chamber topics'
      : trendMeta.sources.includes('reddit')
        ? 'From Reddit + chamber seeds'
        : 'Chamber topic seeds';

  return (
    <div className="home-screen">
      <header className="home-hero">
        <p className="home-kicker">Five models. Random parties. One verdict.</p>
        <h1 className="home-brand">APICONGRESS</h1>
        <p className="home-tagline">
          Drop a topic. Watch the chamber argue. Share the verdict.
        </p>
      </header>

      <section className="trend-rail" aria-label="Trending debate topics">
        <div className="trend-rail-head">
          <span className={`trend-live ${trendMeta.xLive ? 'is-live' : ''}`}>
            {trendMeta.xLive ? '● LIVE ON X' : '● TRENDING'}
          </span>
          <span className="trend-source">{trendMeta.loading ? 'Loading topics…' : sourceLabel}</span>
        </div>
        <div className="trend-chips" role="list">
          {trends.map((t) => (
            <button
              key={`${t.source}-${t.topic}`}
              type="button"
              className="trend-chip"
              role="listitem"
              onClick={() => pickTrend(t)}
              title={`Open debate: ${t.topic}`}
            >
              <span className="trend-heat">{t.heat || '—'}</span>
              <span className="trend-text">{t.topic}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="home-console">
        <form onSubmit={handleSubmit} className="topic-form">
          <label className="sr-only" htmlFor="debate-topic">
            Debate topic
          </label>
          <input
            id="debate-topic"
            ref={inputRef}
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter a topic — or tap a trend above"
            className="topic-input"
            autoFocus
            maxLength={180}
            autoComplete="off"
            enterKeyHint="go"
          />
          <button type="submit" className="begin-button">
            Open Floor
          </button>
        </form>

        <div className="heat-row">
          <label htmlFor="heat-slider">
            Intensity <strong>{heat}</strong>
          </label>
          <input
            id="heat-slider"
            type="range"
            min="40"
            max="100"
            step="5"
            value={heat}
            onChange={(e) => setHeat(Number(e.target.value))}
          />
          <span className="heat-hint">{heat >= 90 ? 'Intense' : heat >= 70 ? 'Spirited' : 'Civil'}</span>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
