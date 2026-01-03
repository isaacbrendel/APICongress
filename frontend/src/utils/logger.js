/**
 * Enhanced Logging Utility
 * Provides structured, timestamped, and categorized logging throughout the application
 */

// Log levels
export const LogLevel = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  SUCCESS: 'SUCCESS'
};

// Log categories with emoji prefixes
export const LogCategory = {
  DEBATE: '🎤',
  VOTE: '🗳️',
  STATE: '⚙️',
  NETWORK: '📡',
  AGENT: '🤖',
  UI: '🎨',
  PERFORMANCE: '⚡',
  USER: '👤',
  SYSTEM: '🔧'
};

class Logger {
  constructor() {
    this.startTime = Date.now();
    this.lastLogTime = Date.now();
    this.performanceMarks = new Map();
  }

  /**
   * Get formatted timestamp
   */
  getTimestamp() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
  }

  /**
   * Get elapsed time since start
   */
  getElapsedTime() {
    const elapsed = Date.now() - this.startTime;
    return `+${(elapsed / 1000).toFixed(3)}s`;
  }

  /**
   * Get time delta since last log
   */
  getTimeDelta() {
    const delta = Date.now() - this.lastLogTime;
    this.lastLogTime = Date.now();
    return `Δ${delta}ms`;
  }

  /**
   * Format log message with metadata (CONCISE MODE)
   */
  formatMessage(category, level, message, data = null) {
    const timestamp = this.getTimestamp();

    // Simplified format: [time] emoji message (key data only)
    let formattedMessage = `[${timestamp}] ${category} ${message}`;

    // Only show essential data in a compact format
    if (data && Object.keys(data).length > 0) {
      const compactData = Object.entries(data)
        .slice(0, 3) // Max 3 fields
        .map(([k, v]) => `${k}:${typeof v === 'object' ? JSON.stringify(v).slice(0, 30) : v}`)
        .join(' ');
      formattedMessage += ` (${compactData})`;
    }

    return formattedMessage;
  }

  /**
   * Core logging method
   */
  log(category, level, message, data = null) {
    const formatted = this.formatMessage(category, level, message, data);

    switch (level) {
      case LogLevel.ERROR:
        console.error(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.DEBUG:
        console.debug(formatted);
        break;
      case LogLevel.SUCCESS:
        console.log(`%c${formatted}`, 'color: #4CAF50; font-weight: bold');
        break;
      default:
        console.log(formatted);
    }
  }

  // Category-specific methods
  debate(message, data = null, level = LogLevel.INFO) {
    this.log(LogCategory.DEBATE, level, message, data);
  }

  vote(message, data = null, level = LogLevel.INFO) {
    this.log(LogCategory.VOTE, level, message, data);
  }

  state(message, data = null, level = LogLevel.INFO) {
    this.log(LogCategory.STATE, level, message, data);
  }

  network(message, data = null, level = LogLevel.INFO) {
    this.log(LogCategory.NETWORK, level, message, data);
  }

  agent(message, data = null, level = LogLevel.INFO) {
    this.log(LogCategory.AGENT, level, message, data);
  }

  ui(message, data = null, level = LogLevel.INFO) {
    this.log(LogCategory.UI, level, message, data);
  }

  performance(message, data = null, level = LogLevel.INFO) {
    this.log(LogCategory.PERFORMANCE, level, message, data);
  }

  user(message, data = null, level = LogLevel.INFO) {
    this.log(LogCategory.USER, level, message, data);
  }

  system(message, data = null, level = LogLevel.INFO) {
    this.log(LogCategory.SYSTEM, level, message, data);
  }

  // Convenience methods
  error(category, message, data = null) {
    this.log(category, LogLevel.ERROR, message, data);
  }

  warn(category, message, data = null) {
    this.log(category, LogLevel.WARN, message, data);
  }

  success(category, message, data = null) {
    this.log(category, LogLevel.SUCCESS, message, data);
  }

  // Performance tracking
  markStart(label) {
    const timestamp = Date.now();
    this.performanceMarks.set(label, timestamp);
    this.performance(`Performance mark START: ${label}`);
  }

  markEnd(label) {
    const startTime = this.performanceMarks.get(label);
    if (startTime) {
      const duration = Date.now() - startTime;
      this.performanceMarks.delete(label);
      this.performance(`Performance mark END: ${label}`, { duration: `${duration}ms` });
      return duration;
    }
    return null;
  }

  // Vote tracking with detailed info
  voteAction(action, details) {
    const {
      messageId,
      agentId,
      voteType,
      affiliation,
      previousVote,
      timestamp = Date.now()
    } = details;

    const voteEmoji = voteType === 'up' ? '👍' : voteType === 'down' ? '👎' : '🔄';
    const changeText = previousVote
      ? `Changed from ${previousVote} to ${voteType}`
      : `New ${voteType} vote`;

    this.vote(`${voteEmoji} ${action}: ${changeText}`, {
      messageId,
      agentId,
      voteType,
      affiliation,
      previousVote,
      timestamp: new Date(timestamp).toISOString()
    });
  }

  // Debate state tracking
  debateStateChange(fromState, toState, details = {}) {
    this.debate(`State transition: ${fromState} → ${toState}`, details);
  }

  // Speaker tracking
  speakerAction(action, speakerName, details = {}) {
    this.debate(`Speaker ${action}: ${speakerName}`, details);
  }

  // Network request tracking
  apiRequest(endpoint, method, details = {}) {
    this.network(`API ${method} ${endpoint}`, details);
  }

  apiResponse(endpoint, status, duration, details = {}) {
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.SUCCESS;
    this.network(`API Response ${status} ${endpoint} (${duration}ms)`, details, level);
  }

  // Agent action tracking
  agentAction(agentName, action, details = {}) {
    this.agent(`${agentName}: ${action}`, details);
  }
}

// Create singleton instance
const logger = new Logger();

// Attach LogCategory and LogLevel to the logger instance for easy access
logger.LogCategory = LogCategory;
logger.LogLevel = LogLevel;

// Export the Logger class and singleton (LogCategory and LogLevel already exported above)
export { Logger };
export default logger;
