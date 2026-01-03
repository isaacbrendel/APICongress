import React, { useState, useEffect, useCallback } from 'react';
import CongressTable from './CongressTable';
import TopicBanner from './TopicBanner';
import ArgumentVoting from './ArgumentVoting';
import useIntelligentAgents from '../hooks/useIntelligentAgents';
import logger from '../utils/logger';
import { getApiUrl, API_ENDPOINTS } from '../config/api';
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
  const [allArguments, setAllArguments] = useState([]); // Store ALL arguments with unique IDs

  // Initialize congress on mount
  useEffect(() => {
    if (!initialized) {
      logger.agent('Initializing intelligent congress', { agentCount: 8 });
      logger.markStart('congress_init');
      initializeCongress(8).then(() => { // Create 8 agents for good visual balance
        const duration = logger.markEnd('congress_init');
        logger.success(logger.LogCategory.AGENT, 'Congress initialized successfully', { duration: `${duration}ms` });
        setInitialized(true);
      });
    }
  }, [initialized, initializeCongress]);

  // Start debate once agents are initialized
  useEffect(() => {
    if (initialized && agents.length > 0 && !debateActive && !currentDebateId) {
      logger.debate('Starting intelligent debate', {
        agentCount: agents.length,
        topic,
        controversyLevel: 100
      });

      // Get agent IDs
      const agentIds = agents.map(a => a.id);

      logger.markStart('intelligent_debate');

      // Start the debate
      startIntelligentDebate(topic, agentIds, {
        controversyLevel: 100,
        enablePeerReview: false, // Can enable for even more depth
        enableResearch: false
      }).then(debateId => {
        if (debateId) {
          logger.success(logger.LogCategory.DEBATE, 'Intelligent debate started', { debateId });
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
    logger.speakerAction('generating argument', agent.name, {
      speakerIndex,
      totalAgents: agents.length,
      agentParty: agent.party
    });

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
      logger.markStart(`argument_gen_${speakerIndex}`);
      const turn = await generateArgument(currentDebateId, agent.id);
      const duration = logger.markEnd(`argument_gen_${speakerIndex}`);

      if (turn) {
        // Create UNIQUE ID for this specific argument
        const uniqueArgumentId = `arg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const argumentData = {
          ...turn,
          uniqueId: uniqueArgumentId,
          timestamp: Date.now(),
          turnIndex: speakerIndex
        };

        logger.success(logger.LogCategory.DEBATE, `Argument generated for ${agent.name}`, {
          duration: `${duration}ms`,
          argumentLength: turn.argument?.length,
          strategy: turn.strategy,
          phase: turn.phase
        });

        setCurrentArgument(argumentData);

        // Store this argument for later voting
        setAllArguments(prev => [...prev, argumentData]);

        // Move to next speaker after displaying argument
        setTimeout(() => {
          const nextIndex = speakerIndex + 1;

          if (nextIndex < agents.length) {
            // Continue to next speaker
            nextTurn(nextIndex);
          } else {
            // Debate complete
            logger.success(logger.LogCategory.DEBATE, 'Intelligent debate complete!', {
              totalArguments: agents.length,
              duration: logger.markEnd('intelligent_debate')
            });
            setDebateActive(false);
            setShowResults(true);
          }
        }, 6000); // Show each argument for 6 seconds
      }
    }, 3000);
  }, [currentDebateId, agents, generateArgument]);

  // Handle agent click
  const handleAgentClick = (agent) => {
    logger.user('Agent clicked', {
      agentName: agent.name,
      agentParty: agent.party,
      agentModel: agent.model
    });
    // Could show detailed agent modal here
  };

  // Handle vote on argument - REINFORCEMENT LEARNING
  // Each vote is independent and sent to backend for aggregation
  const handleArgumentVote = async (argumentId, agentId, voteType) => {
    logger.vote('Reinforcement Learning vote', {
      argumentId,
      agentId,
      voteType
    });

    try {
      logger.markStart(`rl_vote_${argumentId}`);
      logger.apiRequest(API_ENDPOINTS.VOTE_ARGUMENT, 'POST', { argumentId, agentId, voteType });

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

      const duration = logger.markEnd(`rl_vote_${argumentId}`);

      if (!response.ok) {
        throw new Error('Failed to process vote');
      }

      const data = await response.json();

      logger.apiResponse(API_ENDPOINTS.VOTE_ARGUMENT, response.status, duration, {
        message: data.message,
        totalVotes: data.totalVotes,
        approvalRate: data.approvalRate
      });

      // Show immediate feedback in console
      if (data.personalityShifts) {
        logger.agent('Personality evolution triggered', {
          agentId,
          shifts: data.personalityShifts
        });
      }

      return data;
    } catch (error) {
      logger.error(logger.LogCategory.VOTE, 'RL vote failed', {
        argumentId,
        agentId,
        error: error.message
      });
      throw error; // Re-throw so ArgumentVoting can handle it
    }
  };

  // Handle vote and process outcome
  const handleVote = async (winnerId) => {
    const winner = agents.find(a => a.id === winnerId);
    logger.vote('Debate winner selected', {
      winnerId,
      winnerName: winner?.name,
      winnerParty: winner?.party
    });

    // Create voting results
    const votingResults = {};
    agents.forEach(agent => {
      votingResults[agent.id] = {
        upvotes: agent.id === winnerId ? 15 : Math.floor(Math.random() * 10),
        downvotes: agent.id === winnerId ? 3 : Math.floor(Math.random() * 8)
      };
    });

    // Process outcome and trigger learning
    logger.markStart('debate_outcome_processing');
    await processDebateOutcome(currentDebateId, votingResults);
    const duration = logger.markEnd('debate_outcome_processing');

    logger.success(logger.LogCategory.AGENT, 'Debate outcome processed - Agents evolved', {
      duration: `${duration}ms`,
      winnerId,
      totalAgents: agents.length
    });

    // Show final results
    setTimeout(() => {
      // Note: Using alert for now, but could be replaced with a modal
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
          {/* Each argument gets FRESH voting - no pre-selected state */}
          {/* KEY PROP forces React to remount component with fresh state */}
          <ArgumentVoting
            key={currentArgument.uniqueId}
            argumentId={currentArgument.uniqueId}
            agentId={currentArgument.agentId}
            agentName={currentArgument.agentName}
            onVote={handleArgumentVote}
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
              <h3>🗳️ Vote on EVERY Argument - Shape the AI!</h3>
              <p className="voting-instructions">
                Every vote matters! Your feedback trains the AI to debate better.
              </p>
              <div className="argument-list">
                {allArguments.map((arg) => (
                  <div key={arg.uniqueId} className="argument-summary">
                    <div className="argument-content">
                      <strong>{arg.agentName}</strong> ({arg.party}) - {arg.model}:
                      <div className="argument-quote">"{arg.argument}"</div>
                      <div className="argument-metadata">
                        Phase: {arg.phase} | Strategy: {arg.strategy}
                      </div>
                    </div>
                    {/* Each gets INDEPENDENT fresh voting - KEY ensures separate state */}
                    <ArgumentVoting
                      key={arg.uniqueId}
                      argumentId={arg.uniqueId}
                      agentId={arg.agentId}
                      agentName={arg.agentName}
                      onVote={handleArgumentVote}
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
