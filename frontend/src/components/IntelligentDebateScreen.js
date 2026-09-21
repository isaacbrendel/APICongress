import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getApiUrl, API_ENDPOINTS } from '../config/api';
import { castFighters, partyClass, bestQuote } from '../utils/casting';
import { buildSharePayload, copyText, writeTopicToUrl, nativeShare } from '../utils/share';
import './IntelligentDebateScreen.css';

const REACTIONS = [
  { id: 'fire', label: 'Fire', score: 3 },
  { id: 'clap', label: 'Clap', score: 2 },
  { id: 'burn', label: 'Burn', score: 4 }
];

/** ~220 WPM reading + buffer; clamp so short takes still breathe */
function readingPauseMs(text) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean).length;
  const ms = Math.round((words / 2.8) * 1000) + 2500;
  return Math.min(18000, Math.max(7000, ms));
}

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
  const [awaitingContinue, setAwaitingContinue] = useState(false);
  const [autoRemainSec, setAutoRemainSec] = useState(0);
  const [selectedWinner, setSelectedWinner] = useState(null);
  const [pendingCrown, setPendingCrown] = useState(null);
  const [billDocument, setBillDocument] = useState(null);
  const [billStatus, setBillStatus] = useState(null);
  const [isFetchingBill, setIsFetchingBill] = useState(false);
  const [error, setError] = useState(null);
  const [copyState, setCopyState] = useState('idle');
  const [castTick, setCastTick] = useState(0);
  const [focusedArgId, setFocusedArgId] = useState(null);

  const initStarted = useRef(false);
  const skipToVoteRef = useRef(false);
  const feedRef = useRef(null);
  const abortRef = useRef(false);
  const continueResolverRef = useRef(null);
  const autoTimerRef = useRef(null);
  const autoTickRef = useRef(null);

  useEffect(() => {
    writeTopicToUrl(topic);
  }, [topic]);

  useEffect(() => {
    if (onPhaseChange) onPhaseChange(phase);
  }, [phase, onPhaseChange]);

  useEffect(() => {
    if (!focusedArgId) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setFocusedArgId(null);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [focusedArgId]);

  useEffect(() => {
    const feed = feedRef.current;
    if (!feed || focusedArgId) return;
    feed.scrollTo({ top: feed.scrollHeight, behavior: 'smooth' });
  }, [arguments_.length, isGenerating, phase, awaitingContinue, focusedArgId]);

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
    }, 1800);
    return () => {
      clearInterval(iv);
      clearTimeout(t);
    };
  }, [phase]);

  const clearAutoAdvance = () => {
    if (autoTimerRef.current) {
      clearTimeout(autoTimerRef.current);
      autoTimerRef.current = null;
    }
    if (autoTickRef.current) {
      clearInterval(autoTickRef.current);
      autoTickRef.current = null;
    }
    setAutoRemainSec(0);
  };

  const resolveContinue = useCallback(() => {
    clearAutoAdvance();
    setAwaitingContinue(false);
    if (continueResolverRef.current) {
      const r = continueResolverRef.current;
      continueResolverRef.current = null;
      r();
    }
  }, []);

  const waitForContinue = useCallback(
    (argumentText) =>
      new Promise((resolve) => {
        clearAutoAdvance();
        setAwaitingContinue(true);
        continueResolverRef.current = resolve;

        const totalMs = readingPauseMs(argumentText);
        const totalSec = Math.ceil(totalMs / 1000);
        setAutoRemainSec(totalSec);

        autoTickRef.current = setInterval(() => {
          setAutoRemainSec((s) => Math.max(0, s - 1));
        }, 1000);

        autoTimerRef.current = setTimeout(() => {
          resolveContinue();
        }, totalMs);
      }),
    [resolveContinue]
  );

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
    clearAutoAdvance();
    setAwaitingContinue(false);
    if (continueResolverRef.current) {
      const r = continueResolverRef.current;
      continueResolverRef.current = null;
      r();
    }
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
            setScores((prev) => ({
              ...prev,
              [ai.id]: (prev[ai.id] || 0) + 2
            }));
            setIsGenerating(false);

            // Always pause so the latest speech is readable (incl. last before vote)
            if (!skipToVoteRef.current && !abortRef.current) {
              await waitForContinue(argument);
            }
          } else {
            setIsGenerating(false);
          }
        } catch (err) {
          console.error(`[${ai.name}] Error:`, err);
          setError(`${ai.name} is regrouping — continuing the floor`);
          setIsGenerating(false);
        }
      }

      if (!skipToVoteRef.current && !abortRef.current) {
        setAwaitingContinue(false);
        setPhase('voting');
      }
    };

    runDebate();
    return () => {
      abortRef.current = true;
      clearAutoAdvance();
      if (continueResolverRef.current) {
        continueResolverRef.current();
        continueResolverRef.current = null;
      }
    };
  }, [phase, fighters, generateArgument, waitForContinue]);

  const reactToArgument = (e, argId, fighterId, reactionId) => {
    e?.stopPropagation?.();
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

    fetch(getApiUrl(API_ENDPOINTS.VOTE_ARGUMENT), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        argumentId: argId,
        vote: 'up',
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

  const confirmCrown = async () => {
    if (!pendingCrown || isFetchingBill) return;
    const fighterId = pendingCrown;
    setSelectedWinner(fighterId);
    setPendingCrown(null);
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

  const focusedArg = useMemo(
    () => arguments_.find((a) => a.id === focusedArgId) || null,
    [arguments_, focusedArgId]
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

  const pendingFighter = fighters.find((f) => f.id === pendingCrown) || null;
  const currentAI = fighters[currentSpeaker];
  const showArena = phase === 'debating' || phase === 'voting' || phase === 'casting';

  const renderArgCard = (arg, idx, { compact = false, expanded = false } = {}) => (
    <article
      key={arg.id || idx}
      className={`feed-card ${partyClass(arg.party)} ${compact ? 'compact' : ''} ${
        expanded ? 'is-expanded' : ''
      } is-tappable`}
      role="button"
      tabIndex={0}
      onClick={() => setFocusedArgId(arg.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setFocusedArgId(arg.id);
        }
      }}
      aria-label={`Read full argument from ${arg.name}`}
    >
      <header className="feed-card-header">
        <div className="feed-speaker">
          <img src={arg.logo} alt="" width={28} height={28} />
          <span className="feed-speaker-name">{arg.name}</span>
          <span className={`party-pill ${partyClass(arg.party)}`}>{arg.party}</span>
        </div>
        <span className="feed-turn">Turn {idx + 1}</span>
      </header>
      <p className="feed-argument-text">{arg.argument}</p>
      <div className="feed-card-hint">{expanded ? 'Reading now — tap for focus view' : 'Tap to read full →'}</div>
      {!compact && (
        <div className="reaction-row">
          {REACTIONS.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`react-btn react-${r.id}`}
              onClick={(e) => reactToArgument(e, arg.id, arg.fighterId, r.id)}
            >
              {r.label}
              {arg.reactions?.[r.id] ? ` ${arg.reactions[r.id]}` : ''}
            </button>
          ))}
        </div>
      )}
    </article>
  );

  return (
    <div className={`debate-screen ${showArena ? 'has-arena' : ''}`}>
      <button type="button" className="exit-btn" onClick={onReturnHome}>
        ← Exit
      </button>

      <header className="debate-header">
        <p className="debate-eyebrow">Floor topic</p>
        <h1 className="debate-topic">{topic}</h1>
      </header>

      {error && (
        <div className="status-strip">
          <div className="error-banner">
            <span>{error}</span>
            <button type="button" onClick={() => setError(null)} aria-label="Dismiss">
              ×
            </button>
          </div>
        </div>
      )}

      {phase === 'casting' && (
        <section className="phase-casting" aria-live="polite">
          <p className="cast-label">Assigning the chamber…</p>
          <div className="cast-grid">
            {fighters.map((f, i) => (
              <div
                key={f.id}
                className={`cast-card ${partyClass(f.party)} ${castTick > i ? 'revealed' : ''}`}
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

      {(phase === 'debating' || phase === 'voting') && (
        <div className="arena-layout">
          <aside className="fighter-rail" aria-label="Reaction scoreboard">
            <p className="rail-caption">Your reactions</p>
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
                      className={`progress-item ${i < currentSpeaker || (i === currentSpeaker && !isGenerating && arguments_.length > i) ? 'done' : ''} ${
                        i === currentSpeaker && (isGenerating || awaitingContinue) ? 'active' : ''
                      }`}
                    />
                  ))}
                </div>

                <div className="argument-feed" ref={feedRef}>
                  {arguments_.map((arg, idx) =>
                    renderArgCard(arg, idx, {
                      expanded: awaitingContinue && idx === arguments_.length - 1
                    })
                  )}

                  {isGenerating && (
                    <div className="generating-indicator">
                      <div className="typing-dots" aria-hidden="true">
                        <span /><span /><span />
                      </div>
                      <p>{currentAI?.name} has the floor…</p>
                    </div>
                  )}
                </div>

                <div className="rail-foot debate-controls">
                  {awaitingContinue ? (
                    <button type="button" className="continue-btn" onClick={resolveContinue}>
                      {arguments_.length >= fighters.length
                        ? 'Proceed to crown winner'
                        : 'Next speaker'}
                      {autoRemainSec > 0 ? ` · auto in ${autoRemainSec}s` : ''}
                    </button>
                  ) : (
                    <p className="pace-hint">
                      {isGenerating
                        ? 'Listening to the floor…'
                        : 'Take your time — tap any speech to read the full take.'}
                    </p>
                  )}
                  <button type="button" className="skip-all-btn" onClick={handleSkipToVote}>
                    Skip to your vote
                  </button>
                </div>
              </>
            )}

            {phase === 'voting' && (
              <>
                <div className="voting-header">
                  <p className="voting-prompt">You pick the winner</p>
                  <p className="voting-explain">
                    Scores are only your reactions — they don’t decide the verdict. Tap a speech to re-read it, then crown one model.
                  </p>
                </div>

                <div className="argument-feed voting-feed" ref={feedRef}>
                  {arguments_.map((arg, idx) => renderArgCard(arg, idx, { compact: true }))}
                </div>

                <div className="voting-names">
                  <p className="voting-names-label">Crown a model</p>
                  {fighters
                    .filter((ai) => arguments_.some((a) => a.model === ai.model))
                    .map((ai) => (
                      <button
                        key={ai.id}
                        type="button"
                        className={`vote-name ${partyClass(ai.party)} ${
                          pendingCrown === ai.id ? 'selected' : ''
                        }`}
                        onClick={() => setPendingCrown(ai.id)}
                        disabled={isFetchingBill || selectedWinner !== null}
                      >
                        <img src={ai.logo} alt="" width={24} height={24} />
                        <span>
                          {ai.name}
                          <small>{ai.party} · {scores[ai.id] || 0} reaction pts</small>
                        </span>
                      </button>
                    ))}
                </div>

                {pendingCrown && pendingFighter && !isFetchingBill && (
                  <div className="crown-confirm">
                    <p>
                      Crown <strong>{pendingFighter.name}</strong> ({pendingFighter.party})?
                    </p>
                    <div className="crown-confirm-actions">
                      <button type="button" className="crown-cancel" onClick={() => setPendingCrown(null)}>
                        Cancel
                      </button>
                      <button type="button" className="crown-yes" onClick={confirmCrown}>
                        Confirm winner
                      </button>
                    </div>
                  </div>
                )}

                {isFetchingBill && (
                  <div className="bill-loading">
                    <div className="loader" />
                    <p>Recording your verdict…</p>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      )}

      {phase === 'result' && winner && share && (
        <section className="phase-result">
          <div className="share-card" role="article">
            <p className="share-kicker">You crowned the winner</p>
            <div className="share-winner">
              <img src={winner.logo} alt="" width={64} height={64} />
              <div>
                <h2>{winner.name}</h2>
                <span className={`party-pill ${partyClass(winner.party)}`}>{winner.party}</span>
              </div>
            </div>
            <p className="share-topic">{topic}</p>
            <p className="share-how">
              Chosen by you — reaction points were just a guide, not an automatic pick.
            </p>
            <blockquote className="share-quote">“{bestQuote(arguments_, winner.model)}”</blockquote>

            <button
              type="button"
              className="reread-all-btn"
              onClick={() => arguments_[0] && setFocusedArgId(arguments_[0].id)}
            >
              Re-read chamber speeches
            </button>

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

      {/* Full argument reader */}
      {focusedArg && (
        <div
          className="arg-modal-backdrop"
          role="presentation"
          onClick={() => setFocusedArgId(null)}
        >
          <div
            className={`arg-modal ${partyClass(focusedArg.party)}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="arg-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="arg-modal-head">
              <div className="feed-speaker">
                <img src={focusedArg.logo} alt="" width={36} height={36} />
                <div>
                  <h2 id="arg-modal-title">{focusedArg.name}</h2>
                  <span className={`party-pill ${partyClass(focusedArg.party)}`}>{focusedArg.party}</span>
                </div>
              </div>
              <button type="button" className="arg-modal-close" onClick={() => setFocusedArgId(null)}>
                Close
              </button>
            </header>
            <div className="arg-modal-body">
              <p>{focusedArg.argument}</p>
            </div>
            <div className="arg-modal-nav">
              <button
                type="button"
                disabled={arguments_.findIndex((a) => a.id === focusedArg.id) <= 0}
                onClick={() => {
                  const i = arguments_.findIndex((a) => a.id === focusedArg.id);
                  if (i > 0) setFocusedArgId(arguments_[i - 1].id);
                }}
              >
                ← Prev
              </button>
              <span>
                {arguments_.findIndex((a) => a.id === focusedArg.id) + 1} / {arguments_.length}
              </span>
              <button
                type="button"
                disabled={arguments_.findIndex((a) => a.id === focusedArg.id) >= arguments_.length - 1}
                onClick={() => {
                  const i = arguments_.findIndex((a) => a.id === focusedArg.id);
                  if (i < arguments_.length - 1) setFocusedArgId(arguments_[i + 1].id);
                }}
              >
                Next →
              </button>
            </div>
            {phase === 'debating' || phase === 'voting' ? (
              <div className="reaction-row arg-modal-react">
                {REACTIONS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className={`react-btn react-${r.id}`}
                    onClick={(e) => reactToArgument(e, focusedArg.id, focusedArg.fighterId, r.id)}
                  >
                    {r.label}
                    {focusedArg.reactions?.[r.id] ? ` ${focusedArg.reactions[r.id]}` : ''}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default IntelligentDebateScreen;
