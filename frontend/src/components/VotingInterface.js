import React, { useState, useEffect } from 'react';
import './VotingInterface.css';

/**
 * Simplified voting interface focused on voting and argument viewing
 * @param {Object} props
 * @param {Array} props.debateMessages - Array of all messages from the debate
 * @param {Function} props.onVoteSubmit - Function to call when vote is submitted
 * @param {Function} props.onReturnHome - Function to return to home screen
 */
const VotingInterface = ({ debateMessages, onVoteSubmit, onReturnHome }) => {
  const [selectedParty, setSelectedParty] = useState(null);
  const [activeTab, setActiveTab] = useState('Democrat');
  const [activeView, setActiveView] = useState('byParty'); // 'byParty' or 'byModel'
  const [isVoting, setIsVoting] = useState(true);
  const [winner, setWinner] = useState(null);
  
  // Group messages by party and by model
  const [messagesByParty, setMessagesByParty] = useState({
    Democrat: [],
    Republican: [],
    Independent: []
  });

  const [messagesByModel, setMessagesByModel] = useState({});
  
  // Process and group debate messages on load
  useEffect(() => {
    // Group by party
    const byParty = debateMessages.reduce((acc, msg) => {
      if (!acc[msg.affiliation]) {
        acc[msg.affiliation] = [];
      }
      acc[msg.affiliation].push(msg);
      return acc;
    }, { Democrat: [], Republican: [], Independent: [] });
    
    setMessagesByParty(byParty);
    
    // Group by model
    const byModel = debateMessages.reduce((acc, msg) => {
      if (!acc[msg.model]) {
        acc[msg.model] = [];
      }
      acc[msg.model].push(msg);
      return acc;
    }, {});
    
    setMessagesByModel(byModel);
  }, [debateMessages]);
  
  // Handle vote submission
  const handleVoteSubmit = () => {
    if (selectedParty) {
      setWinner(selectedParty);
      setIsVoting(false);
      onVoteSubmit(selectedParty);
    }
  };
  
  // Handle return to home
  const handleReturnHome = () => {
    if (onReturnHome && typeof onReturnHome === 'function') {
      onReturnHome();
    }
  };

  // Get color for a party
  const getPartyColor = (party) => {
    switch (party) {
      case 'Democrat':
        return '#3373CC';
      case 'Republican':
        return '#CC3333';
      case 'Independent':
        return '#8033CC';
      default:
        return '#333333';
    }
  };

  if (isVoting) {
    return (
      <div className="voting-interface">
        <div className="voting-panel">
          <h2>Who Won This Debate?</h2>
          
          <div className="view-toggle">
            <button 
              className={`view-toggle-btn ${activeView === 'byParty' ? 'active' : ''}`}
              onClick={() => setActiveView('byParty')}
            >
              View by Party
            </button>
            <button 
              className={`view-toggle-btn ${activeView === 'byModel' ? 'active' : ''}`}
              onClick={() => setActiveView('byModel')}
            >
              View by Model
            </button>
          </div>
          
          {activeView === 'byParty' ? (
            <>
              <div className="party-tabs">
                {['Democrat', 'Republican', 'Independent'].map(party => (
                  <button
                    key={party}
                    className={`party-tab ${activeTab === party ? 'active' : ''}`}
                    style={{ 
                      borderColor: activeTab === party ? getPartyColor(party) : 'transparent',
                      color: activeTab === party ? getPartyColor(party) : '#555'
                    }}
                    onClick={() => setActiveTab(party)}
                  >
                    {party}
                  </button>
                ))}
              </div>
              
              <div className="arguments-display">
                {messagesByParty[activeTab] && messagesByParty[activeTab].length > 0 ? (
                  <div className="party-arguments">
                    {messagesByParty[activeTab].map((msg, index) => (
                      <div key={index} className="argument-item">
                        <div className="argument-speaker">{msg.model}</div>
                        <div className="argument-content">"{msg.message}"</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-arguments">No arguments from {activeTab}s in this debate.</div>
                )}
              </div>
            </>
          ) : (
            <div className="model-arguments">
              {Object.entries(messagesByModel).map(([model, messages]) => (
                <div key={model} className="model-section">
                  <h3 className="model-name">{model}</h3>
                  {messages.map((msg, index) => (
                    <div 
                      key={index} 
                      className="argument-item"
                      style={{ borderLeftColor: getPartyColor(msg.affiliation) }}
                    >
                      <div 
                        className="argument-affiliation"
                        style={{ color: getPartyColor(msg.affiliation) }}
                      >
                        {msg.affiliation}
                      </div>
                      <div className="argument-content">"{msg.message}"</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
          
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
                    className={`vote-label ${party.toLowerCase()}`}
                    style={{ 
                      borderColor: getPartyColor(party),
                      backgroundColor: selectedParty === party ? getPartyColor(party) : 'transparent',
                      color: selectedParty === party ? 'white' : getPartyColor(party)
                    }}
                  >
                    {party}
                  </label>
                </div>
              ))}
            </div>
            <button
              className="submit-vote-btn"
              disabled={!selectedParty}
              onClick={handleVoteSubmit}
              style={{ 
                backgroundColor: selectedParty ? getPartyColor(selectedParty) : '#ccc',
                cursor: selectedParty ? 'pointer' : 'not-allowed'
              }}
            >
              Submit Vote
            </button>
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <div className={`celebration-screen ${winner ? winner.toLowerCase() : ''}`}>
        <div className="confetti-container">
          {Array.from({ length: 300 }).map((_, i) => (
            <div 
              key={i}
              className="confetti"
              style={{
                left: `${Math.random() * 100}%`,
                width: `${Math.random() * 15 + 5}px`,
                height: `${Math.random() * 25 + 10}px`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${Math.random() * 3 + 2}s`,
                backgroundColor: i % 5 === 0 ? getPartyColor(winner) : 
                                i % 5 === 1 ? '#FFD700' : 
                                i % 5 === 2 ? '#FFFFFF' :
                                i % 5 === 3 ? '#FFFFFF' : '#FFD700'
              }}
            />
          ))}
        </div>
        
        <div className="winner-banner">
          <div className="winner-crown">👑</div>
          <h2 className="winner-headline">
            <span className="winner-text" style={{ color: getPartyColor(winner) }}>
              {winner}
            </span> Wins!
          </h2>
          <p className="winner-subtext">The {winner} viewpoint was most persuasive</p>
          
          <button 
            className="return-home-button"
            onClick={handleReturnHome}
          >
            Start New Debate
          </button>
        </div>
      </div>
    );
  }
};

export default VotingInterface;