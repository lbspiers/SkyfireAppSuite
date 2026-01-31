import React from 'react';
import styles from './PillButton.module.css';

/**
 * PillButton - THE unified pill-shaped button
 *
 * One button to rule them all. Every pill button in the app uses this.
 * The only differences: text content, width (auto), and active state.
 *
 * @param {boolean} active - Active/selected state (changes colors)
 * @param {boolean} disabled - Disabled state
 * @param {Function} onClick - Click handler
 * @param {ReactNode} children - Button text/content
 * @param {string} className - Additional classes
 * @param {string} type - Button type
 */
const PillButton = ({
  active = false,
  disabled = false,
  onClick,
  children,
  className = '',
  type = 'button',
  ...rest
}) => {
  const buttonClass = [
    styles.pillButton,
    active && styles.active,
    disabled && styles.disabled,
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={buttonClass}
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
};

export default PillButton;
