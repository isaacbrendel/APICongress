// src/components/DebateScreen.js
import React, { useEffect, useState, useRef } from 'react';
import DebaterCard from './DebaterCard';
import TopicBanner from './TopicBanner';
import DebateChatBubble from './DebateChatBubble';
import VotingInterface from './VotingInterface';
import WinnerDisplay from './WinnerDisplay';
import PartyAssigner from './PartyAssigner';
import useDebateFlow from '../hooks/useDebateFlow';
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
    isDebateCompleted
  } = useDebateFlow(models, topic, finalPositions);
  
  // Ref for positioning timer
  const positioningTimerRef = useRef(null);
  
  // Seat position arrays
  const demSeats = [
    { top: 55, left: 5 },
    { top: 60, left: 8 },
    { top: 65, left: 12 },
    { top: 57, left: 7 },
    { top: 63, left: 10 },
  ];
  const repSeats = [
    { top: 55, left: 90 },
    { top: 60, left: 82 },
    { top: 65, left: 84 },
    { top: 57, left: 85 },
    { top: 63, left: 75 },
  ];
  const indSeats = [
    { top: 60, left: 48 },
    { top: 65, left: 50 },
    { top: 65, left: 55 },
    { top: 66, left: 49 },
    { top: 66, left: 52 },
  ];

  // Use a small random offset (±1%) for slight variation
  const randomOffset = () => Math.floor(Math.random() * 3) - 1;

  // Initialize models only once when component mounts or models change
  useEffect(() => {
    if (models.length === 0 || isInitialized) return;
    
    console.log("🔄 Initializing debate screen with models:", models);
    
    // Set initialized flag to prevent repeated setup
    setIsInitialized(true);
    
    // Reset states
    setShowVoting(false);
    setShowWinner(false);
    setDebateWinner(null);
    setPositionsAssigned(false);
    
    // Initially scatter debaters within a defined band
    const scatteredPositions = models.reduce((acc, model) => {
      const randTop = Math.floor(Math.random() * 15 + 55);
      const randLeft = Math.floor(Math.random() * 40 + 30); // narrower range (30-70)
      acc[model.id] = { top: randTop, left: randLeft };
      return acc;
    }, {});
    
    setFinalPositions(scatteredPositions);
    
    // Activate party assignment with a small delay
    setTimeout(() => {
      console.log("🏛️ Activating party assignment");
      setPartyAssignmentActive(true);
    }, 100);
  }, [models, isInitialized]);

  // Clean up intervals on component unmount
  useEffect(() => {
    return () => {
      if (positioningTimerRef.current) {
        clearTimeout(positioningTimerRef.current);
        positioningTimerRef.current = null;
      }
    };
  }, []);

  // Handle party assignment completion
  const handlePartyAssignmentComplete = (updatedModels) => {
    console.log("✅ Party assignment complete, assigning positions", updatedModels);
    
    // Deactivate the party assignment component
    setPartyAssignmentActive(false);
    
    // Short delay before positioning to ensure animations don't overlap
    positioningTimerRef.current = setTimeout(() => {
      assignPositionsBasedOnParty(updatedModels);
    }, 200);
  };

  // Assign positions based on party affiliations
  const assignPositionsBasedOnParty = (updatedModels) => {
    console.log("🎯 Assigning positions based on party affiliation");
    
    // Assign positions based on parties
    let newPositions = {};
    const demModels = updatedModels.filter((m) => m.affiliation === 'Democrat');
    const repModels = updatedModels.filter((m) => m.affiliation === 'Republican');
    const indModels = updatedModels.filter((m) => m.affiliation === 'Independent');
    
    demModels.forEach((m, i) => {
      let seat = demSeats[i] || demSeats[0];
      newPositions[m.id] = {
        top: seat.top + randomOffset(),
        left: seat.left + randomOffset(),
      };
    });
    
    repModels.forEach((m, i) => {
      let seat = repSeats[i] || repSeats[0];
      newPositions[m.id] = {
        top: seat.top + randomOffset(),
        left: seat.left + randomOffset(),
      };
    });
    
    indModels.forEach((m, i) => {
      let seat = indSeats[i] || indSeats[0];
      newPositions[m.id] = {
        top: seat.top + randomOffset(),
        left: seat.left + randomOffset(),
      };
    });
    
    // Update positions and mark as assigned
    setFinalPositions(newPositions);
    setPositionsAssigned(true);
    
    // Set up debate speaking order after a longer delay for animations to complete
    positioningTimerRef.current = setTimeout(() => {
      // Use our hook's functions to setup and start the debate
      setupSpeakingOrder();
      
      // Wait a bit more before starting the actual debate
      positioningTimerRef.current = setTimeout(() => {
        startDebate();
      }, 1000);
    }, 1500);
  };

  // Show voting interface after debate completes with delay
  useEffect(() => {
    if (isDebateCompleted && !showVoting && !showWinner) {
      console.log("🎬 Debate completed, showing voting interface after delay");
      positioningTimerRef.current = setTimeout(() => {
        setShowVoting(true);
      }, 2000);
    }
  }, [isDebateCompleted, showVoting, showWinner]);
  
  // Handle vote submission
  const handleVoteSubmit = (party) => {
    console.log(`🗳️ Vote submitted: ${party} wins the debate`);
    setDebateWinner(party);
    setShowVoting(false);
    setShowWinner(true);
  };
  
  // Toggle between winner display and voting interface
  const handleViewArguments = () => {
    setShowWinner(false);
    setShowVoting(true);
  };
  
  // Handle manual party reassignment
  const handleReassignParties = () => {
    console.log("🔄 Manual reassignment requested");
    
    // Reset initialization flag to allow re-initialization
    setIsInitialized(false);
    
    // Reset debate state
    setPositionsAssigned(false);
    
    // Reset models to non-finalized state
    setModels(prev => prev.map(m => ({
      ...m,
      affiliation: '',
      isFinalized: false
    })));
    
    // Scatter positions again
    const scatteredPositions = models.reduce((acc, model) => {
      const randTop = Math.floor(Math.random() * 15 + 55);
      const randLeft = Math.floor(Math.random() * 40 + 30);
      acc[model.id] = { top: randTop, left: randLeft };
      return acc;
    }, {});
    
    setFinalPositions(scatteredPositions);
    
    // Activate party assignment after a delay
    setTimeout(() => {
      setPartyAssignmentActive(true);
    }, 100);
  };

  return (
    <div className={`debate-screen ${partyAssignmentActive ? 'assigning' : ''}`}>
      {/* Background */}
      <div
        className="debate-background"
        style={{
          backgroundImage: `url(${process.env.PUBLIC_URL}/images/GoldenCongress.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      ></div>
      
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
      
      {/* Manual reassign button (only show if debate hasn't completed and positions are assigned) */}
      {!isDebateCompleted && positionsAssigned && (
        <button
          className="reassign-button"
          onClick={handleReassignParties}
        >
          Reassign Affiliations
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
          
          return (
            <div
              key={m.id}
              className={classes}
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
        />
      )}
      
      {/* Voting Interface */}
      {showVoting && (
        <VotingInterface
          debateMessages={debateMessages}
          onVoteSubmit={handleVoteSubmit}
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