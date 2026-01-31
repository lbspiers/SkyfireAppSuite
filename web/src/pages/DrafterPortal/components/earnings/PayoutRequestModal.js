import { useState, useEffect } from 'react';
import { Modal, Button, FormInput, Radio, Alert } from '../../../../components/ui';
import styles from './PayoutRequestModal.module.css';

const PayoutRequestModal = ({
  onClose,
  onSubmit,
  availableBalance = 0,
  minimumPayout = 25,
  isSubmitting = false,
}) => {
  const [amount, setAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('bank_transfer');
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
  }, [amount, payoutMethod]);

  const calculateFee = () => {
    const numAmount = parseFloat(amount) || 0;
    if (payoutMethod === 'instant') {
      return numAmount * 0.025; // 2.5% fee
    }
    return 0;
  };

  const calculateNet = () => {
    const numAmount = parseFloat(amount) || 0;
    const fee = calculateFee();
    return numAmount - fee;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const handleMaxClick = () => {
    setAmount(availableBalance.toFixed(2));
  };

  const validateAndSubmit = () => {
    const numAmount = parseFloat(amount);

    if (!amount || isNaN(numAmount)) {
      setError('Please enter a valid amount');
      return;
    }

    if (numAmount < minimumPayout) {
      setError(`Minimum payout is ${formatCurrency(minimumPayout)}`);
      return;
    }

    if (numAmount > availableBalance) {
      setError(`Amount exceeds available balance of ${formatCurrency(availableBalance)}`);
      return;
    }

    onSubmit(numAmount, payoutMethod);
  };

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
        Cancel
      </Button>
      <Button variant="primary" onClick={validateAndSubmit} disabled={isSubmitting}>
        {isSubmitting ? 'Processing...' : 'Request Payout'}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Request Payout"
      footer={footer}
      size="md"
      closeOnEscape={!isSubmitting}
      showCloseButton={!isSubmitting}
    >
      <div className={styles.content}>
        {/* Available Balance */}
        <div className={styles.balanceSection}>
          <div className={styles.balanceLabel}>Available Balance</div>
          <div className={styles.balanceAmount}>{formatCurrency(availableBalance)}</div>
        </div>

        {/* Amount Input */}
        <div className={styles.field}>
          <FormInput
            label="Payout Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            prefix="$"
            disabled={isSubmitting}
          />
          <Button size="sm" variant="ghost" onClick={handleMaxClick} disabled={isSubmitting}>
            Max
          </Button>
        </div>

        {/* Minimum Payout Notice */}
        <Alert variant="info" className={styles.notice}>
          Minimum payout amount is {formatCurrency(minimumPayout)}
        </Alert>

        {/* Payout Method */}
        <div className={styles.methodSection}>
          <Radio.Group
            name="payoutMethod"
            value={payoutMethod}
            onChange={setPayoutMethod}
            label="Payout Method"
            disabled={isSubmitting}
          >
            <Radio
              value="bank_transfer"
              label="Bank Transfer"
              description="Free • 3-5 business days"
            />
            <Radio
              value="instant"
              label="Instant Transfer"
              description="2.5% fee • Arrives within minutes"
            />
          </Radio.Group>
        </div>

        {/* Fee Calculation */}
        {amount && parseFloat(amount) > 0 && (
          <div className={styles.summary}>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Amount</span>
              <span className={styles.summaryValue}>{formatCurrency(parseFloat(amount))}</span>
            </div>
            {calculateFee() > 0 && (
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Fee (2.5%)</span>
                <span className={styles.summaryValue}>-{formatCurrency(calculateFee())}</span>
              </div>
            )}
            <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
              <span className={styles.summaryLabel}>Net Amount</span>
              <span className={styles.summaryValue}>{formatCurrency(calculateNet())}</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <Alert variant="error" className={styles.error}>
            {error}
          </Alert>
        )}
      </div>
    </Modal>
  );
};

export default PayoutRequestModal;
