// src/components/PartyAssigner.js
import React, { useEffect, useState } from 'react';

/**
 * Simple PartyAssigner component that doesn't rely on the hook
 * This eliminates circular dependencies that were causing initialization errors
 */
const PartyAssigner = ({ models, setModels, active, onAssignmentComplete }) => {
  // Component state
  const [isAssigning, setIsAssigning] = useState(false);
  const [hasAssigned, setHasAssigned] = useState(false);
  
  // Start assignment on mount if active
  useEffect(() => {
    if (active && models.length > 0 && !isAssigning && !hasAssigned) {
      console.log("🎲 Starting party assignment");
      
      // Start assignment animation
      setIsAssigning(true);
      
      // Party rotation animation
      const affiliations = ['Republican', 'Democrat', 'Independent'];
      let intervalId = null;
      
      // Start the roulette animation
      intervalId = setInterval(() => {
        setModels(prev => prev.map(m => ({
          ...m,
          affiliation: affiliations[Math.floor(Math.random() * affiliations.length)],
          isFinalized: false
        })));
      }, 100);
      
      // After a short delay, stop and assign final parties
      setTimeout(() => {
        // Stop the animation
        clearInterval(intervalId);
        
        // Create a balanced distribution of parties
        const updatedModels = assignFinalParties(models);
        
        // Update models with finalized parties
        setModels(updatedModels);
        
        // Update state
        setIsAssigning(false);
        setHasAssigned(true);
        
        // Notify parent after a small delay
        setTimeout(() => {
          onAssignmentComplete && onAssignmentComplete(updatedModels);
        }, 50);
      }, 1500);
    }
  }, [active, models.length, isAssigning, hasAssigned, setModels, onAssignmentComplete]);
  
  // Reassign parties manually
  const handleReassign = () => {
    setHasAssigned(false);
    setIsAssigning(false);
  };
  
  /**
   * Simple function to assign parties with no dependencies
   * Guarantees 2 Republicans, 2 Democrats, and rest Independent
   */
  const assignFinalParties = (modelArray) => {
    if (!modelArray || !Array.isArray(modelArray) || modelArray.length === 0) return [];
    
    // Make a copy to avoid mutation
    const models = [...modelArray];
    
    // Shuffle first to get random assignment
    for (let i = models.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [models[i], models[j]] = [models[j], models[i]];
    }
    
    // Fixed party counts for 5 models
    const targetRep = 2;
    const targetDem = 2;
    // Independents fill in the rest
    
    // Assign parties sequentially
    models.forEach((model, index) => {
      if (index < targetRep) {
        model.affiliation = 'Republican';
        model.cssClass = 'republican';
      } else if (index < targetRep + targetDem) {
        model.affiliation = 'Democrat';
        model.cssClass = 'democrat';
      } else {
        model.affiliation = 'Independent';
        model.cssClass = 'independent';
      }
      model.isFinalized = true;
    });
    
    return models;
  };
  
  return (
    <>
      {!isAssigning && !models.every(m => m.isFinalized) && (
        <button
          className="reassign-button"
          onClick={handleReassign}
        >
          Assign Parties
        </button>
      )}
    </>
  );
};

export default PartyAssigner;