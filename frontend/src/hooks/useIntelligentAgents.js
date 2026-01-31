import { useState, useCallback } from 'react';
import { API_BASE_URL, API_ENDPOINTS, getApiUrl } from '../config/api';

/**
 * Hook for Intelligent Agent System
 * Connects to backend debate system with full agent management
 */
const useIntelligentAgents = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentDebateId, setCurrentDebateId] = useState(null);
  const [debateTurns, setDebateTurns] = useState([]);

  /**
   * Initialize congress of AI agents
   */
  const initializeCongress = useCallback(async (count = 5) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(getApiUrl(API_ENDPOINTS.CONGRESS_INITIALIZE), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to initialize congress: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      setAgents(data.agents || []);
      console.log('[AGENTS] Congress initialized:', data.agents?.length);
      return data.agents;
    } catch (err) {
      console.error('[AGENTS] Init error:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch all registered agents
   */
  const fetchAgents = useCallback(async () => {
    try {
      const response = await fetch(getApiUrl(API_ENDPOINTS.AGENTS));
      if (!response.ok) throw new Error('Failed to fetch agents');

      const data = await response.json();
      setAgents(data.agents || []);
      return data.agents;
    } catch (err) {
      console.error('[AGENTS] Fetch error:', err);
      setError(err.message);
      return [];
    }
  }, []);

  /**
   * Start a debate
   */
  const startIntelligentDebate = useCallback(async (topic, participantIds, options = {}) => {
    setLoading(true);
    setError(null);
    setDebateTurns([]);

    try {
      const response = await fetch(getApiUrl(API_ENDPOINTS.DEBATE_START), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          participantAgentIds: participantIds,
          enablePeerReview: options.enablePeerReview || false,
          enableResearch: options.enableResearch || false,
          controversyLevel: options.controversyLevel || 100
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to start debate: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      setCurrentDebateId(data.debateId);
      console.log('[DEBATE] Started:', data.debateId);
      return data.debateId;
    } catch (err) {
      console.error('[DEBATE] Start error:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Generate next argument in debate
   */
  const generateArgument = useCallback(async (debateId, agentId) => {
    if (!debateId) {
      console.error('[DEBATE] No debateId provided');
      return null;
    }

    try {
      const url = `${API_BASE_URL}${API_ENDPOINTS.DEBATE_ARGUMENT}/${debateId}/argument`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to generate argument: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const turn = data.turn;

      setDebateTurns(prev => [...prev, turn]);
      console.log('[DEBATE] Argument generated');
      return turn;
    } catch (err) {
      console.error('[DEBATE] Argument error:', err);
      setError(err.message);
      return null;
    }
  }, []);

  /**
   * Process debate outcome and trigger learning
   */
  const processDebateOutcome = useCallback(async (debateId, votingResults) => {
    if (!debateId) return null;

    try {
      const url = `${API_BASE_URL}${API_ENDPOINTS.DEBATE_OUTCOME}/${debateId}/outcome`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ votingResults })
      });

      if (!response.ok) throw new Error('Failed to process outcome');

      const data = await response.json();
      console.log('[DEBATE] Outcome processed');
      await fetchAgents();
      return data.result;
    } catch (err) {
      console.error('[DEBATE] Outcome error:', err);
      setError(err.message);
      return null;
    }
  }, [fetchAgents]);

  /**
   * Create research committee
   */
  const createResearchCommittee = useCallback(async (topic, memberIds) => {
    try {
      const response = await fetch(getApiUrl(API_ENDPOINTS.RESEARCH_COMMITTEE), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, memberAgentIds: memberIds })
      });

      if (!response.ok) throw new Error('Failed to create committee');

      const data = await response.json();
      return data.committeeId;
    } catch (err) {
      console.error('[RESEARCH] Create error:', err);
      setError(err.message);
      return null;
    }
  }, []);

  /**
   * Conduct research
   */
  const conductResearch = useCallback(async (committeeId) => {
    setLoading(true);
    try {
      const url = `${API_BASE_URL}${API_ENDPOINTS.RESEARCH_CONDUCT}/${committeeId}/conduct`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error('Failed to conduct research');

      const data = await response.json();
      return data.committee;
    } catch (err) {
      console.error('[RESEARCH] Conduct error:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create coalition
   */
  const createCoalition = useCallback(async (name, memberIds, purpose) => {
    try {
      const response = await fetch(getApiUrl(API_ENDPOINTS.COALITION_CREATE), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, memberAgentIds: memberIds, purpose })
      });

      if (!response.ok) throw new Error('Failed to create coalition');

      const data = await response.json();
      await fetchAgents();
      return data.coalitionId;
    } catch (err) {
      console.error('[COALITION] Create error:', err);
      setError(err.message);
      return null;
    }
  }, [fetchAgents]);

  /**
   * Initialize constitution
   */
  const initializeConstitution = useCallback(async (title, authors = []) => {
    try {
      const response = await fetch(getApiUrl(API_ENDPOINTS.CONSTITUTION_INITIALIZE), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, preambleAuthors: authors })
      });

      if (!response.ok) throw new Error('Failed to init constitution');

      const data = await response.json();
      return data.constitutionId;
    } catch (err) {
      console.error('[CONSTITUTION] Init error:', err);
      setError(err.message);
      return null;
    }
  }, []);

  /**
   * Get constitution
   */
  const getConstitution = useCallback(async (constitutionId = 'constitution_main') => {
    try {
      const url = `${API_BASE_URL}${API_ENDPOINTS.CONSTITUTION}/${constitutionId}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to get constitution');

      const data = await response.json();
      return data.constitution;
    } catch (err) {
      console.error('[CONSTITUTION] Get error:', err);
      setError(err.message);
      return null;
    }
  }, []);

  /**
   * Draft collaborative bill
   */
  const draftCollaborativeBill = useCallback(async (title, topic, contributorIds) => {
    setLoading(true);
    try {
      const response = await fetch(getApiUrl(API_ENDPOINTS.BILL_COLLABORATIVE), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, topic, contributorAgentIds: contributorIds })
      });

      if (!response.ok) throw new Error('Failed to draft bill');

      const data = await response.json();
      return data.bill;
    } catch (err) {
      console.error('[BILL] Draft error:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Reset debate state
   */
  const resetDebate = useCallback(() => {
    setCurrentDebateId(null);
    setDebateTurns([]);
    setError(null);
  }, []);

  return {
    agents,
    loading,
    error,
    currentDebateId,
    debateTurns,
    initializeCongress,
    fetchAgents,
    startIntelligentDebate,
    generateArgument,
    processDebateOutcome,
    createResearchCommittee,
    conductResearch,
    createCoalition,
    initializeConstitution,
    getConstitution,
    draftCollaborativeBill,
    clearError,
    resetDebate
  };
};

export default useIntelligentAgents;
