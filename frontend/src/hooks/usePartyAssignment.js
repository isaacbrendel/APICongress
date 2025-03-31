// src/hooks/usePartyAssignment.js
import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Hook for party assignment with guaranteed constraints:
 * - 2 Republicans
 * - 2 Democrats
 * - 1 Independent (for 5 models)
 */
const usePartyAssignment = (initialModels, setModels) => {
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignmentComplete, setAssignmentComplete] = useState(false);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  
  // Clear intervals/timeouts on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);
  
  // Auto-assign parties when models are available
  useEffect(() => {
    if (initialModels && initialModels.length > 0 && !assignmentComplete) {
      // Apply balanced constraints immediately
      const balancedModels = enforcePartyConstraints(initialModels);
      setModels(balancedModels);
      setAssignmentComplete(true);
    }
  }, [initialModels]);
  
  /**
   * Start party assignment - simple roulette animation
   */
  const startPartyRoulette = useCallback(() => {
    console.log("Starting party assignment");
    
    // Don't start if already assigning
    if (isAssigning) return;
    
    // Set assigning state
    setIsAssigning(true);
    setAssignmentComplete(false);
    
    // Define party options
    const affiliations = ['Republican', 'Democrat', 'Independent'];
    const getRandomAffiliation = () =>
      affiliations[Math.floor(Math.random() * affiliations.length)];
    
    // Clear any existing interval/timeout
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Set up interval for affiliation cycling - just like original code
    intervalRef.current = setInterval(() => {
      setModels((prev) =>
        prev.map((m) => ({
          ...m,
          affiliation: getRandomAffiliation(),
          isFinalized: false,
        }))
      );
    }, 100);
    
    // Set timeout to end the roulette
    timeoutRef.current = setTimeout(() => {
      // Clear the interval
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      
      // Set final, properly balanced affiliations
      setModels((prev) => {
        // Apply balanced distribution
        const balancedModels = enforcePartyConstraints(prev);
        return balancedModels;
      });
      
      // Mark as no longer assigning and assignment as complete
      setIsAssigning(false);
      setAssignmentComplete(true);
    }, 1500); // Reduced time for faster animation
  }, [setModels, isAssigning]);
  
  /**
   * Apply strict party distribution rules:
   * - Exactly 2 Republicans
   * - Exactly 2 Democrats
   * - Remaining as Independents
   */
  const enforcePartyConstraints = useCallback((models) => {
    if (!models || models.length === 0) return models;
    
    console.log("Enforcing party constraints");
    
    // Clone to avoid mutations
    const updatedModels = JSON.parse(JSON.stringify(models));
    
    // Define target counts based on total models
    let targetRep = 2;
    let targetDem = 2;
    
    // Adjust for smaller groups
    if (models.length < 5) {
      if (models.length === 4) {
        targetRep = 2;
        targetDem = 2;
      } else if (models.length === 3) {
        targetRep = 1;
        targetDem = 1;
      } else if (models.length === 2) {
        targetRep = 1;
        targetDem = 1;
      } else { // just one model
        targetRep = 1;
        targetDem = 0;
      }
    }
    
    // Calculate target Independent count
    const targetInd = updatedModels.length - targetRep - targetDem;
    
    // First reset all affiliations
    updatedModels.forEach(model => {
      model.affiliation = '';
    });
    
    // We'll use a preference map - some models have natural affiliations
    const preferredAffiliations = {
      'ChatGPT': 'Democrat',
      'Claude': 'Democrat',
      'Gemini': 'Republican',
      'Grok': 'Republican',
      'Cohere': 'Independent'
    };
    
    // Apply preferred affiliations first (up to targets)
    let currentRep = 0;
    let currentDem = 0;
    let currentInd = 0;
    
    // Process models in order of preference first
    for (const model of updatedModels) {
      const preferred = preferredAffiliations[model.name];
      
      if (preferred === 'Republican' && currentRep < targetRep) {
        model.affiliation = 'Republican';
        currentRep++;
      } else if (preferred === 'Democrat' && currentDem < targetDem) {
        model.affiliation = 'Democrat';
        currentDem++;
      } else if (preferred === 'Independent' && currentInd < targetInd) {
        model.affiliation = 'Independent';
        currentInd++;
      }
    }
    
    // Now fill in the remaining unassigned models
    for (const model of updatedModels) {
      if (!model.affiliation) {
        if (currentRep < targetRep) {
          model.affiliation = 'Republican';
          currentRep++;
        } else if (currentDem < targetDem) {
          model.affiliation = 'Democrat';
          currentDem++;
        } else {
          model.affiliation = 'Independent';
          currentInd++;
        }
      }
    }
    
    // Ensure all models are finalized
    updatedModels.forEach(model => {
      model.isFinalized = true;
    });
    
    console.log(`Final party distribution - Rep: ${currentRep}, Dem: ${currentDem}, Ind: ${currentInd}`);
    return updatedModels;
  }, []);
  
  /**
   * Balance distribution to ensure each party has at least one member
   */
  const balancePartyDistribution = useCallback((models) => {
    if (!models || models.length === 0) return models;
    
    // Just apply our strict constraints
    return enforcePartyConstraints(models);
  }, [enforcePartyConstraints]);
  
  /**
   * Request manual reassignment
   */
  const reassignParties = useCallback(() => {
    // Clean up existing timers
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Reset state
    setIsAssigning(false);
    setAssignmentComplete(false);
    
    // Start with small delay
    setTimeout(startPartyRoulette, 50);
  }, [startPartyRoulette]);
  
  return {
    isAssigning,
    assignmentComplete,
    startPartyRoulette,
    balancePartyDistribution,
    reassignParties,
    enforcePartyConstraints
  };
};

export default usePartyAssignment;