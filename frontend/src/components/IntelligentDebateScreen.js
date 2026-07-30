import React, { useState, useEffect, useRef } from 'react';
import { getApiUrl, API_ENDPOINTS } from '../config/api';
import './IntelligentDebateScreen.css';

const AI_MODELS = [
  { id: 'chatgpt', name: 'ChatGPT', model: 'ChatGPT', party: 'Democrat' },
  { id: 'claude', name: 'Claude', model: 'Claude', party: 'Republican' },
  { id: 'gemini', name: 'Gemini', model: 'Gemini', party: 'Independent' },
  { id: 'grok', name: 'Grok', model: 'Grok', party: 'Democrat' },
  { id: 'cohere', name: 'Cohere', model: 'Cohere', party: 'Republican' }
];

const IntelligentDebateScreen = ({ topic, onReturnHome, onPhaseChange }) => {
  const [phase, setPhase] = useState('init');

  // Notify parent of phase changes for background media swapping
  useEffect(() => {
    if (onPhaseChange) {
      onPhaseChange(phase);
    }
  }, [phase, onPhaseChange]);
  const [currentSpeaker, setCurrentSpeaker] = useState(0);
  const [arguments_, setArguments] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState(null);
  const [billDocument, setBillDocument] = useState(null);
  const [billStatus, setBillStatus] = useState(null); // 'enacted' | 'vetoed' | null
  const [isFetchingBill, setIsFetchingBill] = useState(false);
  const [error, setError] = useState(null);
  const [mockWarning, setMockWarning] = useState(false);

  const initStarted = useRef(false);
  const pauseTimerRef = useRef(null);
  const isPausedRef = useRef(false);
  const skipTurnRef = useRef(false);
  const skipToVoteRef = useRef(false);
  const feedRef = useRef(null);

  // Auto-scroll the rail feed to the latest argument (scroll the feed, never the page)
  useEffect(() => {
    const feed = feedRef.current;
    if (!feed) return;
    feed.scrollTo({ top: feed.scrollHeight, behavior: 'smooth' });
  }, [arguments_.length, isGenerating, phase]);

  // Generate argument via API
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const generateArgument = async (ai, index, currentArguments = []) => {
    try {
      const context = currentArguments.map(arg => ({
        speaker: arg.party,
        message: arg.argument
      }));

      const response = await fetch(getApiUrl(API_ENDPOINTS.LLM), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: ai.model,
          party: ai.party,
          topic: topic,
          controversyLevel: 100,
          context: context,
          persona: ['standard', 'the_absolutist', 'the_pragmatist', 'the_firebrand', 'the_diplomat'][index % 5],
          flavor: ['balanced', 'aggressive', 'analytical', 'charismatic'][index % 4]
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.mock) {
        setMockWarning(true);
      }

      return data.response || data.message || null;
    } catch (err) {
      console.error(`[${ai.name}] Error:`, err);
      setError(`${ai.name} failed to respond`);
      return null;
    }
  };

  // Pausable and skippable delay function
  const pausableDelay = (ms) => {
    return new Promise((resolve) => {
      let elapsed = 0;
      const interval = 50;

      if (pauseTimerRef.current) {
        clearInterval(pauseTimerRef.current);
      }

      pauseTimerRef.current = setInterval(() => {
        if (skipTurnRef.current || skipToVoteRef.current) {
          skipTurnRef.current = false;
          clearInterval(pauseTimerRef.current);
          resolve();
          return;
        }

        if (!isPausedRef.current) {
          elapsed += interval;
          if (elapsed >= ms) {
            clearInterval(pauseTimerRef.current);
            resolve();
          }
        }
      }, interval);
    });
  };

  // Skip current turn delay
  const handleSkipTurn = () => {
    skipTurnRef.current = true;
  };

  // Skip entire debate straight to voting
  const handleSkipToVote = () => {
    skipToVoteRef.current = true;
    if (pauseTimerRef.current) {
      clearInterval(pauseTimerRef.current);
    }
    setPhase('voting');
  };

  // Run debate sequence
  useEffect(() => {
    if (initStarted.current) return;
    initStarted.current = true;

    const runDebate = async () => {
      setPhase('debating');
      const currentArguments = [];

      for (let i = 0; i < AI_MODELS.length; i++) {
        if (skipToVoteRef.current) break;

        const ai = AI_MODELS[i];
        setCurrentSpeaker(i);
        setIsGenerating(true);

        const argument = await generateArgument(ai, i, currentArguments);

        if (argument) {
          const newArg = {
            id: `arg_${i}_${Date.now()}`,
            model: ai.model,
            name: ai.name,
            party: ai.party,
            argument: argument
          };
          currentArguments.push(newArg);
          setArguments(prev => [...prev, newArg]);
        }

        setIsGenerating(false);

        if (i < AI_MODELS.length - 1 && !skipToVoteRef.current) {
          await pausableDelay(6000);
        }
      }

      if (!skipToVoteRef.current) {
        await pausableDelay(3000);
        setPhase('voting');
      }
    };

    runDebate();

    return () => {
      if (pauseTimerRef.current) {
        clearInterval(pauseTimerRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic]);

  // Select Winner and Fetch Substantive Proposal Bill
  const handleSelectWinner = async (modelId) => {
    setSelectedWinner(modelId);
    setIsFetchingBill(true);
    const winningAI = AI_MODELS.find(a => a.id === modelId) || AI_MODELS[0];

    try {
      const response = await fetch(getApiUrl(API_ENDPOINTS.BILL_COLLABORATIVE), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic,
          party: winningAI.party,
          controversyLevel: 100
        })
      });

      if (response.ok) {
        const data = await response.json();
        const doc = data.document || data.documents?.[winningAI.party.toLowerCase()] || data;
        setBillDocument(doc);
      } else {
        setBillDocument(createFallbackBill(topic, winningAI.party));
      }
    } catch (err) {
      console.error('[BILL FETCH ERROR]', err);
      setBillDocument(createFallbackBill(topic, winningAI.party));
    } finally {
      setIsFetchingBill(false);
      setPhase('signing');
    }
  };

  const createFallbackBill = (billTopic, party) => {
    const year = new Date().getFullYear();
    const sanitized = (billTopic || 'Public Policy').slice(0, 100);

    return {
      party: party,
      title: `The ${sanitized} Reform & Progress Act`,
      billNumber: `H.R. ${Math.floor(1000 + Math.random() * 9000)}`,
      fullText: `119TH CONGRESS - 2ND SESSION\nH.R. 4092\n\nIN THE HOUSE OF REPRESENTATIVES\n\nA BILL\nTo establish comprehensive policy, statutory oversight, and national standards regarding ${sanitized}.\n\nBe it enacted by the Senate and House of Representatives of the United States of America in Congress assembled,\n\nSECTION 1. SHORT TITLE.\nThis Act may be cited as "The ${sanitized} Reform & Progress Act of ${year}".\n\nSECTION 2. CONGRESSIONAL FINDINGS.\nCongress finds that statutory standards regarding ${sanitized} are vital to protecting the national economy, consumer safety, and constitutional rights.\n\nSECTION 3. PRINCIPAL POLICY MANDATES.\n(a) The Secretary shall enforce mandatory accountability and compliance guidelines for entities operating regarding ${sanitized}.\n(b) Violations shall be subject to civil regulatory enforcement.\n\nSECTION 4. APPROPRIATIONS.\nThere are authorized to be appropriated $1,250,000,000 to carry out enforcement for fiscal years ${year} through ${year + 4}.`
    };
  };

  const handleSignBill = () => {
    setBillStatus('enacted');
  };

  const handleVetoBill = () => {
    setBillStatus('vetoed');
  };

  const currentAI = AI_MODELS[currentSpeaker];
  const hasRail = phase === 'debating' || phase === 'voting';

  return (
    <div className={`debate-screen ${hasRail ? 'has-rail' : ''}`}>
      <button className="exit-btn" onClick={onReturnHome}>← EXIT</button>

      <header className="debate-header">
        <h1 className="debate-topic">{topic}</h1>
      </header>

      {(error || mockWarning) && (
        <div className="status-strip">
          {error && (
            <div className="error-banner">
              <span>{error}</span>
              <button onClick={() => setError(null)} aria-label="Dismiss error">×</button>
            </div>
          )}

          {mockWarning && (
            <div className="rag-status-badge">
              <span>Political RAG Fallback Active</span>
            </div>
          )}
        </div>
      )}

      {/* INIT */}
      {phase === 'init' && (
        <div className="phase-init">
          <div className="loader"></div>
          <p className="status-text">Preparing Debate</p>
        </div>
      )}

      {/* DEBATING - content rides the right rail, center of frame stays open */}
      {phase === 'debating' && (
        <section className="stage-rail phase-debate">
          <div className="rail-head">
            <div className="progress-bar">
              {AI_MODELS.map((ai, i) => (
                <div key={ai.id} className={`progress-item ${i < currentSpeaker ? 'done' : ''} ${i === currentSpeaker ? 'active' : ''}`}>
                  <span className="progress-name">{ai.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Full Chronological Argument Feed */}
          <div className="argument-feed" ref={feedRef}>
            {arguments_.map((arg, idx) => (
              <div key={arg.id || idx} className="feed-argument-card">
                <div className="feed-card-header">
                  <div className="feed-speaker-info">
                    <span className="feed-speaker-name">{arg.name}</span>
                    <span className={`feed-party-badge party-${arg.party.toLowerCase()}`}>{arg.party}</span>
                  </div>
                  <span className="feed-turn-number">Turn #{idx + 1}</span>
                </div>
                <p className="feed-argument-text">{arg.argument}</p>
              </div>
            ))}

            {isGenerating && (
              <div className="generating-indicator">
                <div className="typing-dots">
                  <span></span><span></span><span></span>
                </div>
                <p className="generating-text">Generating {currentAI?.name}'s argument...</p>
              </div>
            )}
          </div>

          <div className="rail-foot">
            <div className="skip-bar">
              <button className="skip-btn" onClick={handleSkipTurn} title="Skip current turn wait time">
                Skip Turn ⏭
              </button>
              <button className="skip-all-btn" onClick={handleSkipToVote} title="Skip remaining turns and vote now">
                Skip to Vote 🗳️
              </button>
            </div>
          </div>
        </section>
      )}

      {/* VOTING */}
      {phase === 'voting' && (
        <section className="stage-rail phase-voting">
          <div className="rail-head">
            <p className="voting-prompt">Select the Debate Winner</p>
          </div>

          {/* Include previous argument feed during voting so user can read before choosing */}
          <div className="argument-feed voting-feed" ref={feedRef}>
            {arguments_.map((arg, idx) => (
              <div key={arg.id || idx} className="feed-argument-card compact">
                <div className="feed-card-header">
                  <div className="feed-speaker-info">
                    <span className="feed-speaker-name">{arg.name}</span>
                    <span className={`feed-party-badge party-${arg.party.toLowerCase()}`}>{arg.party}</span>
                  </div>
                </div>
                <p className="feed-argument-text">{arg.argument}</p>
              </div>
            ))}
          </div>

          <div className="rail-foot">
            <div className="voting-names">
              {AI_MODELS.filter(ai => arguments_.some(a => a.model === ai.model)).map(ai => (
                <button
                  key={ai.id}
                  className={`vote-name ${selectedWinner === ai.id ? 'selected' : ''}`}
                  onClick={() => handleSelectWinner(ai.id)}
                  disabled={isFetchingBill || selectedWinner !== null}
                >
                  {ai.name} ({ai.party})
                </button>
              ))}
            </div>

            {isFetchingBill && (
              <div className="bill-loading">
                <div className="loader"></div>
                <p className="status-text">Drafting Bill...</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* BILL REVIEW & SIGNING WORKFLOW */}
      {phase === 'signing' && billDocument && (
        <div className="phase-signing">
          <div className="bill-card">
            <div className="bill-header-badge">
              <span className="winner-tag">Winning Platform: {AI_MODELS.find(a => a.id === selectedWinner)?.name} ({billDocument.party})</span>
              <h2 className="bill-number">{billDocument.billNumber || 'H.R. 4092'}</h2>
              <h1 className="bill-title">{billDocument.title}</h1>
            </div>

            <div className="bill-scroll-content">
              <pre className="bill-text">{billDocument.fullText}</pre>
            </div>

            {billStatus === 'enacted' && (
              <div className="enacted-seal">
                <span className="seal-title">OFFICIALLY SIGNED INTO LAW</span>
                <span className="seal-sub">PUBLIC LAW 119-84 • EXECUTIVE ENACTMENT</span>
              </div>
            )}

            {billStatus === 'vetoed' && (
              <div className="vetoed-seal">
                <span className="seal-title">VETOED BY EXECUTIVE</span>
                <span className="seal-sub">RETURNED TO CONGRESS WITHOUT APPROVAL</span>
              </div>
            )}

            <div className="signing-actions">
              {!billStatus ? (
                <>
                  <button className="sign-btn" onClick={handleSignBill}>
                    Sign Bill into Law ✍️
                  </button>
                  <button className="veto-btn" onClick={handleVetoBill}>
                    Veto Bill 🚫
                  </button>
                </>
              ) : (
                <button className="home-btn" onClick={onReturnHome}>
                  Start New Debate
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntelligentDebateScreen;
