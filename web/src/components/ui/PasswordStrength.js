import React, { useMemo } from 'react';
import styles from './PasswordStrength.module.css';

const PasswordStrength = ({ password }) => {
  const strength = useMemo(() => {
    if (!password) return { level: 0, label: '', color: '' };

    // Minimum length requirement
    if (password.length < 8) {
      return { level: 1, label: 'Too Short', color: 'weak' };
    }

    let score = 0;

    // Length checks (more generous scoring)
    if (password.length >= 8) score += 1;
    if (password.length >= 10) score += 1;
    if (password.length >= 12) score += 1;

    // Character variety
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;

    // Scoring: need variety + length
    if (score <= 3) return { level: 1, label: 'Weak', color: 'weak' };
    if (score <= 5) return { level: 2, label: 'Good', color: 'medium' };
    return { level: 3, label: 'Strong', color: 'strong' };
  }, [password]);

  if (!password) return null;

  return (
    <div className={styles.container}>
      <div className={styles.bars}>
        {[1, 2, 3].map((level) => (
          <div
            key={level}
            className={`${styles.bar} ${strength.level >= level ? styles[strength.color] : ''}`}
          />
        ))}
      </div>
      <span className={`${styles.label} ${styles[strength.color]}`}>
        {strength.label}
      </span>
    </div>
  );
};

export default PasswordStrength;
