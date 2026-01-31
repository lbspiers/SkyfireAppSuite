// Email Templates Layout Component
// Main layout for the email templates management system integrated with admin panel

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import {
  EmailTemplate,
  TemplateCategory,
  TemplateDashboardStats,
  BulkTestRequest,
  EmailLog,
} from '../types/emailTemplateTypes';

// Import API types
import {
  TestEmailRequest,
} from '../../services/emailAPI';

// Import child components
import TemplateDashboard from './TemplateDashboard';
import TemplatePreviewSystem from './TemplatePreviewSystem';
import TestingCenter from './TestingCenter';
import AnalyticsDashboard from './AnalyticsDashboard';
import EmailLogsViewer from './EmailLogsViewer';

// Navigation tabs
type TabType = 'dashboard' | 'templates' | 'testing' | 'analytics' | 'logs';

interface TabConfig {
  key: TabType;
  title: string;
  icon: string;
  badge?: number;
}

interface EmailTemplatesLayoutProps {
  templates: EmailTemplate[];
  dashboardStats: TemplateDashboardStats | null;
  emailLogs: EmailLog[];
  emailServiceHealth: any;
  currentAdminEmail: string;
  isLoading?: boolean;
  onSendTest: (request: TestEmailRequest) => Promise<boolean>;
  onSendBulkTest: (request: BulkTestRequest) => Promise<boolean>;
  onRefresh?: () => Promise<void>;
  onExportLogs?: (logs: EmailLog[]) => Promise<void>;
  style?: any;
}

export const EmailTemplatesLayout: React.FC<EmailTemplatesLayoutProps> = ({
  templates,
  dashboardStats,
  emailLogs,
  emailServiceHealth,
  currentAdminEmail,
  isLoading = false,
  onSendTest,
  onSendBulkTest,
  onRefresh,
  onExportLogs,
  style,
}) => {
  // State management
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [refreshing, setRefreshing] = useState(false);

  // Navigation tabs configuration
  const tabs: TabConfig[] = [
    {
      key: 'dashboard',
      title: 'Dashboard',
      icon: '📊',
    },
    {
      key: 'templates',
      title: 'Templates',
      icon: '📧',
      badge: templates.filter(t => t.status === 'pending_approval').length || undefined,
    },
    {
      key: 'testing',
      title: 'Testing',
      icon: '🧪',
    },
    {
      key: 'analytics',
      title: 'Analytics',
      icon: '📈',
    },
    {
      key: 'logs',
      title: 'Logs',
      icon: '📝',
    },
  ];

  // Handle refresh
  const handleRefresh = async () => {
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
  };

  // Handle template selection
  const handleTemplateSelect = (template: EmailTemplate) => {
    setSelectedTemplate(template);
  };

  // Handle preview close
  const handlePreviewClose = () => {
    setSelectedTemplate(null);
  };

  // Render tab content
  const renderTabContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading email templates...</Text>
        </View>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <TemplateDashboard
            templates={templates}
            stats={dashboardStats}
            emailServiceHealth={emailServiceHealth}
            loading={isLoading}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            onTemplateAction={(action: string, template: EmailTemplate) => {
              if (action === 'select') {
                handleTemplateSelect(template);
              }
            }}
          />
        );

      case 'templates':
        return (
          <TemplatePreviewSystem
            templates={templates}
            selectedTemplate={selectedTemplate || undefined}
            onTemplateSelect={handleTemplateSelect}
            onPreviewClose={handlePreviewClose}
            searchQuery={searchQuery}
            categoryFilter={selectedCategory === 'all' ? '' : selectedCategory}
            isLoading={isLoading}
            onRefresh={handleRefresh}
          />
        );

      case 'testing':
        return (
          <TestingCenter
            templates={templates}
            onSendTest={onSendTest}
            onSendBulkTest={onSendBulkTest}
            isLoading={isLoading}
          />
        );

      case 'analytics':
        return (
          <AnalyticsDashboard
            templates={templates}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            isLoading={isLoading}
            onRefresh={handleRefresh}
          />
        );

      case 'logs':
        return (
          <EmailLogsViewer
            logs={emailLogs}
            templates={templates}
            isLoading={isLoading}
            onRefresh={handleRefresh}
            onExportLogs={onExportLogs}
          />
        );

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Header with Service Status */}
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <Text style={styles.title}>Email Templates</Text>
          <View style={[
            styles.statusIndicator,
            { backgroundColor: emailServiceHealth?.status === 'healthy' ? '#10B981' : '#EF4444' }
          ]}>
            <Text style={styles.statusText}>
              {emailServiceHealth?.status === 'healthy' ? '●' : '●'}
              {emailServiceHealth?.status === 'healthy' ? ' Service Online' : ' Service Issues'}
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search templates..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          <Text style={styles.searchIcon}>🔍</Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.tabList}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tab,
                  activeTab === tab.key && styles.activeTab
                ]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={styles.tabIcon}>{tab.icon}</Text>
                <Text style={[
                  styles.tabText,
                  activeTab === tab.key && styles.activeTabText
                ]}>
                  {tab.title}
                </Text>
                {tab.badge && tab.badge > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{tab.badge}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Tab Content */}
      <View style={styles.content}>
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#3B82F6']}
              tintColor={'#3B82F6'}
            />
          }
        >
          {renderTabContent()}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  searchContainer: {
    position: 'relative',
  },
  searchInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingRight: 40,
    paddingVertical: 12,
    fontSize: 14,
    color: '#374151',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
    fontSize: 16,
  },
  tabContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabList: {
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3B82F6',
  },
  tabIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
});

export default EmailTemplatesLayout;