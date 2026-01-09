import React from 'react';
import ArgumentCard from './ArgumentCard';
import './ArgumentFeed.css';

/**
 * ArgumentFeed - Scrollable feed of debate arguments
 *
 * Features:
 * - Chronological display of arguments
 * - Thread indicators for responses
 * - Voting integration
 * - Empty state handling
 * - Progress indicator
 */
const ArgumentFeed = ({ arguments: debateArguments = [], onVote, isLoading = false }) => {
  // Handle empty state
  if (!isLoading && (!debateArguments || debateArguments.length === 0)) {
    return (
      <div className="argument-feed argument-feed--empty">
        <div className="argument-feed__empty-state">
          <div className="argument-feed__empty-icon">💭</div>
          <h3 className="argument-feed__empty-title">No arguments yet</h3>
          <p className="argument-feed__empty-text">
            The debate will begin shortly. Arguments will appear here as participants respond.
          </p>
        </div>
      </div>
    );
  }

  // Determine if an argument is a response to the previous one
  const isResponse = (currentArg, previousArg) => {
    if (!currentArg || !previousArg) return false;
    // Check if it has a respondsTo field
    if (currentArg.respondsTo === previousArg.id) return true;
    // Simple heuristic: if from different parties, likely a response
    if (currentArg.participant?.affiliation !== previousArg.participant?.affiliation) {
      return true;
    }
    return false;
  };

  return (
    <div className="argument-feed">
      <div className="argument-feed__container">
        {debateArguments.map((argument, index) => {
          const previousArg = index > 0 ? debateArguments[index - 1] : null;
          const showThread = previousArg && isResponse(argument, previousArg);

          return (
            <ArgumentCard
              key={argument.id || index}
              argument={argument}
              onVote={onVote}
              showResponseIndicator={showThread}
            />
          );
        })}

        {/* Loading indicator */}
        {isLoading && (
          <div className="argument-feed__loading">
            <div className="argument-feed__loading-spinner"></div>
            <p>Generating next argument...</p>
          </div>
        )}
      </div>

      {/* Status footer */}
      {debateArguments.length > 0 && !isLoading && (
        <div className="argument-feed__footer">
          <span className="argument-feed__count">
            {debateArguments.length} {debateArguments.length === 1 ? 'argument' : 'arguments'}
          </span>
        </div>
      )}
    </div>
  );
};

export default ArgumentFeed;
