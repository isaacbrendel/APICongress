import React, { useState } from 'react';
import './ArgumentVoting.css';

/**
 * ARGUMENT VOTING - REINFORCEMENT LEARNING INTERFACE
 *
 * Every vote IMMEDIATELY affects AI behavior:
 * - Upvotes reinforce successful argument patterns
 * - Downvotes discourage ineffective approaches
 * - Real-time feedback loop shapes agent evolution
 */
const ArgumentVoting = ({ argumentId, agentId, agentName, onVote, currentVote }) => {
  const [voted, setVoted] = useState(currentVote || null);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleVote = async (voteType) => {
    // Toggle vote if clicking same button
    const newVote = voted === voteType ? null : voteType;

    setVoted(newVote);
    setShowFeedback(true);

    // Call parent handler to process vote
    await onVote(argumentId, agentId, newVote);

    // Hide feedback after animation
    setTimeout(() => {
      setShowFeedback(false);
    }, 2000);
  };

  return (
    <div className="argument-voting">
      <button
        className={`vote-button upvote ${voted === 'up' ? 'active' : ''}`}
        onClick={() => handleVote('up')}
        title="This argument is compelling - reinforce this style"
      >
        <span className="vote-icon">👍</span>
        <span className="vote-label">Reinforce</span>
      </button>

      <button
        className={`vote-button downvote ${voted === 'down' ? 'active' : ''}`}
        onClick={() => handleVote('down')}
        title="This argument is weak - discourage this approach"
      >
        <span className="vote-icon">👎</span>
        <span className="vote-label">Discourage</span>
      </button>

      {/* Real-time Feedback */}
      {showFeedback && voted && (
        <div className={`vote-feedback ${voted}`}>
          <div className="feedback-icon">
            {voted === 'up' ? '✓' : '✗'}
          </div>
          <div className="feedback-text">
            {voted === 'up'
              ? `${agentName} will use more of this style!`
              : `${agentName} will adapt their approach!`
            }
          </div>
          <div className="feedback-subtext">
            {voted === 'up'
              ? 'Reinforcing successful patterns...'
              : 'Learning from feedback...'
            }
          </div>
        </div>
      )}
    </div>
  );
};

export default ArgumentVoting;
