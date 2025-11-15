import React, { useState, useEffect } from 'react';
import './DebateChatBubble.css';

/**
 * Enhanced chat bubble component that visually connects to the speaker
 * @param {Object} props
 * @param {string} props.model - Name of the AI model speaking
 * @param {string} props.message - The content of the message
 * @param {string} props.affiliation - Political affiliation (Democrat, Republican, Independent)
 * @param {Object} props.position - {top, left} position of the speaker
 * @param {number} props.countdown - Seconds remaining before next speaker (null if not counting)
 * @param {Object} props.nextSpeaker - The next speaker object
 */
const DebateChatBubble = ({
  model,
  message,
  affiliation,
  position,
  countdown,
  nextSpeaker,
  onPause,
  onResume
}) => {
  // Add a class to handle mobile styling - declare this FIRST to avoid uninitialized variable error
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);
  const [isHovered, setIsHovered] = useState(false);

  // Add resize listener to update mobile state
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 480);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Handle hover events - ACTUALLY pause the timer
  const handleMouseEnter = () => {
    setIsHovered(true);
    if (onPause) {
      onPause();
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (onResume) {
      onResume();
    }
  };
  
  // Set bubble position relative to speaker position
  const getBubblePosition = () => {
    // Default position if no position data
    if (!position) return { top: '30%', left: '50%', transform: 'translateX(-50%)' };
    
    // Use state for mobile detection
    if (isMobile) {
      // On mobile, position at the top center for all speakers
      return { top: '10%', left: '50%', transform: 'translateX(-50%)' };
    } else {
      // Desktop positioning - bubble above the speaker with some offset
      const bubbleTop = Math.max(10, position.top - 15); // At least 10% from top
      
      // Adjust horizontal position based on affiliation
      let bubbleLeft;
      if (affiliation === 'Democrat') {
        bubbleLeft = position.left + 10; // Rightward for Democrats (left side)
      } else if (affiliation === 'Republican') {
        bubbleLeft = position.left - 30; // Leftward for Republicans (right side)
      } else {
        // Independents (middle) - adjust based on absolute position
        bubbleLeft = position.left < 50 ? position.left + 8 : position.left - 28;
      }
      
      return { top: `${bubbleTop}%`, left: `${bubbleLeft}%`, transform: 'none' };
    }
  };

  // Get colors based on affiliation
  const getColors = () => {
    switch (affiliation) {
      case 'Democrat':
        return { 
          borderColor: '#3373CC', 
          backgroundColor: 'rgba(51, 115, 204, 0.1)',
          gradientStart: '#3373CC',
          gradientEnd: '#2a5ca3'
        };
      case 'Republican':
        return { 
          borderColor: '#CC3333', 
          backgroundColor: 'rgba(204, 51, 51, 0.1)',
          gradientStart: '#CC3333',
          gradientEnd: '#a32929'
        };
      case 'Independent':
        return { 
          borderColor: '#8033CC', 
          backgroundColor: 'rgba(128, 51, 204, 0.1)',
          gradientStart: '#8033CC',
          gradientEnd: '#6629a3'
        };
      default:
        return { 
          borderColor: '#333333', 
          backgroundColor: 'rgba(51, 51, 51, 0.1)',
          gradientStart: '#333333',
          gradientEnd: '#222222'
        };
    }
  };

  // Get pointer direction based on affiliation
  const getPointerClass = () => {
    if (affiliation === 'Democrat') return 'pointer-left';
    if (affiliation === 'Republican') return 'pointer-right';
    return 'pointer-bottom'; // Independent
  };

  const bubblePosition = getBubblePosition();
  const colors = getColors();
  const pointerClass = getPointerClass();
  
  return (
    <div
      className={`debate-chat-bubble ${pointerClass} ${isMobile ? 'mobile' : ''} ${isHovered ? 'hovered' : ''}`}
      style={{
        ...bubblePosition,
        borderColor: colors.borderColor,
        backgroundColor: colors.backgroundColor,
        boxShadow: `0 6px 16px rgba(0, 0, 0, 0.15), 0 0 0 1px ${colors.borderColor}`
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div 
        className="speaker-header" 
        style={{ 
          background: `linear-gradient(135deg, ${colors.gradientStart}, ${colors.gradientEnd})` 
        }}
      >
        <div className="speaker-name">
          {model} <span className="speaker-affiliation">({affiliation})</span>
        </div>
      </div>
      
      <div className="message-content">"{message}"</div>
      
      {countdown !== null && nextSpeaker && (
        <div className="countdown-container">
          <div className="countdown-info">
            <div className="next-speaker">
              Next: <span style={{ fontWeight: 'bold' }}>{nextSpeaker.name}</span>
            </div>
          </div>
          <div 
            className="countdown-timer" 
            style={{ 
              color: 'white',
              background: `linear-gradient(135deg, ${colors.gradientStart}, ${colors.gradientEnd})` 
            }}
          >
            {countdown}
          </div>
        </div>
      )}
    </div>
  );
};

export default DebateChatBubble;