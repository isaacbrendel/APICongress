// src/components/VotingInterface.js
import React, { useState, useEffect } from 'react';
import './VotingInterface.css';

/**
 * Elegant and simplified voting interface
 * @param {Object} props
 * @param {Array} props.debateMessages - Array of all messages from the debate
 * @param {Function} props.onVoteSubmit - Function to call when vote is submitted
 * @param {Function} props.onNewDebate - Function to start a new debate
 */
const VotingInterface = ({ debateMessages, onVoteSubmit, onNewDebate }) => {
  const [selectedParty, setSelectedParty] = useState(null);
  const [activeTab, setActiveTab] = useState('Democrat');

  // Group messages by party
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
  }, [partiesWithArguments, activeTab]);

  // Handle vote submission
  const handleVoteSubmit = () => {
    if (selectedParty) {
      onVoteSubmit(selectedParty);
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

  return (
    <div className="voting-interface">
      <div className="voting-header">
        <h2>Who Won This Debate?</h2>
      </div>
      
      <div className="party-tabs">
        {partiesWithArguments.map(party => (
          <button
            key={party}
            className={`party-tab ${activeTab === party ? 'active' : ''} ${party}`}
            onClick={() => setActiveTab(party)}
          >
            {party}
          </button>
        ))}
      </div>
      
      <div className="arguments-display">
        {messagesByParty[activeTab]?.length > 0 ? (
          <div className="party-arguments">
            {messagesByParty[activeTab].map((msg, index) => (
              <div 
                key={index} 
                className="argument-item"
                style={{ borderLeftColor: getPartyColor(activeTab) }}
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
              >
                {party}
              </label>
            </div>
          ))}
        </div>

        <div className="voting-actions">
          <button
            className="submit-vote-btn"
            disabled={!selectedParty}
            onClick={handleVoteSubmit}
          >
            Submit Vote
          </button>

          <button
            className="new-debate-btn"
            onClick={onNewDebate}
          >
            New Debate
          </button>
        </div>
      </div>
    </div>
  );
};

export default VotingInterface;