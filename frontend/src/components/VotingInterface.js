// src/components/VotingInterface.js
import React, { useState, useEffect } from 'react';
import './VotingInterface.css';

/**
 * Enhanced voting interface that appears after debate concludes
 * @param {Object} props
 * @param {Array} props.debateMessages - Array of all messages from the debate
 * @param {Function} props.onVoteSubmit - Function to call when vote is submitted
 */
const VotingInterface = ({ debateMessages, onVoteSubmit }) => {
  const [selectedParty, setSelectedParty] = useState(null);
  const [activeTab, setActiveTab] = useState('Democrat');
  const [animateIn, setAnimateIn] = useState(false);
  const [partyStats, setPartyStats] = useState({});
  
  // Set animation flag
  useEffect(() => {
    console.log("🗳️ VotingInterface component mounted");
    
    // Add animation after a short delay
    setTimeout(() => {
      setAnimateIn(true);
    }, 100);
    
    // Calculate party statistics
    calculatePartyStats();
  }, []);

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

  // Calculate party statistics (word count, argument count, etc.)
  const calculatePartyStats = () => {
    const stats = {};
    
    Object.keys(messagesByParty).forEach(party => {
      if (messagesByParty[party].length === 0) return;
      
      const messages = messagesByParty[party];
      const totalWordCount = messages.reduce((count, msg) => {
        return count + (msg.message.split(/\s+/).length || 0);
      }, 0);
      
      const avgWordCount = Math.round(totalWordCount / messages.length);
      
      stats[party] = {
        argumentCount: messages.length,
        totalWords: totalWordCount,
        avgWords: avgWordCount,
        debaters: [...new Set(messages.map(msg => msg.model))]
      };
    });
    
    setPartyStats(stats);
  };

  // Set initial active tab to the first party with arguments
  useEffect(() => {
    if (partiesWithArguments.length > 0 && !partiesWithArguments.includes(activeTab)) {
      setActiveTab(partiesWithArguments[0]);
    }
  }, [partiesWithArguments, activeTab]);

  // Handle vote submission
  const handleVoteSubmit = () => {
    if (selectedParty) {
      console.log(`🗳️ Vote submitted for: ${selectedParty}`);
      // Add animation before submitting
      setAnimateIn(false);
      setTimeout(() => {
        onVoteSubmit(selectedParty);
      }, 200);
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

  // Get party icon
  const getPartyIcon = (party) => {
    switch (party) {
      case 'Democrat':
        return '🔵';
      case 'Republican':
        return '🔴';
      case 'Independent':
        return '🟣';
      default:
        return '⚪';
    }
  };

  return (
    <div className={`voting-interface ${animateIn ? 'animate-in' : 'animate-out'}`}>
      <div className="voting-header">
        <div className="voting-title">
          <span className="vote-icon">🏛️</span>
          <h2>Who Won This Debate?</h2>
        </div>
        <p>Review the arguments and cast your vote for the strongest position</p>
      </div>
      
      <div className="party-tabs">
        {partiesWithArguments.map(party => (
          <button
            key={party}
            className={`party-tab ${activeTab === party ? 'active' : ''} ${party}`}
            onClick={() => setActiveTab(party)}
          >
            {getPartyIcon(party)} {party}
            <span className="argument-count">
              {messagesByParty[party].length}
            </span>
          </button>
        ))}
      </div>
      
      {partyStats[activeTab] && (
        <div className="party-stats">
          <div className="stat">
            <span className="stat-value">{partyStats[activeTab].argumentCount}</span>
            <span className="stat-label">Arguments</span>
          </div>
          <div className="stat">
            <span className="stat-value">{partyStats[activeTab].avgWords}</span>
            <span className="stat-label">Avg Words</span>
          </div>
          <div className="stat">
            <span className="stat-value">{partyStats[activeTab].debaters.length}</span>
            <span className="stat-label">Speakers</span>
          </div>
        </div>
      )}
      
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
                {getPartyIcon(party)} {party}
              </label>
            </div>
          ))}
          
          <button 
            className="submit-vote-btn"
            disabled={!selectedParty}
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