// src/App.js
import React, { useState, useEffect } from 'react';
import HomeScreen from './components/HomeScreen';
import DebateScreen from './components/DebateScreen';
import IntelligentDebateScreen from './components/IntelligentDebateScreen';
import BackgroundVideo from './components/BackgroundVideo';
import './App.css';

function App() {
  const [debateStarted, setDebateStarted] = useState(false);
  const [topic, setTopic] = useState('');
  const [models, setModels] = useState([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [useIntelligentMode, setUseIntelligentMode] = useState(true); // Default to intelligent mode

  // Initialize models with proper defaults - protection against uninitialized variable
  useEffect(() => {
    if (debateStarted && models.length > 0) {
      // Make sure all models have required properties
      const validatedModels = models.map(model => ({
        ...model,
        id: model.id || Math.floor(Math.random() * 10000),
        affiliation: model.affiliation || 'Independent',
        isFinalized: model.isFinalized || false,
        cssClass: model.cssClass || (model.affiliation ? model.affiliation.toLowerCase() : 'independent')
      }));
      
      // Update models if any were fixed
      if (JSON.stringify(validatedModels) !== JSON.stringify(models)) {
        console.log("Fixing models with required properties");
        setModels(validatedModels);
      }
    }
  }, [debateStarted, models]);

  // When the user submits the topic, initialize 5 debaters with fade transition.
  const startDebate = (enteredTopic) => {
    setIsTransitioning(true);

    // Wait for fade out
    setTimeout(() => {
      setTopic(enteredTopic);
    
    // Validate image paths before creating models
    const validateImagePath = (path) => {
      // Ensure path is a valid string and matches expected pattern
      if (typeof path !== 'string' || !path) {
        console.error('Invalid image path:', path);
        return process.env.PUBLIC_URL + '/logos/default.png';
      }

      // Only allow paths from /logos/ directory
      // eslint-disable-next-line no-useless-escape
      const sanitizedPath = path.replace(/[^a-zA-Z0-9\/._-]/g, '');
      if (!sanitizedPath.includes('/logos/')) {
        console.error('Image path must be from /logos/ directory:', path);
        return process.env.PUBLIC_URL + '/logos/default.png';
      }

      return sanitizedPath;
    };

    // Ensure models have all required properties with validated images
    const initialModels = [
      {
        id: 1,
        name: 'ChatGPT',
        logo: validateImagePath(process.env.PUBLIC_URL + '/logos/chatgpt.png'),
        affiliation: '',
        isFinalized: false,
        cssClass: ''
      },
      {
        id: 2,
        name: 'Claude',
        logo: validateImagePath(process.env.PUBLIC_URL + '/logos/claude.png'),
        affiliation: '',
        isFinalized: false,
        cssClass: ''
      },
      {
        id: 3,
        name: 'Gemini',
        logo: validateImagePath(process.env.PUBLIC_URL + '/logos/gemini.png'),
        affiliation: '',
        isFinalized: false,
        cssClass: ''
      },
      {
        id: 4,
        name: 'Grok',
        logo: validateImagePath(process.env.PUBLIC_URL + '/logos/grok.png'),
        affiliation: '',
        isFinalized: false,
        cssClass: ''
      },
      {
        id: 5,
        name: 'Cohere',
        logo: validateImagePath(process.env.PUBLIC_URL + '/logos/cohere.png'),
        affiliation: '',
        isFinalized: false,
        cssClass: ''
      },
    ];


      setModels(initialModels);
      setDebateStarted(true);

      // Fade back in
      setTimeout(() => {
        setIsTransitioning(false);
      }, 100);
    }, 400);
  };

  // Function to return to home screen with fade transition
  const handleReturnHome = () => {
    setIsTransitioning(true);

    // Wait for fade out
    setTimeout(() => {
      setDebateStarted(false);
      setTopic('');
      setModels([]);

      // Fade back in
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