// src/components/DebateScreen.js
import React, { useEffect, useState, useRef } from 'react';
import DebaterCard from './DebaterCard';
import TopicBanner from './TopicBanner';
import DebateChatBubble from './DebateChatBubble';
import VotingInterface from './VotingInterface';
import PartyAssigner from './PartyAssigner';
import usePartyAssignment from '../hooks/usePartyAssignment';
import './DebateScreen.css';

const DebateScreen = ({ topic, models, setModels, onReturnHome }) => {
  // State for positioning and animation
  const [finalPositions, setFinalPositions] = useState({});
  const [positionsAssigned, setPositionsAssigned] = useState(false);
  const [partyAssignmentActive, setPartyAssignmentActive] = useState(false);
  
  // Debate state
  const [currentChat, setCurrentChat] = useState(null);
  const [debateMessages, setDebateMessages] = useState([]);
  const [countdown, setCountdown] = useState(null);
  const [nextSpeaker, setNextSpeaker] = useState(null);
  const [speakingOrder, setSpeakingOrder] = useState([]);
  const [currentSpeakerIndex, setCurrentSpeakerIndex] = useState(0);
  const [debateCompleted, setDebateCompleted] = useState(false);
  const [showVoting, setShowVoting] = useState(false);
  const [debateWinner, setDebateWinner] = useState(null);
  
  // Track initialization state to prevent repeated setup
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Hook for party assignment 
  const { isAssigning, balancePartyDistribution, reassignParties } = usePartyAssignment(models, setModels);
  
  // Refs for intervals and tracking
  const countdownInterval = useRef(null);
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
    
    console.log("Initializing debate screen with models:", models);
    
    // Set initialized flag to prevent repeated setup
    setIsInitialized(true);
    
    // Reset states
    setDebateMessages([]);
    setCurrentSpeakerIndex(0);
    setDebateCompleted(false);
    setShowVoting(false);
    setDebateWinner(null);
    setPositionsAssigned(false);
    
    // Clear any existing interval
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
      countdownInterval.current = null;
    }
    
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
      console.log("Activating party assignment");
      setPartyAssignmentActive(true);
    }, 100);
  }, [models, isInitialized]);

  // Clean up intervals on component unmount
  useEffect(() => {
    return () => {
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
        countdownInterval.current = null;
      }
      if (positioningTimerRef.current) {
        clearTimeout(positioningTimerRef.current);
        positioningTimerRef.current = null;
      }
    };
  }, []);

  // Handle party assignment completion
  const handlePartyAssignmentComplete = (updatedModels) => {
    console.log("Party assignment complete, assigning positions", updatedModels);
    
    // Deactivate the party assignment component first to prevent any further updates
    setPartyAssignmentActive(false);
    
    // Short delay before positioning to ensure animations don't overlap
    positioningTimerRef.current = setTimeout(() => {
      assignPositionsBasedOnParty(updatedModels);
    }, 200);
  };

  // Assign positions based on party affiliations
  const assignPositionsBasedOnParty = (updatedModels) => {
    console.log("Assigning positions based on party affiliation");
    
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
      setupSpeakingOrder(updatedModels);
    }, 1500);
  };
  
  // Set up speaking order and start the debate
  const setupSpeakingOrder = (updatedModels) => {
    console.log("Setting up speaking order");
    
    // Create a speaking order that alternates between parties
    let order = [];
    
    const demModels = updatedModels.filter((m) => m.affiliation === 'Democrat');
    const repModels = updatedModels.filter((m) => m.affiliation === 'Republican');
    const indModels = updatedModels.filter((m) => m.affiliation === 'Independent');
    
    // Ensure we have at least 2 of each major party in the order if possible
    
    // Start with a Republican
    if (repModels.length > 0) order.push(repModels[0]);
    
    // Then a Democrat
    if (demModels.length > 0) order.push(demModels[0]);
    
    // Add Independent if available
    if (indModels.length > 0) order.push(indModels[0]);
    
    // Add second Republican if available
    if (repModels.length > 1) order.push(repModels[1]);
    
    // Add second Democrat if available
    if (demModels.length > 1) order.push(demModels[1]);
    
    // Add remaining speakers to reach at least 5 if possible
    const remainingModels = updatedModels.filter(m => !order.includes(m));
    for (let i = 0; i < remainingModels.length && order.length < 5; i++) {
      order.push(remainingModels[i]);
    }
    
    console.log("Speaking order established:", order.map(m => m.name));
    setSpeakingOrder(order);
    
    // Start the debate with the first speaker
    if (order.length > 0) {
      const firstSpeaker = order[0];
      setNextSpeaker(firstSpeaker.name);
      
      // Trigger first speaker after a delay to allow UI to update
      positioningTimerRef.current = setTimeout(() => {
        callSpeaker(firstSpeaker, 0, []);
      }, 1000);
    }
  };
  
  // Function to call the next speaker in the debate
  const callSpeaker = async (speaker, speakerIndex, previousMessages) => {
    try {
      setCurrentSpeakerIndex(speakerIndex);
      
      // Prepare previous messages context for the API
      const messagesContext = previousMessages.map(msg => ({
        speaker: msg.model,
        affiliation: msg.affiliation,
        message: msg.message
      }));
      
      // Prepare context as JSON string
      const context = JSON.stringify(messagesContext);
      
      // Make API call with context of previous messages
      const response = await fetch(
        `/api/llm?model=${speaker.name}&party=${speaker.affiliation}&topic=${encodeURIComponent(topic)}&context=${encodeURIComponent(context)}`
      );
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Create the current chat message
      const chatMessage = {
        model: speaker.name,
        message: data.response,
        affiliation: speaker.affiliation
      };
      
      // Update UI with the new message
      setCurrentChat({
        ...chatMessage,
        position: finalPositions[speaker.id]
      });
      
      // Add to debate history
      setDebateMessages(prev => [...prev, chatMessage]);
      
      // Determine if there's a next speaker
      const nextIndex = speakerIndex + 1;
      if (nextIndex < speakingOrder.length) {
        // Set up next speaker
        const next = speakingOrder[nextIndex];
        setNextSpeaker(next.name);
        
        // Start countdown
        startCountdown(10, () => {
          callSpeaker(next, nextIndex, [...previousMessages, chatMessage]);
        });
      } else {
        // Debate is complete, show no countdown
        setCountdown(null);
        setNextSpeaker(null);
        setDebateCompleted(true);
        
        // Show voting interface after a delay
        setTimeout(() => {
          setShowVoting(true);
        }, 2000);
      }
    } catch (error) {
      console.error("Error calling speaker:", error);
      
      // Fallback response in case of error
      const errorMessage = {
        model: speaker.name,
        message: `I'll keep it short: ${topic} needs practical solutions, not partisan games.`,
        affiliation: speaker.affiliation
      };
      
      setCurrentChat({
        ...errorMessage,
        position: finalPositions[speaker.id]
      });
      
      setDebateMessages(prev => [...prev, errorMessage]);
      
      // Continue to next speaker despite error
      const nextIndex = speakerIndex + 1;
      if (nextIndex < speakingOrder.length) {
        const next = speakingOrder[nextIndex];
        setNextSpeaker(next.name);
        
        startCountdown(10, () => {
          callSpeaker(next, nextIndex, [...previousMessages, errorMessage]);
        });
      } else {
        setCountdown(null);
        setNextSpeaker(null);
        setDebateCompleted(true);
        
        setTimeout(() => {
          setShowVoting(true);
        }, 2000);
      }
    }
  };
  
  // Function to start countdown timer
  const startCountdown = (seconds, callback) => {
    // Clear any existing interval
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
    }
    
    // Set initial countdown value
    setCountdown(seconds);
    
    // Start the interval
    countdownInterval.current = setInterval(() => {
      setCountdown(prev => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(countdownInterval.current);
          countdownInterval.current = null;
          callback();
          return null;
        }
        return next;
      });
    }, 1000);
  };
  
  // Handle vote submission
  const handleVoteSubmit = (party) => {
    setDebateWinner(party);
    setShowVoting(false); // Hide voting interface to show winner banner
  };
  
  // Handle manual party reassignment
  const handleReassignParties = () => {
    console.log("Manual reassignment requested");
    
    // Reset initialization flag to allow re-initialization
    setIsInitialized(false);
    
    // Reset debate state
    setDebateMessages([]);
    setCurrentSpeakerIndex(0);
    setSpeakingOrder([]);
    setCurrentChat(null);
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
    <div className={`debate-screen ${isAssigning ? 'assigning' : ''}`}>
      <div
        className="debate-background"
        style={{
          backgroundImage: `url(${process.env.PUBLIC_URL}/images/GoldenCongress.png)`,
          backgroundSize: 'cover',
        }}
      ></div>
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
      {!debateCompleted && positionsAssigned && (
        <button
          className="reassign-button"
          onClick={handleReassignParties}
        >
          Reassign Affiliations
        </button>
      )}
      
      <div className="debaters-container">
        {models.map((m) => {
          const pos = finalPositions[m.id] || { top: 60, left: 50 };
          // Set explicit classes
          const classes = [
            'debater-position',
            isAssigning ? 'roulette' : '',
            positionsAssigned ? 'placed' : '',
            currentChat?.model === m.name ? 'speaking' : ''
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
      
      {currentChat && (
        <DebateChatBubble
          model={currentChat.model}
          message={currentChat.message}
          affiliation={currentChat.affiliation}
          position={finalPositions[speakingOrder[currentSpeakerIndex]?.id]}
          countdown={countdown}
          nextSpeaker={countdown !== null ? nextSpeaker : null}
        />
      )}
      
      {showVoting && (
        <VotingInterface
          debateMessages={debateMessages}
          onVoteSubmit={handleVoteSubmit}
          onReturnHome={onReturnHome}
        />
      )}
      
      {debateWinner && !showVoting && (
        <div className="winner-banner">
          <h2>The <span style={{ 
            color: debateWinner === 'Democrat' ? '#0052A5' : 
                  debateWinner === 'Republican' ? '#CC0000' :
                  '#800080'
          }}>{debateWinner}</span> viewpoint won the debate!</h2>
          <button onClick={onReturnHome}>Start New Debate</button>
        </div>
      )}
    </div>
  );
};

export default DebateScreen;