// Email Templates Admin Screen - Integration with Existing Admin Panel
// Direct implementation following admin panel patterns for consistent UI/UX

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  RefreshControl,
  Platform,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';

import { emailAPI } from '../../services/emailAPI';
import { useResponsive } from '../../utils/responsive';

// Import email template types
import {
  EmailTemplate,
  TemplateDashboardStats,
  BulkTestRequest,
  EmailLog,
  LogFilter,
} from '../../admin/types/emailTemplateTypes';

// Import API types
import {
  TestEmailRequest,
} from '../../services/emailAPI';

interface EmailTemplatesScreenProps {
  refreshing?: boolean;
}

const EmailTemplatesScreen: React.FC<EmailTemplatesScreenProps> = ({
  refreshing = false
}) => {
  const { moderateScale, verticalScale, font } = useResponsive();
  const styles = makeStyles({ moderateScale, verticalScale, font });

  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emailServiceHealth, setEmailServiceHealth] = useState<any>(null);

  // Mock data for templates (in real implementation, this would come from backend)
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [dashboardStats, setDashboardStats] = useState<TemplateDashboardStats | null>(null);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);

  // Get current admin email (this should come from auth context)
  const currentAdminEmail = useMemo(() => {
    return emailAPI.getCurrentAdminEmail();
  }, []);

  /**
   * Initialize component and load data
   */
  useEffect(() => {
    initializeEmailTemplatesScreen();
  }, []);

  /**
   * Handle refresh from parent component
   */
  useEffect(() => {
    if (refreshing) {
      handleRefresh();
    }
  }, [refreshing]);

  /**
   * Initialize the email templates screen
   */
  const initializeEmailTemplatesScreen = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load email service health and template data
      await Promise.all([
        loadEmailServiceHealth(),
        loadMockTemplateData(),
      ]);

      setIsLoading(false);
    } catch (error: any) {
      console.error('[EmailTemplatesScreen] Initialization failed:', error);
      setError('Failed to initialize email templates. Please check your connection and try again.');
      setIsLoading(false);
    }
  }, []);

  /**
   * Load email service health status
   */
  const loadEmailServiceHealth = useCallback(async () => {
    try {
      const healthResponse = await emailAPI.checkHealth();

      if (healthResponse.success) {
        setEmailServiceHealth(healthResponse.data);
        console.log('📧 [EmailTemplatesScreen] Email service health loaded');
      } else {
        console.warn('📧 [EmailTemplatesScreen] Email service health check failed:', healthResponse.message);
        setEmailServiceHealth({
          status: 'unhealthy',
          error: healthResponse.message,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error: any) {
      console.error('[EmailTemplatesScreen] Failed to load email service health:', error);
      setEmailServiceHealth({
        status: 'unhealthy',
        error: emailAPI.formatErrorMessage(error),
        timestamp: new Date().toISOString()
      });
    }
  }, []);


  /**
   * Load mock template data (replace with real API calls)
   */
  const loadMockTemplateData = useCallback(() => {
    // Generate mock email templates
    const mockTemplates: EmailTemplate[] = [
      {
        id: '1',
        name: 'Demo Confirmation Email',
        category: 'booking',
        description: 'Sent to customers when a solar demo is scheduled',
        subject: 'Your Skyfire Solar Demo is Confirmed - {{demoDate}}',
        htmlContent: '<h1>Welcome {{customerName}}</h1><p>Your demo is scheduled for {{demoDate}} at {{demoTime}}</p>',
        textContent: 'Welcome {{customerName}}! Your demo is scheduled for {{demoDate}} at {{demoTime}}',
        variables: [
          {
            key: 'customerName',
            name: 'Customer Name',
            description: 'Full name of the customer',
            type: 'string',
            required: true,
            defaultValue: '',
            examples: ['John Doe', 'Jane Smith'],
          },
          {
            key: 'demoDate',
            name: 'Demo Date',
            description: 'Date of the scheduled demo',
            type: 'date',
            required: true,
            defaultValue: '',
            examples: ['January 15, 2024', 'March 22, 2024'],
          },
          {
            key: 'demoTime',
            name: 'Demo Time',
            description: 'Time of the scheduled demo',
            type: 'string',
            required: true,
            defaultValue: '',
            examples: ['2:00 PM', '10:30 AM'],
          },
        ],
        metadata: {
          tags: ['demo', 'confirmation', 'customer'],
          purpose: 'Confirm scheduled demo appointments',
          audience: 'Prospective customers',
          frequency: 'triggered',
          importance: 'high',
          estimatedSendVolume: 50,
          approvalRequired: false,
        },
        analytics: {
          totalSent: 245,
          deliveryRate: 0.98,
          openRate: 0.87,
          clickRate: 0.23,
          bounceRate: 0.02,
          unsubscribeRate: 0.001,
          spamRate: 0,
          monthlyStats: [
            { month: '2024-01', sent: 89, delivered: 87, opened: 76, clicked: 18, bounced: 2, unsubscribed: 0 },
            { month: '2024-02', sent: 95, delivered: 93, opened: 82, clicked: 21, bounced: 2, unsubscribed: 1 },
            { month: '2024-03', sent: 61, delivered: 60, opened: 53, clicked: 14, bounced: 1, unsubscribed: 0 },
          ],
          recentActivity: [],
        },
        versions: [],
        status: 'active',
        permissions: {
          canView: ['admin', 'editor'],
          canEdit: ['admin'],
          canTest: ['admin', 'editor'],
          canDelete: ['admin'],
          canApprove: ['admin'],
        },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-03-15'),
        createdBy: 'admin@skyfiresd.com',
        updatedBy: 'admin@skyfiresd.com',
      },
      {
        id: '2',
        name: 'Password Reset Security Code',
        category: 'authentication',
        description: 'Secure password reset email with 6-digit code',
        subject: 'Your Skyfire Solar Password Reset Code',
        htmlContent: '<h1>Password Reset Request</h1><p>Your reset code is: <strong>{{resetCode}}</strong></p>',
        textContent: 'Password Reset Request - Your reset code is: {{resetCode}}',
        variables: [
          {
            key: 'resetCode',
            name: 'Reset Code',
            description: '6-digit security code for password reset',
            type: 'string',
            required: true,
            defaultValue: '',
            examples: ['123456', '987654'],
          },
          {
            key: 'expirationTime',
            name: 'Expiration Time',
            description: 'When the reset code expires',
            type: 'string',
            required: false,
            defaultValue: '10 minutes',
            examples: ['10 minutes', '15 minutes'],
          },
        ],
        metadata: {
          tags: ['security', 'password', 'authentication'],
          purpose: 'Enable secure password reset',
          audience: 'Registered users',
          frequency: 'triggered',
          importance: 'critical',
          estimatedSendVolume: 25,
          approvalRequired: false,
        },
        analytics: {
          totalSent: 89,
          deliveryRate: 0.99,
          openRate: 0.95,
          clickRate: 0.78,
          bounceRate: 0.01,
          unsubscribeRate: 0,
          spamRate: 0,
          monthlyStats: [
            { month: '2024-01', sent: 32, delivered: 32, opened: 31, clicked: 25, bounced: 0, unsubscribed: 0 },
            { month: '2024-02', sent: 28, delivered: 28, opened: 26, clicked: 21, bounced: 0, unsubscribed: 0 },
            { month: '2024-03', sent: 29, delivered: 29, opened: 27, clicked: 22, bounced: 0, unsubscribed: 0 },
          ],
          recentActivity: [],
        },
        versions: [],
        status: 'active',
        permissions: {
          canView: ['admin', 'editor'],
          canEdit: ['admin'],
          canTest: ['admin'],
          canDelete: ['admin'],
          canApprove: ['admin'],
        },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-03-10'),
        createdBy: 'admin@skyfiresd.com',
        updatedBy: 'admin@skyfiresd.com',
      },
    ];

    setTemplates(mockTemplates);

    // Generate mock dashboard stats
    const mockStats: TemplateDashboardStats = {
      totalTemplates: mockTemplates.length,
      activeTemplates: mockTemplates.filter(t => t.status === 'active').length,
      draftTemplates: mockTemplates.filter(t => t.status === 'draft').length,
      totalEmailsSent: mockTemplates.reduce((sum, t) => sum + (t.analytics?.totalSent || 0), 0),
      averageOpenRate: mockTemplates.reduce((sum, t) => sum + (t.analytics?.openRate || 0), 0) / mockTemplates.length,
      averageClickRate: mockTemplates.reduce((sum, t) => sum + (t.analytics?.clickRate || 0), 0) / mockTemplates.length,
      topPerformingTemplates: mockTemplates.map(template => ({
        templateId: template.id,
        templateName: template.name,
        category: template.category,
        sent: template.analytics?.totalSent || 0,
        openRate: template.analytics?.openRate || 0,
        clickRate: template.analytics?.clickRate || 0,
        trend: 'up' as const,
      })),
      recentActivity: [],
      categoryBreakdown: [],
    };

    setDashboardStats(mockStats);

    console.log('📧 [EmailTemplatesScreen] Mock template data loaded');
  }, []);

  /**
   * Handle template testing
   */
  const handleSendTest = useCallback(async (request: TestEmailRequest): Promise<boolean> => {
    try {
      console.log('📧 [EmailTemplatesScreen] Sending test email:', request);

      const response = await emailAPI.sendTestEmail(request);

      if (response.success) {
        Alert.alert(
          'Test Email Sent',
          `Test email sent successfully to ${request.recipientEmail}`,
          [{ text: 'OK' }]
        );
        return true;
      } else {
        const userFriendlyMessage = emailAPI.getUserFriendlyErrorMessage(
          response.error || 'TEST_EMAIL_FAILED',
          response.message
        );

        Alert.alert('Test Email Failed', userFriendlyMessage, [{ text: 'OK' }]);
        return false;
      }
    } catch (error: any) {
      console.error('[EmailTemplatesScreen] Failed to send test email:', error);
      Alert.alert(
        'Test Email Error',
        emailAPI.formatErrorMessage(error),
        [{ text: 'OK' }]
      );
      return false;
    }
  }, []);

  /**
   * Handle bulk testing
   */
  const handleSendBulkTest = useCallback(async (request: BulkTestRequest): Promise<boolean> => {
    try {
      console.log('📧 [EmailTemplatesScreen] Sending bulk test emails:', request);

      // For now, simulate bulk testing by sending individual test emails
      const results = await Promise.allSettled(
        request.templateIds.map(async (templateId) => {
          const template = templates.find(t => t.id === templateId);
          if (!template) throw new Error(`Template ${templateId} not found`);

          const testRequest: TestEmailRequest = {
            recipientEmail: request.recipientGroups[0]?.recipients[0]?.email || 'designs@skyfiresd.com',
            templateType: template.category === 'authentication' ? 'password_reset' : 'demo_confirmation',
            adminEmail: currentAdminEmail,
            testData: request.sampleData,
          };

          return emailAPI.sendTestEmail(testRequest);
        })
      );

      const successCount = results.filter(result => result.status === 'fulfilled').length;
      const totalCount = results.length;

      Alert.alert(
        'Bulk Test Complete',
        `${successCount}/${totalCount} test emails sent successfully`,
        [{ text: 'OK' }]
      );

      return successCount > 0;
    } catch (error: any) {
      console.error('[EmailTemplatesScreen] Failed to send bulk test emails:', error);
      Alert.alert(
        'Bulk Test Error',
        emailAPI.formatErrorMessage(error),
        [{ text: 'OK' }]
      );
      return false;
    }
  }, [templates, currentAdminEmail]);

  /**
   * Handle refresh action
   */
  const handleRefresh = useCallback(async () => {
    console.log('📧 [EmailTemplatesScreen] Refreshing data...');
    await initializeEmailTemplatesScreen();
  }, [initializeEmailTemplatesScreen]);

  /**
   * Handle export logs (placeholder)
   */
  const handleExportLogs = useCallback(async (logs: EmailLog[]): Promise<void> => {
    // Placeholder for log export functionality
    Alert.alert(
      'Export Logs',
      `Export ${logs.length} log entries? This feature will be implemented soon.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export', onPress: () => console.log('Export logs:', logs.length) }
      ]
    );
  }, []);

  // Show error alert when error state changes
  useEffect(() => {
    if (error) {
      Alert.alert(
        'Error',
        error,
        [
          { text: 'Retry', onPress: initializeEmailTemplatesScreen }
        ]
      );
    }
  }, [error, initializeEmailTemplatesScreen]);

  // Show error state if initialization failed
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorMessage}>An error occurred. Please check the alert.</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={initializeEmailTemplatesScreen}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FD7332" />
        <Text style={styles.loadingText}>Loading email templates...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={handleRefresh}
          tintColor="#FD7332"
          colors={["#FD7332"]}
        />
      }
    >
      {/* Service Status Header */}
      <View style={styles.statusHeader}>
        <Text style={styles.sectionTitle}>📧 Email Service Status</Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: emailServiceHealth?.status === 'healthy' ? '#4CAF50' : '#FF6B6B' }
        ]}>
          <Text style={styles.statusText}>
            {emailServiceHealth?.status === 'healthy' ? '● Online' : '● Offline'}
          </Text>
        </View>
      </View>

      {/* Quick Stats */}
      <Text style={styles.sectionTitle}>Template Overview</Text>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{templates.length}</Text>
          <Text style={styles.statLabel}>Total Templates</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {dashboardStats?.totalEmailsSent || 0}
          </Text>
          <Text style={styles.statLabel}>Emails Sent</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {dashboardStats?.averageOpenRate ? `${Math.round(dashboardStats.averageOpenRate * 100)}%` : '0%'}
          </Text>
          <Text style={styles.statLabel}>Avg Open Rate</Text>
        </View>
      </View>

      {/* Templates List */}
      <Text style={styles.sectionTitle}>Available Templates</Text>
      {templates.map((template) => (
        <View key={template.id} style={styles.templateCard}>
          <View style={styles.templateHeader}>
            <Text style={styles.templateName}>{template.name}</Text>
            <View style={[
              styles.templateStatus,
              { backgroundColor: template.status === 'active' ? '#4CAF50' : '#FFC107' }
            ]}>
              <Text style={styles.templateStatusText}>{template.status}</Text>
            </View>
          </View>
          <Text style={styles.templateDescription}>{template.description}</Text>
          <View style={styles.templateStats}>
            <Text style={styles.templateStat}>
              📈 {template.analytics?.totalSent || 0} sent
            </Text>
            <Text style={styles.templateStat}>
              📊 {template.analytics?.openRate ? `${Math.round(template.analytics.openRate * 100)}%` : '0%'} open rate
            </Text>
          </View>

          {/* Test Button */}
          <TouchableOpacity
            style={styles.testButton}
            onPress={() => handleSendTest({
              recipientEmail: 'designs@skyfiresd.com',
              templateType: template.category === 'authentication' ? 'password_reset' : 'demo_confirmation',
              adminEmail: currentAdminEmail,
              testData: {
                name: 'Test User',
                date: new Date().toISOString().split('T')[0],
                time: '2:00 PM',
                company: 'Test Company'
              }
            })}
          >
            <Text style={styles.testButtonText}>Send Test Email</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* Email Health Info */}
      {emailServiceHealth && (
        <View style={styles.healthCard}>
          <Text style={styles.sectionTitle}>Service Health</Text>
          <Text style={styles.healthText}>
            Status: {emailServiceHealth.status === 'healthy' ? '✅ Healthy' : '❌ Issues Detected'}
          </Text>
          <Text style={styles.healthText}>
            Last Check: {new Date().toLocaleTimeString()}
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const makeStyles = ({
  moderateScale,
  verticalScale,
  font,
}: {
  moderateScale: (n: number) => number;
  verticalScale: (n: number) => number;
  font: (n: number) => number;
}) =>
  StyleSheet.create({
    scrollContainer: {
      flex: 1,
    },
    container: {
      paddingHorizontal: moderateScale(20),
      paddingBottom: verticalScale(20),
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: moderateScale(40),
    },
    loadingText: {
      fontSize: font(16),
      color: '#FFF',
      marginTop: verticalScale(10),
      opacity: 0.8,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: moderateScale(40),
    },
    errorTitle: {
      fontSize: font(20),
      fontWeight: 'bold',
      color: '#FF6B6B',
      marginBottom: verticalScale(10),
      textAlign: 'center',
    },
    errorMessage: {
      fontSize: font(16),
      color: '#FFF',
      textAlign: 'center',
      marginBottom: verticalScale(20),
      lineHeight: font(22),
      opacity: 0.8,
    },
    retryButton: {
      backgroundColor: '#FD7332',
      paddingHorizontal: moderateScale(20),
      paddingVertical: verticalScale(12),
      borderRadius: 8,
      alignItems: 'center',
    },
    retryButtonText: {
      fontSize: font(16),
      fontWeight: '600',
      color: '#FFFFFF',
    },
    sectionTitle: {
      fontSize: font(18),
      fontWeight: '600',
      color: '#FFF',
      marginBottom: verticalScale(15),
      marginTop: verticalScale(20),
    },
    statusHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: verticalScale(10),
    },
    statusBadge: {
      paddingHorizontal: moderateScale(12),
      paddingVertical: verticalScale(6),
      borderRadius: 15,
    },
    statusText: {
      fontSize: font(12),
      color: '#FFF',
      fontWeight: '600',
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: verticalScale(20),
    },
    statCard: {
      flex: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: moderateScale(8),
      padding: moderateScale(15),
      marginHorizontal: moderateScale(4),
      alignItems: 'center',
    },
    statValue: {
      fontSize: font(24),
      fontWeight: 'bold',
      color: '#FD7332',
      marginBottom: verticalScale(5),
    },
    statLabel: {
      fontSize: font(12),
      color: '#FFF',
      opacity: 0.8,
      textAlign: 'center',
    },
    templateCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: moderateScale(12),
      padding: moderateScale(16),
      marginBottom: verticalScale(12),
    },
    templateHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: verticalScale(8),
    },
    templateName: {
      fontSize: font(16),
      fontWeight: '600',
      color: '#FFF',
      flex: 1,
    },
    templateStatus: {
      paddingHorizontal: moderateScale(8),
      paddingVertical: verticalScale(4),
      borderRadius: 12,
    },
    templateStatusText: {
      fontSize: font(10),
      color: '#FFF',
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    templateDescription: {
      fontSize: font(14),
      color: '#FFF',
      opacity: 0.8,
      marginBottom: verticalScale(10),
      lineHeight: font(20),
    },
    templateStats: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: verticalScale(12),
    },
    templateStat: {
      fontSize: font(12),
      color: '#FFF',
      opacity: 0.7,
    },
    testButton: {
      backgroundColor: '#FD7332',
      paddingVertical: verticalScale(8),
      paddingHorizontal: moderateScale(16),
      borderRadius: 6,
      alignSelf: 'flex-start',
    },
    testButtonText: {
      fontSize: font(12),
      fontWeight: '600',
      color: '#FFF',
    },
    healthCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: moderateScale(12),
      padding: moderateScale(16),
      marginTop: verticalScale(10),
    },
    healthText: {
      fontSize: font(14),
      color: '#FFF',
      opacity: 0.8,
      marginBottom: verticalScale(5),
    },
  });

export default EmailTemplatesScreen;