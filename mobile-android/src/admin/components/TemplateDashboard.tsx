// Template Dashboard Component
// Main dashboard showing overview cards, stats, and quick actions

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import {
  EmailTemplate,
  TemplateDashboardStats,
  TemplatePerformance,
  TEMPLATE_CATEGORIES,
  TEMPLATE_STATUSES,
} from '../types/emailTemplateTypes';

interface TemplateDashboardProps {
  stats: TemplateDashboardStats | null;
  templates: EmailTemplate[];
  onRefresh: () => Promise<void>;
  onTemplateAction: (action: string, template: EmailTemplate) => void;
  loading: boolean;
  refreshing: boolean;
}

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2; // For 2-column layout with margins

const TemplateDashboard: React.FC<TemplateDashboardProps> = ({
  stats,
  templates,
  onRefresh,
  onTemplateAction,
  loading,
  refreshing,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  const renderOverviewCards = () => (
    <View style={styles.overviewGrid}>
      <OverviewCard
        title="Total Templates"
        value={stats?.totalTemplates?.toString() || '0'}
        subtitle="across all categories"
        icon="📧"
        color="#3B82F6"
      />

      <OverviewCard
        title="Active Templates"
        value={stats?.activeTemplates?.toString() || '0'}
        subtitle="ready to send"
        icon="✅"
        color="#10B981"
      />

      <OverviewCard
        title="Emails Sent"
        value={stats?.totalEmailsSent?.toLocaleString() || '0'}
        subtitle="this month"
        icon="📤"
        color="#8B5CF6"
      />

      <OverviewCard
        title="Open Rate"
        value={`${stats?.averageOpenRate?.toFixed(1) || '0'}%`}
        subtitle="average across all"
        icon="👀"
        color="#F59E0B"
      />
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
      </View>

      <View style={styles.quickActionsGrid}>
        <QuickActionCard
          title="Create Template"
          subtitle="Start from scratch"
          icon="➕"
          color="#10B981"
          onPress={() => {/* Navigate to template creator */}}
        />

        <QuickActionCard
          title="Test Email"
          subtitle="Send test message"
          icon="🧪"
          color="#3B82F6"
          onPress={() => {/* Open test center */}}
        />

        <QuickActionCard
          title="View Analytics"
          subtitle="Performance insights"
          icon="📊"
          color="#8B5CF6"
          onPress={() => {/* Switch to analytics tab */}}
        />

        <QuickActionCard
          title="Email Logs"
          subtitle="Recent activity"
          icon="📝"
          color="#F59E0B"
          onPress={() => {/* Switch to logs tab */}}
        />
      </View>
    </View>
  );

  const renderTopPerformingTemplates = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🏆 Top Performing Templates</Text>
        <View style={styles.periodSelector}>
          {(['7d', '30d', '90d'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.activePeriodButton,
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === period && styles.activePeriodButtonText,
                ]}
              >
                {period}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.performanceList}>
        {stats?.topPerformingTemplates?.map((template, index) => (
          <PerformanceTemplateCard
            key={template.templateId}
            template={template}
            rank={index + 1}
            onPress={() => {
              const fullTemplate = templates.find(t => t.id === template.templateId);
              if (fullTemplate) {
                onTemplateAction('preview', fullTemplate);
              }
            }}
          />
        )) || (
          <Text style={styles.emptyText}>No performance data available</Text>
        )}
      </View>
    </View>
  );

  const renderCategoryBreakdown = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>📊 Category Breakdown</Text>
      </View>

      <View style={styles.categoryGrid}>
        {stats?.categoryBreakdown?.map((category) => (
          <CategoryCard
            key={category.category}
            category={category.category}
            count={category.count}
            sent={category.sent}
            openRate={category.openRate}
            clickRate={category.clickRate}
          />
        )) || (
          <Text style={styles.emptyText}>No category data available</Text>
        )}
      </View>
    </View>
  );

  const renderRecentActivity = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🕐 Recent Activity</Text>
        <TouchableOpacity>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.activityList}>
        {stats?.recentActivity?.map((activity) => (
          <ActivityItem
            key={activity.id}
            activity={activity}
            onPress={() => {
              const template = templates.find(t => t.id === activity.templateId);
              if (template) {
                onTemplateAction('preview', template);
              }
            }}
          />
        )) || (
          <Text style={styles.emptyText}>No recent activity</Text>
        )}
      </View>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#3B82F6']}
          tintColor="#3B82F6"
        />
      }
    >
      {renderOverviewCards()}
      {renderQuickActions()}
      {renderTopPerformingTemplates()}
      {renderCategoryBreakdown()}
      {renderRecentActivity()}
    </ScrollView>
  );
};

// Overview Card Component
const OverviewCard: React.FC<{
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  color: string;
}> = ({ title, value, subtitle, icon, color }) => (
  <View style={[styles.overviewCard, { width: cardWidth }]}>
    <LinearGradient
      colors={[color, `${color}CC`]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.overviewCardGradient}
    >
      <View style={styles.overviewCardHeader}>
        <Text style={styles.overviewCardIcon}>{icon}</Text>
        <Text style={styles.overviewCardTitle}>{title}</Text>
      </View>
      <Text style={styles.overviewCardValue}>{value}</Text>
      <Text style={styles.overviewCardSubtitle}>{subtitle}</Text>
    </LinearGradient>
  </View>
);

