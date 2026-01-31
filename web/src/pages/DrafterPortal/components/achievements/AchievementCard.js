import { Progress } from '../../../../components/ui';
import styles from './AchievementCard.module.css';

const AchievementCard = ({ achievement }) => {
  const {
    name,
    description,
    icon,
    xpReward,
    unlocked,
    unlockedAt,
    progress = 0,
    target = 0
  } = achievement;

  const hasProgress = !unlocked && target > 0;
  const progressPercent = hasProgress ? (progress / target) * 100 : 0;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className={`${styles.card} ${unlocked ? styles.unlocked : styles.locked}`}>
      {/* XP Badge */}
      <div className={styles.xpBadge}>+{xpReward} XP</div>

      {/* Icon */}
      <div className={styles.iconContainer}>
        <div className={styles.icon}>{icon}</div>
        {unlocked && (
          <div className={styles.checkmark}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="10" fill="var(--color-success)" />
              <path
                d="M6 10L9 13L14 7"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className={styles.content}>
        <h3 className={styles.name}>{name}</h3>
        <p className={styles.description}>{description}</p>

        {/* Unlock date or progress */}
        {unlocked ? (
          <div className={styles.unlockedDate}>
            Unlocked {formatDate(unlockedAt)}
          </div>
        ) : hasProgress ? (
          <div className={styles.progressSection}>
            <div className={styles.progressLabel}>
              {progress} / {target}
            </div>
            <Progress value={progressPercent} variant="success" />
          </div>
        ) : (
          <div className={styles.lockedText}>🔒 Locked</div>
        )}
      </div>
    </div>
  );
};

export default AchievementCard;
