const Agent = require('./Agent');
const fs = require('fs').promises;
const path = require('path');

/**
 * DEBATE CONTEXT MANAGER
 *
 * Orchestrates intelligent debates between multiple AI agents with:
 * - Multi-model collaboration
 * - Research committees
 * - Peer review systems
 * - Coalition building
 * - Context memory and strategic chaining
 */
class DebateContextManager {
  constructor() {
    this.agents = new Map(); // agentId -> Agent instance
    this.activeDebates = new Map(); // debateId -> debate state
    this.researchCommittees = new Map(); // committeeId -> committee data
    this.coalitions = new Map(); // coalitionId -> coalition data
    this.debateHistoryPath = path.join(__dirname, '../memory/debate_history');
  }

  /**
   * AGENT MANAGEMENT
   * Register or load an agent
   */
  async registerAgent(agentConfig) {
    const agent = new Agent(agentConfig);

    // Try to load existing agent data
    await agent.load();

    this.agents.set(agent.id, agent);
    console.log(`[DEBATE MANAGER] Registered agent: ${agent.name} (${agent.id})`);

    return agent;
  }

  /**
   * Create a diverse congress of agents
   */
  async createCongress(count = 10) {
    console.log(`[DEBATE MANAGER] Creating congress of ${count} agents`);

    const models = ['OpenAI', 'Claude', 'Gemini', 'Grok', 'Cohere'];
    const parties = ['Democrat', 'Republican', 'Independent'];

    const agents = [];

    for (let i = 0; i < count; i++) {
      const agent = await this.registerAgent({
        name: `Representative ${i + 1}`,
        model: models[i % models.length],
        party: parties[i % parties.length],
        personality: this.generateRandomPersonality()
      });
      agents.push(agent);
    }

    return agents;
  }

  /**
   * Generate random but coherent personality
   */
  generateRandomPersonality() {
    // Create base political leaning
    const politicalLean = Math.random();

    return {
      // Political (correlated)
      progressive: politicalLean < 0.5 ? 60 + Math.random() * 30 : 20 + Math.random() * 30,
      conservative: politicalLean < 0.5 ? 20 + Math.random() * 30 : 60 + Math.random() * 30,
      libertarian: 30 + Math.random() * 40,
      authoritarian: 30 + Math.random() * 40,

      // Moral (random but coherent)
      religiosity: 20 + Math.random() * 60,
      morality: 40 + Math.random() * 40,
      pragmatism: 30 + Math.random() * 50,
      idealism: 30 + Math.random() * 50,

      // Behavioral (random)
      aggression: 20 + Math.random() * 60,
      cooperation: 30 + Math.random() * 50,
      selfishness: 20 + Math.random() * 60,
      altruism: 20 + Math.random() * 60,

      // Debate style (random)
      analytical: 30 + Math.random() * 50,
      emotional: 30 + Math.random() * 50,
      humorous: 10 + Math.random() * 40,
      confrontational: 20 + Math.random() * 60,

      // Cultural (correlated with political)
      woke: politicalLean < 0.5 ? 60 + Math.random() * 30 : 10 + Math.random() * 30,
      traditional: politicalLean < 0.5 ? 10 + Math.random() * 30 : 60 + Math.random() * 30,
      populist: 30 + Math.random() * 50,
      elitist: 30 + Math.random() * 50
    };
  }

  /**
   * RESEARCH COMMITTEE SYSTEM
   * Create a research committee for a topic
   */
  async createResearchCommittee(topic, memberAgentIds) {
    const committeeId = `committee_${Date.now()}`;

    const committee = {
      id: committeeId,
      topic: topic,
      members: memberAgentIds,
      createdAt: new Date().toISOString(),
      findings: [],
      consensus: null
    };

    this.researchCommittees.set(committeeId, committee);
    console.log(`[RESEARCH COMMITTEE] Created committee on "${topic}" with ${memberAgentIds.length} members`);

    return committeeId;
  }

  /**
   * Research committee collaborates to investigate topic
   */
  async conductResearch(committeeId, llmExecutor) {
    const committee = this.researchCommittees.get(committeeId);
    if (!committee) {
      throw new Error(`Committee ${committeeId} not found`);
    }

    console.log(`[RESEARCH] Committee researching: ${committee.topic}`);

    // Each member contributes research
    const research = await Promise.all(
      committee.members.map(async (agentId) => {
        const agent = this.agents.get(agentId);
        if (!agent) return null;

        // Generate research prompt
        const prompt = this.buildResearchPrompt(agent, committee.topic);

        // Execute LLM call through provided executor
        const finding = await llmExecutor(agent.model, prompt.system, prompt.user, 0.8);

        // Agent learns from research
        agent.addKnowledge(committee.topic, finding, 'research committee');

        return {
          agentId: agent.id,
          agentName: agent.name,
          finding: finding,
          timestamp: new Date().toISOString()
        };
      })
    );

    committee.findings = research.filter(r => r !== null);

    // Build consensus (if possible)
    committee.consensus = await this.buildConsensus(committee, llmExecutor);

    return committee;
  }

