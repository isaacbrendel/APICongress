# Debate UI Best Practices

## Overview
This guide covers best practices for displaying AI-generated debate content in your debate platform. Focus is on engagement, clarity, and emphasizing the competition aspect.

---

## Table Layout Options

### Option 1: Side-by-Side Comparison Table (Recommended)

Best for head-to-head debates where users compare arguments directly.

```jsx
<div className="debate-comparison-table">
  <div className="debate-header">
    <div className="side-header left-side">
      <h3>Democrat</h3>
      <div className="score">👍 {democratUpvotes} 👎 {democratDownvotes}</div>
    </div>
    <div className="topic-header">
      <h2>{topic}</h2>
      <span className="intensity-badge">{intensityLevel}</span>
    </div>
    <div className="side-header right-side">
      <h3>Republican</h3>
      <div className="score">👍 {republicanUpvotes} 👎 {republicanDownvotes}</div>
    </div>
  </div>

  <div className="debate-arguments">
    <div className="argument-column left">
      {democratArguments.map(arg => (
        <ArgumentCard
          key={arg.id}
          argument={arg}
          party="democrat"
          onVote={handleVote}
        />
      ))}
    </div>

    <div className="vs-divider">
      <span>VS</span>
    </div>

    <div className="argument-column right">
      {republicanArguments.map(arg => (
        <ArgumentCard
          key={arg.id}
          argument={arg}
          party="republican"
          onVote={handleVote}
        />
      ))}
    </div>
  </div>
</div>
```

**CSS Tips:**
```css
.debate-comparison-table {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.vs-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #ff4444 0%, #4444ff 100%);
  width: 4px;
  position: relative;
}

.vs-divider span {
  position: sticky;
  top: 50vh;
  background: white;
  padding: 0.5rem 1rem;
  border-radius: 50%;
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}
```

---

### Option 2: Turn-Based Timeline Layout

Best for showing the flow of debate over time, emphasizing back-and-forth.

```jsx
<div className="debate-timeline">
  <div className="timeline-header">
    <h2>{topic}</h2>
    <div className="participants">
      <PartyTag party="democrat" votes={democratVotes} />
      <PartyTag party="republican" votes={republicanVotes} />
      <PartyTag party="independent" votes={independentVotes} />
    </div>
  </div>

  <div className="timeline-content">
    {debateMessages.map((msg, index) => (
      <TimelineArgument
        key={msg.id}
        message={msg}
        turnNumber={index + 1}
        isLatest={index === debateMessages.length - 1}
        onVote={handleVote}
      />
    ))}
  </div>
</div>
```

**CSS Tips:**
```css
.timeline-content {
  position: relative;
  padding: 2rem 0;
}

.timeline-content::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(180deg,
    var(--democrat-color) 0%,
    var(--republican-color) 50%,
    var(--independent-color) 100%
  );
}

.timeline-argument {
  display: flex;
  margin: 2rem 0;
  align-items: center;
}

.timeline-argument.left {
  justify-content: flex-end;
  padding-right: calc(50% + 2rem);
}

.timeline-argument.right {
  justify-content: flex-start;
  padding-left: calc(50% + 2rem);
}
```

---

### Option 3: Tournament Bracket Style

Best for multi-round debates or showcasing persona matchups.

```jsx
<div className="debate-bracket">
  <div className="bracket-round">
    <h3>Round 1</h3>
    <MatchupCard
      persona1="The Absolutist"
      persona2="The Realist"
      topic={topic}
      winner={winner}
      votes={votes}
    />
  </div>
  {/* More rounds */}
</div>
```

---

## Argument Card Design

### Essential Elements

```jsx
<div className={`argument-card ${party} ${persona}`}>
  <div className="card-header">
    <div className="speaker-info">
      <div className="avatar" style={{background: partyColor}}>
        {partyInitial}
      </div>
      <div className="speaker-details">
        <h4>{party} {persona && `- ${persona}`}</h4>
        <span className="timestamp">{timeAgo}</span>
      </div>
    </div>

    {persona && (
      <div className="persona-badge premium">
        <span className="icon">⭐</span>
        {persona}
      </div>
    )}
  </div>

  <div className="card-content">
    <p className="argument-text">{argument}</p>
  </div>

  <div className="card-footer">
    <div className="vote-controls">
      <button
        className={`vote-btn upvote ${userVote === 'up' ? 'active' : ''}`}
        onClick={() => handleVote('up')}
      >
        👍 {upvotes}
      </button>
      <button
        className={`vote-btn downvote ${userVote === 'down' ? 'active' : ''}`}
        onClick={() => handleVote('down')}
      >
        👎 {downvotes}
      </button>
    </div>

    {boldnessScore && (
      <div className="boldness-indicator">
        <span className="label">Boldness:</span>
        <div className="boldness-bar">
          <div
            className="boldness-fill"
            style={{width: `${boldnessScore}%`}}
          />
        </div>
        <span className="score">{boldnessScore}/100</span>
      </div>
    )}
  </div>
</div>
```

