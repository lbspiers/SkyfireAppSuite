import { Menu, X } from 'lucide-react';
import styles from './DrafterMobileHeader.module.css';

const DrafterMobileHeader = ({ onMenuToggle, isMenuOpen }) => {
  return (
    <header className={styles.header}>
      <button
        className={styles.menuButton}
        onClick={onMenuToggle}
        aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
      >
        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
      <div className={styles.logo}>
        <span className={styles.logoIcon}>🔥</span>
        <span className={styles.logoText}>Skyfire</span>
      </div>
      <div className={styles.spacer} />
    </header>
  );
};

export default DrafterMobileHeader;
