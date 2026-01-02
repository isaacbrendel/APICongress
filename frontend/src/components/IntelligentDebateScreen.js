import React, { useState, useEffect, useCallback } from 'react';
import CongressTable from './CongressTable';
import TopicBanner from './TopicBanner';
import ArgumentVoting from './ArgumentVoting';
import useIntelligentAgents from '../hooks/useIntelligentAgents';
import './IntelligentDebateScreen.css';

/**
 * INTELLIGENT DEBATE SCREEN
 *
 * Showcases the powerful multi-agent AI system with:
 * - Visual congress table (Last Supper style)
 * - Real agent personalities and learning
 * - Strategic, context-aware debates
 * - Relationship dynamics
 * - Coalition building
 */
const IntelligentDebateScreen = ({ topic, onReturnHome }) => {
  const {
    agents,
    loading,
    initializeCongress,
    startIntelligentDebate,
    generateArgument,
    processDebateOutcome,
    currentDebateId,
    debateTurns
  } = useIntelligentAgents();

  const [initialized, setInitialized] = useState(false);
  const [debateActive, setDebateActive] = useState(false);
  const [currentSpeakerIndex, setCurrentSpeakerIndex] = useState(0);
  const [currentArgument, setCurrentArgument] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [argumentVotes, setArgumentVotes] = useState({}); // Track votes per argument

  // Initialize congress on mount
  useEffect(() => {
    if (!initialized) {
      console.log('[INTELLIGENT DEBATE] Initializing congress...');
      initializeCongress(8).then(() => { // Create 8 agents for good visual balance
        setInitialized(true);
      });
    }
  }, [initialized, initializeCongress]);

  // Start debate once agents are initialized
  useEffect(() => {
    if (initialized && agents.length > 0 && !debateActive && !currentDebateId) {
      console.log('[INTELLIGENT DEBATE] Starting debate with', agents.length, 'agents');

      // Get agent IDs
      const agentIds = agents.map(a => a.id);

      // Start the debate
      startIntelligentDebate(topic, agentIds, {
        controversyLevel: 100,
        enablePeerReview: false, // Can enable for even more depth
        enableResearch: false
      }).then(debateId => {
        if (debateId) {
          setDebateActive(true);
          // Start first argument after a delay
          setTimeout(() => {
            nextTurn(0);
          }, 2000);
        }
      });
    }
  }, [initialized, agents, debateActive, currentDebateId, topic, startIntelligentDebate]);

  // Generate next argument
  const nextTurn = useCallback(async (speakerIndex) => {
    if (!currentDebateId || !agents[speakerIndex]) return;

    const agent = agents[speakerIndex];
    console.log(`[INTELLIGENT DEBATE] Generating argument for ${agent.name}`);

    setCurrentSpeakerIndex(speakerIndex);
    setCurrentArgument(null);
    setCountdown(3);

    // Countdown
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    // Generate argument after countdown
    setTimeout(async () => {
      const turn = await generateArgument(currentDebateId, agent.id);

      if (turn) {
        setCurrentArgument(turn);

        // Move to next speaker after displaying argument
        setTimeout(() => {
          const nextIndex = speakerIndex + 1;

          if (nextIndex < agents.length) {
            // Continue to next speaker
            nextTurn(nextIndex);
          } else {
            // Debate complete
            console.log('[INTELLIGENT DEBATE] Debate complete!');
            setDebateActive(false);
            setShowResults(true);
          }
        }, 6000); // Show each argument for 6 seconds
      }
    }, 3000);
  }, [currentDebateId, agents, generateArgument]);

  // Handle agent click
  const handleAgentClick = (agent) => {
    console.log('[AGENT CLICK]', agent);
    // Could show detailed agent modal here
  };

  // Handle vote on argument - REINFORCEMENT LEARNING
  const handleArgumentVote = async (argumentId, agentId, voteType) => {
    console.log(`[REINFORCEMENT LEARNING] Vote ${voteType} for agent ${agentId}`);

    try {
      const response = await fetch('http://localhost:5001/api/vote/argument', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          argumentId,
          agentId,
          voteType
        })
      });

      if (!response.ok) {
        throw new Error('Failed to process vote');
      }

      const data = await response.json();

      console.log('[RL SUCCESS]', data.message, `Influence: ${data.influenceChange >= 0 ? '+' : ''}${data.influenceChange}`);

      // Update local vote tracking
      setArgumentVotes(prev => ({
        ...prev,
        [argumentId]: voteType
      }));

      // Optionally refresh agents to show updated stats
      // This would show the real-time learning effect
      // await fetchAgents(); // Uncomment to see immediate updates

      return data;
    } catch (error) {
      console.error('[RL ERROR]', error);
    }
  };

  // Handle vote and process outcome
  const handleVote = async (winnerId) => {
    console.log('[VOTE] Winner:', winnerId);

    // Create voting results
    const votingResults = {};
    agents.forEach(agent => {
      votingResults[agent.id] = {
        upvotes: agent.id === winnerId ? 15 : Math.floor(Math.random() * 10),
        downvotes: agent.id === winnerId ? 3 : Math.floor(Math.random() * 8)
      };
    });

    // Process outcome and trigger learning
    await processDebateOutcome(currentDebateId, votingResults);

    // Show final results
    setTimeout(() => {
      alert('Debate outcome processed! Agents have learned and evolved.');
    }, 1000);
  };

  const currentSpeaker = agents[currentSpeakerIndex];

  return (
    <div className="intelligent-debate-screen">
      {/* Topic Banner */}
      <TopicBanner topic={topic} />

      {/* Loading State */}
      {loading && !initialized && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <div className="loading-text">
            Assembling AI Congress...
            <div className="loading-subtext">
              Creating diverse personalities and relationships
            </div>
          </div>
        </div>
      )}

      {/* Congress Table - The Last Supper */}
      {initialized && agents.length > 0 && (
        <CongressTable
          agents={agents}
          currentSpeaker={currentSpeaker}
          onAgentClick={handleAgentClick}
        />
      )}

      {/* Debate Status */}
      {debateActive && (
        <div className="debate-status-bar">
          <div className="status-label">
            {countdown !== null ? (
              <>Speaking in <span className="countdown">{countdown}</span></>
            ) : (
              <>Now Speaking</>
            )}
          </div>
          <div className="progress-indicator">
            Argument {currentSpeakerIndex + 1} of {agents.length}
          </div>
        </div>
      )}

      {/* Current Argument Display */}
      {currentArgument && (
        <div className="argument-display">
          <div className="argument-header">
            <span className="speaker-name">{currentArgument.agentName}</span>
            <span className="speaker-party" style={{
              color: currentArgument.party === 'Democrat' ? '#4A90E2' :
                     currentArgument.party === 'Republican' ? '#E24A4A' : '#9B59B6'
            }}>
              ({currentArgument.party})
            </span>
            <span className="speaker-model">{currentArgument.model}</span>
          </div>
          <div className="argument-text">
            "{currentArgument.argument}"
          </div>
          <div className="argument-meta">
            <span>Phase: {currentArgument.phase}</span>
            <span>Strategy: {currentArgument.strategy}</span>
          </div>

          {/* REINFORCEMENT LEARNING - Vote on this argument! */}
          <ArgumentVoting
            argumentId={`arg_${currentArgument.agentId}_${currentSpeakerIndex}`}
            agentId={currentArgument.agentId}
            agentName={currentArgument.agentName}
            onVote={handleArgumentVote}
            currentVote={argumentVotes[`arg_${currentArgument.agentId}_${currentSpeakerIndex}`]}
          />
        </div>
      )}

      {/* Debate Complete - Results */}
      {showResults && (
        <div className="results-overlay">
          <div className="results-panel">
            <h2>Debate Complete!</h2>
            <p>All {agents.length} AI representatives have presented their arguments.</p>

            <div className="results-summary">
              <h3>Arguments Made - Vote on Each!</h3>
              <div className="argument-list">
                {debateTurns.map((turn, idx) => (
                  <div key={idx} className="argument-summary">
                    <div className="argument-content">
                      <strong>{turn.agentName}</strong> ({turn.party}): {turn.argument}
                    </div>
                    <ArgumentVoting
                      argumentId={`arg_${turn.agentId}_${idx}`}
                      agentId={turn.agentId}
                      agentName={turn.agentName}
                      onVote={handleArgumentVote}
                      currentVote={argumentVotes[`arg_${turn.agentId}_${idx}`]}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="vote-section">
              <h3>Who Won?</h3>
              <div className="vote-buttons">
                {agents.map(agent => (
                  <button
                    key={agent.id}
                    className="vote-button"
                    onClick={() => handleVote(agent.id)}
                  >
                    {agent.name}
                  </button>
                ))}
              </div>
            </div>

            <button className="home-button" onClick={onReturnHome}>
              Return Home
            </button>
          </div>
        </div>
      )}

      {/* Return Home Button */}
      {!showResults && (
        <button className="return-home-btn" onClick={onReturnHome}>
          ← Home
        </button>
      )}
    </div>
  );
};

export default IntelligentDebateScreen;