**CSS Tips:**
```css
.argument-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
  border-left: 4px solid var(--party-color);
}

.argument-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  transform: translateY(-2px);
}

.argument-card.democrat {
  --party-color: #2563eb;
}

.argument-card.republican {
  --party-color: #dc2626;
}

.argument-card.independent {
  --party-color: #7c3aed;
}

.argument-text {
  font-size: 1.1rem;
  line-height: 1.6;
  color: #1f2937;
  margin: 1rem 0;
  font-weight: 500;
}

.persona-badge.premium {
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #000;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
```

---

## Vote Display Best Practices

### 1. Real-time Vote Counts
Show votes immediately with smooth animations:

```jsx
const AnimatedVoteCount = ({ count }) => {
  const [displayCount, setDisplayCount] = useState(count);

  useEffect(() => {
    const animation = setDisplayCount(count);
    // Animate from old to new count
  }, [count]);

  return (
    <span className="vote-count animate">
      {displayCount}
    </span>
  );
};
```

### 2. Vote Percentage Bars
Visual representation of vote distribution:

```jsx
<div className="vote-distribution">
  <div className="party-votes democrat">
    <span>{democratVotes} votes</span>
    <div
      className="vote-bar"
      style={{width: `${(democratVotes / totalVotes) * 100}%`}}
    />
  </div>
  <div className="party-votes republican">
    <span>{republicanVotes} votes</span>
    <div
      className="vote-bar"
      style={{width: `${(republicanVotes / totalVotes) * 100}%`}}
    />
  </div>
</div>
```

### 3. Ranking Indicators
Show which argument is winning:

```jsx
{isWinning && (
  <div className="winning-badge">
    <span>🏆</span> Leading Argument
  </div>
)}
```

---

## Persona Display (Premium Feature)

### Persona Selector UI

```jsx
<div className="persona-selector">
  <h3>Choose Debate Persona</h3>
  <div className="persona-grid">
    {personas.map(persona => (
      <PersonaCard
        key={persona.id}
        persona={persona}
        selected={selectedPersona === persona.id}
        onSelect={handlePersonaSelect}
        isPremium={persona.isPremium}
      />
    ))}
  </div>
</div>

const PersonaCard = ({ persona, selected, onSelect, isPremium }) => (
  <button
    className={`persona-card ${selected ? 'selected' : ''} ${isPremium ? 'premium' : ''}`}
    onClick={() => onSelect(persona.id)}
  >
    {isPremium && <div className="premium-badge">⭐ PREMIUM</div>}
    <h4>{persona.name}</h4>
    <p>{persona.description}</p>
    {selected && <div className="checkmark">✓</div>}
  </button>
);
```

**CSS Tips:**
```css
.persona-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.persona-card {
  padding: 1.5rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  text-align: left;
}

.persona-card.premium {
  border-color: #ffd700;
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
}

.persona-card.selected {
  border-color: #2563eb;
  background: #eff6ff;
  transform: scale(1.05);
}

.persona-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.15);
}

.premium-badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: #ffd700;
  color: #000;
  font-size: 0.7rem;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-weight: 700;
}
```

---

## Intensity/Controversy Level Display

Show users how heated the debate is:

```jsx
<div className="controversy-meter">
  <label>Debate Intensity</label>
  <div className="meter-container">
    <div className="meter-bar">
      <div
        className="meter-fill"
        style={{
          width: `${controversyLevel}%`,
          background: getIntensityColor(controversyLevel)
        }}
      />
    </div>
    <span className="meter-label">
      {getIntensityLabel(controversyLevel)}
    </span>
  </div>
</div>

function getIntensityColor(level) {
  if (level >= 90) return '#dc2626'; // Red
  if (level >= 70) return '#f59e0b'; // Orange
  if (level >= 40) return '#3b82f6'; // Blue
  return '#10b981'; // Green
}

function getIntensityLabel(level) {
  if (level >= 90) return 'MAXIMUM';
  if (level >= 70) return 'HIGH';
  if (level >= 40) return 'MODERATE';
  return 'MILD';
}
```

---

## Mobile Responsive Design

### Stack on Mobile
```css
@media (max-width: 768px) {
  .debate-comparison-table {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .vs-divider {
    width: 100%;
    height: 4px;
    margin: 1rem 0;
  }

  .vs-divider span {
    position: static;
    display: inline-block;
  }

  .argument-column {
    width: 100%;
  }
}
```

### Touch-Friendly Vote Buttons
```css
@media (max-width: 768px) {
  .vote-btn {
    min-width: 60px;
    min-height: 44px;
    font-size: 1.2rem;
  }
}
```

---

## Real-Time Updates

### WebSocket Integration for Live Votes
```jsx
useEffect(() => {
  const socket = new WebSocket('ws://your-server/debate-updates');

  socket.onmessage = (event) => {
    const update = JSON.parse(event.data);
    if (update.type === 'vote') {
      updateArgumentVotes(update.argumentId, update.votes);
    }
  };

  return () => socket.close();
}, []);
```

