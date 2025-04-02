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
      
      // We don't need this auto-start logic since DebateScreen handles setup
      // Just set the flag to avoid duplicate starts
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
   * Create a speaking order with a simple and reliable approach
   */
  const setupSpeakingOrder = useCallback(() => {
    // Basic validation
    if (!models || !Array.isArray(models) || models.length === 0) {
      console.warn("⚠️ No models available for speaking order");
      setSpeakingOrder([]);
      return [];
    }
    
    console.log("🎯 Creating optimized speaking order from models:", models.length);
    
    try {
      // Ensure all models have minimum required properties
      const validModels = models.map(model => {
        // Make a safe copy of the model
        const safeModel = {
          ...model,
          id: model.id || Math.random().toString(36).substring(2, 9),
          name: model.name || "Unknown Model",
          affiliation: model.affiliation || "Independent"
        };
        return safeModel;
      });
      
      // Force speaking order in a simple alternating pattern
      // This ensures we avoid complex logic that could fail
      const republicans = validModels.filter(m => m.affiliation === 'Republican');
      const democrats = validModels.filter(m => m.affiliation === 'Democrat');
      const independents = validModels.filter(m => m.affiliation === 'Independent');
      
      console.log(`Party distribution: R=${republicans.length}, D=${democrats.length}, I=${independents.length}`);
      
      // Create new order by taking one from each group in rotation
      const order = [];
      const maxPerParty = Math.max(republicans.length, democrats.length, independents.length);
      
      // Add in alternating fashion: R -> D -> I -> R -> D, etc.
      for (let i = 0; i < maxPerParty; i++) {
        if (i < republicans.length) order.push(republicans[i]);
        if (i < democrats.length) order.push(democrats[i]);
        if (i < independents.length) order.push(independents[i]);
      }
      
      // If no order was created (unlikely), use all models as fallback
      if (order.length === 0) {
        console.warn("⚠️ No speaking order could be created, using all models");
        setSpeakingOrder(validModels);
        setDebateState(DEBATE_STATES.PREPARING);
        return validModels;
      }
      
      // Log success
      console.log("✅ Speaking order created:", order.map(m => `${m.name} (${m.affiliation})`).join(", "));
      
      // Update state
      setSpeakingOrder(order);
      setDebateState(DEBATE_STATES.PREPARING);
      return order;
    } catch (error) {
      // Safety fallback in case of any error
      console.error("❌ Error creating speaking order:", error);
      console.log("Using direct model list as fallback");
      setSpeakingOrder(models);
      setDebateState(DEBATE_STATES.PREPARING);
      return models;
    }
  }, [models]);
  
  /**
   * Start the debate process with robust error handling
   */
  const startDebate = useCallback(() => {
    try {
      // First check if we already have a speaking order
      if (!speakingOrder || !Array.isArray(speakingOrder) || speakingOrder.length === 0) {
        console.warn("⚠️ No speaking order available, creating one now");
        
        // Call setupSpeakingOrder to create a new order
        const newOrder = setupSpeakingOrder();
        
        // If setupSpeakingOrder still couldn't create an order, use models directly
        if (!newOrder || newOrder.length === 0) {
          if (models && models.length > 0) {
            console.log("📌 Using models directly as fallback speaking order");
            
            // Make a safe copy of models with required properties
            const fallbackOrder = models.map(model => ({
              ...model,
              id: model.id || Math.random().toString(36).substring(2, 9),
              name: model.name || "Unknown Model",
              affiliation: model.affiliation || "Independent"
            }));
            
            // Set the order and start the debate
            setSpeakingOrder(fallbackOrder);
            setCurrentSpeakerIndex(0);
            setDebateMessages([]);
            setNextSpeaker(fallbackOrder[0].name);
            setDebateState(DEBATE_STATES.SPEAKING);
            return;
          } else {
            console.error("❌ CRITICAL ERROR: No models available for debate");
            return;
          }
        }
      }
      
      // At this point, we should have a valid speaking order
      console.log("🚀 Starting debate with speakers:", 
        speakingOrder.map(m => `${m.name} (${m.affiliation})`).join(", "));
      
      // Reset debate state
      setCurrentSpeakerIndex(0);
      setDebateMessages([]);
      
      // Safety check for first speaker
      if (speakingOrder && speakingOrder[0]) {
        setNextSpeaker(speakingOrder[0].name);
      } else {
        // This should never happen with our safety measures
        console.error("❌ First speaker is undefined, using fallback");
        setNextSpeaker("First Speaker");
      }
      
      // Start the debate
      setDebateState(DEBATE_STATES.SPEAKING);
      
    } catch (error) {
      // Last resort error handling
      console.error("❌ Error starting debate:", error);
      
      // Try to recover by setting a direct speaking order from models
      if (models && models.length > 0) {
        console.log("🔄 Emergency recovery: using models directly");
        setSpeakingOrder(models);
        setCurrentSpeakerIndex(0);
        setDebateMessages([]);
        setNextSpeaker(models[0].name || "Speaker");
        setDebateState(DEBATE_STATES.SPEAKING);
      }
    }
  }, [speakingOrder, models, setupSpeakingOrder]);
  
  /**
   * Call the current speaker's API to generate a response with robust error handling
   */
  const callCurrentSpeaker = useCallback(async () => {
    try {
      // Validate we have more speakers
      if (!speakingOrder || !Array.isArray(speakingOrder) || currentSpeakerIndex >= speakingOrder.length) {
        console.log("👋 All speakers have spoken, completing debate");
        setDebateState(DEBATE_STATES.COMPLETED);
        return;
      }
      
      // Add a small timeout before API call to ensure UI is ready
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Safety check for speaker validity
      if (!speakingOrder[currentSpeakerIndex]) {
        console.error("❌ Invalid speaker data:", {
          currentSpeakerIndex, 
          speakingOrderLength: speakingOrder?.length,
          speakingOrder: speakingOrder?.map(m => m?.name || 'Unknown')
        });
        
        // Try to recover by moving to completion
        setDebateState(DEBATE_STATES.COMPLETED);
        return;
      }
      
      // Get current speaker safely with defaults
      const speaker = speakingOrder[currentSpeakerIndex];
      const speakerName = speaker.name || `Speaker ${currentSpeakerIndex + 1}`;
      const speakerAffiliation = speaker.affiliation || "Independent";
      const speakerId = speaker.id || `id-${currentSpeakerIndex}`;
      
      console.log(`🎤 Speaker ${currentSpeakerIndex + 1}/${speakingOrder.length}: ${speakerName} (${speakerAffiliation})`);
      
      // Set a temporary placeholder message while API is loading
      setCurrentSpeech({
        model: speakerName,
        message: `The honorable representative from ${speakerAffiliation} is preparing their response...`,
        affiliation: speakerAffiliation,
        position: positions[speakerId] || { top: 50, left: 50 } // Default position if missing
      });
      
      // Prepare previous messages context for the API
      const messagesContext = debateMessages.map(msg => ({
        speaker: msg.model,
        affiliation: msg.affiliation,
        message: msg.message
      }));
      
      // Prepare context as JSON string
      const context = JSON.stringify(messagesContext);
      
      try {
        // Make API call with context of previous messages and proper encoding
        const response = await fetch(
          `/api/llm?model=${encodeURIComponent(speakerName)}&party=${encodeURIComponent(speakerAffiliation)}&topic=${encodeURIComponent(topic)}&context=${encodeURIComponent(context)}`
        );
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Create the chat message with error handling for missing response
        const chatMessage = {
          model: speakerName,
          message: data.response || "No response received. Please try again.",
          affiliation: speakerAffiliation
        };
        
        // Update state with speech and position
        setCurrentSpeech({
          ...chatMessage,
          position: positions[speakerId] || { top: 50, left: 50 }
        });
        
        // Add to debate history
        setDebateMessages(prev => [...prev, chatMessage]);
        
        // Determine if there's a next speaker
        const nextIndex = currentSpeakerIndex + 1;
        if (nextIndex < speakingOrder.length) {
          // Set up next speaker safely
          const next = speakingOrder[nextIndex];
          if (next) {
            setNextSpeaker(next.name || `Speaker ${nextIndex + 1}`);
          } else {
            setNextSpeaker("Next Speaker");
          }
          
          // Move to countdown state
          setDebateState(DEBATE_STATES.COUNTDOWN);
        } else {
          // No next speaker means debate is complete
          setCountdown(null);
          setNextSpeaker(null);
          setDebateState(DEBATE_STATES.COMPLETED);
        }
      } catch (error) {
        console.error("❌ Error calling speaker API:", error);
        
        // Fallback response in case of error
        const errorMessage = {
          model: speakerName,
          message: `I'll keep it short: ${topic} needs practical solutions, not partisan games.`,
          affiliation: speakerAffiliation
        };
        
        setCurrentSpeech({
          ...errorMessage,
          position: positions[speakerId] || { top: 50, left: 50 }
        });
        
        setDebateMessages(prev => [...prev, errorMessage]);
        
        // Continue to next speaker despite error
        const nextIndex = currentSpeakerIndex + 1;
        if (nextIndex < speakingOrder.length) {
          const next = speakingOrder[nextIndex];
          if (next) {
            setNextSpeaker(next.name || `Speaker ${nextIndex + 1}`);
          } else {
            setNextSpeaker("Next Speaker");
          }
          
          // Move to countdown state
          setDebateState(DEBATE_STATES.COUNTDOWN);
        } else {
          setCountdown(null);
          setNextSpeaker(null);
          setDebateState(DEBATE_STATES.COMPLETED);
        }
      }
    } catch (outerError) {
      // Last resort error handling for any exception in the outer function
      console.error("❌ CRITICAL ERROR in callCurrentSpeaker:", outerError);
      
      // Try to recover by moving to the next speaker or completing the debate
      const nextIndex = currentSpeakerIndex + 1;
      if (nextIndex < (speakingOrder?.length || 0)) {
        setCurrentSpeakerIndex(nextIndex);
        setDebateState(DEBATE_STATES.SPEAKING);
      } else {
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