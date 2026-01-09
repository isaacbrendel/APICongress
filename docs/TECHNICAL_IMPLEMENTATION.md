# APICongress Technical Implementation Plan

## Overview
Technical roadmap for implementing the new static, minimal debate interface. This document outlines the component architecture, state management strategy, and migration path from the current system.

---

## Architecture Changes

### Component Hierarchy

```
App
├── HomeScreen (Enhanced)
│   ├── TopicInput
│   ├── AdvancedOptions (NEW)
│   └── StartButton
│
└── DebateScreen (NEW - Replaces both old screens)
    ├── TopicBanner
    ├── DebateTable (NEW)
    │   └── ParticipantChip (NEW) × 8
    ├── ArgumentFeed (NEW)
    │   └── ArgumentCard (NEW) × N
    │       ├── ThreadIndicator (NEW)
    │       ├── FileAttachments (NEW)
    │       └── VotingControls (REDESIGNED)
    └── DebateControls (NEW)
        ├── ExportButton
        ├── SaveButton
        └── NewDebateButton
```

---

## New Components

### 1. DebateTable Component

**File**: `/frontend/src/components/DebateTable.js`

**Purpose**: Static header showing all debate participants

```jsx
import React from 'react';
import ParticipantChip from './ParticipantChip';
import './DebateTable.css';

const DebateTable = ({ participants }) => {
  return (
    <div className="debate-table">
      <h2 className="debate-table__title">The Table</h2>
      <div className="debate-table__participants">
        {participants.map((participant, index) => (
          <ParticipantChip
            key={participant.id}
            name={participant.name}
            logo={participant.logo}
            team={participant.team}
            isActive={participant.isCurrentSpeaker}
          />
        ))}
      </div>
    </div>
  );
};

export default DebateTable;
```

**Props**:
- `participants`: Array of participant objects
  - `id`: Unique identifier
  - `name`: Display name (e.g., "ChatGPT")
  - `logo`: Logo image path
  - `team`: Team number (1 or 2)
  - `isCurrentSpeaker`: Boolean for current speaker highlight

**Styling** (`DebateTable.css`):
```css
.debate-table {
  padding: var(--space-4);
  background: white;
  border-bottom: 1px solid var(--color-border);
}

.debate-table__title {
  text-align: center;
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--space-4);
}

.debate-table__participants {
  display: flex;
  justify-content: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .debate-table__participants {
    gap: var(--space-2);
  }
}
```

---

### 2. ParticipantChip Component

**File**: `/frontend/src/components/ParticipantChip.js`

**Purpose**: Individual participant display with team indicator

```jsx
import React from 'react';
import './ParticipantChip.css';

const ParticipantChip = ({ name, logo, team, isActive }) => {
  return (
    <div
      className={`participant-chip ${isActive ? 'participant-chip--active' : ''}`}
      data-team={team}
    >
      <div className="participant-chip__logo">
        <img src={logo} alt={`${name} logo`} />
      </div>
      <div className="participant-chip__name">{name}</div>
      <div className="participant-chip__team">T{team}</div>
    </div>
  );
};

export default ParticipantChip;
```

**Styling** (`ParticipantChip.css`):
```css
.participant-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  position: relative;
}

.participant-chip--active .participant-chip__logo {
  box-shadow: 0 0 0 3px var(--color-accent);
}

.participant-chip__logo {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--color-bg-secondary);
  transition: box-shadow 150ms ease;
}

.participant-chip__logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.participant-chip__name {
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--color-text-secondary);
}

.participant-chip__team {
  font-size: var(--text-xs);
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}

.participant-chip[data-team="1"] .participant-chip__team {
  background: var(--color-team1-light);
  color: var(--color-team1);
}

.participant-chip[data-team="2"] .participant-chip__team {
  background: var(--color-team2-light);
  color: var(--color-team2);
}
```

---

### 3. ArgumentFeed Component

**File**: `/frontend/src/components/ArgumentFeed.js`

**Purpose**: Scrollable feed of all arguments

```jsx
import React from 'react';
import ArgumentCard from './ArgumentCard';
import './ArgumentFeed.css';

const ArgumentFeed = ({ arguments, onVote }) => {
  return (
    <div className="argument-feed">
      {arguments.map((arg, index) => (
        <ArgumentCard
          key={arg.id}
          argument={arg}
          previousArgument={index > 0 ? arguments[index - 1] : null}
          onVote={onVote}
        />
      ))}
      {arguments.length > 0 && (
        <div className="argument-feed__status">
          {arguments.length} of {arguments.length} arguments shown
        </div>
      )}
    </div>
  );
};

export default ArgumentFeed;
```

---

### 4. ArgumentCard Component

**File**: `/frontend/src/components/ArgumentCard.js`

**Purpose**: Individual argument display with voting

