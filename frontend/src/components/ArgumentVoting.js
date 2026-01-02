import React, { useState } from 'react';
import './ArgumentVoting.css';

/**
 * SIMPLE VOTING - Thumbs up or down
 */
const ArgumentVoting = ({ argumentId, agentId, agentName, onVote }) => {
  const [voted, setVoted] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleVote = async (voteType) => {
    if (processing) return;

    setProcessing(true);
    setVoted(voteType);

    // Call backend
    try {
      await onVote(argumentId, agentId, voteType);
      console.log(`✓ Voted ${voteType} on argument by ${agentName}`);
    } catch (error) {
      console.error('Vote failed:', error);
    }

    setProcessing(false);
  };

  return (
    <div className="argument-voting">
      <button
        className={`vote-btn ${voted === 'up' ? 'voted' : ''}`}
        onClick={() => handleVote('up')}
        disabled={processing}
      >
        👍 Good
      </button>

      <button
        className={`vote-btn ${voted === 'down' ? 'voted' : ''}`}
        onClick={() => handleVote('down')}
        disabled={processing}
      >
        👎 Bad
      </button>

      {voted && (
        <span className="vote-status">
          {voted === 'up' ? '✓ Reinforcing' : '✗ Adapting'}
        </span>
      )}
    </div>
  );
};

export default ArgumentVoting;
