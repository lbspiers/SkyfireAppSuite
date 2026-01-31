import { Skeleton } from '../../../components/ui';
import styles from './Leaderboard.module.css';

const Leaderboard = ({ data = [], period = 'week', onPeriodChange, loading = false }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getMedalIcon = (rank) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return null;
    }
  };

  const periods = [
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'all', label: 'All Time' }
  ];

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>
            <span className={styles.icon}>🏆</span>
            Leaderboard
          </h3>
        </div>
        <div className={styles.tabs}>
          {periods.map((p) => (
            <button key={p.value} className={styles.tab} disabled>
              {p.label}
            </button>
          ))}
        </div>
        <div className={styles.list}>
          <Skeleton.Table rows={10} columns={3} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          <span className={styles.icon}>🏆</span>
          Leaderboard
        </h3>
      </div>

      <div className={styles.tabs}>
        {periods.map((p) => (
          <button
            key={p.value}
            className={`${styles.tab} ${period === p.value ? styles.tabActive : ''}`}
            onClick={() => onPeriodChange(p.value)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className={styles.list}>
        {data.map((entry) => (
          <div
            key={entry.rank}
            className={`${styles.entry} ${entry.isCurrentUser ? styles.currentUser : ''}`}
          >
            <div className={styles.rank}>
              {getMedalIcon(entry.rank) || `#${entry.rank}`}
            </div>
            <div className={styles.entryContent}>
              <div className={styles.entryHeader}>
                <span className={styles.name}>{entry.name}</span>
                {entry.isCurrentUser && <span className={styles.youBadge}>You</span>}
              </div>
              <div className={styles.stats}>
                <span className={styles.stat}>
                  <span className={styles.statIcon}>✅</span>
                  {entry.jobsCompleted} jobs
                </span>
                <span className={styles.stat}>
                  <span className={styles.statIcon}>💰</span>
                  {formatCurrency(entry.earnings)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {data.length === 0 && !loading && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📊</div>
          <div className={styles.emptyText}>No leaderboard data available</div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
