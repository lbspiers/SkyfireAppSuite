// src/components/survey/CategoryManager.js
import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, Sparkles, Loader2 } from 'lucide-react';
import * as Icons from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import styles from './CategoryManager.module.css';

const CategoryManager = ({ categories, onCategoryAdded, onCategoryDeleted }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Focus input when opening
  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  // Debounced Claude suggestions
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (inputValue.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const res = await axiosInstance.post('/api/media-categories/suggest', {
          input: inputValue.trim(),
        });
        if (res.data?.status === 'SUCCESS') {
          setSuggestions(res.data.data);
        }
      } catch (err) {
        console.warn('[CategoryManager] Suggest error:', err);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(debounceRef.current);
  }, [inputValue]);

  const handleCreate = async (label) => {
    setCreating(true);
    setError('');
    try {
      const res = await axiosInstance.post('/api/media-categories', {
        label,
        parent_category: 'custom',
        icon: 'Folder',
      });
      if (res.data?.status === 'SUCCESS') {
        onCategoryAdded(res.data.data.category);
        setInputValue('');
        setSuggestions([]);
        setIsAdding(false);

        // Show similarity warning if present
        if (res.data.data.similarWarning) {
          // Use toast if available, or console
          console.info('[CategoryManager]', res.data.data.similarWarning);
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create category';
      setError(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (uuid, label) => {
    if (!window.confirm(`Delete "${label}"? Photos in this category will keep their tags.`)) return;
    try {
      await axiosInstance.delete(`/api/media-categories/${uuid}`);
      onCategoryDeleted(uuid);
    } catch (err) {
      console.error('[CategoryManager] Delete error:', err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim().length >= 2) {
      e.preventDefault();
      handleCreate(inputValue.trim());
    }
    if (e.key === 'Escape') {
      setIsAdding(false);
      setInputValue('');
      setSuggestions([]);
      setError('');
    }
  };

  // Render custom (non-default) categories as removable pills
  const customCategories = categories.filter(c => !c.is_default);

  return (
    <div className={styles.container}>
      {/* Custom category pills with delete */}
      {customCategories.map(cat => {
        const IconComp = Icons[cat.icon] || Icons.Folder;
        return (
          <span key={cat.uuid} className={styles.customPill}>
            <IconComp size={12} />
            {cat.label}
            <button
              className={styles.removePillBtn}
              onClick={() => handleDelete(cat.uuid, cat.label)}
              title={`Remove ${cat.label}`}
            >
              <X size={10} />
            </button>
          </span>
        );
      })}

      {/* Add button / Input */}
      {!isAdding ? (
        <button className={styles.addButton} onClick={() => setIsAdding(true)}>
          <Plus size={14} />
          Add Category
        </button>
      ) : (
        <div className={styles.addForm}>
          <div className={styles.inputWrapper}>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type category name..."
              className={styles.input}
              maxLength={150}
              disabled={creating}
            />
            {creating && <Loader2 size={14} className={styles.spinner} />}
            <button
              className={styles.cancelBtn}
              onClick={() => { setIsAdding(false); setInputValue(''); setSuggestions([]); setError(''); }}
            >
              <X size={14} />
            </button>
          </div>

          {error && <span className={styles.error}>{error}</span>}

          {/* Claude AI Suggestions */}
          {(suggestions.length > 0 || loadingSuggestions) && (
            <div className={styles.suggestions}>
              <span className={styles.suggestLabel}>
                <Sparkles size={12} />
                Suggestions
              </span>
              {loadingSuggestions ? (
                <span className={styles.loadingText}>Thinking...</span>
              ) : (
                <div className={styles.suggestionPills}>
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      className={styles.suggestionPill}
                      onClick={() => handleCreate(s)}
                      disabled={creating}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CategoryManager;
