import React, { useState } from 'react';
import './VotingInterface.css';

/**
 * MINIMAL CLEAN VOTING INTERFACE
 * Pick a winner. That's it.
 */
const VotingInterface = ({ debateMessages, onVoteSubmit, onNewDebate }) => {
  const [selected, setSelected] = useState(null);

  // Count messages by party
  const counts = debateMessages.reduce((acc, msg) => {
    acc[msg.affiliation] = (acc[msg.affiliation] || 0) + 1;
    return acc;
  }, {});

  const parties = ['Democrat', 'Republican', 'Independent'].filter(p => counts[p]);

  const handleSelect = (party) => {
    setSelected(party);
    // Auto-submit after selection
    setTimeout(() => onVoteSubmit(party), 400);
  };

  return (
    <div className="voting-interface">
      <div className="voting-content">
        <h2 className="voting-title">Who won?</h2>

        <div className="party-options">
          {parties.map(party => (
            <button
              key={party}
              className={`party-option ${party.toLowerCase()} ${selected === party ? 'selected' : ''}`}
              onClick={() => handleSelect(party)}
            >
              <span className="party-name">{party}</span>
              <span className="party-count">{counts[party]} messages</span>
            </button>
          ))}
        </div>

        <button className="new-debate-btn" onClick={onNewDebate}>
          Start Over
        </button>
      </div>
    </div>
  );
};

export default VotingInterface;
