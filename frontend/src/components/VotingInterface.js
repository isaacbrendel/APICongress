// src/components/VotingInterface.js
import React, { useState, useEffect } from 'react';
import './VotingInterface.css';

/**
 * Enhanced voting interface that appears after debate concludes
 * Focused on arguments and voting only (no home/new topic)
 */
const VotingInterface = ({ debateMessages, onVoteSubmit }) => {
  const [selectedParty, setSelectedParty] = useState(null);
  const [activeTab, setActiveTab] = useState('Democrat');
  const [animateIn, setAnimateIn] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Group messages by party for easy viewing
  const messagesByParty = debateMessages.reduce((acc, msg) => {
    if (!acc[msg.affiliation]) {
      acc[msg.affiliation] = [];
    }
    acc[msg.affiliation].push(msg);
    return acc;
  }, { Democrat: [], Republican: [], Independent: [] });

  // Get parties that have arguments
  const partiesWithArguments = Object.keys(messagesByParty).filter(party => 
    messagesByParty[party] && messagesByParty[party].length > 0
  );

  // Set initial active tab to the first party with arguments
  useEffect(() => {
    if (partiesWithArguments.length > 0 && !partiesWithArguments.includes(activeTab)) {
      setActiveTab(partiesWithArguments[0]);
    }
    
    // Trigger animation after a short delay
    setTimeout(() => {
      setAnimateIn(true);
    }, 100);
  }, [partiesWithArguments, activeTab]);

  // Handle vote submission with improved transition
  const handleVoteSubmit = () => {
    if (selectedParty && !isTransitioning) {
      // Set transitioning state to prevent double-clicks
      setIsTransitioning(true);
      
      // Immediately hide the component
      setAnimateIn(false);
      
      // Delay just enough for CSS transition to start, but not complete
      // This prevents the flash of voting interface before winner display
      const immediateHide = setTimeout(() => {
        // Call onVoteSubmit to move to winner display
        onVoteSubmit(selectedParty);
        clearTimeout(immediateHide);
      }, 50); // Very short delay
    }
  };
  
  // Get party color
  const getPartyColor = (party) => {
    switch (party) {
      case 'Democrat':
        return '#3373CC';
      case 'Republican':
        return '#CC3333';
      case 'Independent':
        return '#8033CC';
      default:
        return '#666666';
    }
  };

  // If transitioning out, don't render
  if (isTransitioning) return null;

  return (
    <div className={`voting-interface ${animateIn ? 'animate-in' : 'animate-out'}`}>
      <div className="voting-header">
        <div className="voting-title-icon">🗳️</div>
        <h2>Who Won This Debate?</h2>
        <p>Review the arguments from each party and cast your vote</p>
      </div>
      
      <div className="party-tabs">
        {partiesWithArguments.map(party => (
          <button
            key={party}
            className={`party-tab ${activeTab === party ? 'active' : ''} ${party}`}
            onClick={() => setActiveTab(party)}
            style={{
              '--party-color': getPartyColor(party),
              '--party-color-light': `${getPartyColor(party)}22` // 22 = 13% opacity in hex
            }}
          >
            {party} <span className="argument-count">({messagesByParty[party].length})</span>
          </button>
        ))}
      </div>
      
      <div className="arguments-display">
        {messagesByParty[activeTab].length > 0 ? (
          <div className="party-arguments">
            {messagesByParty[activeTab].map((msg, index) => (
              <div 
                key={index} 
                className="argument-item"
                style={{ 
                  animationDelay: `${index * 0.1}s`,
                  borderLeft: `4px solid ${getPartyColor(activeTab)}`
                }}
              >
                <div className="argument-speaker" style={{ color: getPartyColor(activeTab) }}>
                  {msg.model}
                </div>
                <div className="argument-content">"{msg.message}"</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-arguments">No arguments from {activeTab}s in this debate.</div>
        )}
      </div>
      
      <div className="voting-section">
        <h3>Cast Your Vote</h3>
        <div className="voting-options">
          {partiesWithArguments.map(party => (
            <div key={party} className="voting-option">
              <input
                type="radio"
                id={`vote-${party}`}
                name="party-vote"
                checked={selectedParty === party}
                onChange={() => setSelectedParty(party)}
              />
              <label 
                htmlFor={`vote-${party}`}
                className={`vote-label ${party}`}
                style={{ 
                  '--party-color': getPartyColor(party),
                  '--party-color-light': `${getPartyColor(party)}22` // 22 = 13% opacity in hex
                }}
              >
                {party}
              </label>
            </div>
          ))}
          
          <button 
            className="submit-vote-btn"
            disabled={!selectedParty || isTransitioning}
            onClick={handleVoteSubmit}
          >
            Submit Vote
          </button>
        </div>
      </div>
    </div>
  );
};

export default VotingInterface;