  /**
   * Build research prompt for agent
   */
  buildResearchPrompt(agent, topic) {
    const profile = agent.getPersonalityProfile();

    return {
      system: `You are ${agent.name}, a congressional representative conducting research.

PERSONALITY: ${profile.summary}
PARTY: ${agent.party}
EXPERTISE: ${Object.keys(agent.expertise).join(', ') || 'Developing'}

TASK: Research "${topic}" from your perspective. Provide:
1. Key facts (2-3)
2. Your political perspective on the issue
3. Policy implications

Keep response under 100 words. Be analytical and cite your reasoning.`,

      user: `Research topic: "${topic}"

Conduct your research and present findings from your ${agent.party} ${profile.summary} perspective.`
    };
  }

  /**
   * Attempt to build consensus from research findings
   */
  async buildConsensus(committee, llmExecutor) {
    const findingsSummary = committee.findings
      .map(f => `${f.agentName}: ${f.finding}`)
      .join('\n\n');

    const consensusPrompt = {
      system: `You are a neutral moderator analyzing research committee findings.

TASK: Identify areas of consensus and disagreement among the committee members.

Provide:
1. Points of agreement
2. Points of disagreement
3. Potential compromise positions

Keep response under 150 words.`,

      user: `Committee topic: "${committee.topic}"

Research findings:
${findingsSummary}

Analyze for consensus and disagreement.`
    };

    const consensus = await llmExecutor('Claude', consensusPrompt.system, consensusPrompt.user, 0.7);

    return consensus;
  }

  /**
   * COALITION SYSTEM
   * Form a coalition based on shared interests
   */
  createCoalition(name, memberAgentIds, purpose) {
    const coalitionId = `coalition_${Date.now()}`;

    const coalition = {
      id: coalitionId,
      name: name,
      members: memberAgentIds,
      purpose: purpose,
      createdAt: new Date().toISOString(),
      strength: 0
    };

    this.coalitions.set(coalitionId, coalition);

    // Update agent coalition membership
    memberAgentIds.forEach(agentId => {
      const agent = this.agents.get(agentId);
      if (agent) {
        agent.coalitions.push(coalitionId);
      }
    });

    // Update relationships between coalition members
    memberAgentIds.forEach(agentId1 => {
      memberAgentIds.forEach(agentId2 => {
        if (agentId1 !== agentId2) {
          const agent1 = this.agents.get(agentId1);
          if (agent1) {
            agent1.updateRelationship(agentId2, 10, `Joined coalition: ${name}`);
          }
        }
      });
    });

    console.log(`[COALITION] Created "${name}" with ${memberAgentIds.length} members`);

    return coalitionId;
  }

  /**
   * PEER REVIEW SYSTEM
   * Get peer review of an argument before presenting
   */
  async peerReviewArgument(authorAgentId, argument, reviewerAgentIds, llmExecutor) {
    const author = this.agents.get(authorAgentId);
    if (!author) {
      throw new Error(`Agent ${authorAgentId} not found`);
    }

    console.log(`[PEER REVIEW] ${author.name}'s argument being reviewed by ${reviewerAgentIds.length} peers`);

    const reviews = await Promise.all(
      reviewerAgentIds.map(async (reviewerId) => {
        const reviewer = this.agents.get(reviewerId);
        if (!reviewer) return null;

        const reviewPrompt = this.buildReviewPrompt(reviewer, author, argument);
        const review = await llmExecutor(reviewer.model, reviewPrompt.system, reviewPrompt.user, 0.8);

        // Update relationship based on review quality
        const isPositive = Math.random() > 0.5; // Simplified - would analyze sentiment in production
        author.updateRelationship(reviewerId, isPositive ? 5 : -5, 'peer review');

        return {
          reviewerId: reviewer.id,
          reviewerName: reviewer.name,
          review: review,
          timestamp: new Date().toISOString()
        };
      })
    );

    return reviews.filter(r => r !== null);
  }

  /**
   * Build peer review prompt
   */
  buildReviewPrompt(reviewer, author, argument) {
    const reviewerProfile = reviewer.getPersonalityProfile();
    const relationship = reviewer.getRelationshipWith(author.id);

    return {
      system: `You are ${reviewer.name}, reviewing a colleague's argument.

YOUR PERSONALITY: ${reviewerProfile.summary}
RELATIONSHIP WITH ${author.name}: ${relationship.status}

TASK: Review the argument and provide:
1. Strengths (1-2 points)
2. Weaknesses or improvements (1-2 points)
3. Overall assessment

Be constructive but honest. Keep under 80 words.`,

      user: `${author.name}'s argument:
"${argument}"

Provide your peer review.`
    };
  }

