import React from 'react';
import './ParticipantChip.css';

/**
 * ParticipantChip - Clean display of an AI debate participant
 *
 * Features:
 * - AI logo display
 * - Name label
 * - Party affiliation indicator
 * - Active speaker highlight
 * - Minimal, static design (no animations)
 */
const ParticipantChip = ({ name, logo, affiliation, isActive = false }) => {
  // Normalize affiliation to lowercase for CSS class
  const affiliationClass = affiliation ? affiliation.toLowerCase() : 'independent';

  return (
    <div
      className={`participant-chip ${isActive ? 'participant-chip--active' : ''}`}
      data-affiliation={affiliationClass}
    >
      <div className="participant-chip__logo">
        <img src={logo} alt={`${name} logo`} />
        {isActive && <div className="participant-chip__active-indicator" />}
      </div>
      <div className="participant-chip__name">{name}</div>
      <div className={`participant-chip__party participant-chip__party--${affiliationClass}`}>
        {affiliation}
      </div>
    </div>
  );
};

export default ParticipantChip;
