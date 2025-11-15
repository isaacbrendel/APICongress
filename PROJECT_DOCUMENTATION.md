# API Congress - Project Documentation

## Overview
A debate platform where AI agents argue topics and users vote on winners. Built with React frontend and Node.js backend.

## Current Architecture

**Frontend** (`/frontend/src`):
- `HomeScreen.js` - Topic input and debate initiation
- `DebateScreen.js` - Main debate view with real-time chat display
- `VotingInterface.js` - Post-debate voting with timer
- `WinnerDisplay.js` - Results and champion display
- `BackgroundVideo.js` - Animated GIF backgrounds per screen
- `useDebateFlow.js` - State management for debate phases

**Backend** (`/backend/server.js`):
- Express server with WebSocket support
- OpenAI API integration for AI debaters
- Debate orchestration with 10-second pause before final speaker
- Turn-based argument generation

## Design Choices
- **GIF backgrounds** over video for simpler implementation (5 portrait + 3 landscape variants)
- **WebSocket** for real-time debate streaming
- **Sequential arguments** rather than concurrent for clarity
- **Fixed voting timer** to maintain engagement

## Current State
- Modified files show active styling and flow refinements
- Background video system recently implemented
- Voting interface enhanced with timing controls

## Potential Improvements
- Persist debate history
- Dynamic debater personalities
- Mobile responsive optimization
- Rate limiting on API calls
