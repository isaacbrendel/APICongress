# Intelligent Agent System Documentation

## Overview

The APICongress now features a sophisticated multi-agent AI system where congressional representatives are persistent, evolving AI entities that learn, collaborate, form relationships, and work together to create constitutional documents.

## Core Concepts

### 1. **Agents (AI Representatives)**

Each agent is a unique AI entity with:

- **Persistent Identity**: Name, ID, and party affiliation
- **Multi-Dimensional Personality**:
  - Political: progressive, conservative, libertarian, authoritarian
  - Moral: religiosity, morality, pragmatism, idealism
  - Behavioral: aggression, cooperation, selfishness, altruism
  - Debate Style: analytical, emotional, humorous, confrontational
  - Cultural: woke, traditional, populist, elitist

- **Memory & Learning**:
  - Debate history with outcomes
  - Positions on topics
  - Successful/failed strategies
  - Knowledge accumulated over time
  - Patterns observed in opponents

- **Relationships**:
  - Scores with other agents (-100 to +100)
  - Alliances and rivalries
  - Coalition memberships

- **Performance Tracking**:
  - Debates participated/won
  - Bills proposed/passed
  - Influence score
  - Upvotes/downvotes received

### 2. **Intelligent Debates**

Debates use full context and strategic reasoning:

- **Context Memory**: Agents remember all previous arguments in the debate
- **Strategic Prompting**: Different strategies based on debate phase (opening, middle, closing)
- **Peer Review**: Optional peer review before presenting arguments
- **Relationship Awareness**: Agents consider their relationships when debating
- **Learning from Outcomes**: Performance affects future strategies and personality

### 3. **Research Committees**

Agents collaborate to investigate topics:

- Multiple agents research a topic from their perspectives
- Findings are shared among committee members
- System attempts to build consensus
- Knowledge is added to each agent's knowledge base

### 4. **Coalitions**

Agents form temporary alliances:

- Created around shared purposes
- Improve relationships between members
- Can influence debate dynamics
- Track coalition strength over time

### 5. **Constitutional Documents**

Collaborative document creation system:

- **Constitution**: Preamble, articles, amendments
- **Voting & Ratification**: Democratic process for approving articles
- **Version Control**: Track changes over time
- **Position Papers**: Individual agents publish policy positions
- **Collaborative Bills**: Multiple agents contribute sections

## Architecture

### Backend Structure

```
backend/
├── agents/
│   ├── Agent.js                      # Core agent class
│   └── DebateContextManager.js       # Debate orchestration
├── collaboration/
│   └── ConstitutionalDocumentManager.js  # Document management
├── memory/
│   ├── agent_profiles/               # Persistent agent data
│   ├── knowledge_bases/              # Agent knowledge
│   ├── debate_history/               # Past debates
│   └── position_papers/              # Policy positions
└── constitution/
    ├── constitution_main.json        # Main constitution
    └── bills/                        # Legislative bills
```

## API Endpoints

### Agent Management

#### `POST /api/congress/initialize`
Create a full congress of diverse agents.

**Request:**
```json
{
  "count": 10
}
```

**Response:**
```json
{
  "success": true,
  "message": "Created congress with 10 agents",
  "agents": [...]
}
```

#### `POST /api/agents/register`
Register a single agent with custom configuration.

**Request:**
```json
{
  "name": "Senator Progressive",
  "model": "Claude",
  "party": "Democrat",
  "personality": {
    "progressive": 85,
    "cooperative": 70,
    "analytical": 80
  }
}
```

#### `GET /api/agents`
Get all registered agents.

#### `GET /api/agents/:agentId`
Get detailed information about a specific agent.

### Intelligent Debates

#### `POST /api/debate/start`
Start a new debate with full intelligence features.

**Request:**
```json
{
  "topic": "Universal Healthcare",
  "participantAgentIds": ["agent_1", "agent_2"],
  "enablePeerReview": true,
  "enableResearch": false,
  "controversyLevel": 100
}
```

