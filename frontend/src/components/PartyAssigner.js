// src/components/PartyAssigner.js
import React, { useEffect, useState } from 'react';
import usePartyAssignment from '../hooks/usePartyAssignment';

/**
 * Component to handle party assignment process
 *
 * @param {Object} props
 * @param {Array} props.models - Current models array
 * @param {Function} props.setModels - Function to update models
 * @param {boolean} props.active - Whether the component should be active
 * @param {Function} props.onAssignmentComplete - Callback when assignment is complete
 */
const PartyAssigner = ({ models, setModels, active, onAssignmentComplete }) => {
  const {
    isAssigning,
    startPartyRoulette,
    balancePartyDistribution,
    reassignParties
  } = usePartyAssignment(models, setModels);
  
  // State to track if we've already processed this set of finalized models
  const [hasProcessedFinalizedModels, setHasProcessedFinalizedModels] = useState(false);

  // Start the roulette when component becomes active - ONLY ONCE
  useEffect(() => {
    if (active && models.length > 0 && !isAssigning && !hasProcessedFinalizedModels) {
      console.log("Starting party assignment roulette (initial)");
      startPartyRoulette();
    }
  }, [active, models.length, isAssigning, startPartyRoulette, hasProcessedFinalizedModels]);

  // Clear processed flag when models change or component becomes inactive
  useEffect(() => {
    if (!active || models.some(m => !m.isFinalized)) {
      setHasProcessedFinalizedModels(false);
    }
  }, [active, models]);

  // Process completed assignment ONCE and then call onAssignmentComplete
  useEffect(() => {
    if (models.length > 0 &&
        models.every(m => m.isFinalized) &&
        !isAssigning &&
        !hasProcessedFinalizedModels) {
      
      console.log("Models are finalized, processing once");
      
      // Mark that we've processed these models
      setHasProcessedFinalizedModels(true);
      
      // Apply party balancing
      const balancedModels = balancePartyDistribution(models);
      
      // Only update if there was a change
      const needsUpdate = JSON.stringify(balancedModels) !== JSON.stringify(models);
      if (needsUpdate) {
        console.log("Updating models after balancing");
        setModels(balancedModels);
      }
      
      // Only notify parent once
      console.log("Notifying parent that assignment is complete");
      setTimeout(() => {
        onAssignmentComplete && onAssignmentComplete(balancedModels);
      }, 50);
    }
  }, [
    models,
    isAssigning,
    balancePartyDistribution,
    setModels,
    onAssignmentComplete,
    hasProcessedFinalizedModels
  ]);

  return (
    <>
      {!isAssigning && !models.every(m => m.isFinalized) && (
        <button
          className="reassign-button"
          onClick={reassignParties}
        >
          Assign Parties
        </button>
      )}
      {isAssigning && (
        <div className="assignment-indicator">
          <span>Assigning parties...</span>
        </div>
      )}
    </>
  );
};

export default PartyAssigner;