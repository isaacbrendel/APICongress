import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import './ProposalVoting.css';

/**
 * ELITE PROPOSAL VOTING INTERFACE
 * Users read full documents and vote on which passes
 */
const ProposalVoting = ({ proposals, onVote, topic }) => {
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [viewingProposal, setViewingProposal] = useState(null);

  if (!proposals) {
    return (
      <div className="proposal-voting">
        <div className="no-proposals">
          <h2>No Proposals Generated</h2>
          <p>Start a debate to generate proposals for voting</p>
        </div>
      </div>
    );
  }

  const { democrat, republican, independent } = proposals;

  const handleVote = (party) => {
    setSelectedProposal(party);
    if (onVote) {
      onVote(party);
    }
  };

  const handleViewProposal = (party) => {
    setViewingProposal(party);
  };

  const handleCloseViewer = () => {
    setViewingProposal(null);
  };

  const getProposalByParty = (party) => {
    switch(party) {
      case 'Democrat':
        return democrat;
      case 'Republican':
        return republican;
      case 'Independent':
        return independent;
      default:
        return null;
    }
  };

  const currentProposal = getProposalByParty(viewingProposal);

  return (
    <div className="proposal-voting">
      <div className="voting-header">
        <h1>📜 Policy Proposals</h1>
        <h2 className="topic-display">{topic}</h2>
        <p className="voting-instructions">
          Read each proposal and vote for which one should pass
        </p>
      </div>

      <div className="proposals-grid">
        {/* Democrat Proposal */}
        <div className="proposal-card democrat-card">
          <div className="proposal-header">
            <h3>🔵 Democrat Proposal</h3>
            <span className="word-count">{democrat?.wordCount || 0} words</span>
          </div>
          <div className="proposal-preview">
            {democrat?.content.substring(0, 200)}...
          </div>
          <div className="proposal-actions">
            <button
              className="btn-view"
              onClick={() => handleViewProposal('Democrat')}
            >
              📖 Read Full Proposal
            </button>
            <button
              className={`btn-vote democrat-vote ${selectedProposal === 'Democrat' ? 'voted' : ''}`}
              onClick={() => handleVote('Democrat')}
              disabled={selectedProposal !== null}
            >
              {selectedProposal === 'Democrat' ? '✓ Voted' : '🗳️ Vote for This'}
            </button>
          </div>
        </div>

        {/* Republican Proposal */}
        <div className="proposal-card republican-card">
          <div className="proposal-header">
            <h3>🔴 Republican Proposal</h3>
            <span className="word-count">{republican?.wordCount || 0} words</span>
          </div>
          <div className="proposal-preview">
            {republican?.content.substring(0, 200)}...
          </div>
          <div className="proposal-actions">
            <button
              className="btn-view"
              onClick={() => handleViewProposal('Republican')}
            >
              📖 Read Full Proposal
            </button>
            <button
              className={`btn-vote republican-vote ${selectedProposal === 'Republican' ? 'voted' : ''}`}
              onClick={() => handleVote('Republican')}
              disabled={selectedProposal !== null}
            >
              {selectedProposal === 'Republican' ? '✓ Voted' : '🗳️ Vote for This'}
            </button>
          </div>
        </div>

        {/* Independent Alignment */}
        <div className="proposal-card independent-card">
          <div className="proposal-header">
            <h3>⚪ Independent Position</h3>
            {independent?.confidence && (
              <span className="confidence-badge">
                {independent.confidence}% confident
              </span>
            )}
          </div>
          <div className="independent-alignment">
            <p className="alignment-text">
              <strong>Aligns with:</strong> {independent?.alignedWith || 'Analyzing...'}
            </p>
            {independent?.reasoning && (
              <p className="reasoning-text">
                <strong>Reasoning:</strong> {independent.reasoning}
              </p>
            )}
          </div>
          <div className="proposal-actions">
            <button
              className="btn-view"
              onClick={() => handleViewProposal('Independent')}
            >
              📖 Read Analysis
            </button>
          </div>
        </div>
      </div>

      {/* Voting Results */}
      {selectedProposal && (
        <div className="voting-results">
          <div className="results-box">
            <h2>✓ Vote Cast!</h2>
            <p className="results-text">
              You voted for the <strong>{selectedProposal}</strong> proposal
            </p>
            {independent?.alignedWith && (
              <p className="independent-note">
                Independent also supports: <strong>{independent.alignedWith}</strong>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {viewingProposal && currentProposal && (
        <div className="proposal-viewer-overlay" onClick={handleCloseViewer}>
          <div className="proposal-viewer" onClick={(e) => e.stopPropagation()}>
            <div className="viewer-header">
              <h2>
                {viewingProposal === 'Democrat' && '🔵 Democrat Proposal'}
                {viewingProposal === 'Republican' && '🔴 Republican Proposal'}
                {viewingProposal === 'Independent' && '⚪ Independent Analysis'}
              </h2>
              <button className="btn-close" onClick={handleCloseViewer}>✕</button>
            </div>
            <div className="viewer-content">
              <ReactMarkdown>{currentProposal.content}</ReactMarkdown>
            </div>
            <div className="viewer-footer">
              <button
                className={`btn-vote-from-viewer ${viewingProposal.toLowerCase()}-vote`}
                onClick={() => {
                  handleVote(viewingProposal);
                  handleCloseViewer();
                }}
                disabled={selectedProposal !== null || viewingProposal === 'Independent'}
              >
                {selectedProposal ? '✓ Already Voted' : `🗳️ Vote for ${viewingProposal}`}
              </button>
              <button className="btn-close-viewer" onClick={handleCloseViewer}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProposalVoting;
