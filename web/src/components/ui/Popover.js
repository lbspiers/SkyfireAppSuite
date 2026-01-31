import React, { useState, useRef, useEffect } from 'react';
import styles from './Popover.module.css';

const Popover = ({
  trigger,
  children,
  position = 'bottom',    // top, bottom, left, right
  align = 'center',       // start, center, end
  triggerOn = 'click',    // click, hover
  closeOnClickOutside = true,
  closeOnEscape = true,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        closeOnClickOutside &&
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (e) => {
      if (closeOnEscape && e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, closeOnClickOutside, closeOnEscape]);

  const handleTriggerClick = () => {
    if (triggerOn === 'click') {
      setIsOpen(!isOpen);
    }
  };

  const handleMouseEnter = () => {
    if (triggerOn === 'hover') {
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (triggerOn === 'hover') {
      setIsOpen(false);
    }
  };

  return (
    <div
      className={`${styles.wrapper} ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={triggerRef}
        onClick={handleTriggerClick}
        className={styles.trigger}
      >
        {trigger}
      </div>

      {isOpen && (
        <div
          ref={popoverRef}
          className={`${styles.popover} ${styles[position]} ${styles[`align-${align}`]}`}
        >
          <div className={styles.arrow} />
          <div className={styles.content}>
            {typeof children === 'function' ? children({ close: () => setIsOpen(false) }) : children}
          </div>
        </div>
      )}
    </div>
  );
};

export default Popover;
