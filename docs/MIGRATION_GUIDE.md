# Migration Guide: Legacy to Static UI

## Overview
This guide provides step-by-step instructions for migrating from the current dynamic debate interface to the new static, minimal design system.

---

## Pre-Migration Checklist

- [ ] Review all three specification documents
- [ ] Backup current codebase (`git tag v1-legacy`)
- [ ] Set up feature flag system
- [ ] Create development branch (`git checkout -b feature/static-ui`)
- [ ] Notify stakeholders of UI changes
- [ ] Prepare rollback plan

---

## Migration Phases

### Phase 1: Setup & Infrastructure (Days 1-2)

#### 1.1 Create Design Token System

**File**: `/frontend/src/styles/variables.css`

1. Create new styles directory:
```bash
mkdir -p frontend/src/styles
```

2. Copy the design tokens from `TECHNICAL_IMPLEMENTATION.md`

3. Import in `index.css`:
```css
@import './styles/variables.css';
```

#### 1.2 Set Up Feature Flag

**File**: `/frontend/.env.development`

```env
REACT_APP_USE_STATIC_UI=true
REACT_APP_API_URL=http://localhost:5002
```

**File**: `/frontend/src/config/featureFlags.js` (NEW)

```javascript
export const featureFlags = {
  useStaticUI: process.env.REACT_APP_USE_STATIC_UI === 'true',
  enableSessionPersistence: process.env.REACT_APP_SESSION_PERSISTENCE === 'true',
  enableAnalytics: process.env.REACT_APP_ANALYTICS === 'true'
};
```

#### 1.3 Update App.js

```javascript
import { featureFlags } from './config/featureFlags';
import DebateScreen from './components/DebateScreen'; // OLD
import StaticDebateScreen from './components/StaticDebateScreen'; // NEW

function App() {
  // ... existing state

  const DebateComponent = featureFlags.useStaticUI
    ? StaticDebateScreen
    : DebateScreen;

  return (
    <div className="App">
      {!debateStarted ? (
        <HomeScreen onStartDebate={startDebate} />
      ) : (
        <DebateComponent
          topic={topic}
          models={models}
          onReset={resetDebate}
        />
      )}
    </div>
  );
}
```

---

### Phase 2: Core Component Development (Days 3-7)

#### 2.1 Create ParticipantChip Component

1. Create component files:
```bash
touch frontend/src/components/ParticipantChip.js
touch frontend/src/components/ParticipantChip.css
```

2. Copy implementation from `TECHNICAL_IMPLEMENTATION.md`

3. Test in isolation:
```bash
npm test -- ParticipantChip.test.js
```

#### 2.2 Create DebateTable Component

1. Create component files:
```bash
touch frontend/src/components/DebateTable.js
touch frontend/src/components/DebateTable.css
```

2. Implement component with ParticipantChip children

3. Test rendering with mock participants

#### 2.3 Create ArgumentCard Component

1. Create component files:
```bash
touch frontend/src/components/ArgumentCard.js
touch frontend/src/components/ArgumentCard.css
```

2. Implement voting logic

3. Add file attachment display

4. Test voting interactions

#### 2.4 Create ArgumentFeed Component

1. Create component files:
```bash
touch frontend/src/components/ArgumentFeed.js
touch frontend/src/components/ArgumentFeed.css
```

2. Implement scrollable feed

3. Add thread indicators

4. Test with various argument counts

---

### Phase 3: State Management (Days 8-10)

#### 3.1 Create useStaticDebate Hook

**File**: `/frontend/src/hooks/useStaticDebate.js` (NEW)

