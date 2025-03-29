// src/hooks/usePartyAssignment.js
import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Hook for party assignment that uses the working methodology from original code
 */
const usePartyAssignment = (initialModels, setModels) => {
  const [isAssigning, setIsAssigning] = useState(false);
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
  
  /**
   * Start party assignment - simple roulette like in original working code
   */
  const startPartyRoulette = useCallback(() => {
    console.log("Starting party assignment");
    
    // Don't start if already assigning
    if (isAssigning) return;
    
    // Set assigning state
    setIsAssigning(true);
    
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
      
      // Set final affiliations
      setModels((prev) => {
        const finalModels = prev.map((m) => ({
          ...m,
          affiliation: getRandomAffiliation(),
          isFinalized: true,
        }));
        return finalModels;
      });
      
      // Mark as no longer assigning
      setIsAssigning(false);
    }, 3000);
  }, [setModels, isAssigning]);
  
  /**
   * Balance party distribution
   */
  const balancePartyDistribution = useCallback((models) => {
    if (!models || models.length === 0) return models;
    
    // Only process finalized models
    if (!models.every(m => m.isFinalized)) return models;
    
    // Clone to avoid mutations
    let updatedModels = JSON.parse(JSON.stringify(models));
    
    // Count parties
    const count = {
      Democrat: updatedModels.filter(m => m.affiliation === 'Democrat').length,
      Republican: updatedModels.filter(m => m.affiliation === 'Republican').length,
      Independent: updatedModels.filter(m => m.affiliation === 'Independent').length
    };
    
    // Ensure at least one per party
    const parties = ['Democrat', 'Republican', 'Independent'];
    let changed = false;
    
    parties.forEach(party => {
      if (count[party] === 0) {
        changed = true;
        // Find donor party with most members
        let donor = parties.reduce((max, curr) => 
          count[curr] > count[max] ? curr : max, parties[0]);
        
        // Only donate if has more than 1
        if (count[donor] > 1) {
          // Find and change first model of donor party
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
    
    return changed ? updatedModels : models;
  }, []);
  
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
    
    // Start with small delay
    setTimeout(startPartyRoulette, 50);
  }, [startPartyRoulette]);
  
  return {
    isAssigning,
    startPartyRoulette,
    balancePartyDistribution,
    reassignParties
  };
};

export default usePartyAssignment;