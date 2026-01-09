# AI Session Infrastructure Documentation

## Overview
Infrastructure for easy management, persistence, and reuse of AI debate sessions. This system enables saving, loading, sharing, and analyzing debate sessions for improved iteration and experimentation.

---

## Core Features

### 1. Session Management
- Create new sessions
- Save session state at any point
- Load previous sessions
- Clone sessions for variations
- Archive completed sessions

### 2. Session Persistence
- Local storage for quick access
- Database persistence for long-term storage
- Export sessions to JSON
- Import sessions from JSON

### 3. Session Sharing
- Generate shareable links
- Public/private session visibility
- Embed debates on other sites
- API access for programmatic retrieval

### 4. Session Analytics
- Track engagement metrics
- Analyze voting patterns
- Compare different AI behaviors
- Export analytics data

---

## Database Schema

### Sessions Table

```sql
CREATE TABLE debate_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Core Data
  topic VARCHAR(500) NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'active', 'paused', 'completed', 'archived'

  -- Configuration
  config JSONB NOT NULL, -- participantCount, duration, options

  -- Participants
  participants JSONB NOT NULL, -- Array of participant objects

  -- Debate State
  current_argument_index INTEGER DEFAULT 0,
  total_arguments INTEGER,

  -- Metadata
  user_id UUID REFERENCES users(id),
  is_public BOOLEAN DEFAULT FALSE,
  share_token VARCHAR(64) UNIQUE,

  -- Analytics
  view_count INTEGER DEFAULT 0,
  vote_count INTEGER DEFAULT 0,

  CONSTRAINT valid_status CHECK (status IN ('active', 'paused', 'completed', 'archived'))
);

CREATE INDEX idx_sessions_user_id ON debate_sessions(user_id);
CREATE INDEX idx_sessions_status ON debate_sessions(status);
CREATE INDEX idx_sessions_created_at ON debate_sessions(created_at DESC);
CREATE INDEX idx_sessions_share_token ON debate_sessions(share_token);
```

### Arguments Table

```sql
CREATE TABLE debate_arguments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES debate_sessions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),

  -- Argument Data
  participant_id VARCHAR(100) NOT NULL,
  team INTEGER NOT NULL,
  content TEXT NOT NULL,
  responds_to UUID REFERENCES debate_arguments(id),

  -- Files
  files JSONB, -- Array of file metadata

  -- Voting
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,

  -- Ordering
  sequence_number INTEGER NOT NULL,

  CONSTRAINT valid_team CHECK (team IN (1, 2))
);

CREATE INDEX idx_arguments_session_id ON debate_arguments(session_id);
CREATE INDEX idx_arguments_sequence ON debate_arguments(session_id, sequence_number);
CREATE INDEX idx_arguments_responds_to ON debate_arguments(responds_to);
```

### Votes Table

```sql
CREATE TABLE debate_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT NOW(),

  -- Vote Data
  argument_id UUID NOT NULL REFERENCES debate_arguments(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES debate_sessions(id) ON DELETE CASCADE,

  -- Vote Type
  vote_type VARCHAR(10) NOT NULL, -- 'up', 'down'

  -- User (optional for anonymous votes)
  user_id UUID REFERENCES users(id),
  ip_address INET,

  CONSTRAINT valid_vote_type CHECK (vote_type IN ('up', 'down')),
  CONSTRAINT unique_user_vote UNIQUE (argument_id, user_id)
);

CREATE INDEX idx_votes_argument_id ON debate_votes(argument_id);
CREATE INDEX idx_votes_session_id ON debate_votes(session_id);
```

### Session Analytics Table

