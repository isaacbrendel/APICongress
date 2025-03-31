// src/components/DebateStatusIndicator.js
import React from 'react';
import './DebateStatusIndicator.css';

/**
 * Visual indicator for debate flow state
 * Helps with debugging and provides user feedback
 */
const DebateStatusIndicator = ({ 
  debateState,
  currentSpeakerIndex,
  totalSpeakers,
  currentSpeaker
}) => {
  // Map debate states to user-friendly labels
  const getStateLabel = () => {
    switch (debateState) {
      case 'idle':
        return 'Waiting to Begin';
      case 'preparing':
        return 'Preparing Debate';
      case 'speaking':
        return 'Speaking';
      case 'countdown':
        return 'Next Speaker Soon';
      case 'completed':
        return 'Debate Completed';
      default:
        return 'Unknown State';
    }
  };
  
  // Only show during active debate (hide during voting, etc.)
  if (debateState === 'completed') return null;
  
  return (
    <div className="debate-status-indicator">
      <div className="status-label">
        {getStateLabel()}
      </div>
      {currentSpeaker && (
        <div className="speaker-info">
          <span className="speaker-count">
            Speaker {currentSpeakerIndex + 1} of {totalSpeakers}
          </span>
          <span className="speaker-name">
            {currentSpeaker.name} 
            <span className={`speaker-party ${currentSpeaker.affiliation}`}>
              ({currentSpeaker.affiliation})
            </span>
          </span>
        </div>
      )}
    </div>
  );
};

export default DebateStatusIndicator;