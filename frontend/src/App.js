import React, { useState } from 'react';
import HomeScreen from './components/HomeScreen';
import IntelligentDebateScreen from './components/IntelligentDebateScreen';
import BackgroundVideo from './components/BackgroundVideo';
import './App.css';

function App() {
  const [debateStarted, setDebateStarted] = useState(false);
  const [topic, setTopic] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [bgMode, setBgMode] = useState('home'); // 'home' | 'debate' | 'voting' | 'signing'

  const startDebate = (enteredTopic) => {
    setIsTransitioning(true);

    setTimeout(() => {
      setTopic(enteredTopic);
      setDebateStarted(true);
      setBgMode('debate');

      setTimeout(() => {
        setIsTransitioning(false);
      }, 100);
    }, 400);
  };

  const handleReturnHome = () => {
    setIsTransitioning(true);

    setTimeout(() => {
      setDebateStarted(false);
      setTopic('');
      setBgMode('home');

      setTimeout(() => {
        setIsTransitioning(false);
      }, 100);
    }, 400);
  };

  const handlePhaseChange = (phase) => {
    if (phase === 'voting' || phase === 'complete' || phase === 'signing') {
      setBgMode('champions');
    } else if (phase === 'debating') {
      setBgMode('debate');
    }
  };

  return (
    <BackgroundVideo bgMode={bgMode}>
      <div className={`App ${isTransitioning ? 'transitioning' : ''}`}>
        {!debateStarted ? (
          <HomeScreen onBeginDebate={startDebate} />
        ) : (
          <IntelligentDebateScreen
            topic={topic}
            onReturnHome={handleReturnHome}
            onPhaseChange={handlePhaseChange}
          />
        )}
      </div>
    </BackgroundVideo>
  );
}

export default App;
