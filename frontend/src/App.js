// src/App.js
import React, { useState, useEffect } from 'react';
import HomeScreen from './components/HomeScreen';
import DebateScreen from './components/DebateScreen';
import './App.css';

function App() {
  const [debateStarted, setDebateStarted] = useState(false);
  const [topic, setTopic] = useState('');
  const [models, setModels] = useState([]);

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

  // When the user submits the topic, initialize 5 debaters.
  const startDebate = (enteredTopic) => {
    setTopic(enteredTopic);
    
    // Ensure models have all required properties
    const initialModels = [
      {
        id: 1,
        name: 'ChatGPT',
        logo: process.env.PUBLIC_URL + '/logos/chatgpt.png',
        affiliation: '',
        isFinalized: false,
        cssClass: ''
      },
      {
        id: 2,
        name: 'Claude',
        logo: process.env.PUBLIC_URL + '/logos/claude.png',
        affiliation: '',
        isFinalized: false,
        cssClass: ''
      },
      {
        id: 3,
        name: 'Gemini',
        logo: process.env.PUBLIC_URL + '/logos/gemini.png',
        affiliation: '',
        isFinalized: false,
        cssClass: ''
      },
      {
        id: 4,
        name: 'Grok',
        logo: process.env.PUBLIC_URL + '/logos/grok.png',
        affiliation: '',
        isFinalized: false,
        cssClass: ''
      },
      {
        id: 5,
        name: 'Cohere',
        logo: process.env.PUBLIC_URL + '/logos/cohere.png',
        affiliation: '',
        isFinalized: false,
        cssClass: ''
      },
    ];
    
    setModels(initialModels);
    setDebateStarted(true);
  };

  // Function to return to home screen
  const handleReturnHome = () => {
    setDebateStarted(false);
    setTopic('');
    setModels([]);
  };

  return (
    <div className="App">
      {!debateStarted ? (
        <HomeScreen onBeginDebate={startDebate} />
      ) : (
        <DebateScreen 
          topic={topic} 
          models={models} 
          setModels={setModels} 
          onReturnHome={handleReturnHome}
        />
      )}
    </div>
  );
}

export default App;