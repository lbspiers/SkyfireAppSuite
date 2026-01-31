import { Progress } from '../../../../components/ui';
import styles from './LevelProgressBar.module.css';

const LevelProgressBar = ({ levelInfo, compact = false }) => {
  if (!levelInfo) return null;

  const { level, title, currentXP, nextLevelXP, totalXP, perks = [] } = levelInfo;
  const progressPercent = (currentXP / nextLevelXP) * 100;

  if (compact) {
    return (
      <div className={styles.compact}>
        <div className={styles.compactBadge}>Lv.{level}</div>
        <div className={styles.compactContent}>
          <div className={styles.compactXP}>
            {currentXP.toLocaleString()} / {nextLevelXP.toLocaleString()} XP
          </div>
          <Progress value={progressPercent} size="sm" variant="primary" />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.levelCircle}>
          <div className={styles.levelNumber}>{level}</div>
        </div>
        <div className={styles.headerInfo}>
          <h2 className={styles.title}>{title}</h2>
          <div className={styles.totalXP}>{totalXP.toLocaleString()} Total XP</div>
        </div>
      </div>

      <div className={styles.progressSection}>
        <div className={styles.progressLabel}>
          <span>Level {level}</span>
          <span className={styles.xpText}>
            {currentXP.toLocaleString()} / {nextLevelXP.toLocaleString()} XP
          </span>
        </div>
        <Progress value={progressPercent} size="lg" variant="primary" />
      </div>

      {perks && perks.length > 0 && (
        <div className={styles.perksSection}>
          <div className={styles.perksTitle}>Current Perks</div>
          <ul className={styles.perksList}>
            {perks.map((perk, index) => (
              <li key={index} className={styles.perk}>
                <span className={styles.perkIcon}>✨</span>
                {perk}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LevelProgressBar;
