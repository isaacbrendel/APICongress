// src/hooks/useDebateFlow.js
import { useState, useEffect, useCallback, useRef } from 'react';
import logger from '../utils/logger';

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
 * @param {number} controversyLevel - Controversy intensity level (0-100)
 * @param {Object} messageVotes - Vote tracking data { messageId: { vote, affiliation } }
 * @returns {Object} Debate state and controls
 */
export default function useDebateFlow(models, topic, positions, controversyLevel = 100, messageVotes = {}) {
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
  const isPaused = useRef(false);

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
      logger.warn(logger.LogCategory.DEBATE, "No models available for speaking order");
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
    logger.debate("Setting up speaking order", {
      speakerCount: tempOrder.length,
      speakers: tempOrder.map(m => ({ name: m.name, affiliation: m.affiliation }))
    });
    setSpeakingOrder(tempOrder);
    setDebateState(DEBATE_STATES.PREPARING);

    return tempOrder;
  }, [models]);

  /**
   * Simplified debate starter
   */
  const startDebate = useCallback(() => {
    logger.markStart('debate_execution');
    // Create a fresh speaking order every time
    const order = setupSpeakingOrder();

    // No models, can't start
    if (order.length === 0) {
      logger.error(logger.LogCategory.DEBATE, "Cannot start debate: No models available");
      return;
    }

    // Reset state for fresh start
    setCurrentSpeakerIndex(0);
    setDebateMessages([]);

    // Set the first speaker
    const firstSpeaker = order[0] || { name: "Speaker 1" };
    setNextSpeaker(firstSpeaker.name);

    // Start the debate
    logger.success(logger.LogCategory.DEBATE, "DEBATE STARTED - Setting state to SPEAKING", {
      speakerCount: order.length,
      firstSpeaker: firstSpeaker.name
    });
    setDebateState(DEBATE_STATES.SPEAKING);
  }, [setupSpeakingOrder]);

  /**
   * Call the current speaker's API to generate a response
   */
  const callCurrentSpeaker = useCallback(async () => {
    // Guard against invalid speaking order or index
    if (!speakingOrder || speakingOrder.length === 0 || currentSpeakerIndex >= speakingOrder.length) {
      logger.success(logger.LogCategory.DEBATE, "No more speakers, debate completed");
      const totalDuration = logger.markEnd('debate_execution');
      logger.success(logger.LogCategory.DEBATE, "DEBATE COMPLETED", {
        totalDuration: `${totalDuration}ms`,
        totalSpeakers: speakingOrder?.length || 0
      });
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

    logger.speakerAction('starting speech', speakerName, {
      speakerIndex: currentSpeakerIndex + 1,
      totalSpeakers: speakingOrder.length,
      affiliation: speakerAffiliation
    });
    
    try {
      // Prepare context
      const messagesContext = debateMessages.map(msg => ({
        speaker: msg.model,
        affiliation: msg.affiliation,
        message: msg.message
      }));
      
      const context = JSON.stringify(messagesContext);

      // Calculate feedback stats for the current party
      const partyVotes = Object.values(messageVotes).filter(v => v.affiliation === speakerAffiliation);
      const upvotes = partyVotes.filter(v => v.vote === 'up').length;
      const downvotes = partyVotes.filter(v => v.vote === 'down').length;
      const feedbackData = JSON.stringify({ recentVotes: { upvotes, downvotes } });

      logger.markStart(`speech_gen_${speakerName}`);
      logger.apiRequest('/api/llm', 'GET', {
        speaker: speakerName,
        affiliation: speakerAffiliation,
        feedbackStats: { upvotes, downvotes }
      });

      // Make API call with controversy level and feedback
      const response = await fetch(
        `/api/llm?model=${encodeURIComponent(speakerName)}&party=${encodeURIComponent(speakerAffiliation)}&topic=${encodeURIComponent(topic)}&context=${encodeURIComponent(context)}&controversyLevel=${controversyLevel}&feedback=${encodeURIComponent(feedbackData)}`
      );

      const duration = logger.markEnd(`speech_gen_${speakerName}`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      logger.apiResponse('/api/llm', response.status, duration, {
        speaker: speakerName,
        responseLength: data.response?.length
      });
      
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
        logger.debate("Moving to COUNTDOWN for next speaker", {
          nextSpeaker: next?.name,
          remainingSpeakers: speakingOrder.length - nextIndex
        });
        setDebateState(DEBATE_STATES.COUNTDOWN);
      } else {
        // Final speaker - add 10 second pause before completing
        logger.debate("Final speaker done - Adding 10 second final pause before completion");
        setNextSpeaker(null);
        setDebateState(DEBATE_STATES.FINAL_PAUSE);
      }
    } catch (error) {
      logger.error(logger.LogCategory.DEBATE, "Error calling speaker", {
        speaker: speakerName,
        error: error.message
      });
      
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
        logger.debate("Moving to COUNTDOWN after error for next speaker", {
          nextSpeaker: next?.name
        });
        setDebateState(DEBATE_STATES.COUNTDOWN);
      } else {
        // Final speaker - add 10 second pause before completing
        logger.debate("Final speaker done (after error) - Adding 10 second final pause");
        setNextSpeaker(null);
        setDebateState(DEBATE_STATES.FINAL_PAUSE);
      }
    }
  }, [currentSpeakerIndex, debateMessages, positions, speakingOrder, topic, controversyLevel, messageVotes]);

  /**
   * Move to the next speaker
   */
  const moveToNextSpeaker = useCallback(() => {
    const nextIndex = currentSpeakerIndex + 1;

    if (nextIndex >= speakingOrder?.length || !speakingOrder) {
      logger.debate("No more speakers in moveToNextSpeaker");
      logger.success(logger.LogCategory.DEBATE, "DEBATE COMPLETED - from moveToNextSpeaker");
      setDebateState(DEBATE_STATES.COMPLETED);
    } else {
      logger.debate(`Moving to next speaker: ${nextIndex + 1}/${speakingOrder.length}`, {
        nextSpeaker: speakingOrder[nextIndex]?.name
      });
      setCurrentSpeakerIndex(nextIndex);
      setDebateState(DEBATE_STATES.SPEAKING);
    }
  }, [currentSpeakerIndex, speakingOrder]);

  /**
   * Pause the countdown timer
   */
  const pauseCountdown = useCallback(() => {
    isPaused.current = true;
    logger.ui('Countdown paused');
  }, []);

  /**
   * Resume the countdown timer
   */
  const resumeCountdown = useCallback(() => {
    isPaused.current = false;
    logger.ui('Countdown resumed');
  }, []);

  /**
   * Skip countdown and move to next speaker immediately
   */
  const skipCountdown = useCallback(() => {
    logger.user('Fast-forward: Skipping countdown');

    // Clear any active countdown
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
      countdownInterval.current = null;
    }
    if (finalCountdownInterval.current) {
      clearInterval(finalCountdownInterval.current);
      finalCountdownInterval.current = null;
    }

    // Reset countdown states
    setCountdown(null);
    setFinalCountdown(null);

    // Move to next speaker or complete debate
    if (debateState === DEBATE_STATES.COUNTDOWN) {
      moveToNextSpeaker();
    } else if (debateState === DEBATE_STATES.FINAL_PAUSE) {
      logger.user('Fast-forward: Completing debate immediately');
      setDebateState(DEBATE_STATES.COMPLETED);
    }
  }, [debateState, moveToNextSpeaker]);

  /**
   * Start countdown between speakers
   */
  const startCountdown = useCallback((seconds) => {
    // Clear any existing interval
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
    }

    // Reset pause state
    isPaused.current = false;

    logger.debate(`Starting ${seconds} second countdown to next speaker`);

    // Set initial value
    setCountdown(seconds);

    // Start interval
    countdownInterval.current = setInterval(() => {
      // Only decrement if not paused
      if (!isPaused.current) {
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
      }
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

    logger.debate(`Starting ${seconds} second final countdown before debate completion`);
    
    // Set initial value
    setFinalCountdown(seconds);
    
    // Start interval
    finalCountdownInterval.current = setInterval(() => {
      setFinalCountdown(prev => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(finalCountdownInterval.current);
          finalCountdownInterval.current = null;
          logger.success(logger.LogCategory.DEBATE, "DEBATE COMPLETED - Final countdown finished");
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
    const isCompleted = debateState === DEBATE_STATES.COMPLETED;
    logger.debateStateChange('previous_state', debateState, {
      isCompleted,
      currentSpeakerIndex,
      totalSpeakers: speakingOrder?.length || 0
    });
  }, [debateState, currentSpeakerIndex, speakingOrder]);

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
    isDebateCompleted: debateState === DEBATE_STATES.COMPLETED,
    pauseCountdown,
    resumeCountdown,
    skipCountdown
  };
}