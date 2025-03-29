// src/App.js
import React, { useState } from 'react';
import HomeScreen from './components/HomeScreen';
import DebateScreen from './components/DebateScreen';
import './App.css';

function App() {
  const [debateStarted, setDebateStarted] = useState(false);
  const [topic, setTopic] = useState('');
  const [models, setModels] = useState([]);

  // When the user submits the topic, initialize 5 debaters.
  const startDebate = (enteredTopic) => {
    setTopic(enteredTopic);
    const initialModels = [
      {
        id: 1,
        name: 'ChatGPT',
        logo: process.env.PUBLIC_URL + '/logos/chatgpt.png',
        affiliation: '',
        isFinalized: false,
      },
      {
        id: 2,
        name: 'Claude',
        logo: process.env.PUBLIC_URL + '/logos/claude.png',
        affiliation: '',
        isFinalized: false,
      },
      {
        id: 3,
        name: 'Gemini',
        logo: process.env.PUBLIC_URL + '/logos/gemini.png',
        affiliation: '',
        isFinalized: false,
      },
      {
        id: 4,
        name: 'Grok',
        logo: process.env.PUBLIC_URL + '/logos/grok.png',
        affiliation: '',
        isFinalized: false,
      },
      {
        id: 5,
        name: 'Cohere',
        logo: process.env.PUBLIC_URL + '/logos/cohere.png',
        affiliation: '',
        isFinalized: false,
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