```javascript
import { useState, useCallback, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

export const useStaticDebate = (topic, config) => {
  const [state, setState] = useState({
    status: 'initializing', // 'initializing' | 'active' | 'completed'
    debateId: null,
    participants: [],
    arguments: [],
    currentArgumentIndex: 0,
    totalArguments: 0
  });

  const initializeDebate = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/debate/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, config })
      });

      if (!response.ok) throw new Error('Failed to initialize debate');

      const data = await response.json();

      setState(prev => ({
        ...prev,
        status: 'active',
        debateId: data.debateId,
        participants: data.participants,
        totalArguments: data.estimatedArguments
      }));

      return data;
    } catch (error) {
      console.error('Error initializing debate:', error);
      throw error;
    }
  }, [topic, config]);

  const fetchNextArgument = useCallback(async () => {
    if (!state.debateId) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/debate/${state.debateId}/next-argument`
      );

      if (!response.ok) throw new Error('Failed to fetch argument');

      const data = await response.json();

      setState(prev => ({
        ...prev,
        arguments: [...prev.arguments, data.argument],
        currentArgumentIndex: prev.currentArgumentIndex + 1,
        status: data.hasMore ? 'active' : 'completed'
      }));

      return data.argument;
    } catch (error) {
      console.error('Error fetching argument:', error);
      throw error;
    }
  }, [state.debateId]);

  const submitVote = useCallback(async (argumentId, vote) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/debate/${state.debateId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ argumentId, vote })
      });

      if (!response.ok) throw new Error('Failed to submit vote');

      const data = await response.json();

      // Update vote count in local state
      setState(prev => ({
        ...prev,
        arguments: prev.arguments.map(arg =>
          arg.id === argumentId
            ? { ...arg, voteCount: data.newVoteCount }
            : arg
        )
      }));

      return data;
    } catch (error) {
      console.error('Error submitting vote:', error);
      throw error;
    }
  }, [state.debateId]);

  useEffect(() => {
    if (topic && !state.debateId) {
      initializeDebate();
    }
  }, [topic, state.debateId, initializeDebate]);

  return {
    ...state,
    initializeDebate,
    fetchNextArgument,
    submitVote
  };
};
```

#### 3.2 Update useIntelligentAgents Hook

Modify existing hook to support static mode:

```javascript
// Add new method for static debate initialization
const initializeStaticDebate = useCallback(async (topic, options = {}) => {
  try {
    setIsInitialized(false);
    setError(null);

    // Initialize congress with balanced teams
    const congressData = await initializeCongress(8);

    // Assign teams (4 per team)
    const participantsWithTeams = congressData.agents.map((agent, index) => ({
      ...agent,
      team: (index % 2) + 1, // Alternating teams
      isCurrentSpeaker: false
    }));

    // Start debate with static mode
    const debateData = await startIntelligentDebate(
      topic,
      participantsWithTeams.map(p => p.id),
      { ...options, mode: 'static' }
    );

    setDebateId(debateData.debateId);
    setAgents(participantsWithTeams);
    setIsInitialized(true);

    return {
      debateId: debateData.debateId,
      participants: participantsWithTeams
    };
  } catch (err) {
    setError(err.message);
    throw err;
  }
}, [initializeCongress, startIntelligentDebate]);

// Export new method
return {
  // ... existing exports
  initializeStaticDebate
};
```

---

### Phase 4: Main Screen Implementation (Days 11-14)

#### 4.1 Create StaticDebateScreen Component

**File**: `/frontend/src/components/StaticDebateScreen.js` (NEW)

```javascript
import React, { useState, useEffect } from 'react';
import DebateTable from './DebateTable';
import ArgumentFeed from './ArgumentFeed';
import TopicBanner from './TopicBanner';
import { useStaticDebate } from '../hooks/useStaticDebate';
import './StaticDebateScreen.css';

