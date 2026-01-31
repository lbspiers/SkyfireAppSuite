import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from '../../../../components/ui';
import styles from './EarningsChart.module.css';

const EarningsChart = ({ data = [], loading = false }) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={styles.tooltip}>
          <div className={styles.tooltipLabel}>{data.week}</div>
          <div className={styles.tooltipValue}>{formatCurrency(data.earnings)}</div>
          <div className={styles.tooltipJobs}>{data.jobs} job{data.jobs !== 1 ? 's' : ''}</div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>Weekly Earnings</h3>
        </div>
        <div className={styles.chartWrapper}>
          <Skeleton variant="rectangular" height={300} />
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>Weekly Earnings</h3>
        </div>
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📊</div>
          <div className={styles.emptyText}>No earnings data available</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Weekly Earnings</h3>
        <div className={styles.subtitle}>Last 8 weeks</div>
      </div>
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
            <XAxis
              dataKey="week"
              stroke="rgba(255, 255, 255, 0.5)"
              tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}
            />
            <YAxis
              stroke="rgba(255, 255, 255, 0.5)"
              tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}
              tickFormatter={formatCurrency}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(253, 115, 50, 0.1)' }} />
            <Bar dataKey="earnings" fill="#FD7332" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default EarningsChart;
