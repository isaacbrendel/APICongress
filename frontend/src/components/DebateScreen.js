// src/components/DebateScreen.js
import React, { useEffect, useState, useRef } from 'react';
import DebaterCard from './DebaterCard';
import TopicBanner from './TopicBanner';
import DebateChatBubble from './DebateChatBubble';
import VotingInterface from './VotingInterface';
import WinnerDisplay from './WinnerDisplay';
import PartyAssigner from './PartyAssigner';
import useDebateFlow from '../hooks/useDebateFlow';
import logger from '../utils/logger';
import { getApiUrl, API_ENDPOINTS } from '../config/api';
import './DebateScreen.css';

const DebateScreen = ({ topic, models, setModels, onReturnHome }) => {
  // State for positioning and animation
  const [finalPositions, setFinalPositions] = useState({});
  const [positionsAssigned, setPositionsAssigned] = useState(false);
  const [partyAssignmentActive, setPartyAssignmentActive] = useState(false);
  
  // UI state for showing voting interface
  const [showVoting, setShowVoting] = useState(false);
  const [showWinner, setShowWinner] = useState(false);
  const [debateWinner, setDebateWinner] = useState(null);

  // Track initialization state to prevent repeated setup
  const [isInitialized, setIsInitialized] = useState(false);

  // Vote tracking and controversy settings
  const [messageVotes, setMessageVotes] = useState({}); // { messageId: { vote: 'up'|'down', affiliation: 'Democrat' } }
  const [controversyLevel, setControversyLevel] = useState(100); // 0-100, default to maximum spice
  const [showControversySlider, setShowControversySlider] = useState(false);
  
  // Use the debate flow hook
  const {
    debateState,
    currentSpeaker,
    currentSpeakerIndex,
    speakingOrder,
    currentSpeech,
    countdown,
    nextSpeaker,
    debateMessages,
    setupSpeakingOrder,
    startDebate,
    isDebateCompleted,
    pauseCountdown,
    resumeCountdown,
    skipCountdown
  } = useDebateFlow(models, topic, finalPositions, controversyLevel, messageVotes);
  
  // Ref for positioning timer and voting timer
  const positioningTimerRef = useRef(null);
  const votingTimerRef = useRef(null);
  
  // Responsive and symmetrical seat positions
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);
  
  // Add resize listener to update mobile state
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 480);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Pre-initialize debate variables
  useEffect(() => {
    // Initialize speakingOrder right away to prevent uninitialized variables
    if (models && models.length > 0) {
      logger.system("Pre-initializing debate variables to prevent uninitialized references", { modelCount: models.length });
      // This helps ensure debates can start correctly later
      setupSpeakingOrder();
    }
  }, [models, setupSpeakingOrder]);
  
  // Helper function to create symmetrical party positions - uses isMobile state
  const createPartyPositions = () => {
    if (isMobile) {
      // Mobile positions - more visible and vertically stacked
      return {
        // Democrats on the left
        democrat: [
          { top: 35, left: 25 },
          { top: 45, left: 25 },
          { top: 55, left: 25 },
          { top: 65, left: 25 },
          { top: 75, left: 25 },
        ],
        // Republicans on the right
        republican: [
          { top: 35, left: 75 },
          { top: 45, left: 75 },
          { top: 55, left: 75 },
          { top: 65, left: 75 },
          { top: 75, left: 75 },
        ],
        // Independent in the middle
        independent: [
          { top: 50, left: 50 },
          { top: 60, left: 50 },
          { top: 70, left: 50 },
          { top: 40, left: 50 },
          { top: 80, left: 50 },
        ]
      };
    } else {
      // Desktop positions - more spread out and visually balanced
      return {
        // Democrats on the left side
        democrat: [
          { top: 50, left: 10 },
          { top: 60, left: 15 },
          { top: 70, left: 20 },
          { top: 55, left: 12 },
          { top: 65, left: 18 },
        ],
        // Republicans on the right side
        republican: [
          { top: 50, left: 90 },
          { top: 60, left: 85 },
          { top: 70, left: 80 },
          { top: 55, left: 88 },
          { top: 65, left: 82 },
        ],
        // Independent in the middle
        independent: [
          { top: 60, left: 50 },
          { top: 65, left: 48 },
          { top: 65, left: 52 },
          { top: 55, left: 48 },
          { top: 55, left: 52 },
        ]
      };
    }
  };
  
  // Get the positions based on screen size
  const positions = createPartyPositions();
  
  // Assign positions by party for more semantic organization
  const demSeats = positions.democrat;
  const repSeats = positions.republican;
  const indSeats = positions.independent;

  // Use a small random offset (±1%) for slight variation
  const randomOffset = () => Math.floor(Math.random() * 3) - 1;

  // Initialize models only once when component mounts or models change
  useEffect(() => {
    if (models.length === 0 || isInitialized) return;

    logger.system("Initializing debate screen with models", {
      modelCount: models.length,
      modelNames: models.map(m => m.name)
    });

    // Set initialized flag to prevent repeated setup
    setIsInitialized(true);
    
    // Reset states
    setShowVoting(false);
    setShowWinner(false);
    setDebateWinner(null);
    setPositionsAssigned(false);
    
    // Initially scatter debaters within a defined band
    // Use different positioning for mobile vs desktop
    const scatteredPositions = models.reduce((acc, model) => {
      // For mobile, we use a more focused center area
      if (isMobile) {
        const randTop = Math.floor(Math.random() * 20 + 50); // 50-70%
        const randLeft = Math.floor(Math.random() * 30 + 35); // 35-65%
        acc[model.id] = { top: randTop, left: randLeft };
      } else {
        // Desktop scattering
        const randTop = Math.floor(Math.random() * 15 + 55);
        const randLeft = Math.floor(Math.random() * 40 + 30); // narrower range (30-70)
        acc[model.id] = { top: randTop, left: randLeft };
      }
      return acc;
    }, {});
    
    setFinalPositions(scatteredPositions);
    
    // Activate party assignment with a small delay
    setTimeout(() => {
      logger.ui("Activating party assignment phase");
      setPartyAssignmentActive(true);
    }, 100);
  }, [models, isInitialized, isMobile]);

  // Clean up intervals on component unmount
  useEffect(() => {
    return () => {
      if (positioningTimerRef.current) {
        clearTimeout(positioningTimerRef.current);
        positioningTimerRef.current = null;
      }
      if (votingTimerRef.current) {
        clearTimeout(votingTimerRef.current);
        votingTimerRef.current = null;
      }
    };
  }, []);

  // Handle party assignment completion
  const handlePartyAssignmentComplete = (updatedModels) => {
    // Verify party counts
    const dems = updatedModels.filter(m => m.affiliation === 'Democrat').length;
    const reps = updatedModels.filter(m => m.affiliation === 'Republican').length;
    const inds = updatedModels.filter(m => m.affiliation === 'Independent').length;

    logger.success(logger.LogCategory.SYSTEM, "Party assignment complete, assigning positions", {
      democrats: dems,
      republicans: reps,
      independents: inds,
      total: updatedModels.length
    });
    
    // First assign positions and keep party assigner visible during transition
    assignPositionsBasedOnParty(updatedModels);
    
    // Only hide party assignment component after positions are assigned
    positioningTimerRef.current = setTimeout(() => {
      setPartyAssignmentActive(false);
    }, 500);
  };

  // Completely reliable position assignment based on party affiliation
  const assignPositionsBasedOnParty = (updatedModels) => {
    logger.ui("Assigning positions based on party affiliation", { modelCount: updatedModels.length });

    // Create a safe copy of models with guaranteed properties
    const safeModels = updatedModels.map((model, index) => {
      // Default to Independent if no affiliation
      const affiliation = model.affiliation || "Independent";
      
      return {
        ...model,
        id: model.id || index + 1,
        name: model.name || `Speaker ${index + 1}`,
        affiliation: affiliation,
        cssClass: affiliation.toLowerCase(),
        isFinalized: true
      };
    });
    
    // Create a new positions object
    let newPositions = {};
    
    // Group by party - safe filtering
    const demModels = safeModels.filter(m => m.affiliation === 'Democrat');
    const repModels = safeModels.filter(m => m.affiliation === 'Republican');
    const indModels = safeModels.filter(m => m.affiliation === 'Independent');

    logger.ui("Positioning breakdown", {
      democrats: demModels.length,
      republicans: repModels.length,
      independents: indModels.length
    });
    
    // Position Democrats on the left
    demModels.forEach((model, i) => {
      const seat = demSeats[i % demSeats.length];
      newPositions[model.id] = {
        top: seat.top + randomOffset(),
        left: seat.left + randomOffset()
      };
    });
    
    // Position Republicans on the right
    repModels.forEach((model, i) => {
      const seat = repSeats[i % repSeats.length];
      newPositions[model.id] = {
        top: seat.top + randomOffset(),
        left: seat.left + randomOffset()
      };
    });
    
    // Position Independents in the middle
    indModels.forEach((model, i) => {
      const seat = indSeats[i % indSeats.length];
      newPositions[model.id] = {
        top: seat.top + randomOffset(),
        left: seat.left + randomOffset()
      };
    });
    
    // Final safety check - ensure all models have positions
    safeModels.forEach(model => {
      if (!newPositions[model.id]) {
        logger.warn(logger.LogCategory.UI, `Model ${model.name} has no position assigned, using default`);
        newPositions[model.id] = {
          top: 50 + randomOffset() * 5,
          left: 50 + randomOffset() * 5
        };
      }
    });
    
    // Update models with CSS classes
    setModels(safeModels);
    
    // Update positions and mark as assigned
    setFinalPositions(newPositions);
    setPositionsAssigned(true);
    
    // Set up debate speaking order after a reasonable delay for animations to complete
    positioningTimerRef.current = setTimeout(() => {
      logger.debate("Starting debate initialization");

      // Skip the setupSpeakingOrder step completely - it will be handled inside startDebate
      // This avoids any potential circular dependencies or uninitialized variable errors

      // Simply start the debate - the hook's implementation will handle order creation
      positioningTimerRef.current = setTimeout(() => {
        try {
          logger.markStart('debate_start');
          // Just call startDebate - it handles everything internally now
          startDebate();
        } catch (error) {
          logger.error(logger.LogCategory.DEBATE, "Error starting debate", { error: error.message });

          // Last-resort recovery
          setTimeout(startDebate, 1000);
        }
      }, 800);
    }, 1000);
  };

  // Enhanced voting interface display with more reliable trigger
  useEffect(() => {
    logger.ui("Voting interface conditions check", {
      isDebateCompleted,
      showVoting,
      showWinner
    });

    if (isDebateCompleted && !showVoting && !showWinner) {
      logger.success(logger.LogCategory.DEBATE, "DEBATE COMPLETED, showing voting interface after delay");

      // Clear any existing timers to prevent race conditions
      if (votingTimerRef.current) {
        clearTimeout(votingTimerRef.current);
      }

      // Use a separate timer ref specifically for voting interface
      votingTimerRef.current = setTimeout(() => {
        logger.ui("ACTIVATING VOTING INTERFACE NOW");
        logger.markEnd('debate_start');
        setShowVoting(true);
      }, 2000);
    }
  }, [isDebateCompleted, showVoting, showWinner]);
  
  // Debug lifecycle state changes
  useEffect(() => {
    logger.state("DebateScreen State Update", {
      partyAssignmentActive,
      positionsAssigned,
      debateState,
      currentSpeaker: currentSpeaker?.name || 'None',
      currentSpeech: currentSpeech ? 'Available' : 'None',
      isDebateCompleted,
      showVoting
    });
  }, [partyAssignmentActive, positionsAssigned, debateState, currentSpeaker, currentSpeech, isDebateCompleted, showVoting]);
  
  // Handle vote submission
  const handleVoteSubmit = (party) => {
    logger.vote(`Vote submitted: ${party} wins the debate`, { winner: party });
    setDebateWinner(party);
    setShowVoting(false);
    setShowWinner(true);
  };

  // Handle individual message voting (thumbs up/down)
  const handleMessageVote = async (messageId, vote, affiliation) => {
    // Track previous vote for logging
    const previousVote = messageVotes[messageId]?.vote || null;

    logger.voteAction('Message vote received', {
      messageId,
      voteType: vote,
      affiliation,
      previousVote
    });

    // Update local state first for immediate UI feedback
    setMessageVotes(prev => {
      if (vote === null) {
        // Remove vote
        const newVotes = { ...prev };
        delete newVotes[messageId];
        return newVotes;
      } else {
        // Add or update vote
        return {
          ...prev,
          [messageId]: { vote, affiliation }
        };
      }
    });

    // Send vote to backend for persistence and RL
    try {
      logger.markStart(`vote_${messageId}`);
      logger.network(`Sending message vote to backend`, { messageId, vote, affiliation });

      const response = await fetch(getApiUrl(API_ENDPOINTS.VOTE_MESSAGE), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          voteType: vote,
          affiliation,
          timestamp: Date.now(),
          topic
        })
      });

      const duration = logger.markEnd(`vote_${messageId}`);

      if (!response.ok) {
        throw new Error(`Failed to process vote: ${response.status}`);
      }

      const data = await response.json();
      logger.apiResponse(API_ENDPOINTS.VOTE_MESSAGE, response.status, duration, {
        success: data.success,
        message: data.message
      });

      if (data.success) {
        logger.success(logger.LogCategory.VOTE, `Message vote recorded successfully`, { messageId });
      }
    } catch (error) {
      logger.error(logger.LogCategory.NETWORK, `Failed to send message vote to backend`, {
        messageId,
        error: error.message
      });
      // Note: We don't revert the local state change - the vote is still tracked locally
      // This ensures a good UX even if the backend is temporarily unavailable
    }
  };

  // Toggle between winner display and voting interface
  const handleViewArguments = () => {
    setShowWinner(false);
    setShowVoting(true);
  };
  
  // Handle manual party reassignment
  const handleReassignParties = () => {
    logger.user("Manual party reassignment requested");
    
    // Reset initialization flag to allow re-initialization
    setIsInitialized(false);
    
    // Reset debate state
    setPositionsAssigned(false);
    
    // Reset models to non-finalized state and clear any potential errors
    setModels(prev => prev.map(m => ({
      ...m,
      affiliation: '',
      isFinalized: false,
      cssClass: ''
    })));
    
    // Scatter positions again - with mobile-specific positioning
    const scatteredPositions = models.reduce((acc, model) => {
      // For mobile, use a more focused center area
      if (isMobile) {
        const randTop = Math.floor(Math.random() * 20 + 50); // 50-70%
        const randLeft = Math.floor(Math.random() * 30 + 35); // 35-65%
        acc[model.id] = { top: randTop, left: randLeft };
      } else {
        // Desktop scattering
        const randTop = Math.floor(Math.random() * 15 + 55);
        const randLeft = Math.floor(Math.random() * 40 + 30);
        acc[model.id] = { top: randTop, left: randLeft };
      }
      return acc;
    }, {});
    
    setFinalPositions(scatteredPositions);
    
    // Reset any existing timers
    if (positioningTimerRef.current) {
      clearTimeout(positioningTimerRef.current);
      positioningTimerRef.current = null;
    }
    
    // Make sure it's not already in an assigning state
    if (!partyAssignmentActive) {
      // Activate party assignment immediately
      setPartyAssignmentActive(true);
    }
  };

  return (
    <div className={`debate-screen ${partyAssignmentActive ? 'assigning' : ''} ${positionsAssigned ? 'positions-assigned' : ''}`}>
      {/* Topic Banner */}
      <TopicBanner topic={topic} winner={debateWinner} />
      
      {/* Party Assigner Component - only shown when active */}
      {partyAssignmentActive && (
        <PartyAssigner
          models={models}
          setModels={setModels}
          active={true}
          onAssignmentComplete={handlePartyAssignmentComplete}
        />
      )}
      
      {/* Manual reassign button (more visible and always shown except during specific states) */}
      {!isDebateCompleted && !partyAssignmentActive && (
        <button
          className="reassign-button"
          onClick={handleReassignParties}
          style={{
            zIndex: 100,
            background: '#cc3333',
            color: 'white',
            fontWeight: 'bold',
            boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
          }}
        >
          Reassign Parties
        </button>
      )}

      {/* Controversy Intensity Control */}
      {!isDebateCompleted && !partyAssignmentActive && (
        <div className="controversy-control">
          <button
            className="controversy-toggle"
            onClick={() => setShowControversySlider(!showControversySlider)}
            title="Adjust controversy level"
          >
            🔥 {controversyLevel}%
          </button>
          {showControversySlider && (
            <div className="controversy-slider-panel">
              <div className="controversy-header">
                <span className="controversy-title">Controversy Level</span>
                <button
                  className="controversy-close"
                  onClick={() => setShowControversySlider(false)}
                >
                  ×
                </button>
              </div>
              <div className="controversy-description">
                {controversyLevel === 100 && "🔥 MAXIMUM SPICE - No holds barred"}
                {controversyLevel >= 70 && controversyLevel < 100 && "🌶️ High Heat - Strong opinions"}
                {controversyLevel >= 40 && controversyLevel < 70 && "🧂 Moderate - Balanced debate"}
                {controversyLevel < 40 && "❄️ Mild - Civil discourse"}
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={controversyLevel}
                onChange={(e) => setControversyLevel(parseInt(e.target.value))}
                className="controversy-slider"
              />
              <div className="controversy-value">{controversyLevel}%</div>
            </div>
          )}
        </div>
      )}

      {/* Fast Forward Button */}
      {countdown !== null && !isDebateCompleted && !partyAssignmentActive && (
        <button
          className="fast-forward-button"
          onClick={skipCountdown}
          title="Skip countdown"
        >
          ⏩ Skip
        </button>
      )}

      {/* Debaters Container */}
      <div className="debaters-container">
        {models.map((m) => {
          const pos = finalPositions[m.id] || { top: 60, left: 50 };
          // Set explicit classes
          const classes = [
            'debater-position',
            partyAssignmentActive ? 'roulette' : '',
            positionsAssigned ? 'placed' : '',
            currentSpeech?.model === m.name ? 'speaking' : ''
          ].filter(Boolean).join(' ');
          
          // Add party affiliation class for styling - ensure lowercase for CSS
          const partyClass = m.affiliation ? m.affiliation.toLowerCase() : '';
          
          // Ensure cssClass is set for styling
          if (!m.cssClass && m.affiliation) {
            m.cssClass = m.affiliation.toLowerCase();
          }
          
          return (
            <div
              key={m.id}
              className={`${classes} ${partyClass}`}
              style={{ 
                top: `${pos.top}%`, 
                left: `${pos.left}%`
              }}
            >
              <DebaterCard 
                name={m.name} 
                logo={m.logo} 
                affiliation={m.affiliation}
              />
            </div>
          );
        })}
      </div>
      
      {/* Current Speaker Chat Bubble */}
      {currentSpeech && (
        <DebateChatBubble
          model={currentSpeech.model}
          message={currentSpeech.message}
          affiliation={currentSpeech.affiliation}
          position={finalPositions[speakingOrder[currentSpeakerIndex]?.id]}
          countdown={countdown}
          nextSpeaker={nextSpeaker && speakingOrder.find(m => m.name === nextSpeaker)}
          onPause={pauseCountdown}
          onResume={resumeCountdown}
          onVote={handleMessageVote}
          messageId={`${currentSpeech.model}-${currentSpeakerIndex}`}
        />
      )}
      
      {/* Voting Interface */}
      {showVoting && (
        <VotingInterface
          debateMessages={debateMessages}
          onVoteSubmit={handleVoteSubmit}
          onNewDebate={onReturnHome}
        />
      )}

      {/* Winner Display */}
      {showWinner && (
        <WinnerDisplay
          winner={debateWinner}
          onReturnHome={onReturnHome}
          onViewArguments={handleViewArguments}
        />
      )}
    </div>
  );
};

export default DebateScreen;