import React, { useState } from 'react';
import './ArgumentCard.css';

/**
 * ArgumentCard - Display individual argument with minimal voting
 *
 * Features:
 * - Clean argument display
 * - Party affiliation indicator (subtle left border)
 * - Minimal inline voting (up/down/neutral)
 * - File attachments display
 * - Response threading indicator
 * - No animations or shuffle effects
 */
const ArgumentCard = ({ argument, onVote, showResponseIndicator = false }) => {
  const [voteState, setVoteState] = useState('neutral'); // 'up', 'down', 'neutral'
  const [isVoting, setIsVoting] = useState(false);

  if (!argument) return null;

  const handleVote = async (vote) => {
    if (isVoting) return;

    const newVote = voteState === vote ? 'neutral' : vote;
    setVoteState(newVote);
    setIsVoting(true);

    try {
      await onVote(argument.id, newVote);
    } catch (error) {
      console.error('Vote failed:', error);
      // Revert on error
      setVoteState(voteState);
    } finally {
      setIsVoting(false);
    }
  };

  // Get party class for styling
  const partyClass = argument.participant?.affiliation?.toLowerCase() || 'independent';

  return (
    <>
      {showResponseIndicator && (
        <div className="response-indicator">
          <div className="response-indicator__line" />
          <span className="response-indicator__label">responds to</span>
        </div>
      )}

      <article
        className={`argument-card argument-card--${partyClass}`}
        data-party={partyClass}
      >
        {/* Header */}
        <header className="argument-card__header">
          <div className="argument-card__avatar">
            <img
              src={argument.participant?.logo}
              alt={argument.participant?.name}
            />
          </div>
          <div className="argument-card__meta">
            <span className="argument-card__name">
              {argument.participant?.name || 'Unknown'}
            </span>
            <span className={`argument-card__party argument-card__party--${partyClass}`}>
              {argument.participant?.affiliation || 'Independent'}
            </span>
          </div>
          <time className="argument-card__timestamp">
            {argument.timestamp
              ? new Date(argument.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : ''}
          </time>
        </header>

        {/* Content */}
        <div className="argument-card__content">
          {argument.content || argument.text || ''}
        </div>

        {/* Files (if any) */}
        {argument.files && argument.files.length > 0 && (
          <div className="argument-card__files">
            {argument.files.map((file, index) => (
              <a
                key={index}
                href={file.url}
                className="argument-card__file"
                download
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="argument-card__file-icon">
                  {file.type === 'pdf' ? '📎' : '📊'}
                </span>
                <span className="argument-card__file-name">{file.name}</span>
                <span className="argument-card__file-size">
                  ({file.size || 'Unknown size'})
                </span>
              </a>
            ))}
          </div>
        )}

        {/* Voting */}
        <footer className="argument-card__footer">
          <div className="argument-card__actions">
            <button
              className={`vote-button vote-button--up ${
                voteState === 'up' ? 'vote-button--active' : ''
              }`}
              onClick={() => handleVote('up')}
              disabled={isVoting}
              aria-label="Upvote this argument"
              title="Upvote"
            >
              ↑
            </button>
            <button
              className={`vote-button vote-button--down ${
                voteState === 'down' ? 'vote-button--active' : ''
              }`}
              onClick={() => handleVote('down')}
              disabled={isVoting}
              aria-label="Downvote this argument"
              title="Downvote"
            >
              ↓
            </button>
            {argument.voteCount !== undefined && (
              <span className="argument-card__vote-count" title="Vote score">
                {argument.voteCount}
              </span>
            )}
          </div>
        </footer>
      </article>
    </>
  );
};

export default ArgumentCard;
