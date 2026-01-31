import React, { useState } from 'react';
import { toast } from 'react-toastify';
import styles from './AdminPendingQuestions.module.css';

/**
 * Admin pending questions list
 * @param {Object} props
 * @param {Array} props.questions - Pending questions
 * @param {Function} props.onAnswer - Answer handler
 */
const AdminPendingQuestions = ({ questions = [], onAnswer }) => {
  const [answers, setAnswers] = useState({});
  const [answering, setAnswering] = useState({});

  const formatTime = (dateString) => {
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

  const handleAnswerChange = (questionUuid, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionUuid]: value
    }));
  };

  const handleSubmitAnswer = async (question) => {
    const answerText = answers[question.uuid];

    if (!answerText?.trim()) {
      toast.warning('Please enter an answer', {
        position: 'top-center',
        autoClose: 3000,
      });
      return;
    }

    setAnswering(prev => ({ ...prev, [question.uuid]: true }));

    try {
      await onAnswer(question.uuid, answerText.trim());

      // Clear answer input
      setAnswers(prev => {
        const newAnswers = { ...prev };
        delete newAnswers[question.uuid];
        return newAnswers;
      });

      toast.success('Answer submitted');
    } catch (error) {
      toast.error('Failed to submit answer');
    } finally {
      setAnswering(prev => ({ ...prev, [question.uuid]: false }));
    }
  };

  if (questions.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No pending questions</p>
      </div>
    );
  }

  return (
    <div className={styles.questionsList}>
      {questions.map(question => (
        <div key={question.uuid} className={styles.questionCard}>
          <div className={styles.header}>
            <div className={styles.drafter}>
              <strong>{question.drafterName || 'Unknown Drafter'}</strong>
            </div>
            <div className={styles.time}>{formatTime(question.createdAt)}</div>
          </div>

          <div className={styles.project}>
            Project: {question.projectAddress || 'Unknown Project'}
          </div>

          <div className={styles.question}>
            <strong>Q:</strong> {question.questionText}
          </div>

          <div className={styles.answerForm}>
            <input
              type="text"
              value={answers[question.uuid] || ''}
              onChange={(e) => handleAnswerChange(question.uuid, e.target.value)}
              placeholder="Type your answer..."
              className={styles.answerInput}
              disabled={answering[question.uuid]}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSubmitAnswer(question);
                }
              }}
            />
            <button
              onClick={() => handleSubmitAnswer(question)}
              disabled={answering[question.uuid] || !answers[question.uuid]?.trim()}
              className={styles.submitButton}
            >
              {answering[question.uuid] ? 'Sending...' : 'Answer'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminPendingQuestions;
