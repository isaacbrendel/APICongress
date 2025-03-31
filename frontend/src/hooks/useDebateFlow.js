// src/hooks/useDebateFlow.js
import { useState, useEffect, useCallback, useRef } from 'react';

// Define debate flow states
const DEBATE_STATES = {
  IDLE: 'idle',
  PREPARING: 'preparing',
  SPEAKING: 'speaking',
  COUNTDOWN: 'countdown',
  COMPLETED: 'completed'
};

/**
 * Custom hook to manage debate flow
 * @param {Array} models - Array of AI models with their affiliations
 * @param {string} topic - The debate topic
 * @param {Object} positions - Model position data for visual representation
 * @returns {Object} Debate state and controls
 */
export default function useDebateFlow(models, topic, positions) {
  // Debate state
  const [debateState, setDebateState] = useState(DEBATE_STATES.IDLE);
  const [speakingOrder, setSpeakingOrder] = useState([]);
  const [currentSpeakerIndex, setCurrentSpeakerIndex] = useState(0);
  const [currentSpeech, setCurrentSpeech] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [debateMessages, setDebateMessages] = useState([]);
  const [nextSpeaker, setNextSpeaker] = useState(null);
  const [autoStarted, setAutoStarted] = useState(false);

  // Ref for countdown interval
  const countdownInterval = useRef(null);
  const initTimer = useRef(null);

  // Auto-start the debate when positions are available
  useEffect(() => {
    // Check if we have positions and models with affiliations
    const hasPositions = Object.keys(positions).length > 0;
    const hasAffiliatedModels = models.filter(m => m.affiliation).length === models.length;
    
    if (hasPositions && hasAffiliatedModels && !autoStarted && debateState === DEBATE_STATES.IDLE) {
      console.log("Auto-starting debate setup");
      setAutoStarted(true);
      
      // Clear any previous timer
      if (initTimer.current) {
        clearTimeout(initTimer.current);
      }
      
      // Wait a moment for animations to complete, then setup and start
      initTimer.current = setTimeout(() => {
        const order = setupSpeakingOrder();
        
        initTimer.current = setTimeout(() => {
          startDebate();
        }, 800);
      }, 500);
    }
  }, [positions, models, autoStarted, debateState]);

  // Clear interval on component unmount
  useEffect(() => {
    return () => {
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
        countdownInterval.current = null;
      }
      if (initTimer.current) {
        clearTimeout(initTimer.current);
        initTimer.current = null;
      }
    };
  }, []);

  /**
   * Create a speaking order based on party affiliations that balances the debate
   */
  const setupSpeakingOrder = useCallback(() => {
    if (!models || models.length === 0) return [];
    
    console.log("Setting up speaking order from models:", models);
    
    // Sort models by party for balanced ordering
    const demModels = models.filter((m) => m.affiliation === 'Democrat');
    const repModels = models.filter((m) => m.affiliation === 'Republican');
    const indModels = models.filter((m) => m.affiliation === 'Independent');
    
    let order = [];
    let lastParty = null;
    
    // Start with a Republican if available
    if (repModels.length > 0) {
      order.push(repModels[0]);
      lastParty = 'Republican';
    }
    
    // Then a Democrat if available
    if (demModels.length > 0 && lastParty !== 'Democrat') {
      order.push(demModels[0]);
      lastParty = 'Democrat';
    } else if (repModels.length > 1 && lastParty !== 'Republican') {
      order.push(repModels[1]);
      lastParty = 'Republican';
    } else if (indModels.length > 0 && lastParty !== 'Independent') {
      order.push(indModels[0]);
      lastParty = 'Independent';
    }
    
    // Add Independent if available
    if (indModels.length > 0 && lastParty !== 'Independent') {
      order.push(indModels[0]);
      lastParty = 'Independent';
    } else if (demModels.length > 0 && lastParty !== 'Democrat') {
      order.push(demModels[0]);
      lastParty = 'Democrat';
    } else if (repModels.length > 1 && lastParty !== 'Republican') {
      order.push(repModels[1]);
      lastParty = 'Republican';
    }
    
    // Add second Republican if available
    if (repModels.length > 1 && !order.includes(repModels[1]) && lastParty !== 'Republican') {
      order.push(repModels[1]);
      lastParty = 'Republican';
    } else if (demModels.length > 1 && !order.includes(demModels[1]) && lastParty !== 'Democrat') {
      order.push(demModels[1]);
      lastParty = 'Democrat';
    } else if (indModels.length > 1 && !order.includes(indModels[1]) && lastParty !== 'Independent') {
      order.push(indModels[1]);
      lastParty = 'Independent';
    }
    
    // Add second Democrat if available
    if (demModels.length > 1 && !order.includes(demModels[1]) && lastParty !== 'Democrat') {
      order.push(demModels[1]);
      lastParty = 'Democrat';
    } else if (repModels.length > 2 && !order.includes(repModels[2]) && lastParty !== 'Republican') {
      order.push(repModels[2]);
      lastParty = 'Republican';
    } else if (indModels.length > 1 && !order.includes(indModels[1]) && lastParty !== 'Independent') {
      order.push(indModels[1]);
      lastParty = 'Independent';
    }
    
    // Add remaining speakers to reach at least 5 if possible, while maintaining alternating parties
    const remainingModels = models.filter(m => !order.includes(m));
    for (let i = 0; i < remainingModels.length && order.length < 5; i++) {
      // Skip if same party as last speaker
      if (remainingModels[i].affiliation === lastParty) {
        continue;
      }
      order.push(remainingModels[i]);
      lastParty = remainingModels[i].affiliation;
    }
    
    // If we still need speakers and had to skip some due to party constraints, add them now
    if (order.length < 5) {
      for (let i = 0; i < remainingModels.length && order.length < 5; i++) {
        if (!order.includes(remainingModels[i])) {
          order.push(remainingModels[i]);
        }
      }
    }
    
    console.log("Speaking order established:", order.map(m => `${m.name} (${m.affiliation})`));
    setSpeakingOrder(order);
    setDebateState(DEBATE_STATES.PREPARING);
    
    return order;
  }, [models]);
  
  /**
   * Start the debate process
   */
  const startDebate = useCallback(() => {
    if (speakingOrder.length === 0) {
      console.warn("Cannot start debate: No speaking order established");
      return;
    }
    
    console.log("Starting debate");
    setCurrentSpeakerIndex(0);
    setDebateMessages([]);
    
    // Set the next speaker to the first in order
    const firstSpeaker = speakingOrder[0];
    setNextSpeaker(firstSpeaker.name);
    
    // Move to speaking state to trigger the first API call
    setDebateState(DEBATE_STATES.SPEAKING);
  }, [speakingOrder]);
  
  /**
   * Call the current speaker's API to generate a response
   */
  const callCurrentSpeaker = useCallback(async () => {
    if (currentSpeakerIndex >= speakingOrder.length) {
      console.log("All speakers have spoken, completing debate");
      setDebateState(DEBATE_STATES.COMPLETED);
      return;
    }
    
    const speaker = speakingOrder[currentSpeakerIndex];
    console.log(`Calling speaker ${currentSpeakerIndex + 1}/${speakingOrder.length}: ${speaker.name} (${speaker.affiliation})`);
    
    try {
      // Prepare previous messages context for the API
      const messagesContext = debateMessages.map(msg => ({
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
      
      // Create the chat message
      const chatMessage = {
        model: speaker.name,
        message: data.response,
        affiliation: speaker.affiliation
      };
      
      // Update state with speech and position
      setCurrentSpeech({
        ...chatMessage,
        position: positions[speaker.id]
      });
      
      // Add to debate history
      setDebateMessages(prev => [...prev, chatMessage]);
      
      // Determine if there's a next speaker
      const nextIndex = currentSpeakerIndex + 1;
      if (nextIndex < speakingOrder.length) {
        // Set up next speaker
        const next = speakingOrder[nextIndex];
        setNextSpeaker(next.name);
        
        // Move to countdown state
        setDebateState(DEBATE_STATES.COUNTDOWN);
      } else {
        // No next speaker means debate is complete
        setCountdown(null);
        setNextSpeaker(null);
        setDebateState(DEBATE_STATES.COMPLETED);
      }
    } catch (error) {
      console.error("Error calling speaker:", error);
      
      // Fallback response in case of error
      const errorMessage = {
        model: speaker.name,
        message: `I'll keep it short: ${topic} needs practical solutions, not partisan games.`,
        affiliation: speaker.affiliation
      };
      
      setCurrentSpeech({
        ...errorMessage,
        position: positions[speaker.id]
      });
      
      setDebateMessages(prev => [...prev, errorMessage]);
      
      // Continue to next speaker despite error
      const nextIndex = currentSpeakerIndex + 1;
      if (nextIndex < speakingOrder.length) {
        const next = speakingOrder[nextIndex];
        setNextSpeaker(next.name);
        
        // Move to countdown state
        setDebateState(DEBATE_STATES.COUNTDOWN);
      } else {
        setCountdown(null);
        setNextSpeaker(null);
        setDebateState(DEBATE_STATES.COMPLETED);
      }
    }
  }, [currentSpeakerIndex, debateMessages, positions, speakingOrder, topic]);
  
  /**
   * Move to the next speaker in order
   */
  const moveToNextSpeaker = useCallback(() => {
    const nextIndex = currentSpeakerIndex + 1;
    
    if (nextIndex >= speakingOrder.length) {
      console.log("No more speakers, debate completed");
      setDebateState(DEBATE_STATES.COMPLETED);
    } else {
      console.log(`Moving to next speaker: ${nextIndex + 1}/${speakingOrder.length}`);
      setCurrentSpeakerIndex(nextIndex);
      setDebateState(DEBATE_STATES.SPEAKING);
    }
  }, [currentSpeakerIndex, speakingOrder]);
  
  /**
   * Start countdown timer between speakers
   */
  const startCountdown = useCallback((seconds) => {
    // Clear any existing interval
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
    }
    
    console.log(`Starting ${seconds} second countdown to next speaker`);
    
    // Set initial countdown value
    setCountdown(seconds);
    
    // Start the interval
    countdownInterval.current = setInterval(() => {
      setCountdown(prev => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(countdownInterval.current);
          countdownInterval.current = null;
          moveToNextSpeaker();
          return null;
        }
        return next;
      });
    }, 1000);
  }, [moveToNextSpeaker]);
  
  // Effect to start countdown when in COUNTDOWN state
  useEffect(() => {
    if (debateState === DEBATE_STATES.COUNTDOWN) {
      startCountdown(10); // 10 second countdown between speakers
    }
  }, [debateState, startCountdown]);
  
  // Effect to call current speaker when in SPEAKING state
  useEffect(() => {
    if (debateState === DEBATE_STATES.SPEAKING) {
      callCurrentSpeaker();
    }
  }, [debateState, callCurrentSpeaker]);
  
  return {
    debateState,
    currentSpeaker: speakingOrder[currentSpeakerIndex],
    currentSpeakerIndex,
    speakingOrder,
    currentSpeech,
    countdown,
    nextSpeaker,
    debateMessages,
    setupSpeakingOrder,
    startDebate,
    isDebateCompleted: debateState === DEBATE_STATES.COMPLETED
  };
}