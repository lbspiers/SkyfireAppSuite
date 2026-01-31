import { useState } from 'react';
import { Button, useToast } from '../../components/ui';
import { useEarnings } from '../../hooks/useEarnings';
import EarningsSummaryCards from './components/earnings/EarningsSummaryCards';
import EarningsChart from './components/earnings/EarningsChart';
import TransactionTable from './components/earnings/TransactionTable';
import PayoutRequestModal from './components/earnings/PayoutRequestModal';
import styles from './EarningsPage.module.css';

const EarningsPage = () => {
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [isRequestingPayout, setIsRequestingPayout] = useState(false);
  const { addToast } = useToast();

  const {
    summary,
    transactions,
    weeklyChart,
    loading,
    error,
    currentPage,
    totalPages,
    goToPage,
    requestPayout,
    refresh,
  } = useEarnings();

  const handleExportCSV = () => {
    if (!transactions || transactions.length === 0) {
      addToast('No transactions to export', 'info');
      return;
    }

    try {
      // Create CSV content
      const headers = ['Date', 'Type', 'Description', 'Project', 'Amount'];
      const rows = transactions.map((t) => [
        new Date(t.createdAt).toLocaleDateString('en-US'),
        t.type,
        t.description,
        t.projectNumber || '',
        t.amount.toFixed(2),
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `earnings_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      addToast('CSV exported successfully', 'success');
    } catch (err) {
      console.error('Failed to export CSV:', err);
      addToast('Failed to export CSV', 'error');
    }
  };

  const handlePayoutRequest = async (amount, method) => {
    setIsRequestingPayout(true);
    try {
      await requestPayout(amount, method);
      addToast('Payout request submitted successfully', 'success');
      setShowPayoutModal(false);
    } catch (err) {
      console.error('Failed to request payout:', err);
      addToast(err.message || 'Failed to submit payout request', 'error');
    } finally {
      setIsRequestingPayout(false);
    }
  };

  const canRequestPayout = summary && summary.availableBalance >= 25;

  if (error && !summary) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <div className={styles.errorIcon}>⚠️</div>
          <div className={styles.errorText}>Failed to load earnings data</div>
          <Button variant="primary" onClick={refresh}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>
            <span className={styles.titleIcon}>💰</span>
            Earnings
          </h1>
          <p className={styles.subtitle}>Track your earnings and request payouts</p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="secondary" onClick={handleExportCSV} disabled={loading}>
            Export CSV
          </Button>
          <Button
            variant="primary"
            onClick={() => setShowPayoutModal(true)}
            disabled={!canRequestPayout || loading}
          >
            Request Payout
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={styles.section}>
        <EarningsSummaryCards
          totalEarnings={summary?.totalEarnings || 0}
          thisWeek={summary?.thisWeek || 0}
          pendingPayout={summary?.pendingPayout || 0}
          jobsCompleted={summary?.jobsCompleted || 0}
          loading={loading}
        />
      </div>

      {/* Chart */}
      <div className={styles.section}>
        <EarningsChart data={weeklyChart} loading={loading} />
      </div>

      {/* Transactions */}
      <div className={styles.section}>
        <TransactionTable
          transactions={transactions}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={goToPage}
        />
      </div>

      {/* Payout Modal */}
      {showPayoutModal && (
        <PayoutRequestModal
          onClose={() => setShowPayoutModal(false)}
          onSubmit={handlePayoutRequest}
          availableBalance={summary?.availableBalance || 0}
          minimumPayout={25}
          isSubmitting={isRequestingPayout}
        />
      )}
    </div>
  );
};

export default EarningsPage;