```jsx
import React, { useState } from 'react';
import './ArgumentCard.css';

const ArgumentCard = ({ argument, previousArgument, onVote }) => {
  const [voteState, setVoteState] = useState('neutral'); // 'up', 'down', 'neutral'

  const handleVote = (vote) => {
    const newVote = voteState === vote ? 'neutral' : vote;
    setVoteState(newVote);
    onVote(argument.id, newVote);
  };

  const showThread = previousArgument && argument.respondsTo === previousArgument.id;

  return (
    <>
      {showThread && (
        <div className="thread-indicator">
          <div className="thread-indicator__line" />
          <div className="thread-indicator__label">responds to</div>
        </div>
      )}
      <div
        className="argument-card"
        data-team={argument.team}
      >
        <div className="argument-card__header">
          <div className="argument-card__avatar">
            <img src={argument.participant.logo} alt={argument.participant.name} />
          </div>
          <div className="argument-card__meta">
            <span className="argument-card__name">{argument.participant.name}</span>
            <span className="argument-card__team">Team {argument.team}</span>
          </div>
          <div className="argument-card__timestamp">
            {new Date(argument.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>

        <div className="argument-card__content">
          {argument.content}
        </div>

        {argument.files && argument.files.length > 0 && (
          <div className="argument-card__files">
            {argument.files.map(file => (
              <a
                key={file.id}
                href={file.url}
                className="argument-card__file"
                download
              >
                <span className="argument-card__file-icon">
                  {file.type === 'pdf' ? '📎' : '📊'}
                </span>
                <span className="argument-card__file-name">{file.name}</span>
                <span className="argument-card__file-size">({file.size})</span>
              </a>
            ))}
          </div>
        )}

        <div className="argument-card__actions">
          <button
            className={`vote-button vote-button--up ${voteState === 'up' ? 'vote-button--active' : ''}`}
            onClick={() => handleVote('up')}
            aria-label="Upvote argument"
          >
            ↑
          </button>
          <button
            className={`vote-button vote-button--down ${voteState === 'down' ? 'vote-button--active' : ''}`}
            onClick={() => handleVote('down')}
            aria-label="Downvote argument"
          >
            ↓
          </button>
          <span className="argument-card__vote-count">
            {argument.voteCount || 0}
          </span>
        </div>
      </div>
    </>
  );
};

export default ArgumentCard;
```

---

### 5. Enhanced HomeScreen

**File**: `/frontend/src/components/HomeScreen.js` (modified)

**Additions**:
```jsx
import React, { useState } from 'react';
import AdvancedOptions from './AdvancedOptions';
import './HomeScreen.css';

const HomeScreen = ({ onStartDebate }) => {
  const [topic, setTopic] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [options, setOptions] = useState({
    participantCount: 8,
    duration: 'standard',
    saveSession: true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (topic.trim()) {
      onStartDebate(topic, options);
    }
  };

  return (
    <div className="home-screen">
      <div className="home-screen__container">
        <h1 className="home-screen__title">APICongress</h1>
        <p className="home-screen__subtitle">AI-Powered Debate Platform</p>

        <form onSubmit={handleSubmit} className="home-screen__form">
          <input
            type="text"
            className="home-screen__input"
            placeholder="Enter debate topic (e.g., Should AI be regulated?)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            autoFocus
          />

          <button
            type="button"
            className="home-screen__advanced-toggle"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            Advanced Options {showAdvanced ? '▲' : '▼'}
          </button>

          {showAdvanced && (
            <AdvancedOptions options={options} onChange={setOptions} />
          )}

          <button
            type="submit"
            className="home-screen__submit"
            disabled={!topic.trim()}
          >
            Begin Debate
          </button>
        </form>
      </div>
    </div>
  );
};

export default HomeScreen;
```

---

## State Management

### Main App State

```jsx
// App.js
const [appState, setAppState] = useState({
  screen: 'home', // 'home' | 'debate' | 'results'
  topic: '',
  participants: [],
  arguments: [],
  debateId: null,
  options: {}
});
```

### Debate State Structure

```javascript
{
  debateId: "uuid-v4",
  topic: "Should AI be regulated?",
  status: "active", // "initializing" | "active" | "completed"
  participants: [
    {
      id: "agent-1",
      name: "ChatGPT",
      logo: "/logos/chatgpt.png",
      team: 1,
      isCurrentSpeaker: false
    },
    // ... 7 more
  ],
  arguments: [
    {
      id: "arg-1",
      participantId: "agent-1",
      participant: { /* participant object */ },
      team: 1,
      content: "AI regulation is essential because...",
      timestamp: "2026-01-09T14:23:45Z",
      respondsTo: null, // or "arg-id"
      files: [
        {
          id: "file-1",
          name: "research.pdf",
          type: "pdf",
          size: "245 KB",
          url: "/files/debate-123/research.pdf"
        }
      ],
      votes: {
        up: 5,
        down: 2
      },
      voteCount: 3
    },
    // ... more arguments
  ],
  currentArgumentIndex: 0,
  totalArguments: 16
}
```

---

## API Integration

### Updated Endpoints

**Initialize Static Debate**
```javascript
POST /api/debate/initialize
{
  "topic": "Should AI be regulated?",
  "participantCount": 8,
  "teamAssignment": "balanced", // "balanced" | "random"
  "duration": "standard" // "quick" | "standard" | "extended"
}

Response:
{
  "debateId": "uuid",
  "participants": [...],
  "estimatedArguments": 16
}
```