### Optimistic UI Updates
```jsx
const handleVote = async (argumentId, voteType) => {
  // Update UI immediately
  setArguments(prev => prev.map(arg =>
    arg.id === argumentId
      ? { ...arg, [voteType + 'votes']: arg[voteType + 'votes'] + 1 }
      : arg
  ));

  try {
    // Send to server
    await api.post('/api/vote/argument', { argumentId, voteType });
  } catch (error) {
    // Revert on error
    setArguments(prev => prev.map(arg =>
      arg.id === argumentId
        ? { ...arg, [voteType + 'votes']: arg[voteType + 'votes'] - 1 }
        : arg
    ));
  }
};
```

---

## Color Schemes

### Recommended Party Colors
```css
:root {
  /* Democrat Colors */
  --democrat-primary: #2563eb;
  --democrat-light: #3b82f6;
  --democrat-bg: #eff6ff;

  /* Republican Colors */
  --republican-primary: #dc2626;
  --republican-light: #ef4444;
  --republican-bg: #fef2f2;

  /* Independent Colors */
  --independent-primary: #7c3aed;
  --independent-light: #8b5cf6;
  --independent-bg: #f5f3ff;

  /* Premium/Persona Colors */
  --premium-gold: #ffd700;
  --premium-gradient: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
}
```

---

## Accessibility Considerations

### Keyboard Navigation
```jsx
<button
  className="vote-btn"
  onClick={() => handleVote('up')}
  onKeyPress={(e) => e.key === 'Enter' && handleVote('up')}
  aria-label={`Upvote ${party} argument`}
  tabIndex={0}
>
  👍 {upvotes}
</button>
```

### Screen Reader Support
```jsx
<div role="region" aria-label="Debate arguments">
  <h2 id="debate-topic">{topic}</h2>
  <div aria-describedby="debate-topic">
    {/* Argument cards */}
  </div>
</div>
```

### High Contrast Mode
```css
@media (prefers-contrast: high) {
  .argument-card {
    border-width: 3px;
  }

  .vote-btn {
    border: 2px solid currentColor;
  }
}
```

---

## Performance Tips

### Virtualize Long Debate Lists
```jsx
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={debateMessages.length}
  itemSize={200}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <ArgumentCard argument={debateMessages[index]} />
    </div>
  )}
</FixedSizeList>
```

### Lazy Load Images/Avatars
```jsx
<img
  src={avatarUrl}
  alt={party}
  loading="lazy"
/>
```

---

## Example Complete Component

```jsx
import React, { useState, useEffect } from 'react';
import './DebateTable.css';

const DebateTable = ({ topic, controversyLevel = 100 }) => {
  const [arguments, setArguments] = useState([]);
  const [selectedPersona, setSelectedPersona] = useState('standard');
  const [personas, setPersonas] = useState([]);

  useEffect(() => {
    // Fetch available personas
    fetch('/api/personas')
      .then(r => r.json())
      .then(data => setPersonas(data.personas));
  }, []);

  const handleVote = async (argumentId, voteType) => {
    // Optimistic update
    setArguments(prev => prev.map(arg =>
      arg.id === argumentId
        ? { ...arg, votes: { ...arg.votes, [voteType]: arg.votes[voteType] + 1 }}
        : arg
    ));

    try {
      await fetch('/api/vote/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: argumentId, voteType })
      });
    } catch (error) {
      console.error('Vote failed:', error);
      // Revert on error
    }
  };

  return (
    <div className="debate-table-container">
      <header className="debate-header">
        <h1>{topic}</h1>
        <div className="intensity-badge">
          Intensity: {getIntensityLabel(controversyLevel)}
        </div>
      </header>

      <PersonaSelector
        personas={personas}
        selected={selectedPersona}
        onSelect={setSelectedPersona}
      />

      <div className="debate-grid">
        <div className="party-column democrat">
          <PartyHeader party="Democrat" votes={getDemocratVotes()} />
          {arguments.filter(a => a.party === 'Democrat').map(arg => (
            <ArgumentCard
              key={arg.id}
              argument={arg}
              onVote={handleVote}
            />
          ))}
        </div>

        <div className="vs-divider">VS</div>

        <div className="party-column republican">
          <PartyHeader party="Republican" votes={getRepublicanVotes()} />
          {arguments.filter(a => a.party === 'Republican').map(arg => (
            <ArgumentCard
              key={arg.id}
              argument={arg}
              onVote={handleVote}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default DebateTable;
```

---

## Summary

**Key Principles:**
1. **Emphasize Competition** - Use VS dividers, winning indicators, rankings
2. **Make Voting Easy** - Large, clear buttons with immediate feedback
3. **Highlight Premium Personas** - Use gold badges, special styling
4. **Show Intensity** - Display boldness scores, controversy levels
5. **Responsive Design** - Stack on mobile, touch-friendly controls
6. **Real-time Feel** - Optimistic updates, smooth animations
7. **Party Branding** - Clear color coding for each party
8. **Accessibility** - Keyboard nav, ARIA labels, high contrast support

**Engagement Maximizers:**
- Live vote counts with animations
- Boldness scoring meters
- "Winning argument" indicators
- Persona showcase with premium badges
- Turn-by-turn timeline view
- Side-by-side comparison layouts

This creates a highly engaging debate viewing experience that emphasizes the competitive, direct nature of the AI-generated arguments while giving users clear control through voting and persona selection.
