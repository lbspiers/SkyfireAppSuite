import React, { useState } from 'react';
import { toast } from 'react-toastify';
import styles from './QAPanel.module.css';

/**
 * Q&A panel for workspace
 * @param {Object} props
 * @param {Array} props.questions - Questions list
 * @param {Function} props.onAskQuestion - Ask question handler
 */
const QAPanel = ({ questions = [], onAskQuestion }) => {
  const [questionText, setQuestionText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!questionText.trim()) {
      toast.warning('Please enter a question', {
        position: 'top-center',
        autoClose: 3000,
      });
      return;
    }

    try {
      setSubmitting(true);
      await onAskQuestion(questionText.trim());
      setQuestionText('');
    } catch (error) {
      console.error('Failed to ask question:', error);
      toast.error('Failed to submit question. Please try again.', {
        position: 'top-center',
        autoClose: 5000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const sortedQuestions = [...questions].sort((a, b) => {
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>Questions & Answers</h2>

      {/* Ask Question Form */}
      <form onSubmit={handleSubmit} className={styles.askForm}>
        <textarea
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder="Ask a question about this project..."
          className={styles.questionInput}
          rows={3}
          maxLength={500}
          disabled={submitting}
        />
        <div className={styles.formFooter}>
          <span className={styles.charCount}>
            {questionText.length}/500
          </span>
          <button
            type="submit"
            disabled={submitting || !questionText.trim()}
            className={styles.submitButton}
          >
            {submitting ? 'Submitting...' : 'Ask Question'}
          </button>
        </div>
      </form>

      {/* Questions List */}
      <div className={styles.questionsList}>
        {sortedQuestions.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No questions yet</p>
            <p className={styles.emptyHint}>Ask a question if you need clarification about the project</p>
          </div>
        ) : (
          sortedQuestions.map((question, index) => (
            <div key={question.uuid || index} className={styles.questionItem}>
              <div className={styles.questionHeader}>
                <span className={`${styles.status} ${styles[question.status || 'pending']}`}>
                  {question.status === 'answered' ? 'Answered' : 'Pending'}
                </span>
                <span className={styles.timestamp}>{formatDate(question.createdAt)}</span>
              </div>

              <div className={styles.questionText}>
                <strong>Q:</strong> {question.questionText}
              </div>

              {question.status === 'answered' && question.answerText && (
                <div className={styles.answerSection}>
                  <div className={styles.answerText}>
                    <strong>A:</strong> {question.answerText}
                  </div>
                  {question.answeredAt && (
                    <div className={styles.answerMeta}>
                      Answered {formatDate(question.answeredAt)}
                      {question.answeredBy && ` by ${question.answeredBy}`}
                    </div>
                  )}
                </div>
              )}

              {question.status !== 'answered' && (
                <div className={styles.pendingMessage}>
                  Waiting for response...
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default QAPanel;