// Quick Action Card Component
const QuickActionCard: React.FC<{
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  onPress: () => void;
}> = ({ title, subtitle, icon, color, onPress }) => (
  <TouchableOpacity
    style={[styles.quickActionCard, { width: cardWidth }]}
    onPress={onPress}
  >
    <View style={[styles.quickActionIcon, { backgroundColor: color }]}>
      <Text style={styles.quickActionIconText}>{icon}</Text>
    </View>
    <View style={styles.quickActionContent}>
      <Text style={styles.quickActionTitle}>{title}</Text>
      <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
    </View>
  </TouchableOpacity>
);

// Performance Template Card Component
const PerformanceTemplateCard: React.FC<{
  template: TemplatePerformance;
  rank: number;
  onPress: () => void;
}> = ({ template, rank, onPress }) => {
  const categoryConfig = TEMPLATE_CATEGORIES[template.category];
  const trendIcon = template.trend === 'up' ? '📈' : template.trend === 'down' ? '📉' : '➡️';
  const trendColor = template.trend === 'up' ? '#10B981' : template.trend === 'down' ? '#EF4444' : '#6B7280';

  return (
    <TouchableOpacity style={styles.performanceCard} onPress={onPress}>
      <View style={styles.performanceCardHeader}>
        <View style={styles.performanceRank}>
          <Text style={styles.performanceRankText}>#{rank}</Text>
        </View>
        <View style={styles.performanceCardInfo}>
          <Text style={styles.performanceCardTitle}>{template.templateName}</Text>
          <View style={styles.performanceCardCategory}>
            <Text style={styles.categoryIcon}>{categoryConfig.icon}</Text>
            <Text style={styles.categoryName}>{categoryConfig.name}</Text>
          </View>
        </View>
        <View style={[styles.trendIndicator, { backgroundColor: trendColor }]}>
          <Text style={styles.trendIcon}>{trendIcon}</Text>
        </View>
      </View>

      <View style={styles.performanceStats}>
        <Stat label="Sent" value={template.sent.toLocaleString()} />
        <Stat label="Open Rate" value={`${template.openRate}%`} />
        <Stat label="Click Rate" value={`${template.clickRate}%`} />
      </View>
    </TouchableOpacity>
  );
};

// Category Card Component
const CategoryCard: React.FC<{
  category: any;
  count: number;
  sent: number;
  openRate: number;
  clickRate: number;
}> = ({ category, count, sent, openRate, clickRate }) => {
  const categoryConfig = TEMPLATE_CATEGORIES[category];

  return (
    <View style={[styles.categoryCard, { backgroundColor: `${categoryConfig.color}10` }]}>
      <View style={styles.categoryCardHeader}>
        <Text style={styles.categoryCardIcon}>{categoryConfig.icon}</Text>
        <View>
          <Text style={styles.categoryCardTitle}>{categoryConfig.name}</Text>
          <Text style={styles.categoryCardCount}>{count} templates</Text>
        </View>
      </View>

      <View style={styles.categoryStats}>
        <Stat label="Sent" value={sent.toLocaleString()} />
        <Stat label="Opens" value={`${openRate}%`} />
        <Stat label="Clicks" value={`${clickRate}%`} />
      </View>
    </View>
  );
};

// Activity Item Component
const ActivityItem: React.FC<{
  activity: any;
  onPress: () => void;
}> = ({ activity, onPress }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'template_created': return '➕';
      case 'template_updated': return '✏️';
      case 'template_tested': return '🧪';
      case 'email_sent': return '📤';
      case 'template_approved': return '✅';
      default: return '📄';
    }
  };

  const getActivityText = (type: string) => {
    switch (type) {
      case 'template_created': return 'created template';
      case 'template_updated': return 'updated template';
      case 'template_tested': return 'tested template';
      case 'email_sent': return 'sent email using';
      case 'template_approved': return 'approved template';
      default: return 'modified template';
    }
  };

  return (
    <TouchableOpacity style={styles.activityItem} onPress={onPress}>
      <View style={styles.activityIcon}>
        <Text>{getActivityIcon(activity.type)}</Text>
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityText}>
          <Text style={styles.activityUser}>{activity.userName}</Text>
          {' '}{getActivityText(activity.type)}{' '}
          <Text style={styles.activityTemplate}>{activity.templateName}</Text>
        </Text>
        <Text style={styles.activityTime}>
          {new Date(activity.timestamp).toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// Stat Component
const Stat: React.FC<{
  label: string;
  value: string;
}> = ({ label, value }) => (
  <View style={styles.stat}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 20,
    gap: 16,
  },
  overviewCard: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  overviewCardGradient: {
    padding: 16,
    height: 120,
  },
  overviewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  overviewCardIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  overviewCardTitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  overviewCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  overviewCardSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  sectionContainer: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickActionCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  quickActionIconText: {
    fontSize: 16,
    color: '#FFF',
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    padding: 2,
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  activePeriodButton: {
    backgroundColor: '#3B82F6',
  },
  periodButtonText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  activePeriodButtonText: {
    color: '#FFF',
  },
  performanceList: {
    gap: 12,
  },
  performanceCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  performanceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  performanceRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  performanceRankText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFF',
  },
  performanceCardInfo: {
    flex: 1,
  },
  performanceCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  performanceCardCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  categoryIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  categoryName: {
    fontSize: 12,
    color: '#6B7280',
  },
  trendIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendIcon: {
    fontSize: 10,
  },
  performanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryGrid: {
    gap: 12,
  },
  categoryCard: {
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryCardIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  categoryCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  categoryCardCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  categoryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 18,
  },
  activityUser: {
    fontWeight: '600',
  },
  activityTemplate: {
    fontWeight: '600',
    color: '#3B82F6',
  },
  activityTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  viewAllText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
    fontStyle: 'italic',
    paddingVertical: 20,
  },
});

export default TemplateDashboard;