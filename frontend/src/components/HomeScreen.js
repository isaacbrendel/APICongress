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
      {/* Top Floating Title Header */}
      <header className="home-top-header">
        <h1 className="title">APICONGRESS</h1>
        <p className="subtitle">AI POLITICAL DEBATE SIMULATOR</p>
      </header>

      {/* Bottom Floating Input Console (Center Graphic Unblocked) */}
      <div className="home-bottom-console">
        <form onSubmit={handleSubmit} className="topic-form-horizontal">
          <input
            ref={inputRef}
            type="text"
            placeholder="Enter debate topic (e.g. Should AI be regulated?)"
            className="topic-input-horizontal"
            autoFocus
          />
          <button type="submit" className="begin-button-horizontal">
            Begin Debate ➔
          </button>
        </form>
      </div>
    </div>
  );
};

export default HomeScreen;
