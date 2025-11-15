// src/components/WinnerDisplay.js
import React, { useState, useEffect } from 'react';
import './WinnerDisplay.css';

/**
 * Component to display the winner of the debate with glorious, elegant animations
 */
const WinnerDisplay = ({ winner, onReturnHome, onViewArguments }) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [showTrophy, setShowTrophy] = useState(false);
  const [showSpotlight, setShowSpotlight] = useState(false);
  const [showRibbons, setShowRibbons] = useState(false);
  const [showStars, setShowStars] = useState(false);
  
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
  
  // Elegant secondary color for the party
  const getSecondaryColor = () => {
    switch (winner) {
      case 'Democrat':
        return '#B7D1F8'; // Light blue
      case 'Republican':
        return '#FFCCCB'; // Light red
      case 'Independent':
        return '#E6CCE6'; // Light purple
      default:
        return '#E0E0E0';
    }
  };
  
  // Staged animations for a more dramatic, elegant reveal
  useEffect(() => {
    // Start with spotlight
    setShowSpotlight(true);
    
    // Then show trophy
    setTimeout(() => {
      setShowTrophy(true);
    }, 600);
    
    // Then content with ribbons for elegance
    setTimeout(() => {
      setShowContent(true);
      setShowRibbons(true);
    }, 1200);
    
    // Add stars for sophistication
    setTimeout(() => {
      setShowStars(true);
    }, 1500);
    
    // Finally confetti for celebration
    setTimeout(() => {
      setShowConfetti(true);
    }, 1800);
  }, []);
  
  // Generate random confetti with more elegant shapes and colors
  const generateConfetti = () => {
    const confettiCount = 150;
    const confetti = [];
    
    // More sophisticated color palette
    const partyColor = getPartyColor();
    const secondaryColor = getSecondaryColor();
    
    for (let i = 0; i < confettiCount; i++) {
      // Elegant color palette based on party colors
      const color = i % 6 === 0 ? partyColor :
                   i % 6 === 1 ? secondaryColor :
                   i % 6 === 2 ? '#FFD700' : // Gold
                   i % 6 === 3 ? '#FFFFFF' : // White
                   i % 6 === 4 ? '#F5F5F5' : // Platinum
                   '#FFFACD'; // Light yellow
      
      // Varied sizes for visual interest
      const size = Math.random() * 10 + 5;
      const left = `${Math.random() * 100}%`;
      
      // Smoother, more graceful animation timing
      const animationDelay = `${Math.random() * 3}s`;
      const animationDuration = `${Math.random() * 2 + 3}s`;
      
      // Add some rotation for elegance
      const rotation = Math.floor(Math.random() * 360);
      
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
            animationDuration,
            transform: `rotate(${rotation}deg)`,
            // Add border radius to some pieces for varied shapes
            borderRadius: i % 3 === 0 ? '50%' : i % 4 === 0 ? '0' : '2px'
          }}
        />
      );
    }
    return confetti;
  };
  
  // Generate decorative stars for elegance
  const generateStars = () => {
    const starCount = 12;
    const stars = [];
    
    for (let i = 0; i < starCount; i++) {
      const size = Math.random() * 15 + 10;
      const angle = (i / starCount) * 360; // Evenly distribute stars in a circle
      const distance = 150 + Math.random() * 100; // Distance from center
      
      // Convert polar coordinates to Cartesian
      const x = 50 + Math.cos(angle * Math.PI / 180) * distance / 5;
      const y = 50 + Math.sin(angle * Math.PI / 180) * distance / 5;
      
      // Staggered animations for visual interest
      const delay = i * 0.1;
      
      stars.push(
        <div
          key={i}
          className="decorative-star"
          style={{
            top: `${y}%`,
            left: `${x}%`,
            width: `${size}px`,
            height: `${size}px`,
            animationDelay: `${delay}s`
          }}
        />
      );
    }
    return stars;
  };
  
  // Generate decorative ribbons for elegance
  const generateRibbons = () => {
    const ribbonCount = 8;
    const ribbons = [];
    const partyColor = getPartyColor();
    const secondaryColor = getSecondaryColor();
    
    for (let i = 0; i < ribbonCount; i++) {
      const angle = (i / ribbonCount) * 360;
      const color = i % 2 === 0 ? partyColor : '#FFD700'; // Alternate between party color and gold
      const delay = i * 0.15;
      
      ribbons.push(
        <div
          key={i}
          className="decorative-ribbon"
          style={{
            transform: `rotate(${angle}deg)`,
            backgroundColor: color,
            animationDelay: `${delay}s`
          }}
        />
      );
    }
    return ribbons;
  };

  return (
    <div className="winner-display">
      {/* Champions GIF background */}
      <img
        src={process.env.PUBLIC_URL + '/images/CHAMPIONS.gif'}
        alt="Champions"
        className="champions-background"
      />

      <div className={`winner-content ${showContent ? 'show' : ''}`}>
        <h2 className="winner-title">Champion</h2>
        
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
            style={{ 
              borderColor: getPartyColor(),
              color: getPartyColor()
            }}
          >
            View Arguments
          </button>
          
          <button
            className="new-debate-btn"
            onClick={onReturnHome}
            style={{ 
              backgroundColor: getPartyColor()
            }}
          >
            New Debate
          </button>
        </div>
      </div>
    </div>
  );
};

export default WinnerDisplay;