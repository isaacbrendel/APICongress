import React, { useState } from 'react';
import './ArgumentVoting.css';

const ArgumentVoting = ({ argumentId, agentId, agentName, onVote }) => {
  const [voted, setVoted] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleVote = async (voteType) => {
    // Toggle off if same vote
    if (voted === voteType) {
      setVoted(null);
      setFeedback(null);
      return;
    }

    if (processing) return;

    setProcessing(true);

    try {
      const response = await onVote(argumentId, agentId, voteType);

      setVoted(voteType);
      setFeedback({
        success: true,
        influence: response?.influenceChange || 0,
        approval: response?.approvalRate || 'N/A'
      });

      // Clear feedback after delay
      setTimeout(() => setFeedback(null), 3000);

    } catch (error) {
      setFeedback({
        success: false,
        message: 'Vote failed'
      });
      setTimeout(() => setFeedback(null), 3000);
    }

    setProcessing(false);
  };

  return (
    <div className="voting">
      <div className="vote-buttons">
        <button
          className={`vote-btn vote-up ${voted === 'up' ? 'active' : ''} ${processing ? 'disabled' : ''}`}
          onClick={() => handleVote('up')}
          disabled={processing}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
          <span>{voted === 'up' ? 'Upvoted' : 'Upvote'}</span>
        </button>

        <button
          className={`vote-btn vote-down ${voted === 'down' ? 'active' : ''} ${processing ? 'disabled' : ''}`}
          onClick={() => handleVote('down')}
          disabled={processing}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
          <span>{voted === 'down' ? 'Downvoted' : 'Downvote'}</span>
        </button>
      </div>

      {processing && (
        <div className="vote-status processing">
          Recording...
        </div>
      )}

      {feedback && (
        <div className={`vote-status ${feedback.success ? 'success' : 'error'}`}>
          {feedback.success ? (
            <span>
              Vote recorded
              {feedback.influence !== 0 && (
                <span className="influence">
                  {feedback.influence > 0 ? '+' : ''}{feedback.influence}
                </span>
              )}
            </span>
          ) : (
            <span>{feedback.message}</span>
          )}
        </div>
      )}

      {voted && !feedback && !processing && (
        <div className="vote-indicator">
          Voted {voted === 'up' ? 'up' : 'down'}
        </div>
      )}
    </div>
  );
};

export default ArgumentVoting;
