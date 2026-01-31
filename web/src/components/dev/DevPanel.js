import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import logger from '../../services/devLogger';
import styles from './DevPanel.module.css';

/**
 * DEVPANEL LITE - Development Logging UI
 *
 * Simple floating panel for viewing and managing development logs
 * Only renders in development mode
 */
const DevPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [levelFilter, setLevelFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Subscribe to log updates
  useEffect(() => {
    const unsubscribe = logger.subscribe((newLogs) => {
      setLogs(newLogs);
    });

    // Initialize with current logs
    setLogs(logger.getLogs());

    return unsubscribe;
  }, []);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logger.getFilteredLogs(levelFilter || null, categoryFilter || null, searchQuery);
  }, [logs, levelFilter, categoryFilter, searchQuery]);

  // Get unique categories
  const categories = useMemo(() => {
    return logger.getCategories();
  }, [logs]);

  // Get error count
  const errorCount = useMemo(() => {
    return logger.getErrorCount();
  }, [logs]);

  // Handle copy to clipboard
  const handleCopy = async () => {
    const success = await logger.copyToClipboard(filteredLogs);
    if (success) {
      toast.success('Logs copied to clipboard! Paste into Claude Code for analysis.', {
        position: 'top-center',
        autoClose: 3000,
      });
    } else {
      toast.error('Failed to copy logs to clipboard', {
        position: 'top-center',
        autoClose: 3000,
      });
    }
  };

  // Handle clear logs
  const handleClear = () => {
    if (window.confirm('Clear all logs?')) {
      logger.clear();
    }
  };

  // Don't render in production
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        className={styles.toggleButton}
        onClick={() => setIsOpen(!isOpen)}
        title="DevLogger"
      >
        <span className={styles.toggleIcon}>🔧</span>
        {errorCount > 0 && (
          <span className={styles.errorBadge}>{errorCount}</span>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className={styles.panel}>
          {/* Header */}
          <div className={styles.header}>
            <h3 className={styles.title}>DevLogger Lite</h3>
            <button
              className={styles.closeButton}
              onClick={() => setIsOpen(false)}
              title="Close"
            >
              ×
            </button>
          </div>

          {/* Controls */}
          <div className={styles.controls}>
            {/* Level Filter */}
            <select
              className={styles.select}
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
            >
              <option value="">All Levels</option>
              <option value="CRITICAL">Critical</option>
              <option value="ERROR">Error</option>
              <option value="WARN">Warning</option>
              <option value="SUCCESS">Success</option>
              <option value="INFO">Info</option>
              <option value="DEBUG">Debug</option>
            </select>

            {/* Category Filter */}
            <select
              className={styles.select}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Search */}
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <button
              className={styles.actionButton}
              onClick={handleCopy}
              title="Copy logs for Claude Code"
            >
              📋 Copy for Claude
            </button>
            <button
              className={styles.actionButton}
              onClick={handleClear}
              title="Clear all logs"
            >
              🗑️ Clear
            </button>
            <span className={styles.logCount}>
              {filteredLogs.length} / {logs.length} logs
            </span>
          </div>

          {/* Log List */}
          <div className={styles.logList}>
            {filteredLogs.length === 0 ? (
              <div className={styles.emptyState}>
                No logs to display
              </div>
            ) : (
              filteredLogs.map(log => (
                <div
                  key={log.id}
                  className={`${styles.logEntry} ${styles[`level${log.level}`]}`}
                >
                  <div className={styles.logHeader}>
                    <span className={styles.logLevel}>{log.level}</span>
                    <span className={styles.logCategory}>{log.category}</span>
                    <span className={styles.logTime}>
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className={styles.logMessage}>{log.message}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default DevPanel;