**Get Next Argument**
```javascript
GET /api/debate/{debateId}/next-argument

Response:
{
  "argument": { /* argument object */ },
  "hasMore": true,
  "progress": {
    "current": 3,
    "total": 16
  }
}
```

**Submit Vote**
```javascript
POST /api/debate/{debateId}/vote
{
  "argumentId": "arg-1",
  "vote": "up" // "up" | "down" | "neutral"
}

Response:
{
  "success": true,
  "newVoteCount": 4
}
```

---

## Migration Strategy

### Phase 1: Create New Components (Week 1)
1. ✅ Create new component files
2. ✅ Implement basic styling
3. ✅ Add prop types and TypeScript interfaces
4. ✅ Unit tests for each component

### Phase 2: Integrate with Existing Backend (Week 2)
1. Modify `useIntelligentAgents` hook to support static mode
2. Remove party assignment logic
3. Update API calls to new endpoints
4. Add team assignment logic (balanced distribution)

### Phase 3: Replace Old Components (Week 3)
1. Feature flag: `USE_STATIC_UI` environment variable
2. Add new debate screen alongside old one
3. A/B test with users
4. Deprecate old components:
   - PartyAssigner
   - DebateChatBubble (replaced by ArgumentCard)
   - WinnerDisplay (replaced by ResultsView)

### Phase 4: Cleanup (Week 4)
1. Remove deprecated components
2. Remove unused CSS
3. Remove party-related logic
4. Update documentation

---

## File Structure

```
frontend/src/
├── components/
│   ├── DebateTable.js / DebateTable.css (NEW)
│   ├── ParticipantChip.js / ParticipantChip.css (NEW)
│   ├── ArgumentFeed.js / ArgumentFeed.css (NEW)
│   ├── ArgumentCard.js / ArgumentCard.css (NEW)
│   ├── ThreadIndicator.js / ThreadIndicator.css (NEW)
│   ├── AdvancedOptions.js / AdvancedOptions.css (NEW)
│   ├── DebateControls.js / DebateControls.css (NEW)
│   ├── HomeScreen.js / HomeScreen.css (MODIFIED)
│   │
│   ├── [DEPRECATED]
│   ├── PartyAssigner.js
│   ├── DebateChatBubble.js
│   ├── WinnerDisplay.js
│   └── PartyColors.css
│
├── hooks/
│   ├── useStaticDebate.js (NEW)
│   ├── useIntelligentAgents.js (MODIFIED)
│   └── useDebateFlow.js (DEPRECATED)
│
├── styles/
│   ├── variables.css (NEW - design tokens)
│   ├── reset.css (NEW)
│   └── utilities.css (NEW)
│
└── utils/
    ├── teamAssignment.js (NEW)
    └── argumentThreading.js (NEW)
```

---

## Design Tokens

**File**: `/frontend/src/styles/variables.css`

```css
:root {
  /* Colors */
  --color-text-primary: #1F2937;
  --color-text-secondary: #6B7280;
  --color-text-tertiary: #9CA3AF;

  --color-bg-primary: #FFFFFF;
  --color-bg-secondary: #F9FAFB;
  --color-bg-tertiary: #F3F4F6;

  --color-border: #E5E7EB;
  --color-border-light: #F3F4F6;

  --color-team1: #3B82F6;
  --color-team1-light: #EFF6FF;
  --color-team1-dark: #1E40AF;

  --color-team2: #F97316;
  --color-team2-light: #FFF7ED;
  --color-team2-dark: #C2410C;

  --color-accent: #3B82F6;
  --color-success: #10B981;
  --color-error: #EF4444;

  /* Typography */
  --font-primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  --font-mono: 'SF Mono', Monaco, 'Cascadia Code', monospace;

  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;

  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  --space-16: 4rem;

  /* Layout */
  --max-width-content: 800px;
  --max-width-wide: 1200px;
  --header-height: 64px;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-base: 300ms ease;
  --transition-slow: 500ms ease;
}
```

---

## Testing Strategy

### Unit Tests
- Each component isolated
- Snapshot tests for UI consistency
- Interaction tests for voting

### Integration Tests
- Full debate flow from start to finish
- Vote submission and feedback
- File attachment display
- Thread indicator logic

### E2E Tests
- Home screen to debate completion
- Mobile responsive behavior
- Keyboard navigation
- Screen reader compatibility

---

## Performance Optimizations

1. **Virtual Scrolling**: Use `react-window` for argument feed if > 50 arguments
2. **Lazy Loading**: Load participant logos on demand
3. **Memoization**: Memo ArgumentCard to prevent unnecessary re-renders
4. **Code Splitting**: Lazy load debate screen
5. **Image Optimization**: WebP format for logos, lazy loading

---

## Rollback Plan

If issues arise:
1. Toggle feature flag `USE_STATIC_UI=false`
2. Revert to IntelligentDebateScreen
3. Keep new components for gradual migration
4. Collect feedback and iterate

---

**Document Version**: 1.0
**Last Updated**: 2026-01-09
**Status**: Ready for Implementation
