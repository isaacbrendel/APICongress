// src/hooks/useDebateFlow.js
import { useState, useEffect, useCallback, useRef } from 'react';

// Define debate flow states
const DEBATE_STATES = {
  IDLE: 'idle',
  PREPARING: 'preparing',
  SPEAKING: 'speaking',
  COUNTDOWN: 'countdown',
  FINAL_PAUSE: 'final_pause', // New state for final delay
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
  const [finalCountdown, setFinalCountdown] = useState(null);

  // Ref for countdown interval
  const countdownInterval = useRef(null);
  const finalCountdownInterval = useRef(null);
  const initTimer = useRef(null);

  // Clear intervals on component unmount
  useEffect(() => {
    return () => {
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
        countdownInterval.current = null;
      }
      if (finalCountdownInterval.current) {
        clearInterval(finalCountdownInterval.current);
        finalCountdownInterval.current = null;
      }
      if (initTimer.current) {
        clearTimeout(initTimer.current);
        initTimer.current = null;
      }
    };
  }, []);

  /**
   * Simple and reliable speaking order creation
   */
  const setupSpeakingOrder = useCallback(() => {
    // Basic validation
    if (!models || !Array.isArray(models) || models.length === 0) {
      console.warn("No models available");
      setSpeakingOrder([]);
      setDebateState(DEBATE_STATES.PREPARING);
      return [];
    }
    
    // Create a fixed speaking order from scratch, no dependencies on previous state
    const tempOrder = models.map(model => ({
      id: model.id || Math.random().toString(36).substring(2, 9),
      name: model.name || "Unknown Speaker",
      affiliation: model.affiliation || "Independent"
    }));
    
    // Set order in state
    console.log("Setting up speaking order:", tempOrder.map(m => m.name).join(", "));
    setSpeakingOrder(tempOrder);
    setDebateState(DEBATE_STATES.PREPARING);
    
    return tempOrder;
  }, [models]);

  /**
   * Simplified debate starter
   */
  const startDebate = useCallback(() => {
    // Create a fresh speaking order every time
    const order = setupSpeakingOrder();
    
    // No models, can't start
    if (order.length === 0) {
      console.error("Cannot start debate: No models available");
      return;
    }
    
    // Reset state for fresh start
    setCurrentSpeakerIndex(0);
    setDebateMessages([]);
    
    // Set the first speaker
    const firstSpeaker = order[0] || { name: "Speaker 1" };
    setNextSpeaker(firstSpeaker.name);
    
    // Start the debate
    console.log("🚀 DEBATE STARTED - Setting state to SPEAKING");
    setDebateState(DEBATE_STATES.SPEAKING);
  }, [setupSpeakingOrder]);

  /**
   * Call the current speaker's API to generate a response
   */
  const callCurrentSpeaker = useCallback(async () => {
    // Guard against invalid speaking order or index
    if (!speakingOrder || speakingOrder.length === 0 || currentSpeakerIndex >= speakingOrder.length) {
      console.log("🏁 No more speakers, debate completed");
      console.log("⭐ DEBATE COMPLETED - setting debateState to COMPLETED from callCurrentSpeaker");
      setDebateState(DEBATE_STATES.COMPLETED);
      return;
    }
    
    // Wait a moment to ensure UI is ready
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Get current speaker safely
    const speaker = speakingOrder[currentSpeakerIndex];
    const speakerName = speaker?.name || `Speaker ${currentSpeakerIndex + 1}`;
    const speakerAffiliation = speaker?.affiliation || "Independent";
    const speakerId = speaker?.id || `speaker-${currentSpeakerIndex}`;
    
    console.log(`🎤 Calling speaker ${currentSpeakerIndex + 1}/${speakingOrder.length}: ${speakerName}`);
    
    try {
      // Prepare context
      const messagesContext = debateMessages.map(msg => ({
        speaker: msg.model,
        affiliation: msg.affiliation,
        message: msg.message
      }));
      
      const context = JSON.stringify(messagesContext);
      
      // Make API call
      const response = await fetch(
        `/api/llm?model=${encodeURIComponent(speakerName)}&party=${encodeURIComponent(speakerAffiliation)}&topic=${encodeURIComponent(topic)}&context=${encodeURIComponent(context)}`
      );
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Create message
      const chatMessage = {
        model: speakerName,
        message: data.response || "I'll keep my comments brief.",
        affiliation: speakerAffiliation
      };
      
      // Update state
      setCurrentSpeech({
        ...chatMessage,
        position: positions[speakerId] || { top: 50, left: 50 }
      });
      
      // Add to history
      setDebateMessages(prev => [...prev, chatMessage]);
      
      // Next speaker or final pause for last speaker
      const nextIndex = currentSpeakerIndex + 1;
      if (nextIndex < speakingOrder.length) {
        const next = speakingOrder[nextIndex];
        setNextSpeaker(next?.name || `Speaker ${nextIndex + 1}`);
        console.log(`⏭️ Moving to COUNTDOWN for next speaker: ${next?.name || `Speaker ${nextIndex + 1}`}`);
        setDebateState(DEBATE_STATES.COUNTDOWN);
      } else {
        // Final speaker - add 10 second pause before completing
        console.log("🎯 Final speaker done - Adding 10 second final pause before completion");
        setNextSpeaker(null);
        setDebateState(DEBATE_STATES.FINAL_PAUSE);
      }
    } catch (error) {
      console.error("Error calling speaker:", error);
      
      // Use fallback
      const errorMessage = {
        model: speakerName,
        message: `I'll keep it brief. ${topic} needs practical solutions, not partisan games.`,
        affiliation: speakerAffiliation
      };
      
      setCurrentSpeech({
        ...errorMessage,
        position: positions[speakerId] || { top: 50, left: 50 }
      });
      
      setDebateMessages(prev => [...prev, errorMessage]);
      
      // Continue debate despite error
      const nextIndex = currentSpeakerIndex + 1;
      if (nextIndex < speakingOrder.length) {
        const next = speakingOrder[nextIndex];
        setNextSpeaker(next?.name || `Speaker ${nextIndex + 1}`);
        console.log(`⏭️ Moving to COUNTDOWN after error for next speaker: ${next?.name || `Speaker ${nextIndex + 1}`}`);
        setDebateState(DEBATE_STATES.COUNTDOWN);
      } else {
        // Final speaker - add 10 second pause before completing
        console.log("🎯 Final speaker done (after error) - Adding 10 second final pause");
        setNextSpeaker(null);
        setDebateState(DEBATE_STATES.FINAL_PAUSE);
      }
    }
  }, [currentSpeakerIndex, debateMessages, positions, speakingOrder, topic]);

  /**
   * Move to the next speaker
   */
  const moveToNextSpeaker = useCallback(() => {
    const nextIndex = currentSpeakerIndex + 1;
    
    if (nextIndex >= speakingOrder?.length || !speakingOrder) {
      console.log("🏁 No more speakers in moveToNextSpeaker");
      console.log("⭐ DEBATE COMPLETED - setting debateState to COMPLETED from moveToNextSpeaker");
      setDebateState(DEBATE_STATES.COMPLETED);
    } else {
      console.log(`🔄 Moving to next speaker: ${nextIndex + 1}/${speakingOrder.length}`);
      setCurrentSpeakerIndex(nextIndex);
      setDebateState(DEBATE_STATES.SPEAKING);
    }
  }, [currentSpeakerIndex, speakingOrder]);

  /**
   * Start countdown between speakers
   */
  const startCountdown = useCallback((seconds) => {
    // Clear any existing interval
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
    }
    
    console.log(`⏱️ Starting ${seconds} second countdown to next speaker`);
    
    // Set initial value
    setCountdown(seconds);
    
    // Start interval
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

  /**
   * Start final countdown after last speaker
   */
  const startFinalCountdown = useCallback((seconds) => {
    // Clear any existing interval
    if (finalCountdownInterval.current) {
      clearInterval(finalCountdownInterval.current);
    }
    
    console.log(`⏱️ Starting ${seconds} second final countdown before debate completion`);
    
    // Set initial value
    setFinalCountdown(seconds);
    
    // Start interval
    finalCountdownInterval.current = setInterval(() => {
      setFinalCountdown(prev => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(finalCountdownInterval.current);
          finalCountdownInterval.current = null;
          console.log("⭐ DEBATE COMPLETED - Final countdown finished");
          setDebateState(DEBATE_STATES.COMPLETED);
          return null;
        }
        return next;
      });
    }, 1000);
  }, []);

  // Start countdown when in COUNTDOWN state
  useEffect(() => {
    if (debateState === DEBATE_STATES.COUNTDOWN) {
      startCountdown(10);
    }
  }, [debateState, startCountdown]);

  // Start final countdown when in FINAL_PAUSE state
  useEffect(() => {
    if (debateState === DEBATE_STATES.FINAL_PAUSE) {
      startFinalCountdown(10);
    }
  }, [debateState, startFinalCountdown]);

  // Call current speaker when in SPEAKING state
  useEffect(() => {
    if (debateState === DEBATE_STATES.SPEAKING) {
      callCurrentSpeaker();
    }
  }, [debateState, callCurrentSpeaker]);

  // Add explicit logging for state changes
  useEffect(() => {
    console.log(`🔄 Debate state changed to: ${debateState}`);
    // Log isDebateCompleted value whenever debate state changes
    const isCompleted = debateState === DEBATE_STATES.COMPLETED;
    console.log(`🔍 isDebateCompleted value: ${isCompleted}`);
  }, [debateState]);

  return {
    debateState,
    currentSpeaker: speakingOrder[currentSpeakerIndex],
    currentSpeakerIndex,
    speakingOrder,
    currentSpeech,
    countdown: debateState === DEBATE_STATES.FINAL_PAUSE ? finalCountdown : countdown,
    nextSpeaker,
    debateMessages,
    setupSpeakingOrder,
    startDebate,
    isDebateCompleted: debateState === DEBATE_STATES.COMPLETED
  };
}