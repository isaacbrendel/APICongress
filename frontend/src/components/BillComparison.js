import React, { useState } from 'react';
import './BillComparison.css';

/**
 * COMPETITIVE BILL COMPARISON INTERFACE
 * Side-by-side comparison of Democrat vs Republican legislative proposals
 * with voting and presidential veto power
 */
const BillComparison = ({ democratBill, republicanBill, onVote, onVeto, onNewDebate }) => {
  const [selectedBill, setSelectedBill] = useState(null);
  const [showVetoConfirm, setShowVetoConfirm] = useState(false);
  const [vetoExecuted, setVetoExecuted] = useState(false);

  const handleBillSelect = (party) => {
    setSelectedBill(party);
  };

  const handleVote = () => {
    if (selectedBill) {
      onVote(selectedBill);
    }
  };

  const handleVeto = () => {
    setShowVetoConfirm(true);
  };

  const confirmVeto = () => {
    setVetoExecuted(true);
    setTimeout(() => {
      onVeto();
    }, 2000);
  };

  if (vetoExecuted) {
    return (
      <div className="bill-comparison-container">
        <div className="veto-animation">
          <div className="veto-stamp">
            <div className="veto-text">VETOED</div>
            <div className="veto-subtext">Presidential Authority Exercised</div>
          </div>
          <div className="veto-message">
            Both bills have been rejected. Congress must draft new legislation.
          </div>
          <button className="new-debate-button" onClick={onNewDebate}>
            Start New Debate
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bill-comparison-container">
      {/* Header */}
      <div className="bill-comparison-header">
        <h1 className="comparison-title">⚖️ Legislative Proposals</h1>
        <p className="comparison-subtitle">
          Review both bills and decide which becomes law, or exercise your veto power
        </p>
      </div>

      {/* Side-by-side bill display */}
      <div className="bills-grid">
        {/* Democrat Bill */}
        <div
          className={`bill-card democrat ${selectedBill === 'Democrat' ? 'selected' : ''}`}
          onClick={() => handleBillSelect('Democrat')}
        >
          <div className="bill-header democrat-header">
            <div className="bill-party-badge">
              <span className="party-icon">🔵</span>
              <span className="party-name">Democrat</span>
            </div>
            <div className="bill-meta">
              {democratBill.wordCount} words
            </div>
          </div>

          <div className="bill-title">{democratBill.title}</div>

          <div className="bill-content">
            <pre className="bill-text">{democratBill.fullText}</pre>
          </div>

          {selectedBill === 'Democrat' && (
            <div className="selection-indicator">
              <span className="checkmark">✓</span> Selected
            </div>
          )}
        </div>

        {/* Republican Bill */}
        <div
          className={`bill-card republican ${selectedBill === 'Republican' ? 'selected' : ''}`}
          onClick={() => handleBillSelect('Republican')}
        >
          <div className="bill-header republican-header">
            <div className="bill-party-badge">
              <span className="party-icon">🔴</span>
              <span className="party-name">Republican</span>
            </div>
            <div className="bill-meta">
              {republicanBill.wordCount} words
            </div>
          </div>

          <div className="bill-title">{republicanBill.title}</div>

          <div className="bill-content">
            <pre className="bill-text">{republicanBill.fullText}</pre>
          </div>

          {selectedBill === 'Republican' && (
            <div className="selection-indicator">
              <span className="checkmark">✓</span> Selected
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="bill-actions">
        <button
          className="sign-bill-button"
          onClick={handleVote}
          disabled={!selectedBill}
        >
          <span className="button-icon">✍️</span>
          <span className="button-text">Sign Into Law</span>
          {selectedBill && <span className="button-party">({selectedBill} Bill)</span>}
        </button>

        <button
          className="veto-button"
          onClick={handleVeto}
        >
          <span className="button-icon">⛔</span>
          <span className="button-text">VETO BOTH</span>
        </button>
      </div>

      {/* Veto confirmation modal */}
      {showVetoConfirm && (
        <div className="veto-modal-backdrop" onClick={() => setShowVetoConfirm(false)}>
          <div className="veto-modal" onClick={(e) => e.stopPropagation()}>
            <div className="veto-modal-header">
              <span className="veto-modal-icon">⚠️</span>
              <h2>Confirm Presidential Veto</h2>
            </div>
            <div className="veto-modal-body">
              <p>You are about to reject <strong>BOTH</strong> legislative proposals.</p>
              <p>This will send Congress back to the drawing board.</p>
              <p className="veto-warning">This action cannot be undone.</p>
            </div>
            <div className="veto-modal-actions">
              <button
                className="veto-cancel-button"
                onClick={() => setShowVetoConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="veto-confirm-button"
                onClick={confirmVeto}
              >
                <span>⛔</span> Confirm Veto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillComparison;
