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

const IntelligentDebateScreen = ({ topic, onReturnHome }) => {
  const [phase, setPhase] = useState('init');
  const [currentSpeaker, setCurrentSpeaker] = useState(0);
  const [arguments_, setArguments] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState(null);
  const [error, setError] = useState(null);
  const initStarted = useRef(false);

  // Generate argument via API
  const generateArgument = async (ai, index) => {
    try {
      const response = await fetch(getApiUrl(API_ENDPOINTS.LLM), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: ai.model,
          party: ai.party,
          topic: topic,
          controversyLevel: 100,
          // Add uniqueness factors
          persona: ['standard', 'the_absolutist', 'the_pragmatist', 'the_firebrand', 'the_diplomat'][index % 5],
          flavor: ['balanced', 'aggressive', 'analytical', 'charismatic'][index % 4]
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.response || data.message || null;
    } catch (err) {
      console.error(`[${ai.name}] Error:`, err);
      setError(`${ai.name} failed to respond`);
      return null;
    }
  };

  // Run debate
  useEffect(() => {
    if (initStarted.current) return;
    initStarted.current = true;

    const runDebate = async () => {
      setPhase('debating');

      for (let i = 0; i < AI_MODELS.length; i++) {
        const ai = AI_MODELS[i];
        setCurrentSpeaker(i);
        setIsGenerating(true);

        // Generate argument
        const argument = await generateArgument(ai, i);

        if (argument) {
          setArguments(prev => [...prev, {
            id: `arg_${i}_${Date.now()}`,
            model: ai.model,
            name: ai.name,
            party: ai.party,
            argument: argument
          }]);
        }

        setIsGenerating(false);

        // 3 second pause between speakers
        if (i < AI_MODELS.length - 1) {
          await new Promise(r => setTimeout(r, 3000));
        }
      }

      setPhase('voting');
    };

    runDebate();
  }, [topic]);

  const handleSelectWinner = (modelId) => {
    setSelectedWinner(modelId);
    setTimeout(() => setPhase('complete'), 800);
  };

  const currentAI = AI_MODELS[currentSpeaker];

  return (
    <div className="debate-screen">
      <button className="exit-btn" onClick={onReturnHome}>← EXIT</button>

      <header className="debate-header">
        <h1 className="debate-topic">{topic}</h1>
      </header>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* INIT */}
      {phase === 'init' && (
        <div className="phase-init">
          <div className="loader"></div>
          <p className="status-text">Preparing Debate</p>
        </div>
      )}

      {/* DEBATING */}
      {phase === 'debating' && (
        <div className="phase-debate">
          <div className="progress-bar">
            {AI_MODELS.map((ai, i) => (
              <div key={ai.id} className={`progress-item ${i < currentSpeaker ? 'done' : ''} ${i === currentSpeaker ? 'active' : ''}`}>
                <span className="progress-name">{ai.name}</span>
              </div>
            ))}
          </div>

          <div className="speaker-section">
            <h2 className="speaker-name">{currentAI?.name}</h2>
            <span className="speaker-party">{currentAI?.party}</span>
          </div>

          {isGenerating ? (
            <div className="generating-indicator">
              <div className="typing-dots">
                <span></span><span></span><span></span>
              </div>
              <p className="generating-text">Generating response...</p>
            </div>
          ) : arguments_.length > 0 ? (
            <div className="argument-card">
              <p className="argument-text">{arguments_[arguments_.length - 1]?.argument}</p>
            </div>
          ) : null}
        </div>
      )}

      {/* VOTING */}
      {phase === 'voting' && (
        <div className="phase-voting">
          <h2 className="voting-title">Debate Complete</h2>
          <p className="voting-subtitle">Review all arguments and select the winner</p>

          <div className="arguments-scroll">
            {arguments_.map((arg, index) => (
              <div key={arg.id} className="review-card">
                <div className="review-header">
                  <span className="review-number">{index + 1}</span>
                  <div className="review-info">
                    <span className="review-name">{arg.name}</span>
                    <span className="review-party">{arg.party}</span>
                  </div>
                </div>
                <p className="review-text">{arg.argument}</p>
              </div>
            ))}
          </div>

          <div className="winner-section">
            <h3 className="winner-prompt">Who won the debate?</h3>
            <div className="winner-options">
              {AI_MODELS.filter(ai => arguments_.some(a => a.model === ai.model)).map(ai => (
                <button
                  key={ai.id}
                  className={`winner-btn ${selectedWinner === ai.id ? 'selected' : ''}`}
                  onClick={() => handleSelectWinner(ai.id)}
                  disabled={selectedWinner !== null}
                >
                  {ai.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* COMPLETE */}
      {phase === 'complete' && (
        <div className="phase-complete">
          <h2 className="complete-title">Winner</h2>
          <div className="winner-badge">
            <span className="winner-name">{AI_MODELS.find(a => a.id === selectedWinner)?.name}</span>
          </div>
          <button className="home-btn" onClick={onReturnHome}>New Debate</button>
        </div>
      )}
    </div>
  );
};

export default IntelligentDebateScreen;