  /**
   * INTELLIGENT DEBATE ORCHESTRATION
   * Start a debate with full context and strategy
   */
  async startDebate(topic, participantAgentIds, options = {}) {
    const debateId = `debate_${Date.now()}`;

    const debate = {
      id: debateId,
      topic: topic,
      participants: participantAgentIds,
      turns: [],
      startedAt: new Date().toISOString(),
      phase: 'opening', // opening, middle, closing
      controversyLevel: options.controversyLevel || 100,
      enablePeerReview: options.enablePeerReview || false,
      enableResearch: options.enableResearch || false
    };

    this.activeDebates.set(debateId, debate);
    console.log(`[DEBATE] Started debate on "${topic}" with ${participantAgentIds.length} participants`);

    return debateId;
  }

  /**
   * Generate debate argument with full context and strategy
   */
  async generateDebateArgument(debateId, agentId, llmExecutor) {
    const debate = this.activeDebates.get(debateId);
    const agent = this.agents.get(agentId);

    if (!debate || !agent) {
      throw new Error('Invalid debate or agent');
    }

    // Determine debate phase
    const turnCount = debate.turns.length;
    if (turnCount === 0) {
      debate.phase = 'opening';
    } else if (turnCount >= debate.participants.length * 2) {
      debate.phase = 'closing';
    } else {
      debate.phase = 'middle';
    }

    // Get agent's debate context
    const context = agent.getDebateContext(debate.topic);

    // Build strategic prompt
    const prompt = this.buildStrategicDebatePrompt(agent, debate, context);

    // Execute LLM call
    let argument = await llmExecutor(agent.model, prompt.system, prompt.user, prompt.temperature);

    // Optional: Peer review before presenting
    if (debate.enablePeerReview && debate.phase === 'middle') {
      const reviewerIds = debate.participants.filter(id => id !== agentId).slice(0, 2);
      const reviews = await this.peerReviewArgument(agentId, argument, reviewerIds, llmExecutor);

      // Optionally refine based on reviews (simplified)
      console.log(`[PEER REVIEW] ${agent.name}'s argument reviewed by ${reviews.length} peers`);
    }

    // Record turn
    const turn = {
      agentId: agent.id,
      agentName: agent.name,
      party: agent.party,
      model: agent.model,
      argument: argument,
      phase: debate.phase,
      timestamp: new Date().toISOString(),
      strategy: context.bestStrategy
    };

    debate.turns.push(turn);

    // Agent remembers this debate turn
    agent.rememberDebate({
      topic: debate.topic,
      myArgument: argument,
      opponentArguments: debate.turns.filter(t => t.agentId !== agentId).map(t => t.argument),
      outcome: null, // Will be updated later
      votesReceived: null,
      strategyUsed: context.bestStrategy
    });

    return turn;
  }

  /**
   * Build strategic debate prompt with full context
   */
  buildStrategicDebatePrompt(agent, debate, context) {
    const profile = context.personality;
    const previousTurns = debate.turns.slice(-3); // Last 3 turns for context

    // Build context string
    let contextString = '';
    if (previousTurns.length > 0) {
      contextString = '\n\nPREVIOUS ARGUMENTS:\n' +
        previousTurns.map(t => `${t.agentName} (${t.party}): ${t.argument}`).join('\n');
    }

    // Add knowledge context
    let knowledgeString = '';
    if (context.relevantKnowledge.length > 0) {
      knowledgeString = '\n\nYOUR RELEVANT KNOWLEDGE:\n' +
        context.relevantKnowledge.map(k => `- ${k.fact}`).join('\n');
    }

    // Add relationship context
    const opponents = debate.participants.filter(id => id !== agent.id);
    let relationshipString = '';
    if (opponents.length > 0) {
      const relationships = opponents.map(oppId => {
        const rel = agent.getRelationshipWith(oppId);
        const oppAgent = this.agents.get(oppId);
        return `${oppAgent?.name || oppId}: ${rel.status}`;
      });
      relationshipString = '\n\nYOUR RELATIONSHIPS:\n' + relationships.join('\n');
    }

    // Phase-specific instructions
    let phaseInstruction = '';
    switch (debate.phase) {
      case 'opening':
        phaseInstruction = 'This is your OPENING statement. Set the tone and establish your position clearly.';
        break;
      case 'middle':
        phaseInstruction = 'RESPOND to previous arguments. Counter their points and strengthen your position.';
        break;
      case 'closing':
        phaseInstruction = 'This is your CLOSING argument. Summarize your strongest points and deliver a compelling conclusion.';
        break;
    }

    const temperature = debate.phase === 'closing' ? 0.85 : 0.95;

    return {
      system: `You are ${agent.name}, a ${agent.party} representative in Congress.

PERSONALITY: ${profile.summary}
DEBATE PHASE: ${debate.phase.toUpperCase()}
STRATEGY: ${context.bestStrategy}
PERFORMANCE: ${context.performanceStats.debatesWon}/${context.performanceStats.debatesParticipated} debates won${knowledgeString}${relationshipString}

${phaseInstruction}

Deliver a ${debate.controversyLevel >= 70 ? 'passionate, hard-hitting' : 'measured, thoughtful'} argument.
Keep response 15-25 words. This is a Congressional debate - make it count!`,

      user: `DEBATE TOPIC: "${debate.topic}"${contextString}

Your turn, ${agent.name}. Deliver your ${debate.phase} argument!`,

      temperature: temperature
    };
  }

