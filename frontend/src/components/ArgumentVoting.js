import React, { useState } from 'react';
import './ArgumentVoting.css';

/**
 * REINFORCEMENT LEARNING VOTING INTERFACE
 * Provides clear feedback on every vote and shows RL system response
 */
const ArgumentVoting = ({ argumentId, agentId, agentName, onVote }) => {
  const [voted, setVoted] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleVote = async (voteType) => {
    console.log('🗳️ VOTE BUTTON CLICKED:', voteType);

    if (processing || voted) {
      console.log('Already voted or processing');
      return;
    }

    setProcessing(true);

    // Call backend and get RL feedback
    try {
      console.log('📤 Sending vote to backend:', { argumentId, agentId, voteType });
      const response = await onVote(argumentId, agentId, voteType);

      console.log('✅ VOTE RECORDED:', response);
      console.log('📊 Agent Stats:', {
        influenceChange: response?.influenceChange,
        currentInfluence: response?.currentInfluence,
        totalVotes: response?.totalVotes,
        approvalRate: response?.approvalRate
      });

      if (response?.personalityShifts && response.personalityShifts.length > 0) {
        console.log('🧠 PERSONALITY EVOLUTION:', response.personalityShifts);
      }

      setVoted(voteType);
      setFeedback(response);
      setShowSuccess(true);

      // Keep success message visible
      setTimeout(() => setShowSuccess(false), 3000);

    } catch (error) {
      console.error('❌ Vote failed:', error);
      alert('Failed to record vote. Please try again.');
    }

    setProcessing(false);
  };

  return (
    <div className="argument-voting">
      <div className="vote-buttons-container">
        <button
          className={`vote-btn upvote ${voted === 'up' ? 'voted' : ''} ${processing ? 'processing' : ''}`}
          onClick={() => handleVote('up')}
          disabled={processing || voted}
          title="This argument is effective - reinforce this style"
        >
          <span className="vote-icon">⬆️</span>
          <span className="vote-label">UPVOTE</span>
          {voted === 'up' && <span className="checkmark">✓</span>}
        </button>

        <button
          className={`vote-btn downvote ${voted === 'down' ? 'voted' : ''} ${processing ? 'processing' : ''}`}
          onClick={() => handleVote('down')}
          disabled={processing || voted}
          title="This argument is weak - agent should adapt"
        >
          <span className="vote-icon">⬇️</span>
          <span className="vote-label">DOWNVOTE</span>
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

      {/* Success Feedback with RL Details */}
      {voted && feedback && (
        <div className={`vote-feedback success-feedback ${showSuccess ? 'show' : ''}`}>
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
        </div>
      )}

      {/* Voted indicator that persists */}
      {voted && !showSuccess && (
        <div className="voted-indicator">
          <span className="indicator-icon">{voted === 'up' ? '⬆️' : '⬇️'}</span>
          <span className="indicator-text">
            You voted {voted === 'up' ? 'UP' : 'DOWN'} - AI learning applied!
          </span>
        </div>
      )}
    </div>
  );
};

export default ArgumentVoting;
