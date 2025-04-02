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
  
  // Helper function inside the hook to avoid dependency issues
  const applyPartyConstraints = useCallback((models) => {
    if (!models || models.length === 0) return models;
    
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
    
    // Create a copy of the models
    const updatedModels = JSON.parse(JSON.stringify(models));
    
    // Force specific assignment
    for (let i = 0; i < updatedModels.length; i++) {
      if (i < targetRep) {
        updatedModels[i].affiliation = 'Republican';
      } else if (i < targetRep + targetDem) {
        updatedModels[i].affiliation = 'Democrat';
      } else {
        updatedModels[i].affiliation = 'Independent';
      }
      updatedModels[i].isFinalized = true;
    }
    
    return updatedModels;
  }, []);

  // Auto-assign parties when models are available
  useEffect(() => {
    if (initialModels && initialModels.length > 0 && !assignmentComplete) {
      console.log("Auto-applying party constraints to initial models");
      
      // Apply balanced constraints immediately (using local function to avoid circular dependency)
      const balancedModels = applyPartyConstraints(initialModels);
      
      // Verify distribution
      const dems = balancedModels.filter(m => m.affiliation === 'Democrat').length;
      const reps = balancedModels.filter(m => m.affiliation === 'Republican').length;
      const inds = balancedModels.filter(m => m.affiliation === 'Independent').length;
      console.log(`Initial party distribution: D=${dems}, R=${reps}, I=${inds}`);
      
      // Always update with the balanced models
      setModels(balancedModels);
      setAssignmentComplete(true);
    }
  }, [initialModels, applyPartyConstraints, assignmentComplete, setModels]);
  
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
        const balancedModels = applyPartyConstraints(prev);
        return balancedModels;
      });
      
      // Mark as no longer assigning and assignment as complete
      setIsAssigning(false);
      setAssignmentComplete(true);
    }, 1500); // Reduced time for faster animation
  }, [setModels, isAssigning]);
  
  /**
   * Apply strict party distribution rules with randomization:
   * - Exactly 2 Republicans
   * - Exactly 2 Democrats
   * - Remaining as Independents (usually 1 for 5 models)
   */
  const enforcePartyConstraints = useCallback((models) => {
    console.log("⚠️ ENFORCING PARTY CONSTRAINTS");
    if (!models || models.length === 0) return models;
    
    // Just delegate to the applyPartyConstraints function to avoid duplication
    return applyPartyConstraints(models);
  }, [applyPartyConstraints]);
  
  /**
   * Balance distribution to ensure each party has at least one member
   */
  const balancePartyDistribution = useCallback((models) => {
    if (!models || models.length === 0) return models;
    
    // Just apply our strict constraints
    return applyPartyConstraints(models);
  }, [applyPartyConstraints]);
  
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