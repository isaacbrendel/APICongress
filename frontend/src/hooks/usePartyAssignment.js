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
      console.log("Auto-applying party constraints to initial models");
      // Apply balanced constraints immediately
      const balancedModels = enforcePartyConstraints(initialModels);
      
      // Verify distribution
      const dems = balancedModels.filter(m => m.affiliation === 'Democrat').length;
      const reps = balancedModels.filter(m => m.affiliation === 'Republican').length;
      const inds = balancedModels.filter(m => m.affiliation === 'Independent').length;
      console.log(`Initial party distribution: D=${dems}, R=${reps}, I=${inds}`);
      
      // Only update if correct distribution achieved
      if ((dems === 2 && reps === 2 && inds === 1) || initialModels.length < 5) {
        setModels(balancedModels);
        setAssignmentComplete(true);
      } else {
        console.warn("Invalid party distribution, will retry");
        // Retry with deterministic assignment
        const fixedModels = [...initialModels];
        for (let i = 0; i < fixedModels.length; i++) {
          if (i < 2) {
            fixedModels[i].affiliation = 'Republican';
          } else if (i < 4) {
            fixedModels[i].affiliation = 'Democrat';
          } else {
            fixedModels[i].affiliation = 'Independent';
          }
          fixedModels[i].isFinalized = true;
        }
        setModels(fixedModels);
        setAssignmentComplete(true);
      }
    }
  }, [initialModels, enforcePartyConstraints]);
  
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
   * Apply strict party distribution rules with randomization:
   * - Exactly 2 Republicans
   * - Exactly 2 Democrats
   * - Remaining as Independents (usually 1 for 5 models)
   */
  const enforcePartyConstraints = useCallback((models) => {
    if (!models || models.length === 0) return models;
    
    console.log("Enforcing party constraints with randomization");
    
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
    
    // Shuffle the models array to randomize the order
    const shuffledModels = [...updatedModels];
    for (let i = shuffledModels.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledModels[i], shuffledModels[j]] = [shuffledModels[j], shuffledModels[i]];
    }
    
    // Keep Cohere as Independent if available (it works best as Independent)
    const cohereModel = shuffledModels.find(m => m.name === 'Cohere');
    if (cohereModel && targetInd > 0) {
      cohereModel.affiliation = 'Independent';
      // Remove from array to avoid reassigning
      const cohereIndex = shuffledModels.findIndex(m => m.id === cohereModel.id);
      if (cohereIndex !== -1) {
        shuffledModels.splice(cohereIndex, 1);
      }
    }
    
    // Track counts
    let currentRep = 0;
    let currentDem = 0;
    let currentInd = cohereModel && cohereModel.affiliation === 'Independent' ? 1 : 0;
    
    // Hard enforce the distribution - first Republicans
    for (let i = 0; i < targetRep && i < shuffledModels.length; i++) {
      if (shuffledModels[i].affiliation === '') {
        shuffledModels[i].affiliation = 'Republican';
        currentRep++;
      }
    }
    
    // Then Democrats
    for (let i = targetRep; i < targetRep + targetDem && i < shuffledModels.length; i++) {
      if (shuffledModels[i].affiliation === '') {
        shuffledModels[i].affiliation = 'Democrat';
        currentDem++;
      }
    }
    
    // Then Independent for remaining
    for (let i = targetRep + targetDem; i < shuffledModels.length; i++) {
      if (shuffledModels[i].affiliation === '') {
        shuffledModels[i].affiliation = 'Independent';
        currentInd++;
      }
    }
    
    // Double-check if we need to make adjustments to meet targets
    if (currentRep < targetRep || currentDem < targetDem || currentInd < targetInd) {
      console.log(`Party distribution not met, adjusting. Current: R=${currentRep}, D=${currentDem}, I=${currentInd}. Target: R=${targetRep}, D=${targetDem}, I=${targetInd}`);
      
      // Reset affiliations and distribute deterministically
      updatedModels.forEach(model => {
        model.affiliation = '';
      });
      
      // Shuffle again for a different order but deterministic assignment
      const reShuffled = [...updatedModels];
      for (let i = reShuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [reShuffled[i], reShuffled[j]] = [reShuffled[j], reShuffled[i]];
      }
      
      // Assign EXACTLY 2 Republicans, 2 Democrats, and remaining as Independents
      for (let i = 0; i < reShuffled.length; i++) {
        if (i < targetRep) {
          reShuffled[i].affiliation = 'Republican';
        } else if (i < targetRep + targetDem) {
          reShuffled[i].affiliation = 'Democrat';
        } else {
          reShuffled[i].affiliation = 'Independent';
        }
      }
      
      // Update counts for logging
      currentRep = targetRep;
      currentDem = targetDem;
      currentInd = targetInd;
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