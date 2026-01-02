import React, { useState, useEffect } from 'react';
import './CongressTable.css';

/**
 * CONGRESS TABLE - The Last Supper of AI
 *
 * Displays AI agents in a dramatic table formation
 * Shows personality traits, relationships, and debate status
 */
const CongressTable = ({ agents, currentSpeaker, onAgentClick }) => {
  const [hoveredAgent, setHoveredAgent] = useState(null);

  // Arrange agents in a semi-circle table formation
  const getAgentPosition = (index, total) => {
    // Create a semi-circle arc from left to right
    const angle = (index / (total - 1)) * Math.PI; // 0 to PI (180 degrees)
    const radius = 35; // Distance from center
    const centerX = 50;
    const centerY = 60;

    return {
      left: centerX + radius * Math.cos(angle) + '%',
      top: centerY - radius * Math.sin(angle) * 0.6 + '%' // Flatten the arc
    };
  };

  // Get personality summary
  const getPersonalitySummary = (agent) => {
    if (!agent.personality) return '';

    const p = agent.personality;
    const traits = [];

    // Political
    if (p.progressive > 70) traits.push('Progressive');
    if (p.conservative > 70) traits.push('Conservative');

    // Behavioral
    if (p.aggression > 70) traits.push('Aggressive');
    if (p.cooperation > 70) traits.push('Cooperative');

    // Style
    if (p.analytical > 70) traits.push('Analytical');
    if (p.emotional > 70) traits.push('Passionate');

    return traits.slice(0, 3).join(', ');
  };

  // Get party color
  const getPartyColor = (party) => {
    switch (party) {
      case 'Democrat': return '#4A90E2';
      case 'Republican': return '#E24A4A';
      case 'Independent': return '#9B59B6';
      default: return '#95a5a6';
    }
  };

  // Get model icon/emoji
  const getModelIcon = (modelName) => {
    const icons = {
      'OpenAI': '🤖',
      'ChatGPT': '💬',
      'Claude': '🧠',
      'Gemini': '♊',
      'Grok': '🚀',
      'Cohere': '🔗'
    };
    return icons[modelName] || '🎭';
  };

  return (
    <div className="congress-table">
      {/* Table Surface - The center focus */}
      <div className="table-surface">
        <div className="table-glow"></div>
        <div className="table-label">AI CONGRESS</div>
      </div>

      {/* Agent Seats arranged in semi-circle */}
      {agents && agents.map((agent, index) => {
        const position = getAgentPosition(index, agents.length);
        const isSpeaking = currentSpeaker && currentSpeaker.id === agent.id;
        const isHovered = hoveredAgent === agent.id;

        return (
          <div
            key={agent.id}
            className={`congress-seat ${isSpeaking ? 'speaking' : ''} ${isHovered ? 'hovered' : ''}`}
            style={position}
            onMouseEnter={() => setHoveredAgent(agent.id)}
            onMouseLeave={() => setHoveredAgent(null)}
            onClick={() => onAgentClick && onAgentClick(agent)}
          >
            {/* Agent Avatar Circle */}
            <div
              className="agent-avatar"
              style={{ borderColor: getPartyColor(agent.party) }}
            >
              <div className="agent-icon">
                {getModelIcon(agent.model)}
              </div>

              {/* Speaking Indicator */}
              {isSpeaking && (
                <div className="speaking-pulse"></div>
              )}

              {/* Party Badge */}
              <div
                className="party-badge"
                style={{ background: getPartyColor(agent.party) }}
              >
                {agent.party?.charAt(0) || 'I'}
              </div>
            </div>

            {/* Agent Name */}
            <div className="agent-name">
              {agent.name}
            </div>

            {/* Model Label */}
            <div className="agent-model">{agent.model}</div>

            {/* Stats Bar */}
            <div className="agent-stats">
              <div className="stat-item" title="Debates Won">
                🏆 {agent.stats?.winRate || '0%'}
              </div>
              <div className="stat-item" title="Influence">
                ⭐ {agent.stats?.influence || 0}
              </div>
            </div>

            {/* Expanded Info on Hover */}
            {isHovered && (
              <div className="agent-details-popup">
                <div className="detail-row">
                  <strong>Generation:</strong> {agent.generation || 1}
                </div>
                <div className="detail-row">
                  <strong>Personality:</strong>
                  <div className="personality-tags">
                    {agent.personality && getPersonalitySummary(agent).split(', ').map((trait, i) => (
                      <span key={i} className="personality-tag">{trait}</span>
                    ))}
                  </div>
                </div>
                {agent.social && (
                  <div className="detail-row">
                    <strong>Social:</strong>
                    <span className="social-info">
                      {agent.social.allies} allies, {agent.social.rivals} rivals
                    </span>
                  </div>
                )}
                <div className="detail-row">
                  <strong>Expertise:</strong> {agent.expertise || 0} topics
                </div>
              </div>
            )}

            {/* Connection Lines to other agents (relationships) */}
            {agent.alliances && agent.alliances.length > 0 && (
              <svg className="relationship-lines">
                {/* Draw lines to allies - would need positions of other agents */}
              </svg>
            )}
          </div>
        );
      })}

      {/* Center Debate Topic */}
      {currentSpeaker && (
        <div className="center-focus">
          <div className="topic-indicator">
            Currently Speaking: <strong>{currentSpeaker.name}</strong>
          </div>
        </div>
      )}
    </div>
  );
};

export default CongressTable;
