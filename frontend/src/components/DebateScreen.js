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
  
  // Responsive and symmetrical seat positions
  const isMobile = window.innerWidth <= 480;
  
  // Helper function to create symmetrical party positions
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
    
    console.log("🔄 Initializing debate screen with models:", models);
    
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
      console.log("🏛️ Activating party assignment");
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

  // Assign positions based on party affiliations with improved symmetry
  const assignPositionsBasedOnParty = (updatedModels) => {
    console.log("🎯 Assigning positions based on party affiliation");
    
    // Lowercase party names to match CSS class naming conventions
    const partyToClassMap = {
      'Democrat': 'democrat',
      'Republican': 'republican',
      'Independent': 'independent'
    };
    
    // Group models by affiliation
    let newPositions = {};
    const demModels = updatedModels.filter((m) => m.affiliation === 'Democrat');
    const repModels = updatedModels.filter((m) => m.affiliation === 'Republican');
    const indModels = updatedModels.filter((m) => m.affiliation === 'Independent');
    
    console.log(`Assigning: Democrats: ${demModels.length}, Republicans: ${repModels.length}, Independents: ${indModels.length}`);
    
    // Position Democrats symmetrically on the left
    demModels.forEach((m, i) => {
      // Ensure we use appropriate seat even if we have more models than defined seats
      let seat = demSeats[i % demSeats.length];
      
      // Apply CSS class for styling
      m.cssClass = partyToClassMap[m.affiliation];
      
      // Set position with a small random offset for more natural look
      newPositions[m.id] = {
        top: seat.top + randomOffset(),
        left: seat.left + randomOffset(),
      };
    });
    
    // Position Republicans symmetrically on the right
    repModels.forEach((m, i) => {
      let seat = repSeats[i % repSeats.length];
      
      // Apply CSS class for styling
      m.cssClass = partyToClassMap[m.affiliation];
      
      newPositions[m.id] = {
        top: seat.top + randomOffset(),
        left: seat.left + randomOffset(),
      };
    });
    
    // Position Independents in the middle
    indModels.forEach((m, i) => {
      let seat = indSeats[i % indSeats.length];
      
      // Apply CSS class for styling
      m.cssClass = partyToClassMap[m.affiliation];
      
      newPositions[m.id] = {
        top: seat.top + randomOffset(),
        left: seat.left + randomOffset(),
      };
    });
    
    // Update the models with their CSS classes
    setModels(updatedModels);
    
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