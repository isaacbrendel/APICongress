import React, { useState, useEffect, useRef } from 'react';
import { getApiUrl, API_ENDPOINTS } from '../config/api';
import './IntelligentDebateScreen.css';

const AI_MODELS = [
  { id: 'chatgpt', name: 'ChatGPT', model: 'ChatGPT', logo: process.env.PUBLIC_URL + '/logos/chatgpt.png' },
  { id: 'claude', name: 'Claude', model: 'Claude', logo: process.env.PUBLIC_URL + '/logos/claude.png' },
  { id: 'gemini', name: 'Gemini', model: 'Gemini', logo: process.env.PUBLIC_URL + '/logos/gemini.png' },
  { id: 'grok', name: 'Grok', model: 'Grok', logo: process.env.PUBLIC_URL + '/logos/grok.png' },
  { id: 'cohere', name: 'Cohere', model: 'Cohere', logo: process.env.PUBLIC_URL + '/logos/cohere.png' }
];

const IntelligentDebateScreen = ({ topic, onReturnHome }) => {
  const [phase, setPhase] = useState('init');
  const [currentSpeaker, setCurrentSpeaker] = useState(0);
  const [arguments_, setArguments] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState(null);
  const [error, setError] = useState(null);
  const initStarted = useRef(false);

  // Generate argument directly via LLM API
  const generateArgument = async (model, modelName) => {
    try {
      const response = await fetch(getApiUrl(API_ENDPOINTS.LLM), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model,
          party: 'Independent',
          topic: topic,
          controversyLevel: 100
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.response || data.message || 'No response generated';
    } catch (err) {
      console.error(`[${modelName}] Error:`, err);
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

        const argument = await generateArgument(ai.model, ai.name);

        if (argument) {
          setArguments(prev => [...prev, {
            id: `arg_${i}`,
            model: ai.model,
            name: ai.name,
            logo: ai.logo,
            argument: argument
          }]);
        }

        setIsGenerating(false);

        // Brief pause between speakers
        if (i < AI_MODELS.length - 1) {
          await new Promise(r => setTimeout(r, 1500));
        }
      }

      setPhase('voting');
    };

    runDebate();
  }, [topic]);

  const handleSelectWinner = (modelId) => {
    setSelectedWinner(modelId);
    setTimeout(() => setPhase('complete'), 1000);
  };

  const currentAI = AI_MODELS[currentSpeaker];
  const latestArg = arguments_[arguments_.length - 1];

  return (
    <div className="debate-screen">
      <button className="exit-btn" onClick={onReturnHome}>← Exit</button>

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
          <p className="status-text">Assembling Congress</p>
        </div>
      )}

      {/* DEBATING */}
      {phase === 'debating' && (
        <div className="phase-debate">
          <div className="progress-bar">
            {AI_MODELS.map((ai, i) => (
              <div key={ai.id} className={`progress-item ${i < currentSpeaker ? 'done' : ''} ${i === currentSpeaker ? 'active' : ''}`}>
                <img src={ai.logo} alt={ai.name} />
                <span>{ai.name}</span>
              </div>
            ))}
          </div>

          {currentAI && (
            <div className="speaker-section">
              <div className={`speaker-avatar ${isGenerating ? 'generating' : ''}`}>
                <img src={currentAI.logo} alt={currentAI.name} />
              </div>
              <h2 className="speaker-name">{currentAI.name}</h2>
            </div>
          )}

          {isGenerating ? (
            <div className="generating-indicator">
              <div className="typing-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
          ) : latestArg ? (
            <div className="argument-card">
              <p className="argument-text">{latestArg.argument}</p>
            </div>
          ) : null}
        </div>
      )}

      {/* VOTING */}
      {phase === 'voting' && (
        <div className="phase-voting">
          <h2 className="voting-title">Debate Complete</h2>
          <p className="voting-subtitle">Select the winner</p>

          <div className="arguments-review">
            {arguments_.map((arg) => (
              <div key={arg.id} className="review-card">
                <div className="review-header">
                  <img src={arg.logo} alt={arg.name} className="review-logo" />
                  <span className="review-name">{arg.name}</span>
                </div>
                <p className="review-text">{arg.argument}</p>
              </div>
            ))}
          </div>

          <div className="winner-selection">
            <div className="winner-options">
              {AI_MODELS.map(ai => (
                <button
                  key={ai.id}
                  className={`winner-btn ${selectedWinner === ai.id ? 'selected' : ''}`}
                  onClick={() => handleSelectWinner(ai.id)}
                  disabled={selectedWinner !== null}
                >
                  <img src={ai.logo} alt={ai.name} />
                  <span>{ai.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* COMPLETE */}
      {phase === 'complete' && (
        <div className="phase-complete">
          <h2>Winner Selected</h2>
          {selectedWinner && (
            <div className="winner-display">
              <div className="winner-badge">
                <img src={AI_MODELS.find(a => a.id === selectedWinner)?.logo} alt="" />
                <span>{AI_MODELS.find(a => a.id === selectedWinner)?.name}</span>
              </div>
            </div>
          )}
          <button className="home-btn" onClick={onReturnHome}>New Debate</button>
        </div>
      )}
    </div>
  );
};

export default IntelligentDebateScreen;
