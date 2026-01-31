// Email Templates Analytics Dashboard
// Comprehensive performance metrics and insights

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

// Types
import {
  EmailTemplate,
  TemplatePerformance,
  MonthlyStats,
  ActivityEvent,
  CategoryStats,
  BaseComponentProps,
} from '../types/emailTemplateTypes';

interface AnalyticsDashboardProps extends BaseComponentProps {
  templates: EmailTemplate[];
  timeRange: 'week' | 'month' | 'quarter' | 'year';
  onTimeRangeChange: (range: 'week' | 'month' | 'quarter' | 'year') => void;
  isLoading?: boolean;
  onRefresh?: () => Promise<void>;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: string;
  color: string;
  format?: 'number' | 'percentage' | 'currency';
}

interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    color: string;
    label: string;
  }[];
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon,
  color,
  format = 'number',
}) => {
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val;

    switch (format) {
      case 'percentage':
        return `${val.toFixed(1)}%`;
      case 'currency':
        return `$${val.toLocaleString()}`;
      default:
        return val.toLocaleString();
    }
  };

  const getChangeColor = (change?: number) => {
    if (!change) return '#6B7280';
    return change > 0 ? '#10B981' : '#EF4444';
  };

  const getChangeIcon = (change?: number) => {
    if (!change) return '';
    return change > 0 ? '↗️' : '↘️';
  };

  return (
    <View style={styles.metricCard}>
      <LinearGradient
        colors={[color, color + '80']}
        style={styles.metricIconContainer}
      >
        <Text style={styles.metricIcon}>{icon}</Text>
      </LinearGradient>

      <View style={styles.metricContent}>
        <Text style={styles.metricTitle}>{title}</Text>
        <Text style={styles.metricValue}>{formatValue(value)}</Text>

        {change !== undefined && (
          <View style={styles.metricChange}>
            <Text style={[styles.metricChangeText, { color: getChangeColor(change) }]}>
              {getChangeIcon(change)} {Math.abs(change).toFixed(1)}%
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const SimpleChart: React.FC<{
  data: ChartData;
  height: number;
  type: 'line' | 'bar';
}> = ({ data, height, type }) => {
  const maxValue = Math.max(...data.datasets.flatMap(d => d.data));
  const minValue = Math.min(...data.datasets.flatMap(d => d.data));
  const range = maxValue - minValue || 1;

  return (
    <View style={[styles.chartContainer, { height }]}>
      <View style={styles.chartContent}>
        {data.labels.map((label, index) => (
          <View key={index} style={styles.chartColumn}>
            {data.datasets.map((dataset, datasetIndex) => (
              <View
                key={datasetIndex}
                style={[
                  styles.chartBar,
                  {
                    height: Math.max(4, ((dataset.data[index] - minValue) / range) * (height - 40)),
                    backgroundColor: dataset.color,
                    marginTop: datasetIndex > 0 ? 2 : 0,
                  },
                ]}
              />
            ))}
          </View>
        ))}
      </View>

      <View style={styles.chartLabels}>
        {data.labels.map((label, index) => (
          <Text key={index} style={styles.chartLabel}>
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
};

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  templates,
  timeRange,
  onTimeRangeChange,
  isLoading = false,
  onRefresh,
  className,
  style,
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Calculate overall metrics
  const overallMetrics = useMemo(() => {
    const totalSent = templates.reduce((sum, t) => sum + (t.analytics?.totalSent || 0), 0);
    const totalTemplates = templates.length;
    const activeTemplates = templates.filter(t => t.status === 'active').length;

    const avgOpenRate = templates.length > 0
      ? templates.reduce((sum, t) => sum + (t.analytics?.openRate || 0), 0) / templates.length
      : 0;

    const avgClickRate = templates.length > 0
      ? templates.reduce((sum, t) => sum + (t.analytics?.clickRate || 0), 0) / templates.length
      : 0;

    const avgBounceRate = templates.length > 0
      ? templates.reduce((sum, t) => sum + (t.analytics?.bounceRate || 0), 0) / templates.length
      : 0;

    return {
      totalSent,
      totalTemplates,
      activeTemplates,
      avgOpenRate: avgOpenRate * 100,
      avgClickRate: avgClickRate * 100,
      avgBounceRate: avgBounceRate * 100,
    };
  }, [templates]);

  // Top performing templates
  const topPerformingTemplates = useMemo(() => {
    return [...templates]
      .filter(t => t.analytics && t.analytics.totalSent > 0)
      .sort((a, b) => {
        const scoreA = (a.analytics!.openRate * 0.7) + (a.analytics!.clickRate * 0.3);
        const scoreB = (b.analytics!.openRate * 0.7) + (b.analytics!.clickRate * 0.3);
        return scoreB - scoreA;
      })
      .slice(0, 5);
  }, [templates]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const categories: Record<string, CategoryStats> = {};

    templates.forEach(template => {
      const category = template.category;
      if (!categories[category]) {
        categories[category] = {
          category: category as any,
          count: 0,
          sent: 0,
          openRate: 0,
          clickRate: 0,
        };
      }

      categories[category].count += 1;
      categories[category].sent += template.analytics?.totalSent || 0;
      categories[category].openRate += template.analytics?.openRate || 0;
      categories[category].clickRate += template.analytics?.clickRate || 0;
    });

    // Calculate averages
    Object.values(categories).forEach(category => {
      if (category.count > 0) {
        category.openRate = (category.openRate / category.count) * 100;
        category.clickRate = (category.clickRate / category.count) * 100;
      }
    });

    return Object.values(categories);
  }, [templates]);

  // Mock chart data for demonstration
  const emailVolumeChart = useMemo((): ChartData => {
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const data = [1200, 1500, 1800, 1400, 2100, 2400];

    return {
      labels,
      datasets: [{
        data,
        color: '#3B82F6',
        label: 'Emails Sent',
      }],
    };
  }, [timeRange]);

  const performanceChart = useMemo((): ChartData => {
    const labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    const openRates = [25, 28, 32, 30];
    const clickRates = [4, 5, 6, 5.5];

    return {
      labels,
      datasets: [
        {
          data: openRates,
          color: '#10B981',
          label: 'Open Rate %',
        },
        {
          data: clickRates,
          color: '#F59E0B',
          label: 'Click Rate %',
        },
      ],
    };
  }, [timeRange]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  return (
    <View style={[styles.container, style]} className={className}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#3B82F6']}
            tintColor={'#3B82F6'}
          />
        }
      >
        {/* Time Range Selector */}
        <View style={styles.timeRangeSelector}>
          {['week', 'month', 'quarter', 'year'].map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.timeRangeButton,
                timeRange === range && styles.timeRangeButtonActive
              ]}
              onPress={() => onTimeRangeChange(range as any)}
            >
              <Text style={[
                styles.timeRangeText,
                timeRange === range && styles.timeRangeTextActive
              ]}>
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Key Metrics */}
        <View style={styles.metricsGrid}>
          <MetricCard
            title="Total Sent"
            value={overallMetrics.totalSent}
            change={12.5}
            icon="📧"
            color="#3B82F6"
          />
          <MetricCard
            title="Open Rate"
            value={overallMetrics.avgOpenRate}
            change={3.2}
            icon="👁️"
            color="#10B981"
            format="percentage"
          />
          <MetricCard
            title="Click Rate"
            value={overallMetrics.avgClickRate}
            change={-0.8}
            icon="👆"
            color="#F59E0B"
            format="percentage"
          />
          <MetricCard
            title="Bounce Rate"
            value={overallMetrics.avgBounceRate}
            change={-1.2}
            icon="↩️"
            color="#EF4444"
            format="percentage"
          />
        </View>

        {/* Email Volume Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>Email Volume Over Time</Text>
          <SimpleChart
            data={emailVolumeChart}
            height={200}
            type="bar"
          />
        </View>

        {/* Performance Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>Performance Trends</Text>
          <SimpleChart
            data={performanceChart}
            height={180}
            type="line"
          />
        </View>

        {/* Top Performing Templates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Performing Templates</Text>
          {topPerformingTemplates.length > 0 ? (
            topPerformingTemplates.map((template, index) => (
              <View key={template.id} style={styles.templatePerformanceCard}>
                <View style={styles.templateRank}>
                  <Text style={styles.templateRankText}>#{index + 1}</Text>
                </View>

                <View style={styles.templateInfo}>
                  <Text style={styles.templateName} numberOfLines={1}>
                    {template.name}
                  </Text>
                  <Text style={styles.templateCategory}>
                    {template.category.replace('_', ' ')}
                  </Text>
                </View>

                <View style={styles.templateMetrics}>
                  <View style={styles.templateMetric}>
                    <Text style={styles.templateMetricValue}>
                      {((template.analytics?.openRate || 0) * 100).toFixed(1)}%
                    </Text>
                    <Text style={styles.templateMetricLabel}>Open</Text>
                  </View>

                  <View style={styles.templateMetric}>
                    <Text style={styles.templateMetricValue}>
                      {((template.analytics?.clickRate || 0) * 100).toFixed(1)}%
                    </Text>
                    <Text style={styles.templateMetricLabel}>Click</Text>
                  </View>

                  <View style={styles.templateMetric}>
                    <Text style={styles.templateMetricValue}>
                      {template.analytics?.totalSent || 0}
                    </Text>
                    <Text style={styles.templateMetricLabel}>Sent</Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No performance data available yet</Text>
            </View>
          )}
        </View>

        {/* Category Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance by Category</Text>
          {categoryBreakdown.map((category) => (
            <View key={category.category} style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryName}>
                  {category.category.replace('_', ' ').toUpperCase()}
                </Text>
                <Text style={styles.categoryCount}>
                  {category.count} template{category.count !== 1 ? 's' : ''}
                </Text>
              </View>

              <View style={styles.categoryMetrics}>
                <View style={styles.categoryMetricItem}>
                  <Text style={styles.categoryMetricLabel}>Sent</Text>
                  <Text style={styles.categoryMetricValue}>
                    {category.sent.toLocaleString()}
                  </Text>
                </View>

                <View style={styles.categoryMetricItem}>
                  <Text style={styles.categoryMetricLabel}>Open Rate</Text>
                  <Text style={styles.categoryMetricValue}>
                    {category.openRate.toFixed(1)}%
                  </Text>
                </View>

                <View style={styles.categoryMetricItem}>
                  <Text style={styles.categoryMetricLabel}>Click Rate</Text>
                  <Text style={styles.categoryMetricValue}>
                    {category.clickRate.toFixed(1)}%
                  </Text>
                </View>
              </View>

              {/* Visual performance bar */}
              <View style={styles.performanceBar}>
                <View
                  style={[
                    styles.performanceBarFill,
                    { width: `${Math.min(category.openRate, 100)}%` }
                  ]}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity Insights</Text>
          <View style={styles.insightCard}>
            <Text style={styles.insightTitle}>📈 Key Insights</Text>
            <View style={styles.insightList}>
              <Text style={styles.insightItem}>
                • Authentication emails have the highest open rate at {categoryBreakdown.find(c => c.category === 'authentication')?.openRate.toFixed(1) || '0'}%
              </Text>
              <Text style={styles.insightItem}>
                • {topPerformingTemplates[0]?.name || 'No template'} is your top performer this period
              </Text>
              <Text style={styles.insightItem}>
                • Overall email performance is {overallMetrics.avgOpenRate > 25 ? 'above' : 'below'} industry average
              </Text>
              <Text style={styles.insightItem}>
                • {overallMetrics.activeTemplates} of {overallMetrics.totalTemplates} templates are currently active
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  timeRangeSelector: {
    flexDirection: 'row',
    margin: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  timeRangeButtonActive: {
    backgroundColor: '#3B82F6',
  },
  timeRangeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  timeRangeTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  metricCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minWidth: (SCREEN_WIDTH - 60) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  metricIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  metricIcon: {
    fontSize: 20,
  },
  metricContent: {
    flex: 1,
  },
  metricTitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 2,
  },
  metricChange: {
    alignSelf: 'flex-start',
  },
  metricChangeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  chartSection: {
    margin: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  chartContainer: {
    position: 'relative',
  },
  chartContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100%',
    paddingBottom: 20,
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: 2,
  },
  chartBar: {
    width: '80%',
    borderRadius: 2,
    minHeight: 4,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  chartLabel: {
    fontSize: 10,
    color: '#6B7280',
    flex: 1,
    textAlign: 'center',
  },
  section: {
    margin: 20,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  templatePerformanceCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  templateRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  templateRankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  templateInfo: {
    flex: 1,
    marginRight: 12,
  },
  templateName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  templateCategory: {
    fontSize: 12,
    color: '#64748B',
    textTransform: 'capitalize',
  },
  templateMetrics: {
    flexDirection: 'row',
    gap: 12,
  },
  templateMetric: {
    alignItems: 'center',
  },
  templateMetricValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  templateMetricLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 1,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748B',
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  categoryCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  categoryMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryMetricItem: {
    alignItems: 'center',
  },
  categoryMetricLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 2,
  },
  categoryMetricValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  performanceBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  performanceBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  insightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
  },
  insightList: {
    gap: 8,
  },
  insightItem: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  bottomPadding: {
    height: 40,
  },
});

export default AnalyticsDashboard;