  /**
   * Process debate outcome and learning
   */
  async processDebateOutcome(debateId, votingResults) {
    const debate = this.activeDebates.get(debateId);
    if (!debate) return;

    console.log(`[DEBATE] Processing outcome for debate: ${debate.topic}`);

    // Determine winner(s)
    const votes = new Map();
    debate.participants.forEach(agentId => {
      const agentVotes = votingResults[agentId] || { upvotes: 0, downvotes: 0 };
      votes.set(agentId, agentVotes.upvotes - agentVotes.downvotes);
    });

    const sortedByVotes = Array.from(votes.entries()).sort((a, b) => b[1] - a[1]);
    const winnerId = sortedByVotes[0][0];
    const winner = this.agents.get(winnerId);

    // Update agent learning
    debate.participants.forEach(agentId => {
      const agent = this.agents.get(agentId);
      if (!agent) return;

      const won = agentId === winnerId;
      const agentVotes = votingResults[agentId] || { upvotes: 0, downvotes: 0 };

      // Update performance
      const lastDebate = agent.memory.debateHistory[agent.memory.debateHistory.length - 1];
      if (lastDebate) {
        lastDebate.outcome = won ? 'won' : 'lost';
        lastDebate.votesReceived = agentVotes;
      }

      // Learn from strategy effectiveness
      const strategy = agent.memory.debateHistory[agent.memory.debateHistory.length - 1]?.strategyUsed || 'balanced';
      agent.learnFromDebate(strategy, won);

      // Adapt personality based on performance
      if (won) {
        // Reinforce successful traits
        console.log(`[LEARNING] ${agent.name} won! Reinforcing successful approach.`);
        agent.performance.influenceScore += 10;
      } else if (agentVotes.downvotes > agentVotes.upvotes) {
        // Adapt losing strategy
        console.log(`[LEARNING] ${agent.name} received negative feedback. Adapting approach.`);
        agent.adaptPersonality('pragmatism', 5, 'Lost debate, becoming more pragmatic');
      }

      // Update relationships based on voting patterns
      debate.participants.forEach(otherId => {
        if (otherId !== agentId) {
          const otherVotes = votes.get(otherId);
          const myVotes = votes.get(agentId);

          // If we both did well or both did poorly, slightly improve relationship
          if ((otherVotes > 0 && myVotes > 0) || (otherVotes < 0 && myVotes < 0)) {
            agent.updateRelationship(otherId, 2, 'Similar debate performance');
          }
        }
      });

      // Save agent state
      agent.save();
    });

    // Save debate history
    await this.saveDebateHistory(debate, winnerId);

    console.log(`[DEBATE] Winner: ${winner?.name || 'Unknown'}`);

    return {
      winner: winner?.getSummary(),
      votes: Object.fromEntries(votes)
    };
  }

  /**
   * Save debate to history
   */
  async saveDebateHistory(debate, winnerId) {
    try {
      const historyFile = path.join(this.debateHistoryPath, `${debate.id}.json`);

      const historyData = {
        ...debate,
        winnerId: winnerId,
        completedAt: new Date().toISOString()
      };

      await fs.mkdir(this.debateHistoryPath, { recursive: true });
      await fs.writeFile(historyFile, JSON.stringify(historyData, null, 2));

      console.log(`[DEBATE] Saved debate history: ${debate.id}`);
    } catch (error) {
      console.error('[DEBATE] Failed to save debate history:', error);
    }
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId) {
    return this.agents.get(agentId);
  }

  /**
   * Get all agents
   */
  getAllAgents() {
    return Array.from(this.agents.values());
  }

  /**
   * Get agent summaries
   */
  getAgentSummaries() {
    return this.getAllAgents().map(agent => agent.getSummary());
  }
}

module.exports = DebateContextManager;