```sql
CREATE TABLE session_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES debate_sessions(id) ON DELETE CASCADE,
  recorded_at TIMESTAMP DEFAULT NOW(),

  -- Metrics
  event_type VARCHAR(50) NOT NULL, -- 'view', 'vote', 'share', 'export'
  event_data JSONB,

  -- User Context
  user_id UUID REFERENCES users(id),
  ip_address INET,
  user_agent TEXT,

  -- Referrer
  referrer TEXT
);

CREATE INDEX idx_analytics_session_id ON session_analytics(session_id);
CREATE INDEX idx_analytics_event_type ON session_analytics(event_type);
CREATE INDEX idx_analytics_recorded_at ON session_analytics(recorded_at DESC);
```

---

## Backend API Endpoints

### Session Management

#### Create New Session
```http
POST /api/sessions
Content-Type: application/json

{
  "topic": "Should AI be regulated?",
  "config": {
    "participantCount": 8,
    "duration": "standard",
    "teamAssignment": "balanced"
  }
}

Response:
{
  "sessionId": "uuid",
  "shareToken": "abc123...",
  "status": "active",
  "participants": [...],
  "createdAt": "2026-01-09T14:23:45Z"
}
```

#### Get Session
```http
GET /api/sessions/{sessionId}

Response:
{
  "session": {
    "id": "uuid",
    "topic": "...",
    "status": "active",
    "participants": [...],
    "config": {...},
    "createdAt": "...",
    "updatedAt": "..."
  },
  "arguments": [...],
  "progress": {
    "current": 5,
    "total": 16
  }
}
```

#### Update Session Status
```http
PATCH /api/sessions/{sessionId}/status
Content-Type: application/json

{
  "status": "paused" // or "active", "completed", "archived"
}

Response:
{
  "success": true,
  "session": {...}
}
```

#### List Sessions
```http
GET /api/sessions?status=active&limit=20&offset=0

Response:
{
  "sessions": [
    {
      "id": "...",
      "topic": "...",
      "status": "active",
      "createdAt": "...",
      "argumentCount": 12,
      "voteCount": 45
    },
    ...
  ],
  "total": 150,
  "hasMore": true
}
```

#### Delete Session
```http
DELETE /api/sessions/{sessionId}

Response:
{
  "success": true,
  "message": "Session deleted successfully"
}
```

---

### Session Sharing

#### Generate Share Link
```http
POST /api/sessions/{sessionId}/share
Content-Type: application/json

{
  "isPublic": true
}

Response:
{
  "shareUrl": "https://apicongress.com/debate/abc123...",
  "shareToken": "abc123...",
  "expiresAt": null // or timestamp for temporary links
}
```

#### Access Shared Session
```http
GET /api/sessions/shared/{shareToken}

Response:
{
  "session": {...},
  "arguments": [...],
  "isPublic": true,
  "canVote": true,
  "canEdit": false
}
```

#### Revoke Share Link
```http
DELETE /api/sessions/{sessionId}/share

Response:
{
  "success": true,
  "message": "Share link revoked"
}
```

---

### Export/Import

#### Export Session
```http
GET /api/sessions/{sessionId}/export?format=json

Response:
{
  "version": "1.0",
  "exportedAt": "2026-01-09T14:23:45Z",
  "session": {...},
  "arguments": [...],
  "votes": {...},
  "analytics": {...}
}
```

#### Import Session
```http
POST /api/sessions/import
Content-Type: application/json

{
  "version": "1.0",
  "session": {...},
  "arguments": [...]
}

Response:
{
  "sessionId": "uuid",
  "imported": true,
  "message": "Session imported successfully"
}
```

---

### Analytics

#### Get Session Analytics
```http
GET /api/sessions/{sessionId}/analytics

Response:
{
  "overview": {
    "totalViews": 127,
    "totalVotes": 45,
    "uniqueVisitors": 89,
    "averageTimeSpent": "4m 32s"
  },
  "votingPatterns": {
    "team1Upvotes": 28,
    "team1Downvotes": 5,
    "team2Upvotes": 10,
    "team2Downvotes": 2
  },
  "argumentEngagement": [
    {
      "argumentId": "...",
      "views": 98,
      "votes": 23,
      "engagementRate": 0.23
    },
    ...
  ],
  "timeline": {
    "hourly": [...],
    "daily": [...]
  }
}
```

