// src/components/TopicBanner.js
import React, { forwardRef } from 'react';
import './TopicBanner.css';

const TopicBanner = forwardRef(({ topic }, ref) => {
  return (
    <div
      className="topic-banner"
      ref={ref}
      style={{
        backgroundImage: `url(${process.env.PUBLIC_URL}/images/PaperBanner.png)`,
      }}
    >
      <div className="banner-text">{topic}</div>
    </div>
  );
});

TopicBanner.displayName = 'TopicBanner';
export default TopicBanner;
