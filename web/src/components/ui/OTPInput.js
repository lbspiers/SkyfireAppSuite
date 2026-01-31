import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import styles from './OTPInput.module.css';

const OTPInput = forwardRef(({ length = 6, value = '', onChange, error }, ref) => {
  const inputRefs = useRef([]);
  const [values, setValues] = useState(Array(length).fill(''));

  // Sync with external value prop
  useEffect(() => {
    if (value !== values.join('')) {
      const chars = value.split('').slice(0, length);
      const newValues = Array(length).fill('');
      chars.forEach((char, i) => {
        newValues[i] = char;
      });
      setValues(newValues);
    }
  }, [value, length, values]);

  // Expose focus method to parent
  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRefs.current[0]?.focus();
    }
  }));

  const handleChange = (index, e) => {
    const val = e.target.value;

    // Only allow single digit
    if (val.length > 1) return;
    if (val && !/^\d$/.test(val)) return;

    const newValues = [...values];
    newValues[index] = val;
    setValues(newValues);

    // Call parent onChange with combined value
    onChange(newValues.join(''));

    // Auto-advance to next input
    if (val && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace - go to previous input
    if (e.key === 'Backspace' && !values[index] && index > 0) {
      const newValues = [...values];
      newValues[index - 1] = '';
      setValues(newValues);
      onChange(newValues.join(''));
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\s/g, '').slice(0, length);
    if (!/^\d+$/.test(pastedData)) return;

    const newValues = Array(length).fill('');
    pastedData.split('').forEach((char, i) => {
      if (i < length) newValues[i] = char;
    });
    setValues(newValues);
    onChange(newValues.join(''));

    // Focus last filled or next empty
    const focusIndex = Math.min(pastedData.length, length - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  return (
    <div className={styles.container}>
      <div className={styles.inputGroup}>
        {Array(length).fill(0).map((_, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={values[index]}
            onChange={(e) => handleChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            className={`${styles.input} ${error ? styles.inputError : ''}`}
            autoComplete="one-time-code"
          />
        ))}
      </div>
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
});

OTPInput.displayName = 'OTPInput';

export default OTPInput;
