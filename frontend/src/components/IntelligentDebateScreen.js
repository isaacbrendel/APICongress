import React, { useState, useEffect, useCallback } from 'react';
import ArgumentVoting from './ArgumentVoting';
import useIntelligentAgents from '../hooks/useIntelligentAgents';
import logger from '../utils/logger';
import { getApiUrl, API_ENDPOINTS } from '../config/api';
import './IntelligentDebateScreen.css';

/**
 * INTELLIGENT DEBATE SCREEN - MINIMALIST DESIGN
 *
 * Clean, stationary display of 5 AI debaters:
 * - ChatGPT, Claude, Gemini, Grok, Cohere
 * - Logos displayed prominently
 * - Minimalist aesthetic matching landing page
 */

// Map of AI model names to their logos
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
    initializeCongress,
    startIntelligentDebate,
    generateArgument,
    processDebateOutcome,
    currentDebateId
  } = useIntelligentAgents();

  const [initialized, setInitialized] = useState(false);
  const [debateActive, setDebateActive] = useState(false);
  const [currentSpeakerIndex, setCurrentSpeakerIndex] = useState(0);
  const [currentArgument, setCurrentArgument] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [allArguments, setAllArguments] = useState([]); // Store ALL arguments with unique IDs

  // Initialize congress on mount - 5 agents for 5 AI models
  useEffect(() => {
    if (!initialized) {
      logger.agent('Initializing intelligent congress', { agentCount: 5 });
      logger.markStart('congress_init');
      initializeCongress(5).then(() => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Get logo for agent based on model name
  const getAgentLogo = (agent) => {
    if (!agent) return null;
    const modelInfo = AI_MODELS.find(m =>
      agent.model?.toLowerCase().includes(m.name.toLowerCase()) ||
      agent.name?.toLowerCase().includes(m.name.toLowerCase())
    );
    return modelInfo?.logo || AI_MODELS[0].logo; // Default to first logo if not found
  };

  return (
    <div className="intelligent-debate-screen">
      {/* Exit Button - Minimal top-left */}
      <button className="exit-button" onClick={onReturnHome}>
        Exit
      </button>

      {/* Loading State */}
      {loading && !initialized && (
        <div className="loading-container">
          <div className="loading-text">Assembling AI Congress...</div>
        </div>
      )}

      {/* Main Content - Only show when initialized */}
      {initialized && !showResults && (
        <>
          {/* Topic Display - Minimal top center */}
          <div className="topic-display">
            {topic}
          </div>

          {/* AI Debaters - Stationary logos in horizontal row */}
          <div className="ai-debaters">
            {agents.map((agent, index) => {
              const isSpeaking = currentSpeaker && currentSpeaker.id === agent.id;
              const hasSpoken = index < currentSpeakerIndex;

              return (
                <div
                  key={agent.id}
                  className={`ai-debater ${isSpeaking ? 'speaking' : ''} ${hasSpoken ? 'spoken' : ''}`}
                >
                  <div className="ai-logo-container">
                    <img
                      src={getAgentLogo(agent)}
                      alt={agent.model || agent.name}
                      className="ai-logo"
                    />
                  </div>
                  <div className="ai-name">{agent.model || agent.name}</div>
                </div>
              );
            })}
          </div>

          {/* Current Argument - Clean centered display */}
          {currentArgument && (
            <div className="argument-container">
              <div className="argument-text">
                {currentArgument.argument}
              </div>

              {/* Voting - Minimal design */}
              <ArgumentVoting
                key={currentArgument.uniqueId}
                argumentId={currentArgument.uniqueId}
                agentId={currentArgument.agentId}
                agentName={currentArgument.agentName}
                onVote={handleArgumentVote}
              />
            </div>
          )}

          {/* Countdown indicator - only show during countdown */}
          {countdown !== null && (
            <div className="countdown-display">{countdown}</div>
          )}
        </>
      )}

      {/* Debate Complete - Results with Minimalist Design */}
      {showResults && (
        <div className="results-container">
          <div className="results-content">
            <h2 className="results-title">Debate Complete</h2>
            <p className="results-subtitle">
              Vote on each argument to help train the AI
            </p>

            {/* All arguments for voting */}
            <div className="results-arguments">
              {allArguments.map((arg) => (
                <div key={arg.uniqueId} className="result-argument">
                  <div className="result-argument-header">
                    <img
                      src={getAgentLogo(arg)}
                      alt={arg.model}
                      className="result-ai-logo"
                    />
                    <span className="result-ai-name">{arg.model || arg.agentName}</span>
                  </div>
                  <div className="result-argument-text">
                    {arg.argument}
                  </div>
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

            {/* Winner selection */}
            <div className="winner-section">
              <h3 className="winner-title">Select Winner</h3>
              <div className="winner-buttons">
                {agents.map(agent => (
                  <button
                    key={agent.id}
                    className="winner-button"
                    onClick={() => handleVote(agent.id)}
                  >
                    {agent.model || agent.name}
                  </button>
                ))}
              </div>
            </div>

            <button className="results-home-button" onClick={onReturnHome}>
              Return Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntelligentDebateScreen;
