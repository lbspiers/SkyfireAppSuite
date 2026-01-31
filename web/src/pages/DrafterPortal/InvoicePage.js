import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, StatusBadge, LoadingSpinner } from '../../components/ui';
import { earningsService } from '../../services/earningsService';
import styles from './InvoicePage.module.css';

const InvoicePage = () => {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        const data = await earningsService.getInvoice(uuid);
        setInvoice(data);
      } catch (err) {
        console.error('Failed to fetch invoice:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (uuid) {
      fetchInvoice();
    }
  }, [uuid]);

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
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'info';
      case 'paid':
        return 'success';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <LoadingSpinner size="lg" />
          <div className={styles.loadingText}>Loading invoice...</div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <div className={styles.errorIcon}>⚠️</div>
          <div className={styles.errorText}>Failed to load invoice</div>
          <Button variant="primary" onClick={() => navigate('/drafter-portal/earnings')}>
            Back to Earnings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Action Bar (hidden on print) */}
      <div className={styles.actionBar}>
        <Button variant="secondary" onClick={() => navigate('/drafter-portal/earnings')}>
          ← Back to Earnings
        </Button>
        <Button variant="primary" onClick={handlePrint}>
          Print Invoice
        </Button>
      </div>

      {/* Invoice */}
      <div className={styles.invoice}>
        {/* Header */}
        <div className={styles.invoiceHeader}>
          <div className={styles.branding}>
            <div className={styles.logo}>☀️ Skyfire Solar</div>
            <div className={styles.tagline}>Professional Design Services</div>
          </div>
          <div className={styles.invoiceMeta}>
            <div className={styles.invoiceNumber}>
              Invoice #{invoice.invoiceNumber}
            </div>
            <StatusBadge status={invoice.status} variant={getStatusVariant(invoice.status)} />
          </div>
        </div>

        {/* Bill To & Period */}
        <div className={styles.infoSection}>
          <div className={styles.billTo}>
            <div className={styles.sectionTitle}>Bill To</div>
            <div className={styles.billToName}>{invoice.drafterName}</div>
            <div className={styles.billToEmail}>{invoice.drafterEmail}</div>
          </div>
          <div className={styles.period}>
            <div className={styles.sectionTitle}>Invoice Period</div>
            <div className={styles.periodDates}>
              {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className={styles.lineItems}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.thDescription}>Description</th>
                <th className={styles.thProject}>Project</th>
                <th className={styles.thDate}>Date</th>
                <th className={styles.thAmount}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((item, index) => (
                <tr key={index}>
                  <td className={styles.tdDescription}>{item.description}</td>
                  <td className={styles.tdProject}>{item.projectNumber || '-'}</td>
                  <td className={styles.tdDate}>{formatDate(item.date)}</td>
                  <td className={styles.tdAmount}>{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className={styles.summary}>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Subtotal</span>
            <span className={styles.summaryValue}>{formatCurrency(invoice.subtotal)}</span>
          </div>
          {invoice.bonuses > 0 && (
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Bonuses</span>
              <span className={`${styles.summaryValue} ${styles.positive}`}>
                +{formatCurrency(invoice.bonuses)}
              </span>
            </div>
          )}
          {invoice.deductions > 0 && (
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Deductions</span>
              <span className={`${styles.summaryValue} ${styles.negative}`}>
                -{formatCurrency(invoice.deductions)}
              </span>
            </div>
          )}
          <div className={`${styles.summaryRow} ${styles.total}`}>
            <span className={styles.summaryLabel}>Total</span>
            <span className={styles.summaryValue}>{formatCurrency(invoice.total)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.footerText}>
            Thank you for your exceptional work! Questions? Contact accounts@skyfiresolar.com
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePage;
