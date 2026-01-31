# API Congress - Project Documentation

## Overview
An ultra-minimalist AI debate platform where 5 leading AI models (ChatGPT, Claude, Gemini, Grok, Cohere) engage in intelligent debates. Users vote on individual arguments using a reinforcement learning system that trains the AIs in real-time. Features a stunning ceramic steel OS-window aesthetic with carousel navigation.

## Design Philosophy
**Ultra-Clean Minimalism**: Inspired by premium operating systems with a permanent ceramic steel aesthetic. Every element serves a purpose. No visual clutter. Subtle animations with cubic-bezier easing. Transparent backgrounds, thin borders, generous spacing.

## Current Architecture

### Frontend (`/frontend/src`)

#### Core Components
- **`HomeScreen.js`** - Minimalist landing page with topic input
  - Clean centered design
  - Transparent input with subtle border
  - Uppercase button styling
  - Fade-in animation on mount

- **`IntelligentDebateScreen.js`** - Main debate interface with carousel gallery
  - 5 stationary AI debaters with logo displays
  - Real-time argument generation with countdown
  - OS-style argument cards with ceramic steel aesthetic
  - Carousel navigation with logo pills
  - Arrow navigation (desktop) and swipe (mobile)
  - Reinforcement learning voting on each argument
  - Responsive design for all screen sizes

- **`ArgumentVoting.js`** - Minimalist voting interface
  - Upvote/downvote buttons with hover effects
  - Real-time feedback display
  - Vote toggling support
  - Training feedback (influence changes, approval rates)
  - Personality evolution indicators

#### Styling
- **Minimalist CSS** - Ultra-clean design language
  - Transparent backgrounds with rgba(0,0,0,0.2-0.5)
  - Thin borders (1px) with rgba(255,255,255,0.15-0.5)
  - Text shadows for readability
  - Font weights 300-600 for hierarchy
  - Letter-spacing for elegance (1-2px)
  - Cubic-bezier easing (0.4, 0, 0.2, 1)

#### Hooks
- **`useIntelligentAgents.js`** - Advanced AI debate management
  - Congress initialization (5 agents)
  - Multi-turn debate orchestration
  - Argument generation with strategy tracking
  - Relationship dynamics between agents
  - Learning and evolution system

### Backend (`/backend/server.js`)

#### API Endpoints
- `POST /api/congress/initialize` - Create AI agent congress
- `POST /api/debate/start` - Begin intelligent debate
- `POST /api/debate/turn` - Generate next argument
- `POST /api/debate/outcome` - Process results and trigger learning
- `POST /api/vote/argument` - Record RL vote and update agent

#### Features
- **5 AI Model Integration**: OpenAI (ChatGPT), Anthropic (Claude), Google (Gemini), xAI (Grok), Cohere
- **Reinforcement Learning**: Vote-based personality evolution
- **Agent Personalities**: Each agent has unique traits, party affiliations, influence scores
- **Relationship Dynamics**: Agents form opinions about each other
- **Strategy System**: Opening, building, rebuttal, conclusion phases
- **Persistent Memory**: Votes and agent states saved to disk

## Key Features

### 🎨 Ceramic Steel OS Aesthetic
- **Gradient backgrounds**: Linear gradients with subtle color shifts
- **Inset lighting**: Top border highlight (inset 0 1px 0)
- **Deep shadows**: 0 20px 60px for depth and elevation
- **Minimal borders**: 1px solid with low opacity
- **Clean typography**: Sans-serif, varied weights, generous spacing

### 🎡 Carousel Gallery System
- **Logo Pill Navigation**: Horizontal row of clickable AI logos
  - Active state: full color, solid background
  - Inactive state: grayscale filter, transparent
- **OS Window Cards**: Beautiful argument containers
  - Header bar with AI logo, name, and counter (1/5)
  - Content area with generous padding (50-80px)
  - Integrated voting interface
- **Navigation Arrows**: Desktop left/right arrows outside card
- **Swipe Support**: Touch-optimized for mobile devices

### 🧠 Intelligent Debate System
- **5 AI Debaters**: ChatGPT, Claude, Gemini, Grok, Cohere
- **Real-time Generation**: Watch arguments appear with countdown
- **Visual Feedback**: Speaking AI scales up (1.05x) with border glow
- **Grayscale Effect**: Inactive AIs desaturated, active full color
- **Smooth Transitions**: All state changes animated

### ⬆️⬇️ Reinforcement Learning Voting
- **Individual Votes**: Rate each argument separately
- **Real-time Training**: Immediate feedback on AI personality shifts
- **Influence System**: Agents gain/lose influence based on votes
- **Approval Tracking**: See approval rates for each argument
- **Personality Evolution**: Agents adapt debate style based on feedback

### 📱 Mobile-First Responsive Design
- **Desktop (1200px+)**: Expanded cards, 80px padding, large arrows
- **Tablet (768px)**: Optimized sizing, closer arrows
- **Mobile (480px)**:
  - Horizontal scrollable AI logos
  - Scroll-snap for smooth navigation
  - Hidden arrows (swipe instead)
  - Touch-optimized interface
  - Reduced padding for comfort

## Design Patterns

