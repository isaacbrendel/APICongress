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
  const [mockWarning, setMockWarning] = useState(false);
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

      // Check if this is a mock/stock response
      if (data.mock) {
        console.warn(`⚠️ [STOCK RESPONSE] ${ai.name} returned a pre-written fallback response - API may be failing`);
        setMockWarning(true);
      }

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

      // 5 second delay to read the final response before voting
      await new Promise(r => setTimeout(r, 5000));
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

      {mockWarning && (
        <div className="mock-warning">
          <span>⚠️ STOCK RESPONSES DETECTED - API may be failing</span>
          <button onClick={() => setMockWarning(false)}>×</button>
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
          <p className="voting-prompt">select the winner</p>
          <div className="voting-names">
            {AI_MODELS.filter(ai => arguments_.some(a => a.model === ai.model)).map(ai => (
              <button
                key={ai.id}
                className={`vote-name ${selectedWinner === ai.id ? 'selected' : ''}`}
                onClick={() => handleSelectWinner(ai.id)}
                disabled={selectedWinner !== null}
              >
                {ai.name}
              </button>
            ))}
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
