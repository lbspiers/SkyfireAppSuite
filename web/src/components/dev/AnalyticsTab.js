import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getAnalytics } from '../../services/devTaskService';
import styles from './AnalyticsTab.module.css';

const AnalyticsTab = ({ selectedTasks = [] }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const workloadCalculation = useMemo(() => {
    if (selectedTasks.length === 0) return null;

    let totalEstimate = 0;
    let totalActual = 0;
    let hasEstimates = false;
    let hasActuals = false;

    selectedTasks.forEach(task => {
      if (task.estimatedTime) {
        totalEstimate += parseFloat(task.estimatedTime) || 0;
        hasEstimates = true;
      }
      if (task.actualTime) {
        totalActual += parseFloat(task.actualTime) || 0;
        hasActuals = true;
      }
    });

    return {
      count: selectedTasks.length,
      totalEstimate: hasEstimates ? totalEstimate.toFixed(1) : null,
      totalActual: hasActuals ? totalActual.toFixed(1) : null,
    };
  }, [selectedTasks]);

  if (loading) {
    return (
      <div className={styles.loadingState}>
        Loading analytics...
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorState}>
        {error}
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className={styles.emptyState}>
        <h3>No Analytics Available</h3>
        <p>Complete some tasks to see analytics</p>
      </div>
    );
  }

  const { weeklySummary, statusOverview, timeMetrics, dailyActivity, categoryBreakdown, priorityBreakdown } = analytics;

  return (
    <div className={styles.analyticsContainer}>
      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        {/* Weekly Summary */}
        <div className={styles.statCard}>
          <h3>Weekly Summary</h3>
          <div className={styles.statValue}>{weeklySummary?.completed || 0}</div>
          <div className={styles.statSubtext}>
            {weeklySummary?.total || 0} tasks this week
          </div>
        </div>

        {/* Status Overview */}
        <div className={styles.statCard}>
          <h3>Status Overview</h3>
          <div className={styles.statusGrid}>
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>Todo</span>
              <span className={styles.statusValue}>{statusOverview?.todo || 0}</span>
            </div>
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>Progress</span>
              <span className={styles.statusValue}>{statusOverview?.inProgress || 0}</span>
            </div>
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>Done</span>
              <span className={styles.statusValue}>{statusOverview?.completed || 0}</span>
            </div>
          </div>
        </div>

        {/* Time Metrics */}
        <div className={styles.statCard}>
          <h3>Time Metrics</h3>
          <div className={styles.timeMetrics}>
            <div className={styles.timeMetric}>
              <div className={styles.timeLabel}>Avg Est</div>
              <div className={styles.timeValue}>{timeMetrics?.avgEstimate || '0'}h</div>
            </div>
            <div className={styles.timeMetric}>
              <div className={styles.timeLabel}>Avg Actual</div>
              <div className={styles.timeValue}>{timeMetrics?.avgActual || '0'}h</div>
            </div>
            <div className={styles.timeMetric}>
              <div className={styles.timeLabel}>Accuracy</div>
              <div className={styles.timeValue}>{timeMetrics?.accuracy || '0'}%</div>
            </div>
          </div>
        </div>

        {/* Workload Calculator */}
        {workloadCalculation && (
          <div className={styles.statCard}>
            <h3>Workload Calculator</h3>
            <div className={styles.statValue}>{workloadCalculation.count}</div>
            <div className={styles.statSubtext}>
              {workloadCalculation.totalEstimate && (
                <>Est: {workloadCalculation.totalEstimate}h</>
              )}
              {workloadCalculation.totalActual && (
                <> | Actual: {workloadCalculation.totalActual}h</>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Daily Activity Chart */}
      <div className={styles.chartCard}>
        <h3>Daily Activity (Last 30 Days)</h3>
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyActivity || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
              <XAxis
                dataKey="date"
                stroke="var(--gray-500)"
                style={{ fontSize: 'var(--font-size-xs)' }}
              />
              <YAxis
                stroke="var(--gray-500)"
                style={{ fontSize: 'var(--font-size-xs)' }}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--gray-200)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--font-size-sm)',
                }}
              />
              <Line
                type="monotone"
                dataKey="completed"
                stroke="var(--color-success)"
                strokeWidth={2}
                dot={{ fill: 'var(--color-success)', r: 4 }}
                name="Completed"
              />
              <Line
                type="monotone"
                dataKey="created"
                stroke="var(--color-info)"
                strokeWidth={2}
                dot={{ fill: 'var(--color-info)', r: 4 }}
                name="Created"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category & Priority Breakdown */}
      <div className={styles.breakdownGrid}>
        {/* Category Breakdown */}
        <div className={styles.breakdownCard}>
          <h3>Category Breakdown</h3>
          <div className={styles.breakdownList}>
            {categoryBreakdown && categoryBreakdown.length > 0 ? (
              categoryBreakdown.map((cat) => (
                <div key={cat.category} className={styles.breakdownItem}>
                  <span className={styles.breakdownLabel}>{cat.category}</span>
                  <div className={styles.breakdownValue}>
                    <span className={styles.breakdownCount}>{cat.count}</span>
                    <div className={styles.breakdownBar}>
                      <div
                        className={styles.breakdownBarFill}
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>No category data</div>
            )}
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className={styles.breakdownCard}>
          <h3>Priority Breakdown</h3>
          <div className={styles.breakdownList}>
            {priorityBreakdown && priorityBreakdown.length > 0 ? (
              priorityBreakdown.map((pri) => (
                <div key={pri.priority} className={styles.breakdownItem}>
                  <span className={styles.breakdownLabel}>{pri.priority}</span>
                  <div className={styles.breakdownValue}>
                    <span className={styles.breakdownCount}>{pri.count}</span>
                    <div className={styles.breakdownBar}>
                      <div
                        className={styles.breakdownBarFill}
                        style={{ width: `${pri.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>No priority data</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;
