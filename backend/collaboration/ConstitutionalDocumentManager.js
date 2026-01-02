const fs = require('fs').promises;
const path = require('path');

/**
 * CONSTITUTIONAL DOCUMENT MANAGER
 *
 * Manages collaborative creation of constitutional documents, bills, and position papers
 * - Multi-agent document editing
 * - Version control and history
 * - Voting and ratification
 * - Amendment process
 */
class ConstitutionalDocumentManager {
  constructor() {
    this.documents = new Map(); // documentId -> document
    this.constitutionPath = path.join(__dirname, '../constitution');
    this.positionPapersPath = path.join(__dirname, '../memory/position_papers');
  }

  /**
   * CONSTITUTION MANAGEMENT
   * Initialize new constitutional document
   */
  async initializeConstitution(title, preambleAuthors) {
    const docId = 'constitution_main';

    const constitution = {
      id: docId,
      title: title,
      type: 'constitution',
      preamble: {
        text: '',
        authors: preambleAuthors,
        ratifiedAt: null
      },
      articles: [],
      amendments: [],
      signatures: [],
      version: 1,
      status: 'draft', // draft, ratified
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    this.documents.set(docId, constitution);
    await this.saveDocument(constitution);

    console.log(`[CONSTITUTION] Initialized: ${title}`);

    return docId;
  }

  /**
   * Draft preamble collaboratively
   */
  async draftPreamble(constitutionId, agentContributions, llmExecutor) {
    const constitution = this.documents.get(constitutionId);
    if (!constitution) {
      throw new Error('Constitution not found');
    }

    console.log(`[CONSTITUTION] Drafting preamble with ${agentContributions.length} contributors`);

    // Combine agent perspectives
    const contributionTexts = agentContributions
      .map(c => `${c.agentName} (${c.party}): ${c.contribution}`)
      .join('\n\n');

    // Synthesize into preamble
    const synthPrompt = {
      system: `You are a constitutional scholar synthesizing multiple perspectives into a unified preamble.

TASK: Create a compelling constitutional preamble that incorporates the diverse viewpoints provided.

The preamble should:
1. State core principles and values
2. Establish the purpose of governance
3. Balance different political perspectives
4. Be inspirational yet practical

Format: 3-4 sentences. Use formal, constitutional language.`,

      user: `Constitutional document title: "${constitution.title}"

Contributor perspectives:
${contributionTexts}

Synthesize these into a unified constitutional preamble.`
    };

    const preamble = await llmExecutor('Claude', synthPrompt.system, synthPrompt.user, 0.7);

    constitution.preamble.text = preamble;
    constitution.lastModified = new Date().toISOString();
    constitution.version++;

    await this.saveDocument(constitution);

    return preamble;
  }

  /**
   * Propose new article
   */
  async proposeArticle(constitutionId, articleNumber, title, authorAgentId, content) {
    const constitution = this.documents.get(constitutionId);
    if (!constitution) {
      throw new Error('Constitution not found');
    }

    const article = {
      number: articleNumber,
      title: title,
      sections: [
        {
          number: 1,
          text: content,
          authorAgentId: authorAgentId,
          proposedAt: new Date().toISOString()
        }
      ],
      status: 'proposed', // proposed, ratified, rejected
      votes: { for: 0, against: 0, abstain: 0 },
      comments: []
    };

    constitution.articles.push(article);
    constitution.lastModified = new Date().toISOString();

    await this.saveDocument(constitution);

    console.log(`[CONSTITUTION] Article ${articleNumber} proposed: ${title}`);

    return article;
  }

  /**
   * Add section to existing article (collaborative editing)
   */
  async addSectionToArticle(constitutionId, articleNumber, authorAgentId, sectionText, llmExecutor) {
    const constitution = this.documents.get(constitutionId);
    if (!constitution) {
      throw new Error('Constitution not found');
    }

    const article = constitution.articles.find(a => a.number === articleNumber);
    if (!article) {
      throw new Error('Article not found');
    }

    // Check for consistency with existing sections
    const consistencyCheck = await this.checkConsistency(article, sectionText, llmExecutor);

    const section = {
      number: article.sections.length + 1,
      text: sectionText,
      authorAgentId: authorAgentId,
      proposedAt: new Date().toISOString(),
      consistencyScore: consistencyCheck.score,
      conflicts: consistencyCheck.conflicts
    };

    article.sections.push(section);
    constitution.lastModified = new Date().toISOString();

    await this.saveDocument(constitution);

    console.log(`[CONSTITUTION] Section added to Article ${articleNumber}`);

    return section;
  }

  /**
   * Check consistency of new section with existing article
   */
  async checkConsistency(article, newSectionText, llmExecutor) {
    const existingSections = article.sections
      .map(s => `Section ${s.number}: ${s.text}`)
      .join('\n\n');

    const consistencyPrompt = {
      system: `You are a legal analyst checking constitutional consistency.

TASK: Analyze if a new section is consistent with existing sections.

Provide:
1. Consistency score (0-100)
2. Any conflicts or contradictions
3. Suggestions for harmonization

Keep response under 100 words.`,

      user: `Article: ${article.title}

Existing sections:
${existingSections}

Proposed new section:
${newSectionText}

Analyze consistency.`
    };

    const analysis = await llmExecutor('Claude', consistencyPrompt.system, consistencyPrompt.user, 0.7);

    // Extract score (simplified - would use structured output in production)
    const scoreMatch = analysis.match(/(\d+)/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 70;

    return {
      score: score,
      conflicts: score < 60 ? ['Potential inconsistency detected'] : [],
      analysis: analysis
    };
  }

  /**
   * Vote on article
   */
  voteOnArticle(constitutionId, articleNumber, agentId, vote) {
    const constitution = this.documents.get(constitutionId);
    if (!constitution) {
      throw new Error('Constitution not found');
    }

    const article = constitution.articles.find(a => a.number === articleNumber);
    if (!article) {
      throw new Error('Article not found');
    }

    // Record vote
    if (vote === 'for') article.votes.for++;
    else if (vote === 'against') article.votes.against++;
    else article.votes.abstain++;

    // Check if article should be ratified (simple majority)
    const totalVotes = article.votes.for + article.votes.against;
    if (totalVotes > 0 && article.votes.for / totalVotes > 0.5) {
      article.status = 'ratified';
      console.log(`[CONSTITUTION] Article ${articleNumber} RATIFIED`);
    } else if (totalVotes > 0 && article.votes.against / totalVotes > 0.5) {
      article.status = 'rejected';
      console.log(`[CONSTITUTION] Article ${articleNumber} REJECTED`);
    }

    this.saveDocument(constitution);

    return article;
  }

  /**
   * Ratify entire constitution
   */
  async ratifyConstitution(constitutionId, signatoryAgents) {
    const constitution = this.documents.get(constitutionId);
    if (!constitution) {
      throw new Error('Constitution not found');
    }

    // Check if all articles are ratified
    const unratifiedArticles = constitution.articles.filter(a => a.status !== 'ratified');
    if (unratifiedArticles.length > 0) {
      throw new Error(`Cannot ratify: ${unratifiedArticles.length} articles not yet ratified`);
    }

    // Add signatures
    constitution.signatures = signatoryAgents.map(agent => ({
      agentId: agent.id,
      agentName: agent.name,
      party: agent.party,
      signedAt: new Date().toISOString()
    }));

    constitution.status = 'ratified';
    constitution.preamble.ratifiedAt = new Date().toISOString();

    await this.saveDocument(constitution);

    console.log(`[CONSTITUTION] CONSTITUTION RATIFIED with ${signatoryAgents.length} signatures!`);

    return constitution;
  }

  /**
   * Propose amendment
   */
  async proposeAmendment(constitutionId, amendmentNumber, title, authorAgentId, text) {
    const constitution = this.documents.get(constitutionId);
    if (!constitution) {
      throw new Error('Constitution not found');
    }

    const amendment = {
      number: amendmentNumber,
      title: title,
      text: text,
      authorAgentId: authorAgentId,
      proposedAt: new Date().toISOString(),
      status: 'proposed',
      votes: { for: 0, against: 0, abstain: 0 },
      ratifiedAt: null
    };

    constitution.amendments.push(amendment);
    constitution.lastModified = new Date().toISOString();

    await this.saveDocument(constitution);

    console.log(`[CONSTITUTION] Amendment ${amendmentNumber} proposed: ${title}`);

    return amendment;
  }

  /**
   * POSITION PAPERS
   * Agent creates position paper on topic
   */
  async createPositionPaper(agentId, agentName, topic, stance, reasoning) {
    const paperId = `position_${agentId}_${Date.now()}`;

    const paper = {
      id: paperId,
      agentId: agentId,
      agentName: agentName,
      topic: topic,
      stance: stance,
      reasoning: reasoning,
      createdAt: new Date().toISOString(),
      endorsements: [],
      rebuttals: []
    };

    await this.savePositionPaper(paper);

    console.log(`[POSITION PAPER] ${agentName} published paper on: ${topic}`);

    return paperId;
  }

  /**
   * Endorse another agent's position paper
   */
  async endorsePositionPaper(paperId, endorserAgentId, endorserName) {
    const paper = await this.loadPositionPaper(paperId);

    paper.endorsements.push({
      agentId: endorserAgentId,
      agentName: endorserName,
      endorsedAt: new Date().toISOString()
    });

    await this.savePositionPaper(paper);

    console.log(`[POSITION PAPER] ${endorserName} endorsed ${paper.agentName}'s paper`);

    return paper;
  }

  /**
   * Write rebuttal to position paper
   */
  async rebutPositionPaper(paperId, rebutterAgentId, rebutterName, rebuttalText) {
    const paper = await this.loadPositionPaper(paperId);

    paper.rebuttals.push({
      agentId: rebutterAgentId,
      agentName: rebutterName,
      text: rebuttalText,
      submittedAt: new Date().toISOString()
    });

    await this.savePositionPaper(paper);

    console.log(`[POSITION PAPER] ${rebutterName} rebutted ${paper.agentName}'s paper`);

    return paper;
  }

  /**
   * BILL DRAFTING
   * Collaborative bill creation
   */
  async draftCollaborativeBill(title, topic, contributingAgents, llmExecutor) {
    console.log(`[BILL DRAFTING] Creating collaborative bill: ${title}`);

    // Each agent contributes a section
    const sections = await Promise.all(
      contributingAgents.map(async (agent, index) => {
        const sectionPrompt = {
          system: `You are ${agent.name}, contributing to a collaborative bill.

PERSONALITY: ${agent.getPersonalityProfile().summary}
PARTY: ${agent.party}

TASK: Draft ONE section of the bill addressing "${topic}".

Provide:
1. Section title
2. Legislative language (formal)
3. Implementation details

Keep under 100 words. Use proper legislative format.`,

          user: `Bill: ${title}
Topic: ${topic}

Draft Section ${index + 1} from your perspective.`
        };

        const section = await llmExecutor(agent.model, sectionPrompt.system, sectionPrompt.user, 0.8);

        return {
          number: index + 1,
          authorAgentId: agent.id,
          authorName: agent.name,
          text: section,
          contributedAt: new Date().toISOString()
        };
      })
    );

    // Synthesize into full bill
    const fullBillPrompt = {
      system: `You are a legislative drafter combining multiple sections into a cohesive bill.

TASK: Create a unified bill document from the provided sections.

Include:
1. Bill number and title
2. Preamble/Purpose
3. All sections (integrated smoothly)
4. Enactment clause

Format professionally. Keep under 400 words total.`,

      user: `Bill title: ${title}

Contributed sections:
${sections.map(s => `Section ${s.number} (by ${s.authorName}):\n${s.text}`).join('\n\n')}

Synthesize into complete legislative bill.`
    };

    const fullBill = await llmExecutor('Claude', fullBillPrompt.system, fullBillPrompt.user, 0.75);

    const bill = {
      id: `bill_${Date.now()}`,
      title: title,
      topic: topic,
      fullText: fullBill,
      sections: sections,
      contributors: contributingAgents.map(a => ({ id: a.id, name: a.name, party: a.party })),
      status: 'draft',
      votes: { for: 0, against: 0, abstain: 0 },
      createdAt: new Date().toISOString()
    };

    await this.saveBill(bill);

    console.log(`[BILL DRAFTING] Completed collaborative bill with ${contributingAgents.length} contributors`);

    return bill;
  }

  /**
   * PERSISTENCE
   */
  async saveDocument(document) {
    try {
      await fs.mkdir(this.constitutionPath, { recursive: true });
      const filePath = path.join(this.constitutionPath, `${document.id}.json`);
      await fs.writeFile(filePath, JSON.stringify(document, null, 2));
      console.log(`[DOCUMENT] Saved: ${document.id}`);
    } catch (error) {
      console.error(`[DOCUMENT] Failed to save ${document.id}:`, error);
    }
  }

  async savePositionPaper(paper) {
    try {
      await fs.mkdir(this.positionPapersPath, { recursive: true });
      const filePath = path.join(this.positionPapersPath, `${paper.id}.json`);
      await fs.writeFile(filePath, JSON.stringify(paper, null, 2));
    } catch (error) {
      console.error(`[POSITION PAPER] Failed to save ${paper.id}:`, error);
    }
  }

  async loadPositionPaper(paperId) {
    const filePath = path.join(this.positionPapersPath, `${paperId}.json`);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  }

  async saveBill(bill) {
    try {
      const billsPath = path.join(this.constitutionPath, 'bills');
      await fs.mkdir(billsPath, { recursive: true });
      const filePath = path.join(billsPath, `${bill.id}.json`);
      await fs.writeFile(filePath, JSON.stringify(bill, null, 2));
      console.log(`[BILL] Saved: ${bill.id}`);
    } catch (error) {
      console.error(`[BILL] Failed to save ${bill.id}:`, error);
    }
  }

  /**
   * Get constitution
   */
  getConstitution(constitutionId = 'constitution_main') {
    return this.documents.get(constitutionId);
  }

  /**
   * Get all position papers for a topic
   */
  async getAllPositionPapersForTopic(topic) {
    try {
      const files = await fs.readdir(this.positionPapersPath);
      const papers = await Promise.all(
        files
          .filter(f => f.endsWith('.json'))
          .map(async f => {
            const data = await fs.readFile(path.join(this.positionPapersPath, f), 'utf8');
            return JSON.parse(data);
          })
      );

      return papers.filter(p =>
        p.topic.toLowerCase().includes(topic.toLowerCase())
      );
    } catch (error) {
      console.error('[POSITION PAPERS] Failed to load papers:', error);
      return [];
    }
  }
}

module.exports = ConstitutionalDocumentManager;
