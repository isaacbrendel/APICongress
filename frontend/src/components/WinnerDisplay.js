// src/components/WinnerDisplay.js
import React, { useState, useEffect } from 'react';
import './WinnerDisplay.css';

/**
 * Component to display the winner of the debate with glorious animations
 */
const WinnerDisplay = ({ winner, onReturnHome, onViewArguments }) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [showTrophy, setShowTrophy] = useState(false);
  const [showSpotlight, setShowSpotlight] = useState(false);
  
  // Get party-specific styling
  const getPartyColor = () => {
    switch (winner) {
      case 'Democrat':
        return '#0052A5';
      case 'Republican':
        return '#CC0000';
      case 'Independent':
        return '#800080';
      default:
        return '#333333';
    }
  };
  
  // Staged animations for a more dramatic reveal
  useEffect(() => {
    // Start with spotlight
    setShowSpotlight(true);
    
    // Then show trophy
    setTimeout(() => {
      setShowTrophy(true);
    }, 600);
    
    // Then content
    setTimeout(() => {
      setShowContent(true);
    }, 1200);
    
    // Finally confetti
    setTimeout(() => {
      setShowConfetti(true);
    }, 1800);
  }, []);
  
  // Generate random confetti
  const generateConfetti = () => {
    const confettiCount = 150; // More confetti for glory!
    const confetti = [];
    
    for (let i = 0; i < confettiCount; i++) {
      const color = i % 5 === 0 ? getPartyColor() : 
                   i % 5 === 1 ? '#FFD700' : // Gold
                   i % 5 === 2 ? '#FFFFFF' : // White
                   i % 5 === 3 ? '#E6E6FA' : // Lavender
                   '#FFFACD'; // Light yellow
                   
      const size = Math.random() * 10 + 5;
      const left = `${Math.random() * 100}%`;
      const animationDelay = `${Math.random() * 3}s`;
      const animationDuration = `${Math.random() * 2 + 3}s`;
      
      confetti.push(
        <div 
          key={i} 
          className="confetti"
          style={{
            left,
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: color,
            animationDelay,
            animationDuration
          }}
        />
      );
    }
    
    return confetti;
  };
  
  return (
    <div className="winner-display">
      {/* Spotlight effect */}
      {showSpotlight && <div className="spotlight" />}
      
      {/* Animated confetti */}
      {showConfetti && (
        <div className="confetti-container">
          {generateConfetti()}
        </div>
      )}
      
      <div className={`winner-content ${showContent ? 'show' : ''}`}>
        {/* Trophy animation */}
        {showTrophy && (
          <div className="trophy">
            <div className="trophy-cup">
              <div className="trophy-top"></div>
              <div className="trophy-middle"></div>
              <div className="trophy-bottom"></div>
              <div className="trophy-base"></div>
            </div>
          </div>
        )}
        
        <h2 className="winner-title">Debate Champion</h2>
        
        <div 
          className="winner-party"
          style={{ color: getPartyColor() }}
        >
          {winner}
        </div>
        
        <p className="winner-message">
          The <span style={{ color: getPartyColor(), fontWeight: 'bold' }}>{winner}</span> viewpoint was the most convincing in this debate!
        </p>
        
        <div className="winner-actions">
          <button
            className="view-arguments-btn"
            onClick={onViewArguments}
          >
            View Arguments
          </button>
          
          <button
            className="new-debate-btn"
            onClick={onReturnHome}
          >
            New Debate
          </button>
        </div>
      </div>
    </div>
  );
};

export default WinnerDisplay;