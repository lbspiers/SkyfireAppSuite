import { useState } from 'react';
import styles from './Accordion.module.css';

const Accordion = ({ items = [], allowMultiple = false, className = '' }) => {
  const [openIndices, setOpenIndices] = useState([]);

  const toggleItem = (index) => {
    if (allowMultiple) {
      setOpenIndices((prev) =>
        prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
      );
    } else {
      setOpenIndices((prev) => (prev.includes(index) ? [] : [index]));
    }
  };

  return (
    <div className={`${styles.accordion} ${className}`}>
      {items.map((item, index) => {
        const isOpen = openIndices.includes(index);
        return (
          <div key={index} className={`${styles.item} ${isOpen ? styles.open : ''}`}>
            <button className={styles.header} onClick={() => toggleItem(index)}>
              <span className={styles.title}>{item.title}</span>
              <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M4 6L8 10L12 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>
            <div className={styles.content}>
              <div className={styles.contentInner}>{item.content}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Accordion;
