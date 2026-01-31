import { Pagination, Skeleton } from '../../../../components/ui';
import styles from './TransactionTable.module.css';

const TransactionTable = ({
  transactions = [],
  loading = false,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const getTypeIcon = (type) => {
    const icons = {
      earning: '💵',
      bonus: '🎁',
      penalty: '⚠️',
      payout: '🏦',
    };
    return icons[type] || '💵';
  };

  const getAmountClass = (type) => {
    if (type === 'penalty') return styles.amountNegative;
    if (type === 'payout') return styles.amountNegative;
    return styles.amountPositive;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>Transaction History</h3>
        </div>
        <div className={styles.tableWrapper}>
          <Skeleton.Table rows={10} columns={4} />
        </div>
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>Transaction History</h3>
        </div>
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📋</div>
          <div className={styles.emptyText}>No transactions yet</div>
          <div className={styles.emptySubtext}>Your earnings will appear here</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Transaction History</h3>
      </div>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thType}>Type</th>
              <th className={styles.thDate}>Date</th>
              <th className={styles.thDescription}>Description</th>
              <th className={styles.thAmount}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.uuid} className={styles.row}>
                <td className={styles.tdType}>
                  <div className={styles.typeCell}>
                    <span className={styles.typeIcon}>{getTypeIcon(transaction.type)}</span>
                    <span className={styles.typeLabel}>{transaction.type}</span>
                  </div>
                </td>
                <td className={styles.tdDate}>{formatDate(transaction.createdAt)}</td>
                <td className={styles.tdDescription}>
                  <div className={styles.description}>
                    <div className={styles.descriptionText}>{transaction.description}</div>
                    {transaction.projectNumber && (
                      <div className={styles.projectNumber}>Project: {transaction.projectNumber}</div>
                    )}
                  </div>
                </td>
                <td className={styles.tdAmount}>
                  <span className={getAmountClass(transaction.type)}>
                    {transaction.type === 'penalty' || transaction.type === 'payout' ? '-' : '+'}
                    {formatCurrency(Math.abs(transaction.amount))}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
        </div>
      )}
    </div>
  );
};

export default TransactionTable;
