import React, { useEffect, useState, useRef } from 'react';
import DebaterCard from './DebaterCard';
import TopicBanner from './TopicBanner';
import DebateChatBubble from './DebateChatBubble';
import VotingInterface from './VotingInterface';
import './DebateScreen.css';

const DebateScreen = ({ topic, models, setModels }) => {
  const [finalPositions, setFinalPositions] = useState({});
  const [currentChat, setCurrentChat] = useState(null);
  const [debateMessages, setDebateMessages] = useState([]);
  const [countdown, setCountdown] = useState(null);
  const [nextSpeaker, setNextSpeaker] = useState(null);
  const [speakingOrder, setSpeakingOrder] = useState([]);
  const [currentSpeakerIndex, setCurrentSpeakerIndex] = useState(0);
  const [debateCompleted, setDebateCompleted] = useState(false);
  const [showVoting, setShowVoting] = useState(false);
  const [debateWinner, setDebateWinner] = useState(null);
  
  // Countdown interval reference
  const countdownInterval = useRef(null);
  
  // Seat positions for different parties
  const demSeats = [
    { top: 55, left: 5 },
    { top: 60, left: 8 },
    { top: 65, left: 12 },
    { top: 57, left: 7 },
    { top: 63, left: 10 },
  ];
  const repSeats = [
    { top: 55, left: 90 },
    { top: 60, left: 88 },
    { top: 65, left: 86 },
    { top: 57, left: 89 },
    { top: 63, left: 87 },
  ];
  const indSeats = [
    { top: 60, left: 48 },
    { top: 63, left: 50 },
    { top: 63, left: 52 },
    { top: 66, left: 49 },
    { top: 66, left: 51 },
  ];

  // Small random offset (±1%)
  const randomOffset = () => Math.floor(Math.random() * 3) - 1;

  // Initially scatter debaters within a narrow range
  const scatteredPositions = models.reduce((acc, model) => {
    const randTop = Math.floor(Math.random() * 15 + 55);
    const randLeft = Math.floor(Math.random() * 20 + 40);
    acc[model.id] = { top: randTop, left: randLeft };
    return acc;
  }, {});

  useEffect(() => {
    setFinalPositions(scatteredPositions);
  }, [models]);

  // Roulette effect: randomize affiliation every 100ms for 3 seconds
  useEffect(() => {
    const affiliations = ['Republican', 'Democrat', 'Independent'];
    const getRandomAffiliation = () =>
      affiliations[Math.floor(Math.random() * affiliations.length)];

    const interval = setInterval(() => {
      setModels((prev) =>
        prev.map((m) => ({
          ...m,
          affiliation: getRandomAffiliation(),
          isFinalized: false,
        }))
      );
    }, 100);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      setModels((prev) =>
        prev.map((m) => ({
          ...m,
          affiliation: getRandomAffiliation(),
          isFinalized: true,
        }))
      );
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [setModels]);

  // After roulette finalizes, ensure each party is represented and assign final positions
  useEffect(() => {
    if (models.length > 0 && models.every((m) => m.isFinalized)) {
      // Reset debate state when models change
      setDebateMessages([]);
      setCurrentSpeakerIndex(0);
      setDebateCompleted(false);
      setShowVoting(false);
      setDebateWinner(null);
      
      // Clear any existing countdown
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
        countdownInterval.current = null;
      }
      
      let updatedModels = [...models];
      const count = {
        Democrat: updatedModels.filter((m) => m.affiliation === 'Democrat').length,
        Republican: updatedModels.filter((m) => m.affiliation === 'Republican').length,
        Independent: updatedModels.filter((m) => m.affiliation === 'Independent').length,
      };
      
      // Ensure each party has at least one representative
      const parties = ['Democrat', 'Republican', 'Independent'];
      parties.forEach((party) => {
        if (count[party] === 0) {
          let donor = parties.reduce((max, cur) =>
            count[cur] > count[max] ? cur : max,
            parties[0]
          );
          if (count[donor] > 1) {
            for (let i = 0; i < updatedModels.length; i++) {
              if (updatedModels[i].affiliation === donor) {
                updatedModels[i].affiliation = party;
                count[donor]--;
                count[party]++;
                break;
              }
            }
          }
        }
      });

      // Assign seating positions based on party affiliation
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
      setFinalPositions(newPositions);

      // Create a speaking order that alternates between parties when possible
      // Try to ensure we have at least 2 from each major party and 1 independent
      let order = [];
      
      // Add first Democrat
      if (demModels.length > 0) order.push(demModels[0]);
      
      // Add first Republican
      if (repModels.length > 0) order.push(repModels[0]);
      
      // Add Independent if available
      if (indModels.length > 0) order.push(indModels[0]);
      
      // Add second Democrat if available
      if (demModels.length > 1) order.push(demModels[1]);
      
      // Add second Republican if available
      if (repModels.length > 1) order.push(repModels[1]);
      
      // Add remaining speakers to reach at least 5 if possible, prioritizing balance
      while (order.length < 5 && order.length < updatedModels.length) {
        // Count current speakers by party
        const currentCounts = {
          Democrat: order.filter(m => m.affiliation === 'Democrat').length,
          Republican: order.filter(m => m.affiliation === 'Republican').length,
          Independent: order.filter(m => m.affiliation === 'Independent').length
        };
        
        // Find party with fewest speakers
        const fewestParty = Object.keys(currentCounts).reduce((a, b) => 
          currentCounts[a] <= currentCounts[b] ? a : b
        );
        
        // Try to add a speaker from that party
        const partyModels = updatedModels.filter(m => 
          m.affiliation === fewestParty && !order.includes(m)
        );
        
        if (partyModels.length > 0) {
          order.push(partyModels[0]);
        } else {
          // If no more from fewest party, add any remaining speaker
          const remainingModels = updatedModels.filter(m => !order.includes(m));
          if (remainingModels.length > 0) {
            order.push(remainingModels[0]);
          } else {
            break; // No more speakers to add
          }
        }
      }
      
      setSpeakingOrder(order);
      
      // Start the debate with the first speaker
      if (order.length > 0) {
        const firstSpeaker = order[0];
        setNextSpeaker(firstSpeaker.name);
        
        // Trigger first speaker after a short delay to allow UI to update
        setTimeout(() => {
          callSpeaker(firstSpeaker, 0, []);
        }, 1000);
      }
    }
  }, [models, setModels, topic]);
  
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
        }, 3000);
      }
    } catch (error) {
      console.error("Error calling speaker:", error);
      
      // Fallback response in case of error
      const errorMessage = {
        model: speaker.name,
        message: `I apologize, but I'm having technical difficulties presenting my views on ${topic}.`,
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
        }, 3000);
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
    setShowVoting(false);
  };
  
  // Handle starting new debate
  const handleNewTopic = (newTopic) => {
    // Reset all state and start new debate with new topic
    setDebateMessages([]);
    setCurrentSpeakerIndex(0);
    setDebateCompleted(false);
    setShowVoting(false);
    setDebateWinner(null);
    
    // Update topic (assuming this is managed by parent component)
    if (typeof topic === 'function') {
      topic(newTopic);
    }
    
    // Restart the affiliation roulette
    const affiliations = ['Republican', 'Democrat', 'Independent'];
    const getRandomAffiliation = () =>
      affiliations[Math.floor(Math.random() * affiliations.length)];
      
    const interval = setInterval(() => {
      setModels((prev) =>
        prev.map((m) => ({
          ...m,
          affiliation: getRandomAffiliation(),
          isFinalized: false,
        }))
      );
    }, 100);
    
    setTimeout(() => {
      clearInterval(interval);
      setModels((prev) =>
        prev.map((m) => ({
          ...m,
          affiliation: getRandomAffiliation(),
          isFinalized: true,
        }))
      );
    }, 3000);
  };

  return (
    <div className="debate-screen">
      <div
        className="debate-background"
        style={{
          backgroundImage: `url(${process.env.PUBLIC_URL}/images/GoldenCongress.png)`,
          backgroundSize: 'cover',
        }}
      ></div>
      <TopicBanner topic={topic} winner={debateWinner} />
      
      {!debateCompleted && (
        <button
          className="reassign-button"
          onClick={() => {
            const affiliations = ['Republican', 'Democrat', 'Independent'];
            const getRandomAffiliation = () =>
              affiliations[Math.floor(Math.random() * affiliations.length)];
            const interval = setInterval(() => {
              setModels((prev) =>
                prev.map((m) => ({
                  ...m,
                  affiliation: getRandomAffiliation(),
                  isFinalized: false,
                }))
              );
            }, 100);
            setTimeout(() => {
              clearInterval(interval);
              setModels((prev) =>
                prev.map((m) => ({
                  ...m,
                  affiliation: getRandomAffiliation(),
                  isFinalized: true,
                }))
              );
            }, 3000);
          }}
        >
          Reassign Affiliations
        </button>
      )}
      
      <div className="debaters-container">
        {models.map((m) => {
          const pos = finalPositions[m.id] || { top: 60, left: 50 };
          return (
            <div
              key={m.id}
              className={`debater-position ${currentChat?.model === m.name ? 'speaking' : ''}`}
              style={{ top: `${pos.top}%`, left: `${pos.left}%` }}
            >
              <DebaterCard name={m.name} logo={m.logo} affiliation={m.affiliation} />
            </div>
          );
        })}
      </div>
      
      {currentChat && (
        <DebateChatBubble
          model={currentChat.model}
          message={currentChat.message}
          affiliation={currentChat.affiliation}
          position={currentChat.position}
          countdown={countdown}
          nextSpeaker={countdown !== null ? nextSpeaker : null}
        />
      )}
      
      {showVoting && (
        <VotingInterface
          debateMessages={debateMessages}
          onVoteSubmit={handleVoteSubmit}
          onNewTopic={handleNewTopic}
        />
      )}
      
      {debateWinner && !showVoting && (
        <div className="winner-banner">
          <h2>The {debateWinner} viewpoint won the debate!</h2>
          <button onClick={() => setShowVoting(true)}>View Arguments</button>
        </div>
      )}
    </div>
  );
};

export default DebateScreen;