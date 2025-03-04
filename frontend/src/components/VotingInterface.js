import React, { useState } from 'react';
import './VotingInterface.css';

/**
 * Voting interface that appears after debate concludes
 * @param {Object} props
 * @param {Array} props.debateMessages - Array of all messages from the debate
 * @param {Function} props.onVoteSubmit - Function to call when vote is submitted
 * @param {Function} props.onNewTopic - Function to restart with a new topic
 */
const VotingInterface = ({ debateMessages, onVoteSubmit, onNewTopic }) => {
  const [selectedParty, setSelectedParty] = useState(null);
  const [activeTab, setActiveTab] = useState('Democrat');
  const [newTopic, setNewTopic] = useState('');
  
  // Group messages by party
  const messagesByParty = debateMessages.reduce((acc, msg) => {
    if (!acc[msg.affiliation]) {
      acc[msg.affiliation] = [];
    }
    acc[msg.affiliation].push(msg);
    return acc;
  }, { Democrat: [], Republican: [], Independent: [] });

  // Handle vote submission
  const handleVoteSubmit = () => {
    if (selectedParty) {
      onVoteSubmit(selectedParty);
    }
  };

  // Handle new topic submission
  const handleNewTopic = () => {
    if (newTopic.trim()) {
      onNewTopic(newTopic.trim());
    }
  };

  return (
    <div className="voting-interface">
      <div className="voting-header">
        <h2>Who won this debate?</h2>
        <p>Review the arguments and cast your vote</p>
      </div>
      
      <div className="party-tabs">
        {['Democrat', 'Republican', 'Independent'].map(party => (
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
        {messagesByParty[activeTab].length > 0 ? (
          <div className="party-arguments">
            {messagesByParty[activeTab].map((msg, index) => (
              <div key={index} className="argument-item">
                <div className="argument-speaker">{msg.model}</div>
                <div className="argument-content">{msg.message}</div>
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
          {['Democrat', 'Republican', 'Independent'].map(party => (
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
          
          <button 
            className="submit-vote-btn"
            disabled={!selectedParty}
            onClick={handleVoteSubmit}
          >
            Submit Vote
          </button>
        </div>
      </div>
      
      <div className="new-topic-section">
        <h3>Start a New Debate</h3>
        <div className="new-topic-input">
          <input
            type="text"
            placeholder="Enter a new topic..."
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
          />
          <button 
            className="new-topic-btn"
            disabled={!newTopic.trim()}
            onClick={handleNewTopic}
          >
            Start New Debate
          </button>
        </div>
      </div>
    </div>
  );
};

export default VotingInterface;