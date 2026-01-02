import { useState, useCallback, useEffect } from 'react';

/**
 * Hook for Intelligent Agent System Integration
 *
 * Connects frontend to the powerful backend agent system with:
 * - Multi-model debates
 * - Agent personalities and learning
 * - Relationship dynamics
 * - Research committees
 * - Constitutional documents
 */
const useIntelligentAgents = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentDebateId, setCurrentDebateId] = useState(null);
  const [debateTurns, setDebateTurns] = useState([]);

  const API_BASE = 'http://localhost:5001/api';

  /**
   * Initialize a full congress of AI agents
   */
  const initializeCongress = useCallback(async (count = 10) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/congress/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count })
      });

      if (!response.ok) {
        throw new Error(`Failed to initialize congress: ${response.statusText}`);
      }

      const data = await response.json();
      setAgents(data.agents || []);
      console.log('[INTELLIGENT AGENTS] Congress initialized:', data.agents);

      return data.agents;
    } catch (err) {
      console.error('[INTELLIGENT AGENTS] Error:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get all registered agents
   */
  const fetchAgents = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/agents`);

      if (!response.ok) {
        throw new Error('Failed to fetch agents');
      }

      const data = await response.json();
      setAgents(data.agents || []);

      return data.agents;
    } catch (err) {
      console.error('[INTELLIGENT AGENTS] Error fetching agents:', err);
      setError(err.message);
      return [];
    }
  }, []);

  /**
   * Start an intelligent debate with full context
   */
  const startIntelligentDebate = useCallback(async (topic, participantIds, options = {}) => {
    setLoading(true);
    setError(null);
    setDebateTurns([]);

    try {
      const response = await fetch(`${API_BASE}/debate/start`, {
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
        throw new Error('Failed to start debate');
      }

      const data = await response.json();
      setCurrentDebateId(data.debateId);
      console.log('[INTELLIGENT DEBATE] Started:', data.debateId);

      return data.debateId;
    } catch (err) {
      console.error('[INTELLIGENT DEBATE] Error:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Generate next debate argument
   */
  const generateArgument = useCallback(async (debateId, agentId) => {
    try {
      const response = await fetch(`${API_BASE}/debate/${debateId}/argument`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId })
      });

      if (!response.ok) {
        throw new Error('Failed to generate argument');
      }

      const data = await response.json();
      const turn = data.turn;

      // Add to debate turns
      setDebateTurns(prev => [...prev, turn]);

      console.log('[INTELLIGENT DEBATE] New argument:', turn);

      return turn;
    } catch (err) {
      console.error('[INTELLIGENT DEBATE] Error generating argument:', err);
      setError(err.message);
      return null;
    }
  }, []);

  /**
   * Process debate outcome and trigger agent learning
   */
  const processDebateOutcome = useCallback(async (debateId, votingResults) => {
    try {
      const response = await fetch(`${API_BASE}/debate/${debateId}/outcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ votingResults })
      });

      if (!response.ok) {
        throw new Error('Failed to process debate outcome');
      }

      const data = await response.json();
      console.log('[INTELLIGENT DEBATE] Outcome processed:', data.result);

      // Refresh agent data to show learning
      await fetchAgents();

      return data.result;
    } catch (err) {
      console.error('[INTELLIGENT DEBATE] Error processing outcome:', err);
      setError(err.message);
      return null;
    }
  }, [fetchAgents]);

  /**
   * Create research committee
   */
  const createResearchCommittee = useCallback(async (topic, memberIds) => {
    try {
      const response = await fetch(`${API_BASE}/research/committee`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, memberAgentIds: memberIds })
      });

      if (!response.ok) {
        throw new Error('Failed to create research committee');
      }

      const data = await response.json();
      console.log('[RESEARCH COMMITTEE] Created:', data.committeeId);

      return data.committeeId;
    } catch (err) {
      console.error('[RESEARCH COMMITTEE] Error:', err);
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
      const response = await fetch(`${API_BASE}/research/${committeeId}/conduct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to conduct research');
      }

      const data = await response.json();
      console.log('[RESEARCH] Completed:', data.committee);

      return data.committee;
    } catch (err) {
      console.error('[RESEARCH] Error:', err);
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
      const response = await fetch(`${API_BASE}/coalition/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, memberAgentIds: memberIds, purpose })
      });

      if (!response.ok) {
        throw new Error('Failed to create coalition');
      }

      const data = await response.json();
      console.log('[COALITION] Created:', data.coalitionId);

      // Refresh agents to show updated coalitions
      await fetchAgents();

      return data.coalitionId;
    } catch (err) {
      console.error('[COALITION] Error:', err);
      setError(err.message);
      return null;
    }
  }, [fetchAgents]);

  /**
   * Initialize constitution
   */
  const initializeConstitution = useCallback(async (title, authors = []) => {
    try {
      const response = await fetch(`${API_BASE}/constitution/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, preambleAuthors: authors })
      });

      if (!response.ok) {
        throw new Error('Failed to initialize constitution');
      }

      const data = await response.json();
      console.log('[CONSTITUTION] Initialized:', data.constitutionId);

      return data.constitutionId;
    } catch (err) {
      console.error('[CONSTITUTION] Error:', err);
      setError(err.message);
      return null;
    }
  }, []);

  /**
   * Get constitution
   */
  const getConstitution = useCallback(async (constitutionId = 'constitution_main') => {
    try {
      const response = await fetch(`${API_BASE}/constitution/${constitutionId}`);

      if (!response.ok) {
        throw new Error('Failed to get constitution');
      }

      const data = await response.json();
      return data.constitution;
    } catch (err) {
      console.error('[CONSTITUTION] Error:', err);
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
      const response = await fetch(`${API_BASE}/bill/collaborative`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, topic, contributorAgentIds: contributorIds })
      });

      if (!response.ok) {
        throw new Error('Failed to draft bill');
      }

      const data = await response.json();
      console.log('[COLLABORATIVE BILL] Drafted:', data.bill);

      return data.bill;
    } catch (err) {
      console.error('[COLLABORATIVE BILL] Error:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // State
    agents,
    loading,
    error,
    currentDebateId,
    debateTurns,

    // Actions
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
    draftCollaborativeBill
  };
};

export default useIntelligentAgents;
