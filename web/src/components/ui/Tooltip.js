import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './Tooltip.module.css';

const Tooltip = ({
  content,
  children,
  position = 'top',    // top, bottom, left, right
  delay = 200,         // ms before showing
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const timeoutRef = useRef(null);
  const wrapperRef = useRef(null);

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay);
  };

  const hideTooltip = () => {
    clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  useEffect(() => {
    if (isVisible && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

      let top = 0;
      let left = 0;

      switch (position) {
        case 'bottom':
          top = rect.bottom + scrollTop + 8;
          left = rect.left + scrollLeft + rect.width / 2;
          break;
        case 'top':
          top = rect.top + scrollTop - 8;
          left = rect.left + scrollLeft + rect.width / 2;
          break;
        case 'left':
          top = rect.top + scrollTop + rect.height / 2;
          left = rect.left + scrollLeft - 8;
          break;
        case 'right':
          top = rect.top + scrollTop + rect.height / 2;
          left = rect.right + scrollLeft + 8;
          break;
        default:
          break;
      }

      setTooltipPosition({ top, left });
    }
  }, [isVisible, position]);

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  if (!content) return children;

  return (
    <>
      <div
        ref={wrapperRef}
        className={styles.wrapper}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
      >
        {children}
      </div>
      {isVisible && createPortal(
        <div
          className={`${styles.tooltip} ${styles[position]} ${className}`}
          role="tooltip"
          style={{
            position: 'absolute',
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
          }}
        >
          {content}
          <div className={styles.arrow} />
        </div>,
        document.body
      )}
    </>
  );
};

export default Tooltip;
