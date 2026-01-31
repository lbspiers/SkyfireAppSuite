import { Skeleton } from '../../../../components/ui';
import styles from './EarningsSummaryCards.module.css';

const EarningsSummaryCards = ({
  totalEarnings = 0,
  thisWeek = 0,
  pendingPayout = 0,
  jobsCompleted = 0,
  loading = false,
}) => {
  const cards = [
    {
      id: 'total',
      label: 'Total Earnings',
      value: totalEarnings,
      icon: '💰',
      accentClass: styles.accentPrimary,
    },
    {
      id: 'week',
      label: 'This Week',
      value: thisWeek,
      icon: '📅',
      accentClass: styles.accentSuccess,
    },
    {
      id: 'pending',
      label: 'Pending Payout',
      value: pendingPayout,
      icon: '⏳',
      accentClass: styles.accentWarning,
    },
    {
      id: 'jobs',
      label: 'Jobs Completed',
      value: jobsCompleted,
      icon: '✅',
      accentClass: styles.accentInfo,
      isCount: true,
    },
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className={styles.grid}>
        {cards.map((card) => (
          <div key={card.id} className={`${styles.card} ${card.accentClass}`}>
            <div className={styles.cardContent}>
              <div className={styles.icon}>{card.icon}</div>
              <div className={styles.details}>
                <div className={styles.label}>{card.label}</div>
                <Skeleton variant="text" width="80%" height={32} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {cards.map((card) => (
        <div key={card.id} className={`${styles.card} ${card.accentClass}`}>
          <div className={styles.cardContent}>
            <div className={styles.icon}>{card.icon}</div>
            <div className={styles.details}>
              <div className={styles.label}>{card.label}</div>
              <div className={styles.value}>
                {card.isCount ? card.value.toLocaleString() : formatCurrency(card.value)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EarningsSummaryCards;
