import React from 'react';
import ParticipantChip from './ParticipantChip';
import './DebateTable.css';

/**
 * DebateTable - Static header showing all debate participants
 *
 * Features:
 * - Displays all AI participants in a fixed grid
 * - Shows current speaker with visual highlight
 * - Organized by party affiliation
 * - Responsive layout (desktop: single row, mobile: wrapped)
 * - No shuffling or dynamic positioning
 */
const DebateTable = ({ participants = [], currentSpeakerIndex = null }) => {
  if (!participants || participants.length === 0) {
    return null;
  }

  // Group participants by party for optional organized display
  const groupedByParty = {
    Democrat: participants.filter(p => p.affiliation === 'Democrat'),
    Republican: participants.filter(p => p.affiliation === 'Republican'),
    Independent: participants.filter(p => p.affiliation === 'Independent')
  };

  const hasPartyGroups = Object.values(groupedByParty).some(group => group.length > 0);

  return (
    <div className="debate-table">
      <div className="debate-table__header">
        <h2 className="debate-table__title">The Table</h2>
        <div className="debate-table__subtitle">
          {participants.length} participants
        </div>
      </div>

      <div className="debate-table__participants">
        {participants.map((participant, index) => (
          <ParticipantChip
            key={participant.id || participant.name}
            name={participant.name}
            logo={participant.logo}
            affiliation={participant.affiliation}
            isActive={currentSpeakerIndex === index}
          />
        ))}
      </div>

      {/* Optional party legend */}
      {hasPartyGroups && (
        <div className="debate-table__legend">
          {groupedByParty.Democrat.length > 0 && (
            <div className="debate-table__legend-item debate-table__legend-item--democrat">
              <span className="debate-table__legend-count">{groupedByParty.Democrat.length}</span> Democrat
            </div>
          )}
          {groupedByParty.Republican.length > 0 && (
            <div className="debate-table__legend-item debate-table__legend-item--republican">
              <span className="debate-table__legend-count">{groupedByParty.Republican.length}</span> Republican
            </div>
          )}
          {groupedByParty.Independent.length > 0 && (
            <div className="debate-table__legend-item debate-table__legend-item--independent">
              <span className="debate-table__legend-count">{groupedByParty.Independent.length}</span> Independent
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DebateTable;