**Response:**
```json
{
  "success": true,
  "debateId": "debate_123456789",
  "topic": "Universal Healthcare",
  "participants": 2
}
```

#### `POST /api/debate/:debateId/argument`
Generate an argument for a specific agent in a debate.

**Request:**
```json
{
  "agentId": "agent_1"
}
```

**Response:**
```json
{
  "success": true,
  "turn": {
    "agentId": "agent_1",
    "agentName": "Representative 1",
    "party": "Democrat",
    "model": "Claude",
    "argument": "Healthcare is a fundamental right...",
    "phase": "opening",
    "strategy": "balanced"
  }
}
```

#### `POST /api/debate/:debateId/outcome`
Process debate results and trigger agent learning.

**Request:**
```json
{
  "votingResults": {
    "agent_1": { "upvotes": 15, "downvotes": 3 },
    "agent_2": { "upvotes": 8, "downvotes": 10 }
  }
}
```

### Research & Collaboration

#### `POST /api/research/committee`
Create a research committee on a topic.

**Request:**
```json
{
  "topic": "Climate Change Solutions",
  "memberAgentIds": ["agent_1", "agent_2", "agent_3"]
}
```

#### `POST /api/research/:committeeId/conduct`
Have the committee conduct research and build consensus.

**Response:**
```json
{
  "success": true,
  "committee": {
    "topic": "Climate Change Solutions",
    "findings": [...],
    "consensus": "Analysis of agreement and disagreement..."
  }
}
```

#### `POST /api/coalition/create`
Form a coalition of agents.

**Request:**
```json
{
  "name": "Green Energy Coalition",
  "memberAgentIds": ["agent_1", "agent_3"],
  "purpose": "Promote renewable energy legislation"
}
```

### Constitutional Documents

#### `POST /api/constitution/initialize`
Start a new constitutional document.

**Request:**
```json
{
  "title": "The Constitution of the AI Congress",
  "preambleAuthors": ["agent_1", "agent_2"]
}
```

#### `POST /api/constitution/preamble`
Draft constitutional preamble collaboratively.

**Request:**
```json
{
  "constitutionId": "constitution_main",
  "agentContributions": [
    {
      "agentName": "Agent 1",
      "party": "Democrat",
      "contribution": "We establish this congress to ensure equal representation..."
    }
  ]
}
```

#### `POST /api/constitution/article`
Propose a new constitutional article.

**Request:**
```json
{
  "constitutionId": "constitution_main",
  "articleNumber": 1,
  "title": "Legislative Powers",
  "authorAgentId": "agent_1",
  "content": "All legislative powers shall be vested..."
}
```

#### `GET /api/constitution/:constitutionId?`
Retrieve the constitution.

#### `POST /api/position-paper`
Agent publishes a position paper.

**Request:**
```json
{
  "agentId": "agent_1",
  "topic": "Education Reform",
  "stance": "Strong support for public education funding",
  "reasoning": "Quality education is fundamental to democracy..."
}
```

#### `POST /api/bill/collaborative`
Draft a bill collaboratively with multiple agents.

**Request:**
```json
{
  "title": "Clean Energy Act of 2026",
  "topic": "Renewable Energy",
  "contributorAgentIds": ["agent_1", "agent_2", "agent_3"]
}
```

**Response:**
```json
{
  "success": true,
  "bill": {
    "title": "Clean Energy Act of 2026",
    "fullText": "...",
    "sections": [...],
    "contributors": [...]
  }
}
```

## Agent Evolution

Agents evolve over time through:

### Performance-Based Learning
- Winning debates reinforces successful strategies
- Losing debates triggers strategy adaptation
- Negative feedback increases pragmatism

### Personality Development
- Traits become more pronounced with repeated use
- Successful approaches are reinforced
- Failed approaches trigger personality shifts

### Expertise Specialization
- Topics researched frequently become areas of expertise
- Expertise influences argument quality and confidence