const StaticDebateScreen = ({ topic, models, onReset }) => {
  const {
    status,
    participants,
    arguments: debateArguments,
    currentArgumentIndex,
    totalArguments,
    fetchNextArgument,
    submitVote
  } = useStaticDebate(topic, {
    participantCount: 8,
    duration: 'standard'
  });

  const [autoAdvance, setAutoAdvance] = useState(true);

  // Auto-fetch next argument
  useEffect(() => {
    if (status === 'active' && autoAdvance) {
      const timer = setTimeout(() => {
        fetchNextArgument();
      }, 3000); // 3 second delay between arguments

      return () => clearTimeout(timer);
    }
  }, [status, autoAdvance, currentArgumentIndex, fetchNextArgument]);

  const handleVote = (argumentId, vote) => {
    submitVote(argumentId, vote);
  };

  if (status === 'initializing') {
    return (
      <div className="static-debate-screen static-debate-screen--loading">
        <div className="loading-spinner">Initializing debate...</div>
      </div>
    );
  }

  return (
    <div className="static-debate-screen">
      <TopicBanner topic={topic} />

      <DebateTable participants={participants} />

      <ArgumentFeed
        arguments={debateArguments}
        onVote={handleVote}
      />

      <div className="debate-controls">
        {status === 'active' && (
          <>
            <button onClick={() => setAutoAdvance(!autoAdvance)}>
              {autoAdvance ? 'Pause' : 'Resume'}
            </button>
            <button onClick={fetchNextArgument}>Next Argument</button>
          </>
        )}
        {status === 'completed' && (
          <button onClick={onReset}>New Debate</button>
        )}
      </div>

      {totalArguments > 0 && (
        <div className="debate-progress">
          {currentArgumentIndex} of {totalArguments} arguments
        </div>
      )}
    </div>
  );
};

export default StaticDebateScreen;
```

#### 4.2 Create Corresponding CSS

**File**: `/frontend/src/components/StaticDebateScreen.css`

```css
.static-debate-screen {
  min-height: 100vh;
  background: var(--color-bg-secondary);
  display: flex;
  flex-direction: column;
}

.static-debate-screen--loading {
  justify-content: center;
  align-items: center;
}

.loading-spinner {
  font-size: var(--text-lg);
  color: var(--color-text-secondary);
}

.debate-controls {
  position: fixed;
  bottom: var(--space-4);
  right: var(--space-4);
  display: flex;
  gap: var(--space-2);
  background: white;
  padding: var(--space-3);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}

.debate-controls button {
  padding: var(--space-2) var(--space-4);
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: var(--transition-fast);
}