### Color Palette
- **Primary Background**: Transparent to rgba(0,0,0,0.5)
- **Text Colors**: rgba(255,255,255,0.5) to rgba(255,255,255,0.98)
- **Border Colors**: rgba(255,255,255,0.1) to rgba(255,255,255,0.5)
- **Shadows**: rgba(0,0,0,0.5-0.8) for depth

### Typography
- **Headings**: 0.65-2rem, weight 400-600, letter-spacing 1-2px
- **Body Text**: 1.05-1.45rem, weight 300-400, line-height 1.8-2.2
- **Labels**: 0.6-0.75rem, weight 500-600, uppercase, letter-spacing 2px

### Spacing
- **Section Gaps**: 60-100px vertical spacing
- **Element Gaps**: 12-80px between related items
- **Padding**: 30-80px inside containers
- **Margins**: 40-80px for major sections

### Animations
- **Easing**: cubic-bezier(0.4, 0, 0.2, 1) for smooth, natural motion
- **Duration**: 0.2-0.6s for most transitions
- **Transforms**: translateY, scale, opacity for entrance effects
- **Hover States**: Subtle lifts (translateY -2px), opacity changes

## File Structure

```
APICongress/
├── frontend/
│   ├── public/
│   │   └── logos/           # AI model logos (chatgpt, claude, gemini, grok, cohere)
│   └── src/
│       ├── components/
│       │   ├── HomeScreen.js/css              # Landing page
│       │   ├── IntelligentDebateScreen.js/css # Main debate interface
│       │   ├── ArgumentVoting.js/css          # RL voting interface
│       │   └── BackgroundVideo.js             # Animated backgrounds
│       ├── hooks/
│       │   └── useIntelligentAgents.js        # AI debate logic
│       ├── utils/
│       │   └── logger.js                      # Development logging
│       └── config/
│           └── api.js                         # API endpoints
├── backend/
│   ├── server.js                   # Main Express server
│   ├── agents/
│   │   ├── agentManager.js        # Agent lifecycle management
│   │   └── conversationContext.js # Debate context tracking
│   ├── memory/
│   │   └── votes/                 # Persistent vote storage
│   └── utils/
│       └── voteStorage.js         # Vote persistence system
└── docs/                          # Additional documentation
```

## Current State

### Completed Features ✅
- Ultra-minimalist design aesthetic throughout
- 5 AI model integration with real logos
- Intelligent debate system with strategies
- Carousel navigation with OS-style cards
- Reinforcement learning voting system
- Desktop and mobile responsive layouts
- Smooth animations and transitions
- Persistent vote storage
- Agent personality evolution
- Real-time debate generation

### In Progress 🚧
- Backend API key configuration (currently using mock responses)
- Testing full debate flow with live AI responses
- Fine-tuning mobile swipe interactions

## Technical Details

### Performance Optimizations
- CSS animations use transform/opacity (GPU accelerated)
- Cubic-bezier easing for smooth 60fps animations
- Lazy loading of debate content
- Minimal re-renders with React state management

### Accessibility
- Semantic HTML structure
- Keyboard navigation support (arrows)
- Clear focus states
- Readable font sizes (minimum 0.6rem)
- High contrast text (0.8-0.98 opacity)

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS Grid and Flexbox layouts
- CSS custom properties
- Touch events for mobile

## Development Notes

### Running the Application
```bash
# Start backend (port 5001)
cd backend && npm start

# Start frontend (port 3000)
cd frontend && npm start
```

### Environment Variables
```bash
# Backend .env
OPENAI_API_KEY=your_key
ANTHROPIC_API_KEY=your_key
GOOGLE_API_KEY=your_key
XAI_API_KEY=your_key
COHERE_API_KEY=your_key
```

### Key Dependencies
- **Frontend**: React 18, React Hooks
- **Backend**: Express, Axios, AI SDKs
- **Styling**: Pure CSS with custom properties

## Future Enhancements

### Planned Features
- [ ] Swipe gesture library for smoother mobile navigation
- [ ] Keyboard shortcuts (←/→ for carousel)
- [ ] Debate history and replay
- [ ] User accounts and voting history
- [ ] AI vs AI voting (agents vote on each other)
- [ ] Advanced filtering (by AI model, topic, date)
- [ ] Export debate transcripts
- [ ] Social sharing of debates

### Design Improvements
- [ ] Theme customization (dark/light modes)
- [ ] Animated logo transitions
- [ ] Micro-interactions on vote buttons
- [ ] Progress indicators for long debates
- [ ] Sound effects (optional, minimal)

### Technical Debt
- [ ] Unit tests for components
- [ ] E2E tests for debate flow
- [ ] API rate limiting
- [ ] Error boundary components
- [ ] Performance monitoring
- [ ] SEO optimization

## Design Inspiration
- **macOS Window Chrome**: Clean headers, subtle shadows
- **iOS Design Language**: Minimal, functional, elegant
- **Scandinavian Minimalism**: Function over form, breathing room
- **Ceramic Materials**: Permanent, solid, refined finish
- **Brushed Steel**: Industrial elegance, subtle texture

## Credits
Built with an obsessive attention to detail and a love for clean, functional design. Every pixel matters. Every animation serves a purpose. Ultra-clean. Ultra-impressive. Ultra-minimal.

---

**Last Updated**: January 2026
**Version**: 2.0 (Carousel Gallery Release)
