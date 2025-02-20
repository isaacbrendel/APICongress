// src/components/DebaterCard.js
import React from 'react';
import './DebaterCard.css';

const DebaterCard = ({ name, logo, affiliation }) => {
  let bannerColor = '#333';
  if (affiliation === 'Republican') {
    bannerColor = '#CC0000';
  } else if (affiliation === 'Democrat') {
    bannerColor = '#003366';
  } else if (affiliation === 'Independent') {
    bannerColor = '#800080';
  }

  return (
    <div className="debater-card">
      <div className="debater-circle">
        <img src={logo} alt={name} className="debater-logo" />
      </div>
      <div className="debater-banner" style={{ backgroundColor: bannerColor }}>
        <span className="debater-name">{name}</span>
      </div>
    </div>
  );
};

export default DebaterCard;
