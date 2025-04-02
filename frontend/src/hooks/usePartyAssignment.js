// src/hooks/usePartyAssignment.js
import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Hook for party assignment with simplified logic to prevent circular dependencies
 */
const usePartyAssignment = (initialModels, setModels) => {
  // Basic state
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignmentComplete, setAssignmentComplete] = useState(false);
  
  // Refs for timers
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  
  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);
  
  /**
   * Assign models to parties with fixed distribution:
   * - 2 Republicans, 2 Democrats, 1 Independent (for 5 models)
   * - Scaled appropriately for fewer models
   */
  const assignParties = useCallback((models) => {
    if (!models || models.length === 0) return [];
    
    console.log("Assigning parties to models:", models.length);
    
    // Clone models to avoid mutation issues
    const updatedModels = [...models];
    
    // Define target counts based on total models
    let repubCount = 2; // Default for 5 models
    let demoCount = 2;  // Default for 5 models
    
    // Adjust for different group sizes
    if (models.length === 4) {
      repubCount = 2;
      demoCount = 2;
    } else if (models.length === 3) {
      repubCount = 1;
      demoCount = 1;
    } else if (models.length === 2) {
      repubCount = 1;
      demoCount = 1;
    } else if (models.length === 1) {
      repubCount = 1;
      demoCount = 0;
    }
    
    // Calculate independents
    const indepCount = models.length - repubCount - demoCount;
    
    // Shuffling the array to create random assignment
    for (let i = updatedModels.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [updatedModels[i], updatedModels[j]] = [updatedModels[j], updatedModels[i]];
    }
    
    // Assign parties sequentially
    let assigned = 0;
    
    // First assign Republicans
    for (let i = 0; i < repubCount; i++) {
      if (assigned < updatedModels.length) {
        updatedModels[assigned].affiliation = 'Republican';
        updatedModels[assigned].cssClass = 'republican';
        updatedModels[assigned].isFinalized = true;
        assigned++;
      }
    }
    
    // Then assign Democrats
    for (let i = 0; i < demoCount; i++) {
      if (assigned < updatedModels.length) {
        updatedModels[assigned].affiliation = 'Democrat';
        updatedModels[assigned].cssClass = 'democrat';
        updatedModels[assigned].isFinalized = true;
        assigned++;
      }
    }
    
    // Then assign Independents
    for (let i = 0; i < indepCount; i++) {
      if (assigned < updatedModels.length) {
        updatedModels[assigned].affiliation = 'Independent';
        updatedModels[assigned].cssClass = 'independent';
        updatedModels[assigned].isFinalized = true;
        assigned++;
      }
    }
    
    // Logging assignment
    const counts = {
      republican: updatedModels.filter(m => m.affiliation === 'Republican').length,
      democrat: updatedModels.filter(m => m.affiliation === 'Democrat').length,
      independent: updatedModels.filter(m => m.affiliation === 'Independent').length
    };
    
    console.log(`Assigned parties: R=${counts.republican}, D=${counts.democrat}, I=${counts.independent}`);
    return updatedModels;
  }, []);
  
  /**
   * Start party assignment roulette animation
   */
  const startPartyRoulette = useCallback(() => {
    console.log("Starting party assignment roulette");
    
    // Don't restart if already assigning
    if (isAssigning) return;
    
    // Reset state
    setIsAssigning(true);
    setAssignmentComplete(false);
    
    // Define options for roulette
    const affiliations = ['Republican', 'Democrat', 'Independent'];
    const getRandomAffiliation = () => 
      affiliations[Math.floor(Math.random() * affiliations.length)];
    
    // Clear any existing timers
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    // Start cycling through affiliations
    intervalRef.current = setInterval(() => {
      setModels(prev => prev.map(m => ({
        ...m,
        affiliation: getRandomAffiliation(),
        isFinalized: false
      })));
    }, 100);
    
    // Stop roulette after a delay and set final parties
    timeoutRef.current = setTimeout(() => {
      // Stop cycling
      clearInterval(intervalRef.current);
      
      // Get fresh models to ensure we work with latest state
      setModels(prev => {
        const finalModels = assignParties(prev);
        return finalModels;
      });
      
      // Update state
      setIsAssigning(false);
      setAssignmentComplete(true);
    }, 1500);
  }, [setModels, isAssigning, assignParties]);
  
  /**
   * Apply balanced party distribution
   */
  const balancePartyDistribution = useCallback((models) => {
    return assignParties(models);
  }, [assignParties]);
  
  /**
   * Trigger party reassignment
   */
  const reassignParties = useCallback(() => {
    // Clean up any existing timers
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    // Reset state
    setIsAssigning(false);
    setAssignmentComplete(false);
    
    // Start with a small delay
    setTimeout(startPartyRoulette, 50);
  }, [startPartyRoulette]);
  
  /**
   * Auto-assign parties when models first become available
   */
  useEffect(() => {
    if (initialModels && initialModels.length > 0 && !assignmentComplete && !isAssigning) {
      console.log("Auto-assigning parties to initial models");
      const balancedModels = assignParties(initialModels);
      setModels(balancedModels);
      setAssignmentComplete(true);
    }
  }, [initialModels, assignParties, assignmentComplete, isAssigning, setModels]);
  
  return {
    isAssigning,
    assignmentComplete,
    startPartyRoulette,
    balancePartyDistribution,
    reassignParties,
    // For backward compatibility
    enforcePartyConstraints: assignParties
  };
};

export default usePartyAssignment;