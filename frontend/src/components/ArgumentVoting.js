import React, { useState } from 'react';
import logger from '../utils/logger';
import './ArgumentVoting.css';

/**
 * REINFORCEMENT LEARNING VOTING INTERFACE
 * Provides clear feedback on every vote and shows RL system response
 * NOW SUPPORTS VOTE TOGGLING - Users can change their vote!
 */
const ArgumentVoting = ({ argumentId, agentId, agentName, onVote }) => {
  const [voted, setVoted] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleVote = async (voteType) => {
    logger.vote('VOTE BUTTON CLICKED', { argumentId, agentId, voteType, currentVote: voted });

    // Allow vote toggling - if clicking same vote, remove it
    if (voted === voteType) {
      logger.vote('Removing vote (toggle off)', { argumentId, voteType });
      setVoted(null);
      setFeedback(null);
      return;
    }

    if (processing) {
      logger.warn(logger.LogCategory.VOTE, 'Vote already processing, ignoring click');
      return;
    }

    setProcessing(true);

    // Call backend and get RL feedback
    try {
      logger.markStart(`vote_${argumentId}_${voteType}`);
      logger.network('Sending vote to backend', { argumentId, agentId, voteType, agentName });

      const response = await onVote(argumentId, agentId, voteType);

      const duration = logger.markEnd(`vote_${argumentId}_${voteType}`);
      logger.success(logger.LogCategory.VOTE, 'VOTE RECORDED', {
        argumentId,
        voteType,
        duration: `${duration}ms`,
        influenceChange: response?.influenceChange,
        currentInfluence: response?.currentInfluence,
        totalVotes: response?.totalVotes,
        approvalRate: response?.approvalRate
      });

      if (response?.personalityShifts && response.personalityShifts.length > 0) {
        logger.agent(`${agentName} PERSONALITY EVOLUTION`, {
          shifts: response.personalityShifts
        });
      }

      setVoted(voteType);
      setFeedback(response);
      setShowSuccess(true);

      // Keep success message visible
      setTimeout(() => setShowSuccess(false), 3000);

    } catch (error) {
      logger.error(logger.LogCategory.VOTE, 'Vote failed', {
        argumentId,
        agentId,
        voteType,
        error: error.message
      });
      // Show styled error in feedback area instead of alert
      setFeedback({
        error: true,
        message: 'Failed to record vote. Please try again.'
      });
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setFeedback(null);
      }, 3000);
    }

    setProcessing(false);
  };

  return (
    <div className="argument-voting">
      <div className="vote-buttons-container">
        <button
          className={`vote-btn upvote ${voted === 'up' ? 'voted' : ''} ${processing ? 'processing' : ''}`}
          onClick={() => handleVote('up')}
          disabled={processing}
          title={voted === 'up' ? "Click again to remove your upvote" : "This argument is effective - reinforce this style"}
        >
          <span className="vote-icon">⬆️</span>
          <span className="vote-label">{voted === 'up' ? 'UPVOTED' : 'UPVOTE'}</span>
          {voted === 'up' && <span className="checkmark">✓</span>}
        </button>

        <button
          className={`vote-btn downvote ${voted === 'down' ? 'voted' : ''} ${processing ? 'processing' : ''}`}
          onClick={() => handleVote('down')}
          disabled={processing}
          title={voted === 'down' ? "Click again to remove your downvote" : "This argument is weak - agent should adapt"}
        >
          <span className="vote-icon">⬇️</span>
          <span className="vote-label">{voted === 'down' ? 'DOWNVOTED' : 'DOWNVOTE'}</span>
          {voted === 'down' && <span className="checkmark">✓</span>}
        </button>
      </div>

      {/* Processing State */}
      {processing && (
        <div className="vote-feedback processing-feedback">
          <div className="spinner"></div>
          <span>Recording vote...</span>
        </div>
      )}

      {/* Success/Error Feedback with RL Details */}
      {feedback && (
        <div className={`vote-feedback ${feedback.error ? 'error-feedback' : 'success-feedback'} ${showSuccess ? 'show' : ''}`}>
          {feedback.error ? (
            <>
              <div className="feedback-header">
                <span className="feedback-icon">❌</span>
                <span className="feedback-message">{feedback.message}</span>
              </div>
              <div className="feedback-footer">
                Please try again or check your connection
              </div>
            </>
          ) : (
            <>
              <div className="feedback-header">
                <span className="feedback-icon">{voted === 'up' ? '✅' : '🔄'}</span>
                <span className="feedback-message">
                  {voted === 'up' ? 'Vote Recorded - Reinforcing!' : 'Vote Recorded - Agent Adapting!'}
                </span>
              </div>

              <div className="feedback-details">
                <div className="feedback-row">
                  <span className="label">Influence Change:</span>
                  <span className={`value ${feedback.influenceChange > 0 ? 'positive' : 'negative'}`}>
                    {feedback.influenceChange > 0 ? '+' : ''}{feedback.influenceChange}
                  </span>
                </div>

                <div className="feedback-row">
                  <span className="label">Current Influence:</span>
                  <span className="value">{feedback.currentInfluence}</span>
                </div>

                <div className="feedback-row">
                  <span className="label">Approval Rate:</span>
                  <span className="value">{feedback.approvalRate}</span>
                </div>

                {feedback.personalityShifts && feedback.personalityShifts.length > 0 && (
                  <div className="feedback-row personality-shifts">
                    <span className="label">🧠 Personality Evolution:</span>
                    <span className="value">{feedback.personalityShifts.join(', ')}</span>
                  </div>
                )}
              </div>

              <div className="feedback-footer">
                ✓ Your feedback is training the AI in real-time!
              </div>
            </>
          )}
        </div>
      )}

      {/* Voted indicator that persists */}
      {voted && !showSuccess && (
        <div className="voted-indicator">
          <span className="indicator-icon">{voted === 'up' ? '⬆️' : '⬇️'}</span>
          <span className="indicator-text">
            You voted {voted === 'up' ? 'UP' : 'DOWN'} - AI learning applied! (Click button again to change)
          </span>
        </div>
      )}
    </div>
  );
};

export default ArgumentVoting;
