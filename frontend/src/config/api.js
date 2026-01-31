/**
 * API Configuration
 * Centralized configuration for backend API endpoints
 */

const getBackendUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5001';
  }
  return '';
};

export const API_BASE_URL = getBackendUrl();

export const API_ENDPOINTS = {
  // Core debate endpoints
  LLM: '/api/llm',
  DEBATE_START: '/api/debate/start',
  DEBATE_ARGUMENT: '/api/debate', // + /:debateId/argument
  DEBATE_OUTCOME: '/api/debate', // + /:debateId/outcome

  // Congress and agents
  CONGRESS_INITIALIZE: '/api/congress/initialize',
  AGENTS: '/api/agents',
  AGENT_FEEDBACK: '/api/agents', // + /:agentId/feedback

  // Voting (RL)
  VOTE_ARGUMENT: '/api/vote/argument',
  VOTE_MESSAGE: '/api/vote/message',

  // Research and collaboration
  RESEARCH_COMMITTEE: '/api/research/committee',
  RESEARCH_CONDUCT: '/api/research', // + /:committeeId/conduct
  COALITION_CREATE: '/api/coalition/create',

  // Constitution and bills
  CONSTITUTION_INITIALIZE: '/api/constitution/initialize',
  CONSTITUTION: '/api/constitution',
  BILL_COLLABORATIVE: '/api/bill/collaborative',
  POSITION_PAPER: '/api/position-paper',

  // System
  STATUS: '/api/status',
  PERSONAS: '/api/personas',
  MODEL_FLAVORS: '/api/model-flavors'
};

export const getApiUrl = (endpoint) => `${API_BASE_URL}${endpoint}`;

export default { API_BASE_URL, API_ENDPOINTS, getApiUrl };
