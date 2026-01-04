import React, { useState } from 'react';
import ProposalVoting from '../components/ProposalVoting';
import './ProposalPage.css';

const ProposalPage = () => {
  const [topic, setTopic] = useState('');
  const [proposals, setProposals] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [voted, setVoted] = useState(null);

  const generateProposals = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }

    setLoading(true);
    setError(null);
    setProposals(null);

    try {
      console.log('[PROPOSAL PAGE] Generating proposals for:', topic);

      const response = await fetch('/api/generate-proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          topic,
          controversyLevel: 100
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[PROPOSAL PAGE] Proposals received:', data);

      setProposals(data.proposals);
    } catch (err) {
      console.error('[PROPOSAL PAGE] Error:', err);
      setError(`Failed to generate proposals: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = (party) => {
    console.log(`[PROPOSAL PAGE] User voted for: ${party}`);
    setVoted(party);

    // Could send vote to backend here
    fetch('/api/vote/proposal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        topic,
        votedFor: party,
        timestamp: Date.now()
      })
    }).catch(err => console.error('Failed to record vote:', err));
  };

  if (proposals) {
    return (
      <div className="proposal-page">
        <ProposalVoting
          proposals={proposals}
          onVote={handleVote}
          topic={topic}
        />
        <button
          className="btn-new-debate"
          onClick={() => {
            setProposals(null);
            setTopic('');
            setVoted(null);
          }}
        >
          🔄 New Debate
        </button>
      </div>
    );
  }

  return (
    <div className="proposal-page-input">
      <div className="input-container">
        <h1 className="title">🏛️ APICongress</h1>
        <h2 className="subtitle">Elite Policy Debate System</h2>

        <div className="topic-input-section">
          <label htmlFor="topic-input">Enter Debate Topic:</label>
          <input
            id="topic-input"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') generateProposals();
            }}
            placeholder="e.g., Should we increase the minimum wage to $15/hour?"
            disabled={loading}
            className="topic-input"
          />

          <button
            onClick={generateProposals}
            disabled={loading || !topic.trim()}
            className="btn-generate"
          >
            {loading ? '⏳ Generating...' : '🚀 Generate Proposals'}
          </button>

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          {loading && (
            <div className="loading-status">
              <div className="loading-spinner"></div>
              <p>🤖 AI models debating...</p>
              <p>📝 Generating policy documents...</p>
              <p>⚖️ Independent analyzing positions...</p>
            </div>
          )}
        </div>

        <div className="info-section">
          <h3>How It Works:</h3>
          <ol>
            <li>🔵 Democrat and 🔴 Republican AI models debate the topic</li>
            <li>📜 Each side generates a full policy proposal</li>
            <li>⚪ Independent AI analyzes both and picks a side</li>
            <li>🗳️ You read all proposals and vote for the winner</li>
          </ol>

          <div className="features">
            <div className="feature">
              <strong>✅ Direct Topic Addressing</strong>
              <p>No generic platitudes - specific arguments only</p>
            </div>
            <div className="feature">
              <strong>✅ AI-Powered Independent</strong>
              <p>Independent uses AI to analyze and align</p>
            </div>
            <div className="feature">
              <strong>✅ Full Document Voting</strong>
              <p>Read complete proposals before voting</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProposalPage;
