// src/components/DebaterCard.js
import React from 'react';
import './DebaterCard.css';

/**
 * DebaterCard component with direct color handling - based on your working version
 * but integrated with the current component structure
 */
const DebaterCard = ({ name, logo, affiliation }) => {
  // Direct color calculation like in your original working version
  let bannerColor = '#333';
  if (affiliation === 'Republican') {
    bannerColor = '#CC0000';  // Republican red
  } else if (affiliation === 'Democrat') {
    bannerColor = '#003366';  // Democrat blue
  } else if (affiliation === 'Independent') {
    bannerColor = '#800080';  // Independent purple
  } else if (!affiliation || affiliation.trim() === '') {
    // Default color for unassigned models
    bannerColor = '#555555';
  }

  // Apply class for CSS targeting
  const cardClass = affiliation ? affiliation.toLowerCase() : 'unassigned';

  return (
    <div className={`debater-card ${cardClass}`}>
      <div className="debater-circle">
        <img src={logo} alt={name} className="debater-logo" />
      </div>
      <div 
        className="debater-banner"
        style={{ backgroundColor: bannerColor }} // Direct style application
      >
        <span className="debater-name">{name}</span>
      </div>
    </div>
  );
};

export default DebaterCard;