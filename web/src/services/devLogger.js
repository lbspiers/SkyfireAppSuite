/**
 * DEVLOGGER LITE - Development Logging System
 *
 * Intercepts console calls, stores logs, and provides Claude-friendly formatting
 * Only active in development mode
 */

class DevLogger {
  constructor() {
    if (DevLogger.instance) {
      return DevLogger.instance;
    }

    this.logs = [];
    this.subscribers = [];
    this.isEnabled = process.env.NODE_ENV === 'development';
    this.maxLogs = 500; // Prevent memory issues

    if (this.isEnabled) {
      this.interceptConsole();
    }

    DevLogger.instance = this;
  }

  // Log Levels
  static LEVELS = {
    DEBUG: { name: 'DEBUG', color: 'var(--gray-400)', priority: 0 },
    INFO: { name: 'INFO', color: 'var(--color-info)', priority: 1 },
    SUCCESS: { name: 'SUCCESS', color: 'var(--color-success)', priority: 2 },
    WARN: { name: 'WARN', color: 'var(--color-warning)', priority: 3 },
    ERROR: { name: 'ERROR', color: 'var(--color-error)', priority: 4 },
    CRITICAL: { name: 'CRITICAL', color: 'var(--color-primary-dark)', priority: 5 }
  };

  // Intercept native console methods
  interceptConsole() {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;
    const originalDebug = console.debug;

    console.log = (...args) => {
      this.addLog('INFO', 'General', args);
      originalLog.apply(console, args);
    };

    console.error = (...args) => {
      this.addLog('ERROR', 'General', args);
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      this.addLog('WARN', 'General', args);
      originalWarn.apply(console, args);
    };

    console.info = (...args) => {
      this.addLog('INFO', 'General', args);
      originalInfo.apply(console, args);
    };

    console.debug = (...args) => {
      this.addLog('DEBUG', 'General', args);
      originalDebug.apply(console, args);
    };
  }

  // Check if error is from browser extension (should be ignored)
  isExtensionError(args) {
    const message = args.map(arg => String(arg)).join(' ');
    return message.includes('listener indicated an asynchronous response') ||
           message.includes('runtime.lastError') ||
           message.includes('chrome-extension://') ||
           message.includes('moz-extension://') ||
           message.includes('Extension context invalidated');
  }

  // Add log entry
  addLog(level, category, args) {
    if (!this.isEnabled) return;

    // Filter out browser extension errors
    if (this.isExtensionError(args)) {
      return;
    }

    const log = {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      level,
      category,
      message: this.formatMessage(args),
      args
    };

    this.logs.unshift(log); // Add to beginning

    // Limit log storage
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    this.notify();
  }

  // Custom logging methods with categories
  log(category, ...args) {
    this.addLog('INFO', category, args);
  }

  success(category, ...args) {
    this.addLog('SUCCESS', category, args);
  }

  error(category, ...args) {
    this.addLog('ERROR', category, args);
  }

  warn(category, ...args) {
    this.addLog('WARN', category, args);
  }

  debug(category, ...args) {
    this.addLog('DEBUG', category, args);
  }

  critical(category, ...args) {
    this.addLog('CRITICAL', category, args);
  }

  // Format arguments into readable string
  formatMessage(args) {
    return args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch (e) {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');
  }

  // Format logs for Claude Code analysis
  formatForClaude(filteredLogs = null) {
    const logsToFormat = filteredLogs || this.logs;

    if (logsToFormat.length === 0) {
      return 'No logs available';
    }

    let output = '# Development Logs\n\n';
    output += `Generated: ${new Date().toISOString()}\n`;
    output += `Total Logs: ${logsToFormat.length}\n\n`;

    // Group by level
    const grouped = {};
    logsToFormat.forEach(log => {
      if (!grouped[log.level]) {
        grouped[log.level] = [];
      }
      grouped[log.level].push(log);
    });

    // Output by priority (errors first)
    const levels = ['CRITICAL', 'ERROR', 'WARN', 'SUCCESS', 'INFO', 'DEBUG'];

    levels.forEach(level => {
      if (grouped[level] && grouped[level].length > 0) {
        output += `## ${level} (${grouped[level].length})\n\n`;

        grouped[level].forEach(log => {
          const time = log.timestamp.toLocaleTimeString();
          output += `**[${time}]** [${log.category}]\n`;
          output += '```\n';
          output += log.message;
          output += '\n```\n\n';
        });
      }
    });

    return output;
  }

  // Copy formatted logs to clipboard
  async copyToClipboard(filteredLogs = null) {
    const formatted = this.formatForClaude(filteredLogs);

    try {
      await navigator.clipboard.writeText(formatted);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }

  // Get filtered logs
  getFilteredLogs(levelFilter = null, categoryFilter = null, searchQuery = '') {
    return this.logs.filter(log => {
      const levelMatch = !levelFilter || log.level === levelFilter;
      const categoryMatch = !categoryFilter || log.category === categoryFilter;
      const searchMatch = !searchQuery ||
        log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.category.toLowerCase().includes(searchQuery.toLowerCase());

      return levelMatch && categoryMatch && searchMatch;
    });
  }

  // Get all unique categories
  getCategories() {
    const categories = new Set();
    this.logs.forEach(log => categories.add(log.category));
    return Array.from(categories).sort();
  }

  // Clear all logs
  clear() {
    this.logs = [];
    this.notify();
  }

  // Get error count
  getErrorCount() {
    return this.logs.filter(log =>
      log.level === 'ERROR' || log.level === 'CRITICAL'
    ).length;
  }

  // Subscribe to log updates
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  // Notify subscribers
  notify() {
    this.subscribers.forEach(callback => callback(this.logs));
  }

  // Get all logs
  getLogs() {
    return this.logs;
  }
}

// Export singleton instance
const logger = new DevLogger();
export default logger;
