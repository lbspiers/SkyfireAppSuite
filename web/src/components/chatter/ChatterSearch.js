import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, MessageSquare, Reply, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UserAvatar from './UserAvatar';
import * as chatterService from '../../services/chatterService';
import styles from '../../styles/Chatter.module.css';

/**
 * ChatterSearch - Search bar with results dropdown
 *
 * @param {string} projectUuid - Project UUID to search within
 * @param {function} onResultClick - (threadUuid: string) => void - Navigate to thread
 * @param {function} onClose - Close search mode
 */
const ChatterSearch = ({ projectUuid, onResultClick, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounced search
  const performSearch = useCallback(async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setResults([]);
      setTotalResults(0);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await chatterService.searchChatter(projectUuid, searchTerm);
      setResults(data.results || []);
      setTotalResults(data.total || 0);
      setIsOpen(true);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [projectUuid]);

  // Handle input change with debounce
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce search by 300ms
    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  // Clear search
  const handleClear = () => {
    setQuery('');
    setResults([]);
    setTotalResults(0);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Handle result click
  const handleResultClick = (result) => {
    if (onResultClick) {
      onResultClick(result.threadUuid);
    }
    setIsOpen(false);
  };

  // Handle escape key
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      if (query) {
        handleClear();
      } else if (onClose) {
        onClose();
      }
    }
  };

  // Format relative time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Render highlighted text (backend returns <mark> tags)
  const renderHighlight = (html) => {
    return { __html: html };
  };

  return (
    <div className={styles.chatterSearch}>
      <div className={styles.searchInputWrapper}>
        <Search size={18} className={styles.searchIcon} />
        <input
          ref={inputRef}
          type="text"
          className={styles.searchInput}
          placeholder="Search messages..."
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
        />
        {query && (
          <button
            className={styles.searchClearBtn}
            onClick={handleClear}
            title="Clear search"
          >
            <X size={16} />
          </button>
        )}
        {isLoading && (
          <div className={styles.searchSpinner} />
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.searchResults}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {results.length > 0 ? (
              <>
                <div className={styles.searchResultsHeader}>
                  {totalResults} result{totalResults !== 1 ? 's' : ''} for "{query}"
                </div>
                <div className={styles.searchResultsList}>
                  {results.map((result) => (
                    <div
                      key={`${result.type}-${result.uuid}`}
                      className={styles.searchResultItem}
                      onClick={() => handleResultClick(result)}
                    >
                      <div className={styles.searchResultIcon}>
                        {result.type === 'thread' ? (
                          <MessageSquare size={16} />
                        ) : (
                          <Reply size={16} />
                        )}
                      </div>
                      <div className={styles.searchResultContent}>
                        <div className={styles.searchResultMeta}>
                          <UserAvatar user={result.author} size="xs" />
                          <span className={styles.searchResultAuthor}>
                            {result.author.firstName} {result.author.lastName}
                          </span>
                          <span className={styles.searchResultTime}>
                            {formatTime(result.createdAt)}
                          </span>
                          {result.type === 'reply' && (
                            <span className={styles.searchResultBadge}>Reply</span>
                          )}
                        </div>
                        <div
                          className={styles.searchResultHighlight}
                          dangerouslySetInnerHTML={renderHighlight(result.highlight)}
                        />
                      </div>
                      <ArrowRight size={16} className={styles.searchResultArrow} />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className={styles.searchNoResults}>
                <Search size={24} />
                <span>No results found for "{query}"</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatterSearch;
