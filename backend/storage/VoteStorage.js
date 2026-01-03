const fs = require('fs');
const path = require('path');

/**
 * PERSISTENT VOTE STORAGE SYSTEM
 * Manages message votes with file-based persistence for long-term RL training
 */
class VoteStorage {
  constructor() {
    this.storageDir = path.join(__dirname, '../memory/votes');
    this.votesFile = path.join(this.storageDir, 'message_votes.json');
    this.votes = {};
    this.initialized = false;

    console.log('[VOTE STORAGE] Initializing persistent vote storage');
    this.ensureStorageDirectory();
    this.loadVotes();
  }

  /**
   * Ensure storage directory exists
   */
  ensureStorageDirectory() {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
      console.log('[VOTE STORAGE] ✓ Created storage directory:', this.storageDir);
    } else {
      console.log('[VOTE STORAGE] ✓ Storage directory exists:', this.storageDir);
    }
  }

  /**
   * Load votes from persistent storage
   */
  loadVotes() {
    try {
      if (fs.existsSync(this.votesFile)) {
        const data = fs.readFileSync(this.votesFile, 'utf8');
        this.votes = JSON.parse(data);
        const voteCount = Object.keys(this.votes).length;
        console.log(`[VOTE STORAGE] ✓ Loaded ${voteCount} votes from disk`);
        this.initialized = true;
      } else {
        console.log('[VOTE STORAGE] ✓ No existing votes file, starting fresh');
        this.votes = {};
        this.initialized = true;
        this.saveVotes(); // Create initial file
      }
    } catch (error) {
      console.error('[VOTE STORAGE] ✗ Error loading votes:', error.message);
      this.votes = {};
      this.initialized = true;
    }
  }

  /**
   * Save votes to persistent storage
   */
  saveVotes() {
    try {
      fs.writeFileSync(this.votesFile, JSON.stringify(this.votes, null, 2), 'utf8');
      console.log(`[VOTE STORAGE] ✓ Saved ${Object.keys(this.votes).length} votes to disk`);
      return true;
    } catch (error) {
      console.error('[VOTE STORAGE] ✗ Error saving votes:', error.message);
      return false;
    }
  }

  /**
   * Record a vote
   */
  recordVote(messageId, voteData) {
    if (!this.initialized) {
      console.warn('[VOTE STORAGE] ⚠ Storage not initialized, initializing now');
      this.loadVotes();
    }

    this.votes[messageId] = {
      ...voteData,
      recordedAt: Date.now()
    };

    console.log(`[VOTE STORAGE] ✓ Recorded ${voteData.voteType} vote for message ${messageId} (${voteData.affiliation})`);

    // Save immediately for data integrity
    this.saveVotes();

    return this.votes[messageId];
  }

  /**
   * Remove a vote
   */
  removeVote(messageId) {
    if (this.votes[messageId]) {
      const removed = this.votes[messageId];
      delete this.votes[messageId];
      console.log(`[VOTE STORAGE] ✓ Removed vote for message ${messageId}`);
      this.saveVotes();
      return removed;
    }
    return null;
  }

  /**
   * Get vote for a specific message
   */
  getVote(messageId) {
    return this.votes[messageId] || null;
  }

  /**
   * Get all votes
   */
  getAllVotes() {
    return { ...this.votes };
  }

  /**
   * Get votes filtered by criteria
   */
  getVotesBy(criteria) {
    const { topic, affiliation, voteType, since } = criteria;

    return Object.entries(this.votes)
      .filter(([_, vote]) => {
        if (topic && vote.topic !== topic) return false;
        if (affiliation && vote.affiliation !== affiliation) return false;
        if (voteType && vote.voteType !== voteType) return false;
        if (since && vote.timestamp < since) return false;
        return true;
      })
      .reduce((acc, [id, vote]) => {
        acc[id] = vote;
        return acc;
      }, {});
  }

  /**
   * Get vote statistics for a party/topic
   */
  getStats(affiliation, topic = null) {
    const votes = Object.values(this.votes).filter(v => {
      if (v.affiliation !== affiliation) return false;
      if (topic && v.topic !== topic) return false;
      return true;
    });

    const upvotes = votes.filter(v => v.voteType === 'up').length;
    const downvotes = votes.filter(v => v.voteType === 'down').length;
    const total = votes.length;
    const approvalRate = total > 0 ? ((upvotes / total) * 100).toFixed(1) : '0';

    console.log(`[VOTE STORAGE] Stats for ${affiliation}${topic ? ` on "${topic}"` : ''}: ${upvotes}↑ ${downvotes}↓ (${approvalRate}% approval)`);

    return {
      upvotes,
      downvotes,
      total,
      approvalRate: parseFloat(approvalRate),
      netScore: upvotes - downvotes
    };
  }

  /**
   * Clear all votes (for testing/reset)
   */
  clearAllVotes() {
    const count = Object.keys(this.votes).length;
    this.votes = {};
    this.saveVotes();
    console.log(`[VOTE STORAGE] ✓ Cleared ${count} votes`);
    return count;
  }

  /**
   * Get recent vote trend (last N votes)
   */
  getRecentTrend(affiliation, count = 10) {
    const recentVotes = Object.values(this.votes)
      .filter(v => v.affiliation === affiliation)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, count);

    const upvotes = recentVotes.filter(v => v.voteType === 'up').length;
    const downvotes = recentVotes.filter(v => v.voteType === 'down').length;

    return {
      upvotes,
      downvotes,
      total: recentVotes.length,
      trend: upvotes > downvotes ? 'improving' : downvotes > upvotes ? 'declining' : 'stable'
    };
  }
}

// Singleton instance
let instance = null;

module.exports = {
  getInstance: () => {
    if (!instance) {
      instance = new VoteStorage();
    }
    return instance;
  },
  VoteStorage
};