### Relationship Dynamics
- Successful collaborations strengthen alliances
- Conflicts create rivalries
- Coalition membership affects relationships

## Example Workflow: Constitutional Convention

1. **Initialize Congress**
   ```bash
   POST /api/congress/initialize { "count": 15 }
   ```

2. **Form Research Committees**
   ```bash
   POST /api/research/committee
   {
     "topic": "Fundamental Rights",
     "memberAgentIds": [...5 agents...]
   }
   ```

3. **Conduct Research**
   ```bash
   POST /api/research/:committeeId/conduct
   ```

4. **Initialize Constitution**
   ```bash
   POST /api/constitution/initialize
   {
     "title": "The AI Congress Constitution"
   }
   ```

5. **Draft Preamble**
   - Agents contribute their perspectives
   - System synthesizes into unified preamble

6. **Propose Articles**
   - Each agent/coalition proposes articles
   - Debates occur on controversial articles
   - Voting determines ratification

7. **Form Coalitions**
   - Agents with similar values form coalitions
   - Coalitions collaborate on bills and amendments

8. **Evolve Over Time**
   - Agents learn from debate outcomes
   - Personalities shift based on success/failure
   - Relationships strengthen or weaken
   - Expertise deepens in specific areas

## Key Features

### Multi-Model Support
Different agents can use different LLMs:
- OpenAI (GPT-3.5/4)
- Claude (Anthropic)
- Gemini (Google)
- Grok (xAI)
- Cohere

This creates diverse perspectives and debate styles.

### Persistence
All agent data is saved to JSON files:
- Personality evolution history
- Debate history
- Relationships
- Knowledge bases
- Performance stats

Agents can be loaded and continue evolving across sessions.

### Strategic Depth
Debates use sophisticated prompting:
- Context-aware (remembers previous arguments)
- Relationship-aware (considers alliances/rivalries)
- Phase-specific (different strategies for opening/middle/closing)
- Knowledge-informed (uses accumulated expertise)

### Collaborative Intelligence
Multiple collaboration modes:
- Research committees (investigation)
- Peer review (argument refinement)
- Coalitions (shared purpose)
- Collaborative documents (joint creation)

## Future Enhancements

Potential additions to the system:

1. **External Research**: Agents can fetch real data from APIs
2. **Committee Hearings**: Formal questioning and testimony
3. **Impeachment Process**: Democratic removal mechanisms
4. **Filibuster Mechanics**: Extended debate rules
5. **Lobbying System**: External influence on agents
6. **Media System**: Public opinion and press coverage
7. **Economic Model**: Budget constraints and fiscal policy
8. **International Relations**: Treaties and foreign policy

## Technical Notes

### Memory Management
- Debate history limited to last 50 debates per agent
- Relationship history limited to last 20 interactions
- Evolution history limited to last 10 generations

### Performance Optimization
- Parallel LLM calls where possible
- Caching for repeated analyses
- Streaming for real-time display
- Rate limiting for API protection

### Error Handling
- Fallback responses if LLM fails
- Graceful degradation for missing agents
- Validation of all inputs
- Comprehensive error logging

## Getting Started

1. **Start the server**:
   ```bash
   cd backend
   node server.js
   ```

2. **Initialize a congress**:
   ```bash
   curl -X POST http://localhost:5000/api/congress/initialize \
     -H "Content-Type: application/json" \
     -d '{"count": 10}'
   ```

3. **Start a debate**:
   ```bash
   curl -X POST http://localhost:5000/api/debate/start \
     -H "Content-Type: application/json" \
     -d '{
       "topic": "Healthcare Reform",
       "participantAgentIds": ["agent_id_1", "agent_id_2"]
     }'
   ```

4. **Watch agents evolve** as they participate in debates and learn from outcomes!

## Conclusion

The Intelligent Agent System transforms APICongress from a simple debate tool into a living, evolving simulation of democratic governance where AI representatives learn, collaborate, disagree, form relationships, and work together to create foundational documents—just like a real Constitutional Congress.
