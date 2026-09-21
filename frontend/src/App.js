import React, { useCallback, useEffect, useState } from 'react';
import HomeScreen from './components/HomeScreen';
import IntelligentDebateScreen from './components/IntelligentDebateScreen';
import BackgroundVideo from './components/BackgroundVideo';
import { readTopicFromUrl } from './utils/share';
import './App.css';

function App() {
  const [debateStarted, setDebateStarted] = useState(false);
  const [topic, setTopic] = useState('');
  const [controversyLevel, setControversyLevel] = useState(85);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [bgMode, setBgMode] = useState('home');
  const [seedTopic, setSeedTopic] = useState('');

  useEffect(() => {
    const fromUrl = readTopicFromUrl();
    if (fromUrl) setSeedTopic(fromUrl);
  }, []);

  const startDebate = useCallback((enteredTopic, opts = {}) => {
    const clean = (enteredTopic || '').trim();
    if (!clean) return;

    setIsTransitioning(true);
    setTimeout(() => {
      setTopic(clean);
      setControversyLevel(
        typeof opts.controversyLevel === 'number' ? opts.controversyLevel : 85
      );
      setDebateStarted(true);
      setBgMode('debate');
      setTimeout(() => setIsTransitioning(false), 80);
    }, 280);
  }, []);

  const handleReturnHome = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setDebateStarted(false);
      setSeedTopic(topic);
      setTopic('');
      setBgMode('home');
      setTimeout(() => setIsTransitioning(false), 80);
    }, 280);
  }, [topic]);

  const handlePhaseChange = useCallback((phase) => {
    if (phase === 'voting' || phase === 'result' || phase === 'signing' || phase === 'complete') {
      setBgMode('champions');
    } else if (phase === 'debating' || phase === 'casting') {
      setBgMode('debate');
    }
  }, []);

  return (
    <BackgroundVideo bgMode={bgMode}>
      <div className={`App ${isTransitioning ? 'transitioning' : ''}`}>
        {!debateStarted ? (
          <HomeScreen onBeginDebate={startDebate} initialTopic={seedTopic} />
        ) : (
          <IntelligentDebateScreen
            topic={topic}
            controversyLevel={controversyLevel}
            onReturnHome={handleReturnHome}
            onPhaseChange={handlePhaseChange}
          />
        )}
      </div>
    </BackgroundVideo>
  );
}

export default App;
