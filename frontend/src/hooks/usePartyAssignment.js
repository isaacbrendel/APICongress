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
    
    // Randomly assign parties to ensure different assignments each time
    // First, shuffle the models array to randomize the order
    const shuffledModels = [...updatedModels].sort(() => Math.random() - 0.5);
    
    // Keep Cohere as Independent if available (it works best as Independent)
    const cohereModel = shuffledModels.find(m => m.name === 'Cohere');
    if (cohereModel && targetInd > 0) {
      cohereModel.affiliation = 'Independent';
      shuffledModels.splice(shuffledModels.indexOf(cohereModel), 1);
    } else {
      // No special handling for Cohere
    }
    
    // Track counts
    let currentRep = 0;
    let currentDem = 0;
    let currentInd = cohereModel && cohereModel.affiliation === 'Independent' ? 1 : 0;
    
    // Randomly assign remaining models
    for (const model of shuffledModels) {
      // If this model already has an affiliation, skip it
      if (model.affiliation) continue;
      
      // Randomly select a party based on what we still need
      const availableParties = [];
      if (currentRep < targetRep) availableParties.push('Republican');
      if (currentDem < targetDem) availableParties.push('Democrat');
      if (currentInd < targetInd) availableParties.push('Independent');
      
      // If no parties are available, default to Independent
      if (availableParties.length === 0) {
        model.affiliation = 'Independent';
        currentInd++;
        continue;
      }
      
      // Randomly select from available parties
      const randomParty = availableParties[Math.floor(Math.random() * availableParties.length)];
      model.affiliation = randomParty;
      
      // Update counts
      if (randomParty === 'Republican') currentRep++;
      else if (randomParty === 'Democrat') currentDem++;
      else currentInd++;
    }
    
    // Double-check if we need to make adjustments to meet targets
    // (this shouldn't happen, but just in case)
    if (currentRep < targetRep || currentDem < targetDem) {
      const needMoreRep = targetRep - currentRep;
      const needMoreDem = targetDem - currentDem;
      
      // Find Independent models that can be reassigned
      const indModels = updatedModels.filter(m => m.affiliation === 'Independent');
      
      // Assign to Republican if needed
      for (let i = 0; i < needMoreRep && i < indModels.length; i++) {
        indModels[i].affiliation = 'Republican';
        currentRep++;
        currentInd--;
      }
      
      // Assign to Democrat if needed
      for (let i = 0; i < needMoreDem && i < indModels.length - needMoreRep; i++) {
        indModels[needMoreRep + i].affiliation = 'Democrat';
        currentDem++;
        currentInd--;
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