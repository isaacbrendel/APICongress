import React, { useState, useEffect, useCallback, useRef } from 'react';
import ArgumentVoting from './ArgumentVoting';
import useIntelligentAgents from '../hooks/useIntelligentAgents';
import { getApiUrl, API_ENDPOINTS } from '../config/api';
import './IntelligentDebateScreen.css';

const AI_MODELS = [
  { name: 'ChatGPT', logo: process.env.PUBLIC_URL + '/logos/chatgpt.png' },
  { name: 'Claude', logo: process.env.PUBLIC_URL + '/logos/claude.png' },
  { name: 'Gemini', logo: process.env.PUBLIC_URL + '/logos/gemini.png' },
  { name: 'Grok', logo: process.env.PUBLIC_URL + '/logos/grok.png' },
  { name: 'Cohere', logo: process.env.PUBLIC_URL + '/logos/cohere.png' }
];

const IntelligentDebateScreen = ({ topic, onReturnHome }) => {
  const {
    agents,
    loading,
    error,
    initializeCongress,
    startIntelligentDebate,
    generateArgument,
    processDebateOutcome,
    currentDebateId,
    clearError,
    resetDebate
  } = useIntelligentAgents();

  // Phase: init -> debating -> voting -> complete
  const [phase, setPhase] = useState('init');
  const [currentSpeaker, setCurrentSpeaker] = useState(0);
  const [arguments_, setArguments] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState(null);
  const [voteSubmitted, setVoteSubmitted] = useState(false);

  const debateIdRef = useRef(null);
  const initStarted = useRef(false);

  // Get logo for an agent
  const getLogo = useCallback((agent) => {
    if (!agent) return AI_MODELS[0].logo;
    const model = AI_MODELS.find(m =>
      agent.model?.toLowerCase().includes(m.name.toLowerCase()) ||
      agent.name?.toLowerCase().includes(m.name.toLowerCase())
    );
    return model?.logo || AI_MODELS[0].logo;
  }, []);

  // Initialize congress and start debate
  useEffect(() => {
    if (initStarted.current) return;
    initStarted.current = true;

    const init = async () => {
      try {
        console.log('[DEBATE] Initializing...');
        const agentList = await initializeCongress(5);

        if (!agentList || agentList.length === 0) {
          console.error('[DEBATE] No agents returned');
          return;
        }

        console.log('[DEBATE] Starting with agents:', agentList.map(a => a.id));
        const agentIds = agentList.map(a => a.id);
        const debateId = await startIntelligentDebate(topic, agentIds, {
          controversyLevel: 100
        });

        if (!debateId) {
          console.error('[DEBATE] No debate ID returned');
          return;
        }

        debateIdRef.current = debateId;
        setPhase('debating');

        // Start generating arguments
        generateNextArgument(0, debateId, agentList);
      } catch (err) {
        console.error('[DEBATE] Init failed:', err);
      }
    };

    init();
  }, [topic, initializeCongress, startIntelligentDebate]);

  // Generate argument for a speaker
  const generateNextArgument = useCallback(async (speakerIndex, debateId, agentList) => {
    if (!debateId || !agentList[speakerIndex]) {
      console.log('[DEBATE] Complete or invalid state');
      setPhase('voting');
      return;
    }

    setIsGenerating(true);
    setCurrentSpeaker(speakerIndex);

    const agent = agentList[speakerIndex];
    console.log(`[DEBATE] Generating for ${agent.model || agent.name}`);

    const turn = await generateArgument(debateId, agent.id);

    if (turn) {
      const argData = {
        ...turn,
        uniqueId: `arg_${Date.now()}_${speakerIndex}`,
        speakerIndex,
        model: agent.model,
        agentName: agent.name
      };

      setArguments(prev => [...prev, argData]);
      setIsGenerating(false);

      // Next speaker after delay
      setTimeout(() => {
        if (speakerIndex + 1 < agentList.length) {
          generateNextArgument(speakerIndex + 1, debateId, agentList);
        } else {
          setPhase('voting');
        }
      }, 4000);
    } else {
      setIsGenerating(false);
      // Try next speaker even if this one failed
      if (speakerIndex + 1 < agentList.length) {
        generateNextArgument(speakerIndex + 1, debateId, agentList);
      } else {
        setPhase('voting');
      }
    }
  }, [generateArgument]);

  // Handle argument vote
  const handleArgumentVote = async (argumentId, agentId, voteType) => {
    try {
      const response = await fetch(getApiUrl(API_ENDPOINTS.VOTE_ARGUMENT), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          argumentId,
          agentId,
          voteType,
          timestamp: Date.now()
        })
      });

      if (!response.ok) {
        throw new Error(`Vote failed: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      console.error('[VOTE] Error:', err);
      throw err;
    }
  };

  // Handle winner selection
  const handleSelectWinner = async (winnerId) => {
    setSelectedWinner(winnerId);
    setVoteSubmitted(true);

    const votingResults = {};
    agents.forEach(agent => {
      votingResults[agent.id] = {
        upvotes: agent.id === winnerId ? 15 : Math.floor(Math.random() * 10),
        downvotes: agent.id === winnerId ? 2 : Math.floor(Math.random() * 8)
      };
    });

    await processDebateOutcome(debateIdRef.current, votingResults);

    setTimeout(() => {
      setPhase('complete');
    }, 1500);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      resetDebate();
    };
  }, [resetDebate]);

  const currentAgent = agents[currentSpeaker];
  const latestArgument = arguments_[arguments_.length - 1];

  return (
    <div className="debate-screen">
      <button className="exit-btn" onClick={onReturnHome}>
        Exit
      </button>

      <header className="debate-header">
        <h1 className="debate-topic">{topic}</h1>
      </header>

      {/* Error Display */}
      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={clearError}>Dismiss</button>
        </div>
      )}

      {/* INIT PHASE */}
      {phase === 'init' && (
        <div className="phase-init">
          <div className="loader"></div>
          <p className="status-text">Assembling Congress</p>
        </div>
      )}

      {/* DEBATING PHASE */}
      {phase === 'debating' && (
        <div className="phase-debate">
          {/* Progress Bar */}
          <div className="progress-bar">
            {agents.map((agent, i) => (
              <div
                key={agent.id}
                className={`progress-item ${i < currentSpeaker ? 'done' : ''} ${i === currentSpeaker ? 'active' : ''}`}
              >
                <img src={getLogo(agent)} alt="" />
                <span>{agent.model || agent.name}</span>
              </div>
            ))}
          </div>

          {/* Current Speaker */}
          {currentAgent && (
            <div className="speaker-section">
              <div className={`speaker-avatar ${isGenerating ? 'generating' : ''}`}>
                <img src={getLogo(currentAgent)} alt={currentAgent.model} />
              </div>
              <h2 className="speaker-name">{currentAgent.model || currentAgent.name}</h2>
            </div>
          )}

          {/* Argument Display */}
          {isGenerating ? (
            <div className="generating-indicator">
              <div className="typing-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
          ) : latestArgument ? (
            <div className="argument-card">
              <p className="argument-text">{latestArgument.argument}</p>
              <ArgumentVoting
                key={latestArgument.uniqueId}
                argumentId={latestArgument.uniqueId}
                agentId={latestArgument.agentId}
                agentName={latestArgument.agentName || latestArgument.model}
                onVote={handleArgumentVote}
              />
            </div>
          ) : null}
        </div>
      )}

      {/* VOTING PHASE */}
      {phase === 'voting' && (
        <div className="phase-voting">
          <h2 className="voting-title">Debate Complete</h2>
          <p className="voting-subtitle">Review arguments and select a winner</p>

          <div className="arguments-review">
            {arguments_.map((arg, i) => (
              <div key={arg.uniqueId} className="review-card">
                <div className="review-header">
                  <img src={getLogo(agents[i])} alt="" className="review-logo" />
                  <span className="review-name">{agents[i]?.model || agents[i]?.name}</span>
                </div>
                <p className="review-text">{arg.argument}</p>
                <ArgumentVoting
                  key={`review-${arg.uniqueId}`}
                  argumentId={arg.uniqueId}
                  agentId={arg.agentId}
                  agentName={arg.agentName || arg.model}
                  onVote={handleArgumentVote}
                />
              </div>
            ))}
          </div>

          <div className="winner-selection">
            <h3>Select Winner</h3>
            <div className="winner-options">
              {agents.map(agent => (
                <button
                  key={agent.id}
                  className={`winner-btn ${selectedWinner === agent.id ? 'selected' : ''}`}
                  onClick={() => handleSelectWinner(agent.id)}
                  disabled={voteSubmitted}
                >
                  <img src={getLogo(agent)} alt="" />
                  <span>{agent.model || agent.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* COMPLETE PHASE */}
      {phase === 'complete' && (
        <div className="phase-complete">
          <h2>Results Recorded</h2>
          <p>AI agents have learned from this debate</p>

          {selectedWinner && (
            <div className="winner-display">
              <span>Winner</span>
              <div className="winner-badge">
                <img src={getLogo(agents.find(a => a.id === selectedWinner))} alt="" />
                <span>{agents.find(a => a.id === selectedWinner)?.model}</span>
              </div>
            </div>
          )}

          <button className="home-btn" onClick={onReturnHome}>
            Return Home
          </button>
        </div>
      )}
    </div>
  );
};

export default IntelligentDebateScreen;
