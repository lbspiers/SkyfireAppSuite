import React, { createContext, useContext } from 'react';
import styles from './Radio.module.css';

const RadioGroupContext = createContext(null);

const RadioGroup = ({
  name,
  value,
  onChange,
  children,
  orientation = 'vertical', // vertical, horizontal
  gap = 'md',
  disabled = false,
  label,
  error,
  className = '',
}) => {
  return (
    <div className={`${styles.groupWrapper} ${className}`}>
      {label && <span className={styles.groupLabel}>{label}</span>}
      <RadioGroupContext.Provider value={{ name, value, onChange, disabled }}>
        <div
          className={`
            ${styles.group}
            ${styles[orientation]}
            ${styles[`gap-${gap}`]}
          `.trim()}
          role="radiogroup"
        >
          {children}
        </div>
      </RadioGroupContext.Provider>
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
};

const Radio = ({
  value,
  label,
  description,
  disabled: disabledProp = false,
  size = 'md',  // sm, md, lg
  className = '',
  name: nameProp,
  checked: checkedProp,
  onChange: onChangeProp,
}) => {
  const context = useContext(RadioGroupContext);

  const name = context?.name || nameProp;
  const checked = context ? context.value === value : checkedProp;
  const disabled = context?.disabled || disabledProp;
  const onChange = context?.onChange || onChangeProp;

  const handleChange = (e) => {
    if (onChange) {
      onChange(value, e);
    }
  };

  const id = `radio-${name}-${value}`.replace(/\s+/g, '-');

  return (
    <label
      className={`${styles.container} ${disabled ? styles.disabled : ''} ${className}`}
      htmlFor={id}
    >
      <div className={`${styles.radio} ${styles[size]} ${checked ? styles.checked : ''}`}>
        <input
          type="radio"
          id={id}
          name={name}
          value={value}
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          className={styles.input}
        />
        <div className={styles.dot} />
      </div>

      {(label || description) && (
        <div className={styles.content}>
          {label && <span className={styles.label}>{label}</span>}
          {description && <span className={styles.description}>{description}</span>}
        </div>
      )}
    </label>
  );
};

Radio.Group = RadioGroup;
export default Radio;
