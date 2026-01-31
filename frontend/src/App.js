import React, { useState } from 'react';
import HomeScreen from './components/HomeScreen';
import IntelligentDebateScreen from './components/IntelligentDebateScreen';
import BackgroundVideo from './components/BackgroundVideo';
import './App.css';

function App() {
  const [debateStarted, setDebateStarted] = useState(false);
  const [topic, setTopic] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const startDebate = (enteredTopic) => {
    setIsTransitioning(true);

    setTimeout(() => {
      setTopic(enteredTopic);
      setDebateStarted(true);

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

      setTimeout(() => {
        setIsTransitioning(false);
      }, 100);
    }, 400);
  };

  return (
    <BackgroundVideo isDebateScreen={debateStarted}>
      <div className={`App ${isTransitioning ? 'transitioning' : ''}`}>
        {!debateStarted ? (
          <HomeScreen onBeginDebate={startDebate} />
        ) : (
          <IntelligentDebateScreen
            topic={topic}
            onReturnHome={handleReturnHome}
          />
        )}
      </div>
    </BackgroundVideo>
  );
}

export default App;