---

## Frontend Components

### Session Manager Component

**File**: `/frontend/src/components/SessionManager.js`

```jsx
import React, { useState, useEffect } from 'react';
import { useSessionManager } from '../hooks/useSessionManager';
import './SessionManager.css';

const SessionManager = ({ onLoadSession }) => {
  const { sessions, loading, error, loadSessions, deleteSession } = useSessionManager();
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'completed'

  useEffect(() => {
    loadSessions(filter);
  }, [filter]);

  const filteredSessions = sessions.filter(s => {
    if (filter === 'all') return true;
    return s.status === filter;
  });

  return (
    <div className="session-manager">
      <div className="session-manager__header">
        <h2>Your Debates</h2>
        <div className="session-manager__filters">
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={filter === 'active' ? 'active' : ''}
            onClick={() => setFilter('active')}
          >
            Active
          </button>
          <button
            className={filter === 'completed' ? 'active' : ''}
            onClick={() => setFilter('completed')}
          >
            Completed
          </button>
        </div>
      </div>

      {loading && <div className="session-manager__loading">Loading...</div>}
      {error && <div className="session-manager__error">{error}</div>}

      <div className="session-manager__list">
        {filteredSessions.map(session => (
          <div key={session.id} className="session-card">
            <div className="session-card__header">
              <h3>{session.topic}</h3>
              <span className={`session-card__status session-card__status--${session.status}`}>
                {session.status}
              </span>
            </div>
            <div className="session-card__meta">
              <span>{session.argumentCount} arguments</span>
              <span>{session.voteCount} votes</span>
              <span>{new Date(session.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="session-card__actions">
              <button onClick={() => onLoadSession(session.id)}>
                Load
              </button>
              <button onClick={() => navigator.clipboard.writeText(session.shareUrl)}>
                Share
              </button>
              <button onClick={() => deleteSession(session.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SessionManager;
```

---

### Save Session Dialog

**File**: `/frontend/src/components/SaveSessionDialog.js`

```jsx
import React, { useState } from 'react';
import './SaveSessionDialog.css';

const SaveSessionDialog = ({ session, onSave, onCancel }) => {
  const [isPublic, setIsPublic] = useState(false);
  const [name, setName] = useState(session.topic);

  const handleSave = () => {
    onSave({
      name,
      isPublic,
      status: 'completed'
    });
  };

  return (
    <div className="save-dialog">
      <div className="save-dialog__content">
        <h2>Save Debate Session</h2>

        <div className="save-dialog__field">
          <label>Session Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="save-dialog__field">
          <label>
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            Make this debate public
          </label>
          <p className="save-dialog__help">
            Public debates can be viewed by anyone with the link
          </p>
        </div>

        <div className="save-dialog__actions">
          <button onClick={onCancel}>Cancel</button>
          <button onClick={handleSave} className="primary">
            Save Session
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveSessionDialog;
```

---

## Custom Hooks

### useSessionManager Hook

**File**: `/frontend/src/hooks/useSessionManager.js`

