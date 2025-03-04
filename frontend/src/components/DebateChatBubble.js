import React from 'react';
import './DebateChatBubble.css';

/**
 * Enhanced chat bubble component that visually connects to the speaker
 * @param {Object} props
 * @param {string} props.model - Name of the AI model speaking
 * @param {string} props.message - The content of the message
 * @param {string} props.affiliation - Political affiliation (Democrat, Republican, Independent)
 * @param {Object} props.position - {top, left} position of the speaker
 * @param {number} props.countdown - Seconds remaining before next speaker (null if not counting)
 * @param {string} props.nextSpeaker - Name of the next AI to speak
 */
const DebateChatBubble = ({ 
  model, 
  message, 
  affiliation, 
  position, 
  countdown, 
  nextSpeaker
}) => {
  // Set bubble position relative to speaker position
  const getBubblePosition = () => {
    if (!position) return { top: '30%', left: '50%' };
    
    // Position bubble above the speaker with some offset
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
    
    return { top: `${bubbleTop}%`, left: `${bubbleLeft}%` };
  };
  
  // Get colors based on affiliation
  const getColors = () => {
    switch (affiliation) {
      case 'Democrat':
        return { borderColor: '#3373CC', backgroundColor: 'rgba(51, 115, 204, 0.1)' };
      case 'Republican':
        return { borderColor: '#CC3333', backgroundColor: 'rgba(204, 51, 51, 0.1)' };
      case 'Independent':
        return { borderColor: '#8033CC', backgroundColor: 'rgba(128, 51, 204, 0.1)' };
      default:
        return { borderColor: '#333333', backgroundColor: 'rgba(51, 51, 51, 0.1)' };
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
      className={`debate-chat-bubble ${pointerClass}`}
      style={{
        ...bubblePosition,
        borderColor: colors.borderColor,
        backgroundColor: colors.backgroundColor
      }}
    >
      <div className="speaker-name" style={{ color: colors.borderColor }}>
        {model}
      </div>
      <div className="message-content">{message}</div>
      
      {countdown !== null && (
        <div className="countdown-container">
          <div className="countdown-timer" style={{ color: colors.borderColor }}>
            {countdown}
          </div>
          <div className="next-speaker">
            Next: <span style={{ fontWeight: 'bold' }}>{nextSpeaker}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebateChatBubble;