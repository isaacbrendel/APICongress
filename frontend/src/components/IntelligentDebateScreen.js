import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getApiUrl, API_ENDPOINTS } from '../config/api';
import { castFighters, partyClass, bestQuote } from '../utils/casting';
import { buildSharePayload, copyText, writeTopicToUrl, nativeShare } from '../utils/share';
import './IntelligentDebateScreen.css';

const REACTIONS = [
  {
    id: 'clap',
    label: 'Clap',
    meaning: 'I agree',
    hint: 'Solid point — you back this take',
    score: 2
  },
  {
    id: 'fire',
    label: 'Fire',
    meaning: 'Hot take',
    hint: 'Sharp and convincing — this landed hard',
    score: 3
  },
  {
    id: 'burn',
    label: 'Burn',
    meaning: 'Roasted them',
    hint: 'Destroyed the other side — biggest score boost',
    score: 4
  }
];

const IntelligentDebateScreen = ({
  topic,
  controversyLevel = 85,
  onReturnHome,
  onPhaseChange
}) => {
  const [fighters] = useState(() => castFighters());
  const [phase, setPhase] = useState('casting');
  const [currentSpeaker, setCurrentSpeaker] = useState(0);
  const [arguments_, setArguments] = useState([]);
  const [scores, setScores] = useState(() =>
    Object.fromEntries(fighters.map((f) => [f.id, 0]))
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState(null);
  const [billDocument, setBillDocument] = useState(null);
  const [billStatus, setBillStatus] = useState(null);
  const [isFetchingBill, setIsFetchingBill] = useState(false);
  const [error, setError] = useState(null);
  const [copyState, setCopyState] = useState('idle');
  const [castTick, setCastTick] = useState(0);

  const initStarted = useRef(false);
  const skipToVoteRef = useRef(false);
  const feedRef = useRef(null);
  const abortRef = useRef(false);

  useEffect(() => {
    writeTopicToUrl(topic);
  }, [topic]);

  useEffect(() => {
    if (onPhaseChange) onPhaseChange(phase);
  }, [phase, onPhaseChange]);

  useEffect(() => {
    const feed = feedRef.current;
    if (!feed) return;
    feed.scrollTo({ top: feed.scrollHeight, behavior: 'smooth' });
  }, [arguments_.length, isGenerating, phase]);

  // Cast reveal choreography then debate
  useEffect(() => {
    if (phase !== 'casting') return undefined;
    let tick = 0;
    const iv = setInterval(() => {
      tick += 1;
      setCastTick(tick);
    }, 120);
    const t = setTimeout(() => {
      clearInterval(iv);
      setPhase('debating');
    }, 1600);
    return () => {
      clearInterval(iv);
      clearTimeout(t);
    };
  }, [phase]);

  const generateArgument = useCallback(
    async (ai, currentArguments = []) => {
      const context = currentArguments.map((arg) => ({
        speaker: arg.party,
        message: arg.argument
      }));

      const response = await fetch(getApiUrl(API_ENDPOINTS.LLM), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: ai.model,
          party: ai.party,
          topic,
          controversyLevel,
          context,
          persona: ai.persona,
          flavor: ai.flavor
        })
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      return data.response || data.message || null;
    },
    [topic, controversyLevel]
  );

  const handleSkipToVote = () => {
    skipToVoteRef.current = true;
    setPhase('voting');
  };

  useEffect(() => {
    if (phase !== 'debating' || initStarted.current) return undefined;
    initStarted.current = true;
    abortRef.current = false;

    const runDebate = async () => {
      const currentArguments = [];

      for (let i = 0; i < fighters.length; i += 1) {
        if (skipToVoteRef.current || abortRef.current) break;

        const ai = fighters[i];
        setCurrentSpeaker(i);
        setIsGenerating(true);

        try {
          const argument = await generateArgument(ai, currentArguments);
          if (argument && !skipToVoteRef.current) {
            const newArg = {
              id: `arg_${i}_${Date.now()}`,
              model: ai.model,
              fighterId: ai.id,
              name: ai.name,
              party: ai.party,
              logo: ai.logo,
              argument,
              reactions: { fire: 0, clap: 0, burn: 0 }
            };
            currentArguments.push(newArg);
            setArguments((prev) => [...prev, newArg]);
            // Opening bonus so scoreboard moves immediately
            setScores((prev) => ({
              ...prev,
              [ai.id]: (prev[ai.id] || 0) + 2
            }));
          }
        } catch (err) {
          console.error(`[${ai.name}] Error:`, err);
          setError(`${ai.name} is regrouping — continuing the floor`);
        }

        setIsGenerating(false);

        // Short dramatic beat only — no fake multi-second waits
        if (i < fighters.length - 1 && !skipToVoteRef.current) {
          await new Promise((r) => setTimeout(r, 450));
        }
      }

      if (!skipToVoteRef.current && !abortRef.current) {
        await new Promise((r) => setTimeout(r, 600));
        setPhase('voting');
      }
    };

    runDebate();
    return () => {
      abortRef.current = true;
    };
  }, [phase, fighters, generateArgument]);

  const reactToArgument = (argId, fighterId, reactionId) => {
    const reaction = REACTIONS.find((r) => r.id === reactionId);
    if (!reaction) return;

    setArguments((prev) =>
      prev.map((a) =>
        a.id === argId
          ? {
              ...a,
              reactions: {
                ...a.reactions,
                [reactionId]: (a.reactions?.[reactionId] || 0) + 1
              }
            }
          : a
      )
    );
    setScores((prev) => ({
      ...prev,
      [fighterId]: (prev[fighterId] || 0) + reaction.score
    }));

    // Fire-and-forget RL vote when available
    fetch(getApiUrl(API_ENDPOINTS.VOTE_ARGUMENT), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        argumentId: argId,
        vote: reactionId === 'burn' ? 'up' : reactionId === 'fire' ? 'up' : 'up',
        model: fighters.find((f) => f.id === fighterId)?.model
      })
    }).catch(() => {});
  };

  const createFallbackBill = (billTopic, party) => {
    const year = new Date().getFullYear();
    const sanitized = (billTopic || 'Public Policy').slice(0, 100);
    return {
      party,
      title: `The ${sanitized} Reform & Progress Act`,
      billNumber: `H.R. ${Math.floor(1000 + Math.random() * 9000)}`,
      fullText: `119TH CONGRESS\n\nA BILL\nTo establish national standards regarding ${sanitized}.\n\nBe it enacted...\n\nSECTION 1. SHORT TITLE.\nThis Act may be cited as "The ${sanitized} Reform & Progress Act of ${year}".`
    };
  };

  const handleSelectWinner = async (fighterId) => {
    setSelectedWinner(fighterId);
    setIsFetchingBill(true);
    const winningAI = fighters.find((a) => a.id === fighterId) || fighters[0];

    try {
      const response = await fetch(getApiUrl(API_ENDPOINTS.BILL_COLLABORATIVE), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          party: winningAI.party,
          controversyLevel
        })
      });

      if (response.ok) {
        const data = await response.json();
        const doc = data.document || data.documents?.[winningAI.party.toLowerCase()] || data;
        setBillDocument(doc);
      } else {
        setBillDocument(createFallbackBill(topic, winningAI.party));
      }
    } catch {
      setBillDocument(createFallbackBill(topic, winningAI.party));
    } finally {
      setIsFetchingBill(false);
      setPhase('result');
    }
  };

  const winner = useMemo(
    () => fighters.find((f) => f.id === selectedWinner) || null,
    [fighters, selectedWinner]
  );

  const share = useMemo(() => {
    if (!winner) return null;
    return buildSharePayload({
      topic,
      winner: winner.name,
      party: winner.party,
      quote: bestQuote(arguments_, winner.model)
    });
  }, [winner, topic, arguments_]);

  const handleCopyShare = async () => {
    if (!share) return;
    // Prefer OS share sheet on mobile when available
    const shared = await nativeShare({
      title: 'APICONGRESS verdict',
      text: share.text,
      url: share.rematch
    });
    if (shared) {
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 2000);
      return;
    }
    const ok = await copyText(share.text);
    setCopyState(ok ? 'copied' : 'failed');
    setTimeout(() => setCopyState('idle'), 2000);
  };

  const leaderId = useMemo(() => {
    let best = fighters[0]?.id;
    let bestScore = -1;
    Object.entries(scores).forEach(([id, s]) => {
      if (s > bestScore) {
        bestScore = s;
        best = id;
      }
    });
    return best;
  }, [scores, fighters]);

  const currentAI = fighters[currentSpeaker];
  const showArena = phase === 'debating' || phase === 'voting' || phase === 'casting';

  return (
    <div className={`debate-screen ${showArena ? 'has-arena' : ''}`}>
      <button type="button" className="exit-btn" onClick={onReturnHome}>
        ← Exit
      </button>

      <header className="debate-header">
        <p className="debate-eyebrow">Floor topic</p>
        <h1 className="debate-topic">{topic}</h1>
      </header>

      {(error) && (
        <div className="status-strip">
          {error && (
            <div className="error-banner">
              <span>{error}</span>
              <button type="button" onClick={() => setError(null)} aria-label="Dismiss">
                ×
              </button>
            </div>
          )}
        </div>
      )}

      {/* CASTING */}
      {phase === 'casting' && (
        <section className="phase-casting" aria-live="polite">
          <p className="cast-label">Assigning the chamber…</p>
          <div className="cast-grid">
            {fighters.map((f, i) => (
              <div
                key={f.id}
                className={`cast-card ${partyClass(f.party)} ${castTick > i ? 'revealed' : ''}`}
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <img src={f.logo} alt="" className="cast-logo" width={48} height={48} />
                <div>
                  <strong>{f.name}</strong>
                  <span className={`party-pill ${partyClass(f.party)}`}>{f.party}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* DEBATE + VOTE arena */}
      {(phase === 'debating' || phase === 'voting') && (
        <div className="arena-layout">
          <aside className="fighter-rail" aria-label="Scoreboard">
            {fighters.map((f) => (
              <div
                key={f.id}
                className={`fighter-chip ${partyClass(f.party)} ${
                  currentSpeaker === fighters.indexOf(f) && phase === 'debating' ? 'speaking' : ''
                } ${leaderId === f.id ? 'leading' : ''}`}
              >
                <img src={f.logo} alt="" width={36} height={36} />
                <div className="fighter-meta">
                  <span className="fighter-name">{f.name}</span>
                  <span className={`party-pill ${partyClass(f.party)}`}>{f.party}</span>
                </div>
                <span className="fighter-score">{scores[f.id] || 0}</span>
              </div>
            ))}
          </aside>

          <section className="stage-main">
            {phase === 'debating' && (
              <>
                <div className="progress-bar" aria-hidden="true">
                  {fighters.map((ai, i) => (
                    <div
                      key={ai.id}
                      className={`progress-item ${i < currentSpeaker ? 'done' : ''} ${
                        i === currentSpeaker ? 'active' : ''
                      }`}
                    />
                  ))}
                </div>

                <p className="reaction-legend">
                  Rate each speech — <strong>Clap</strong> agree · <strong>Fire</strong> hot take ·{' '}
                  <strong>Burn</strong> roasted the other side
                </p>

                <div className="argument-feed" ref={feedRef}>
                  {arguments_.map((arg, idx) => (
                    <article key={arg.id || idx} className={`feed-card ${partyClass(arg.party)}`}>
                      <header className="feed-card-header">
                        <div className="feed-speaker">
                          <img src={arg.logo} alt="" width={28} height={28} />
                          <span className="feed-speaker-name">{arg.name}</span>
                          <span className={`party-pill ${partyClass(arg.party)}`}>{arg.party}</span>
                        </div>
                        <span className="feed-turn">Turn {idx + 1}</span>
                      </header>
                      <p className="feed-argument-text">{arg.argument}</p>
                      <div
                        className="reaction-row"
                        role="group"
                        aria-label="Rate this argument"
                      >
                        {REACTIONS.map((r) => {
                          const count = arg.reactions?.[r.id] || 0;
                          return (
                            <button
                              key={r.id}
                              type="button"
                              className={`react-btn react-${r.id}`}
                              title={r.hint}
                              aria-label={`${r.label}: ${r.hint}. Adds ${r.score} points.`}
                              onClick={() => reactToArgument(arg.id, arg.fighterId, r.id)}
                            >
                              <span className="react-label">{r.label}</span>
                              <span className="react-meaning">{r.meaning}</span>
                              {count > 0 ? (
                                <span className="react-count" aria-hidden="true">
                                  {count}
                                </span>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    </article>
                  ))}

                  {isGenerating && (
                    <div className="generating-indicator">
                      <div className="typing-dots" aria-hidden="true">
                        <span /><span /><span />
                      </div>
                      <p>{currentAI?.name} has the floor…</p>
                    </div>
                  )}
                </div>

                <div className="rail-foot">
                  <button type="button" className="skip-all-btn" onClick={handleSkipToVote}>
                    Skip to verdict
                  </button>
                </div>
              </>
            )}

            {phase === 'voting' && (
              <>
                <p className="voting-prompt">Who won the floor?</p>
                <div className="argument-feed voting-feed" ref={feedRef}>
                  {arguments_.map((arg, idx) => (
                    <article key={arg.id || idx} className={`feed-card compact ${partyClass(arg.party)}`}>
                      <header className="feed-card-header">
                        <div className="feed-speaker">
                          <img src={arg.logo} alt="" width={28} height={28} />
                          <span className="feed-speaker-name">{arg.name}</span>
                          <span className={`party-pill ${partyClass(arg.party)}`}>{arg.party}</span>
                        </div>
                      </header>
                      <p className="feed-argument-text">{arg.argument}</p>
                    </article>
                  ))}
                </div>
                <div className="voting-names">
                  {fighters
                    .filter((ai) => arguments_.some((a) => a.model === ai.model))
                    .map((ai) => (
                      <button
                        key={ai.id}
                        type="button"
                        className={`vote-name ${partyClass(ai.party)} ${
                          selectedWinner === ai.id ? 'selected' : ''
                        }`}
                        onClick={() => handleSelectWinner(ai.id)}
                        disabled={isFetchingBill || selectedWinner !== null}
                      >
                        <img src={ai.logo} alt="" width={24} height={24} />
                        <span>
                          {ai.name}
                          <small>{ai.party} · {scores[ai.id] || 0} pts</small>
                        </span>
                      </button>
                    ))}
                </div>
                {isFetchingBill && (
                  <div className="bill-loading">
                    <div className="loader" />
                    <p>Sealing the verdict…</p>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      )}

      {/* RESULT + SHARE */}
      {phase === 'result' && winner && share && (
        <section className="phase-result">
          <div className="share-card" role="article">
            <p className="share-kicker">Chamber verdict</p>
            <div className="share-winner">
              <img src={winner.logo} alt="" width={64} height={64} />
              <div>
                <h2>{winner.name}</h2>
                <span className={`party-pill ${partyClass(winner.party)}`}>{winner.party}</span>
              </div>
            </div>
            <p className="share-topic">{topic}</p>
            <blockquote className="share-quote">“{bestQuote(arguments_, winner.model)}”</blockquote>

            <div className="share-actions">
              <a className="share-linkedin" href={share.linkedInIntent} target="_blank" rel="noreferrer">
                LinkedIn
              </a>
              <a className="share-x" href={share.xIntent} target="_blank" rel="noreferrer">
                Post to X
              </a>
              <button type="button" className="share-copy" onClick={handleCopyShare}>
                {copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Copy failed' : 'Copy / Share'}
              </button>
              <button type="button" className="share-rematch" onClick={onReturnHome}>
                New debate
              </button>
            </div>

            {billDocument && (
              <details className="bill-details">
                <summary>Optional: sign the winner&apos;s bill</summary>
                <div className="bill-mini">
                  <h3>{billDocument.billNumber} — {billDocument.title}</h3>
                  <pre className="bill-text">{billDocument.fullText}</pre>
                  {!billStatus ? (
                    <div className="signing-actions">
                      <button type="button" className="sign-btn" onClick={() => setBillStatus('enacted')}>
                        Sign into law
                      </button>
                      <button type="button" className="veto-btn" onClick={() => setBillStatus('vetoed')}>
                        Veto
                      </button>
                    </div>
                  ) : (
                    <p className="bill-status">
                      {billStatus === 'enacted' ? 'Signed into law.' : 'Vetoed. Returned to chamber.'}
                    </p>
                  )}
                </div>
              </details>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default IntelligentDebateScreen;