```javascript
import { useState, useCallback } from 'react';
import { API_BASE_URL } from '../config/api';

export const useSessionManager = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadSessions = useCallback(async (filter = 'all') => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions?status=${filter}`);
      if (!response.ok) throw new Error('Failed to load sessions');
      const data = await response.json();
      setSessions(data.sessions);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createSession = useCallback(async (topic, config) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, config })
      });
      if (!response.ok) throw new Error('Failed to create session');
      return await response.json();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const getSession = useCallback(async (sessionId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`);
      if (!response.ok) throw new Error('Failed to load session');
      return await response.json();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const saveSession = useCallback(async (sessionId, updates) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to save session');
      return await response.json();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const deleteSession = useCallback(async (sessionId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete session');
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const shareSession = useCallback(async (sessionId, isPublic = true) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic })
      });
      if (!response.ok) throw new Error('Failed to generate share link');
      return await response.json();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const exportSession = useCallback(async (sessionId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/export`);
      if (!response.ok) throw new Error('Failed to export session');
      const data = await response.json();

      // Trigger download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `debate-${sessionId}.json`;
      a.click();
      URL.revokeObjectURL(url);

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const importSession = useCallback(async (sessionData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      });
      if (!response.ok) throw new Error('Failed to import session');
      return await response.json();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  return {
    sessions,
    loading,
    error,
    loadSessions,
    createSession,
    getSession,
    saveSession,
    deleteSession,
    shareSession,
    exportSession,
    importSession
  };
};
```

---

## Local Storage Strategy

### Storage Keys
```javascript
// Session IDs stored locally
localStorage.setItem('apicongress_recent_sessions', JSON.stringify([
  'session-id-1',
  'session-id-2',
  // ...up to 10 most recent
]));

// Current active session
localStorage.setItem('apicongress_active_session', 'session-id-1');

// Session cache (for offline access)
localStorage.setItem('apicongress_session_cache', JSON.stringify({
  'session-id-1': {
    session: {...},
    arguments: [...],
    cachedAt: '2026-01-09T14:23:45Z'
  }
}));

// User preferences
localStorage.setItem('apicongress_preferences', JSON.stringify({
  defaultParticipantCount: 8,
  autoSave: true,
  theme: 'light'
}));
```

### Cache Management
- Cache last 10 sessions for offline access
- Clear cache older than 7 days
- Sync with backend on network restore
- Progressive Web App (PWA) support

---

## Implementation Roadmap

### Phase 1: Basic Persistence (Week 1)
- [ ] Create database schema
- [ ] Implement session creation/retrieval endpoints
- [ ] Add local storage fallback
- [ ] Basic session list UI

### Phase 2: Session Management (Week 2)
- [ ] Session Manager component
- [ ] Save/Load functionality
- [ ] Session status updates
- [ ] Delete/Archive sessions

### Phase 3: Sharing & Export (Week 3)
- [ ] Share link generation
- [ ] Public session viewer
- [ ] Export to JSON
- [ ] Import from JSON

### Phase 4: Analytics (Week 4)
- [ ] Track session metrics
- [ ] Analytics dashboard
- [ ] Voting pattern analysis
- [ ] Export analytics data

---

## Security Considerations

### Access Control
- Sessions are private by default
- Share tokens are cryptographically secure (64 chars)
- Rate limiting on session creation (10/hour per IP)
- Anonymous votes tracked by IP (single vote per IP per argument)

### Data Privacy
- No PII collected without explicit consent
- IP addresses hashed for analytics
- GDPR compliance for EU users
- Data retention: 90 days for inactive sessions

### API Security
- JWT authentication for user sessions
- CORS configuration for allowed origins
- Input validation and sanitization
- SQL injection prevention (parameterized queries)

---

## Monitoring & Logging

### Key Metrics
- Session creation rate
- Average session duration
- Vote participation rate
- Share link usage
- Export download count

### Error Tracking
- Failed session loads
- Vote submission errors
- Share link generation failures
- Import/export errors

### Performance Metrics
- Session load time
- Argument fetch latency
- Vote processing time
- Database query performance

---

## Future Enhancements

### V2 Features
- Session templates (pre-configured debate formats)
- Session forking (create variations)
- Collaborative viewing (multiple users watching same debate)
- Live session updates (WebSocket support)
- Session comparison (side-by-side diff)

### V3 Features
- Session remixing (combine arguments from multiple sessions)
- AI-powered session recommendations
- Integration with external tools (Notion, Slack, Discord)
- API webhooks for session events
- Custom branding for shared sessions

---

**Document Version**: 1.0
**Last Updated**: 2026-01-09
**Status**: Ready for Implementation