.debate-controls button:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.debate-progress {
  position: fixed;
  bottom: var(--space-4);
  left: var(--space-4);
  background: white;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

@media (max-width: 768px) {
  .debate-controls {
    left: var(--space-4);
    right: var(--space-4);
    justify-content: center;
  }

  .debate-progress {
    left: 50%;
    transform: translateX(-50%);
    bottom: calc(var(--space-4) + 60px);
  }
}
```

---

### Phase 5: Deprecate Old Components (Days 15-17)

#### 5.1 Mark Components as Deprecated

Add warning comments to old components:

```javascript
// frontend/src/components/DebateScreen.js

/**
 * @deprecated This component is deprecated and will be removed in v2.0
 * Use StaticDebateScreen instead
 * @see StaticDebateScreen
 */
const DebateScreen = ({ topic, models, onReset }) => {
  console.warn('DebateScreen is deprecated. Use StaticDebateScreen instead.');
  // ... existing implementation
};
```

#### 5.2 Update Imports with Deprecation Notices

```javascript
// frontend/src/App.js

// Legacy imports (to be removed)
import DebateScreen from './components/DebateScreen'; // DEPRECATED
import PartyAssigner from './components/PartyAssigner'; // DEPRECATED

// New imports
import StaticDebateScreen from './components/StaticDebateScreen';
```

#### 5.3 Create Component Migration Map

**File**: `/docs/COMPONENT_MIGRATION_MAP.md`

```markdown
# Component Migration Map

| Old Component | New Component | Status | Notes |
|--------------|---------------|--------|-------|
| DebateScreen | StaticDebateScreen | ✅ Complete | Remove party logic |
| PartyAssigner | (removed) | ✅ Complete | No longer needed |
| DebateChatBubble | ArgumentCard | ✅ Complete | Simplified design |
| VotingInterface | (inline voting) | ✅ Complete | Now part of ArgumentCard |
| WinnerDisplay | ResultsView | 🚧 In Progress | Simplified results |
| DebaterCard | ParticipantChip | ✅ Complete | Minimal design |
```

---

### Phase 6: CSS Cleanup (Days 18-19)

#### 6.1 Remove Unused CSS

1. Identify unused CSS files:
```bash
# List all CSS files
find frontend/src -name "*.css" -type f

# Check for unused imports
grep -r "import.*\.css" frontend/src/components/
```

2. Move to deprecated folder:
```bash
mkdir -p frontend/src/components/deprecated
mv frontend/src/components/PartyAssigner.* frontend/src/components/deprecated/
mv frontend/src/components/DebateChatBubble.* frontend/src/components/deprecated/
mv frontend/src/components/PartyColors.css frontend/src/components/deprecated/
```

#### 6.2 Consolidate Remaining Styles

1. Create unified style system:
```bash
touch frontend/src/styles/reset.css
touch frontend/src/styles/utilities.css
```

2. Import order in `index.css`:
```css
/* Reset & Base */
@import './styles/reset.css';
@import './styles/variables.css';

/* Utilities */
@import './styles/utilities.css';

/* Application styles */
@import './App.css';
```

---

### Phase 7: Testing & QA (Days 20-21)

#### 7.1 Unit Tests

Create test files for all new components:

```bash
touch frontend/src/components/__tests__/ParticipantChip.test.js
touch frontend/src/components/__tests__/DebateTable.test.js
touch frontend/src/components/__tests__/ArgumentCard.test.js
touch frontend/src/components/__tests__/ArgumentFeed.test.js
touch frontend/src/components/__tests__/StaticDebateScreen.test.js
```

Example test:

```javascript
// frontend/src/components/__tests__/ParticipantChip.test.js

import { render, screen } from '@testing-library/react';
import ParticipantChip from '../ParticipantChip';

describe('ParticipantChip', () => {
  const mockParticipant = {
    name: 'ChatGPT',
    logo: '/logos/chatgpt.png',
    team: 1,
    isActive: false
  };

  test('renders participant name', () => {
    render(<ParticipantChip {...mockParticipant} />);
    expect(screen.getByText('ChatGPT')).toBeInTheDocument();
  });

  test('displays team indicator', () => {
    render(<ParticipantChip {...mockParticipant} />);
    expect(screen.getByText('T1')).toBeInTheDocument();
  });

  test('applies active class when isActive is true', () => {
    render(<ParticipantChip {...mockParticipant} isActive={true} />);
    const chip = screen.getByText('ChatGPT').closest('.participant-chip');
    expect(chip).toHaveClass('participant-chip--active');
  });
});
```

Run tests:
```bash
npm test -- --coverage
```

#### 7.2 Integration Tests

Test full debate flow:

```javascript
// frontend/src/__tests__/integration/debateFlow.test.js

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';

describe('Debate Flow Integration', () => {
  test('complete debate flow from home to results', async () => {
    const user = userEvent.setup();

    render(<App />);

    // Start on home screen
    expect(screen.getByText('APICongress')).toBeInTheDocument();

    // Enter topic
    const input = screen.getByPlaceholderText(/enter debate topic/i);
    await user.type(input, 'Should AI be regulated?');

    // Start debate
    const startButton = screen.getByText('Begin Debate');
    await user.click(startButton);

    // Wait for debate table to appear
    await waitFor(() => {
      expect(screen.getByText('The Table')).toBeInTheDocument();
    });

    // Check that participants are shown
    expect(screen.getByText('ChatGPT')).toBeInTheDocument();
    expect(screen.getByText('Claude')).toBeInTheDocument();

    // Wait for first argument
    await waitFor(() => {
      expect(screen.getByText(/AI regulation/i)).toBeInTheDocument();
    }, { timeout: 5000 });

    // Test voting
    const upvoteButton = screen.getAllByLabelText('Upvote argument')[0];
    await user.click(upvoteButton);

    // Verify vote was recorded
    expect(upvoteButton).toHaveClass('vote-button--active');
  });
});
```

#### 7.3 Visual Regression Tests

Set up Chromatic or Percy for visual diffs:

```bash
npm install --save-dev @storybook/react
npx storybook init
```

Create stories:

```javascript
// frontend/src/components/ParticipantChip.stories.js

import ParticipantChip from './ParticipantChip';

export default {
  title: 'Components/ParticipantChip',
  component: ParticipantChip
};

export const Default = () => (
  <ParticipantChip
    name="ChatGPT"
    logo="/logos/chatgpt.png"
    team={1}
    isActive={false}
  />
);

export const Active = () => (
  <ParticipantChip
    name="ChatGPT"
    logo="/logos/chatgpt.png"
    team={1}
    isActive={true}
  />
);

export const Team2 = () => (
  <ParticipantChip
    name="Gemini"
    logo="/logos/gemini.png"
    team={2}
    isActive={false}
  />
);
```

---

### Phase 8: Production Deployment (Days 22-23)

#### 8.1 Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Code review completed
- [ ] Feature flag configured for gradual rollout
- [ ] Performance benchmarks met
- [ ] Accessibility audit passed
- [ ] Mobile testing completed
- [ ] Analytics tracking implemented
- [ ] Error monitoring configured
- [ ] Documentation updated

#### 8.2 Gradual Rollout Strategy

**Week 1: Internal Testing (10% traffic)**
```env
REACT_APP_USE_STATIC_UI=true
ROLLOUT_PERCENTAGE=10
```

Monitor:
- Error rates
- User engagement
- Performance metrics
- User feedback

**Week 2: Beta Users (25% traffic)**
```env
ROLLOUT_PERCENTAGE=25
```

**Week 3: Wider Rollout (50% traffic)**
```env
ROLLOUT_PERCENTAGE=50
```

**Week 4: Full Rollout (100% traffic)**
```env
REACT_APP_USE_STATIC_UI=true
ROLLOUT_PERCENTAGE=100
```

#### 8.3 Rollback Procedure

If critical issues arise:

1. Immediate rollback via feature flag:
```bash
# Production environment
export REACT_APP_USE_STATIC_UI=false
```

2. Redeploy previous version:
```bash
git revert HEAD
git push origin main
```

3. Notify users:
- Status page update
- Email notification
- In-app banner

---

## Post-Migration Tasks

### Week 1 After Full Rollout

- [ ] Remove deprecated components
- [ ] Delete unused CSS files
- [ ] Update all documentation
- [ ] Archive old screenshots/demos
- [ ] Publish migration announcement
- [ ] Collect user feedback
- [ ] Plan next iteration

### Week 2 After Full Rollout

- [ ] Analyze engagement metrics
- [ ] Review error logs
- [ ] Optimize performance based on real usage
- [ ] Address user feedback
- [ ] Plan session persistence features

---

## Troubleshooting Common Issues

### Issue: Feature flag not working

**Solution:**
```bash
# Clear browser cache and localStorage
localStorage.clear();

# Restart dev server
npm start
```

### Issue: Old styles bleeding into new components

**Solution:**
```css
/* Add specificity to new components */
.static-debate-screen .argument-card {
  /* Override old styles */
  all: unset;
  /* Apply new styles */
}
```

### Issue: API endpoints returning wrong data format

**Solution:**
Update API response transformers:
```javascript
const transformLegacyResponse = (data) => {
  return {
    arguments: data.messages?.map(msg => ({
      id: msg.id,
      content: msg.text,
      participant: msg.speaker,
      team: msg.party === 'Democrat' ? 1 : 2 // Legacy mapping
    }))
  };
};
```

---

## Success Metrics

Track these metrics to measure migration success:

- [ ] Zero production errors related to new UI
- [ ] < 2s page load time
- [ ] 95%+ mobile responsiveness score
- [ ] 90%+ positive user feedback
- [ ] 50%+ reduction in support tickets about UI confusion
- [ ] Maintained or improved engagement metrics

---

## Support & Resources

- **Technical Questions**: Check `TECHNICAL_IMPLEMENTATION.md`
- **Design Questions**: Check `UI_UX_SPECIFICATION.md`
- **Session Features**: Check `AI_SESSION_INFRASTRUCTURE.md`
- **Bug Reports**: File issues in GitHub
- **Feature Requests**: Discuss in team meetings

---

**Document Version**: 1.0
**Last Updated**: 2026-01-09
**Migration Owner**: Development Team
