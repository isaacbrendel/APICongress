const fs = require('fs').promises;
const path = require('path');

/**
 * INTELLIGENT AGENT SYSTEM
 *
 * Represents a congressional representative AI agent with:
 * - Persistent memory and learning
 * - Evolving personality across multiple dimensions
 * - Research and collaboration capabilities
 * - Relationship dynamics with other agents
 * - Performance-based strategy adaptation
 */
class Agent {
  constructor(config) {
    // Core identity
    this.id = config.id || this.generateId();
    this.name = config.name || `Representative ${this.id}`;
    this.model = config.model || 'Claude'; // Which LLM powers this agent

    // Personality dimensions (0-100 scales)
    this.personality = {
      // Political spectrum
      progressive: config.personality?.progressive ?? 50,
      conservative: config.personality?.conservative ?? 50,
      libertarian: config.personality?.libertarian ?? 50,
      authoritarian: config.personality?.authoritarian ?? 50,

      // Moral/ethical dimensions
      religiosity: config.personality?.religiosity ?? 50,
      morality: config.personality?.morality ?? 50,
      pragmatism: config.personality?.pragmatism ?? 50,
      idealism: config.personality?.idealism ?? 50,

      // Behavioral traits
      aggression: config.personality?.aggression ?? 50,
      cooperation: config.personality?.cooperation ?? 50,
      selfishness: config.personality?.selfishness ?? 50,
      altruism: config.personality?.altruism ?? 50,

      // Debate style
      analytical: config.personality?.analytical ?? 50,
      emotional: config.personality?.emotional ?? 50,
      humorous: config.personality?.humorous ?? 50,
      confrontational: config.personality?.confrontational ?? 50,

      // Cultural/social dimensions
      woke: config.personality?.woke ?? 50,
      traditional: config.personality?.traditional ?? 50,
      populist: config.personality?.populist ?? 50,
      elitist: config.personality?.elitist ?? 50
    };

    // Party affiliation (can change over time)
    this.party = config.party || 'Independent';

    // Memory and learning
    this.memory = {
      debateHistory: [], // Past debates participated in
      positions: {}, // Positions on various topics
      strategies: {}, // What strategies worked/failed
      learnings: [], // Key learnings from past debates
      opponentPatterns: {} // Patterns observed in other agents
    };

    // Relationships with other agents (-100 to +100)
    this.relationships = {}; // { agentId: relationshipScore }

    // Coalitions and alliances
    this.coalitions = []; // Array of coalition IDs
    this.alliances = []; // Array of agent IDs allied with
    this.rivalries = []; // Array of agent IDs rivalrous with

    // Performance tracking
    this.performance = {
      debatesParticipated: 0,
      debatesWon: 0,
      argumentsUpvoted: 0,
      argumentsDownvoted: 0,
      billsProposed: 0,
      billsPassed: 0,
      influenceScore: 0
    };

    // Knowledge and expertise
    this.expertise = {}; // { topic: proficiencyLevel }
    this.knowledgeBase = []; // Array of researched facts and positions

    // Evolution tracking
    this.generation = config.generation || 1;
    this.evolutionHistory = []; // Track how personality has changed

    // File paths
    this.profilePath = path.join(__dirname, '../memory/agent_profiles', `${this.id}.json`);
    this.knowledgeBasePath = path.join(__dirname, '../memory/knowledge_bases', `${this.id}.json`);
  }

