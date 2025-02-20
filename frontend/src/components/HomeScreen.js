// src/components/HomeScreen.js
import React, { useRef } from 'react';
import './HomeScreen.css';

const HomeScreen = ({ onBeginDebate }) => {
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = inputRef.current.value.trim();
    if (text) {
      onBeginDebate(text);
    }
  };

  return (
    <div className="home-screen">
      <div
        className="blurred-bg"
        style={{
          backgroundImage: `url(${process.env.PUBLIC_URL}/images/GoldenCongress.png)`,
        }}
      ></div>
      <div className="welcome-card">
        <h1 className="title">APICongress</h1>
        <p className="subtitle">Enter your debate topic below.</p>
        <form onSubmit={handleSubmit} className="topic-form">
          <input
            ref={inputRef}
            type="text"
            placeholder="e.g. Should AI be regulated?"
            className="topic-input"
          />
          <button type="submit" className="begin-button">
            Begin Debate
          </button>
        </form>
      </div>
    </div>
  );
};

export default HomeScreen;
