/**
 * API Configuration
 * Centralized configuration for backend API endpoints
 */

// Get backend URL from environment variable or use default
const getBackendUrl = () => {
  // Check for environment variable first
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // Default to localhost in development
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5002';
  }

  // In production, use relative URLs (same domain as frontend)
  return '';
};

export const API_BASE_URL = getBackendUrl();

// API Endpoints
export const API_ENDPOINTS = {
  LLM: '/api/llm',
  VOTE_ARGUMENT: '/api/vote/argument',
  VOTE_MESSAGE: '/api/vote/message',
  AGENTS: '/api/agents',
  DEBATE: '/api/debate'
};

// Helper to build full URL
export const getApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  getApiUrl
};