  /**
   * Generate unique agent ID
   */
  generateId() {
    return `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * PERSONALITY SYSTEM
   * Get current personality profile for prompting
   */
  getPersonalityProfile() {
    const p = this.personality;

    // Determine dominant traits
    const traits = [];

    // Political
    if (p.progressive > 70) traits.push('strongly progressive');
    else if (p.progressive > 55) traits.push('progressive');
    if (p.conservative > 70) traits.push('strongly conservative');
    else if (p.conservative > 55) traits.push('conservative');

    // Moral
    if (p.religiosity > 70) traits.push('deeply religious');
    else if (p.religiosity > 55) traits.push('faith-oriented');
    if (p.pragmatism > 70) traits.push('highly pragmatic');
    if (p.idealism > 70) traits.push('strongly idealistic');

    // Behavioral
    if (p.aggression > 70) traits.push('aggressive');
    if (p.cooperation > 70) traits.push('collaborative');
    if (p.selfishness > 70) traits.push('self-interested');
    if (p.altruism > 70) traits.push('altruistic');

    // Cultural
    if (p.woke > 70) traits.push('socially progressive');
    if (p.traditional > 70) traits.push('traditional values');
    if (p.populist > 70) traits.push('populist');

    // Debate style
    if (p.analytical > 70) traits.push('data-driven');
    if (p.emotional > 70) traits.push('emotionally compelling');
    if (p.humorous > 70) traits.push('witty');
    if (p.confrontational > 70) traits.push('confrontational');

    return {
      summary: traits.join(', '),
      traits: traits,
      raw: p
    };
  }

  /**
   * MEMORY SYSTEM
   * Remember a debate turn
   */
  rememberDebate(debateData) {
    this.memory.debateHistory.push({
      timestamp: new Date().toISOString(),
      topic: debateData.topic,
      myArgument: debateData.myArgument,
      opponentArguments: debateData.opponentArguments,
      outcome: debateData.outcome,
      votesReceived: debateData.votesReceived,
      strategyUsed: debateData.strategyUsed
    });

    // Keep only last 50 debates in memory (for performance)
    if (this.memory.debateHistory.length > 50) {
      this.memory.debateHistory = this.memory.debateHistory.slice(-50);
    }

    // Update performance tracking
    this.performance.debatesParticipated++;
    if (debateData.outcome === 'won') {
      this.performance.debatesWon++;
    }
    this.performance.argumentsUpvoted += debateData.votesReceived?.upvotes || 0;
    this.performance.argumentsDownvoted += debateData.votesReceived?.downvotes || 0;
  }

  /**
   * Update position on a topic based on learning
   */
  updatePosition(topic, position, confidence) {
    this.memory.positions[topic] = {
      stance: position,
      confidence: confidence,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Learn from debate outcome
   */
  learnFromDebate(strategyUsed, wasEffective) {
    if (!this.memory.strategies[strategyUsed]) {
      this.memory.strategies[strategyUsed] = {
        timesUsed: 0,
        successCount: 0,
        effectiveness: 0
      };
    }

    const strategy = this.memory.strategies[strategyUsed];
    strategy.timesUsed++;
    if (wasEffective) {
      strategy.successCount++;
    }
    strategy.effectiveness = strategy.successCount / strategy.timesUsed;
  }

  /**
   * RELATIONSHIP SYSTEM
   * Update relationship with another agent
   */
  updateRelationship(agentId, delta, reason) {
    if (!this.relationships[agentId]) {
      this.relationships[agentId] = {
        score: 0,
        history: []
      };
    }

    const rel = this.relationships[agentId];
    rel.score = Math.max(-100, Math.min(100, rel.score + delta));
    rel.history.push({
      timestamp: new Date().toISOString(),
      delta: delta,
      reason: reason,
      newScore: rel.score
    });

    // Keep only last 20 interactions
    if (rel.history.length > 20) {
      rel.history = rel.history.slice(-20);
    }

    // Update alliances/rivalries
    if (rel.score > 60 && !this.alliances.includes(agentId)) {
      this.alliances.push(agentId);
      this.rivalries = this.rivalries.filter(id => id !== agentId);
    } else if (rel.score < -60 && !this.rivalries.includes(agentId)) {
      this.rivalries.push(agentId);
      this.alliances = this.alliances.filter(id => id !== agentId);
    }
  }

  /**
   * Get relationship status with another agent
   */
  getRelationshipWith(agentId) {
    const rel = this.relationships[agentId];
    if (!rel) return { score: 0, status: 'neutral' };

    let status = 'neutral';
    if (rel.score > 60) status = 'strong ally';
    else if (rel.score > 30) status = 'ally';
    else if (rel.score < -60) status = 'strong rival';
    else if (rel.score < -30) status = 'rival';

    return {
      score: rel.score,
      status: status,
      recentInteractions: rel.history.slice(-5)
    };
  }

  /**
   * EVOLUTION SYSTEM
   * Evolve personality based on experiences
   */
  evolve(reason) {
    // Save current state to history
    this.evolutionHistory.push({
      timestamp: new Date().toISOString(),
      generation: this.generation,
      personality: { ...this.personality },
      reason: reason
    });

    // Keep only last 10 evolution snapshots
    if (this.evolutionHistory.length > 10) {
      this.evolutionHistory = this.evolutionHistory.slice(-10);
    }

    this.generation++;
  }

  /**
   * Adapt personality based on performance
   */
  adaptPersonality(dimension, delta, reason) {
    const oldValue = this.personality[dimension];
    this.personality[dimension] = Math.max(0, Math.min(100, oldValue + delta));

    console.log(`[AGENT EVOLUTION] ${this.name}: ${dimension} ${oldValue} -> ${this.personality[dimension]} (${reason})`);

    // Track significant changes
    if (Math.abs(delta) > 10) {
      this.evolve(`${dimension} changed significantly: ${reason}`);
    }
  }

  /**
   * KNOWLEDGE SYSTEM
   * Add to knowledge base
   */
  addKnowledge(topic, fact, source) {
    this.knowledgeBase.push({
      topic: topic,
      fact: fact,
      source: source,
      timestamp: new Date().toISOString(),
      confidence: 1.0
    });

    // Update expertise
    if (!this.expertise[topic]) {
      this.expertise[topic] = 1;
    } else {
      this.expertise[topic] = Math.min(100, this.expertise[topic] + 1);
    }
  }

  /**
   * Get relevant knowledge for a topic
   */
  getRelevantKnowledge(topic, limit = 5) {
    if (!this.knowledgeBase || !Array.isArray(this.knowledgeBase)) {
      this.knowledgeBase = [];
      return [];
    }
    return this.knowledgeBase
      .filter(item => item.topic && item.topic.toLowerCase().includes(topic.toLowerCase()))
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
      .slice(0, limit);
  }

  /**
   * PERSISTENCE SYSTEM
   * Save agent state to disk
   */
  async save() {
    try {
      const agentData = {
        id: this.id,
        name: this.name,
        model: this.model,
        personality: this.personality,
        party: this.party,
        memory: this.memory,
        relationships: this.relationships,
        coalitions: this.coalitions,
        alliances: this.alliances,
        rivalries: this.rivalries,
        performance: this.performance,
        expertise: this.expertise,
        generation: this.generation,
        evolutionHistory: this.evolutionHistory,
        lastSaved: new Date().toISOString()
      };

      await fs.writeFile(this.profilePath, JSON.stringify(agentData, null, 2));

      // Save knowledge base separately (can get large)
      const knowledgeData = {
        agentId: this.id,
        knowledgeBase: this.knowledgeBase,
        lastUpdated: new Date().toISOString()
      };

      await fs.writeFile(this.knowledgeBasePath, JSON.stringify(knowledgeData, null, 2));

      console.log(`[AGENT] Saved ${this.name} (${this.id}) to disk`);
      return true;
    } catch (error) {
      console.error(`[AGENT] Failed to save ${this.name}:`, error);
      return false;
    }
  }

  /**
   * Load agent state from disk
   */
  async load() {
    try {
      const profileData = await fs.readFile(this.profilePath, 'utf8');
      const agentData = JSON.parse(profileData);

      // Restore agent state
      Object.assign(this, agentData);

      // Load knowledge base
      try {
        const knowledgeData = await fs.readFile(this.knowledgeBasePath, 'utf8');
        const knowledge = JSON.parse(knowledgeData);
        this.knowledgeBase = knowledge.knowledgeBase || [];
      } catch (knowledgeError) {
        console.log(`[AGENT] No knowledge base found for ${this.name}, starting fresh`);
        this.knowledgeBase = [];
      }

      console.log(`[AGENT] Loaded ${this.name} (${this.id}) from disk`);
      return true;
    } catch (error) {
      console.log(`[AGENT] Could not load ${this.name}, using initial configuration`);
      return false;
    }
  }

  /**
   * STRATEGY SYSTEM
   * Get best strategy based on past performance
   */
  getBestStrategy() {
    const strategies = Object.entries(this.memory.strategies)
      .sort((a, b) => b[1].effectiveness - a[1].effectiveness);

    if (strategies.length === 0) {
      return 'balanced'; // Default strategy
    }

    return strategies[0][0];
  }

  /**
   * Get debate context for this agent
   */
  getDebateContext(topic) {
    return {
      personality: this.getPersonalityProfile(),
      position: this.memory.positions[topic],
      relevantKnowledge: this.getRelevantKnowledge(topic),
      bestStrategy: this.getBestStrategy(),
      performanceStats: this.performance,
      alliances: this.alliances,
      rivalries: this.rivalries
    };
  }

  /**
   * Generate detailed agent summary
   */
  getSummary() {
    const profile = this.getPersonalityProfile();
    const winRate = this.performance.debatesParticipated > 0
      ? (this.performance.debatesWon / this.performance.debatesParticipated * 100).toFixed(1)
      : 0;

    return {
      id: this.id,
      name: this.name,
      model: this.model,
      party: this.party,
      generation: this.generation,
      personality: profile.summary,
      stats: {
        debates: this.performance.debatesParticipated,
        winRate: `${winRate}%`,
        influence: this.performance.influenceScore,
        bills: `${this.performance.billsPassed}/${this.performance.billsProposed}`
      },
      social: {
        allies: this.alliances.length,
        rivals: this.rivalries.length,
        coalitions: this.coalitions.length
      },
      expertise: Object.keys(this.expertise).length
    };
  }
}

module.exports = Agent;
