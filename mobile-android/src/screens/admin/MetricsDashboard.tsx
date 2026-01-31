import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { adminAPI } from '../../services/adminAPI';
import { useResponsive } from '../../utils/responsive';

interface MetricsDashboardProps {
  refreshing?: boolean;
}

interface Metrics {
  userStats: {
    totalActive: number;
    pendingApproval: number;
    newRegistrationsToday: number;
    newRegistrationsWeek: number;
    newRegistrationsMonth: number;
  };
  projectStats: {
    totalProjects: number;
    avgProjectsPerDay: number;
    recentActivity: number;
  };
  pipelineMetrics: {
    avgTimeToApproval: string;
    avgTimeInPipeline: string;
    conversionRate: string;
  };
}

const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ refreshing }) => {
  const { moderateScale, verticalScale, font } = useResponsive();
  const styles = makeStyles({ moderateScale, verticalScale, font });

  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      console.log('📊 [METRICS] Fetching metrics data...');
      const result = await adminAPI.getMetrics();
      
      console.log('📊 [METRICS] API Response:', result);
      console.log('📊 [METRICS] Response data structure:', JSON.stringify(result.data, null, 2));
      
      if (result.status === 'SUCCESS') {
        console.log('📊 [METRICS] Setting metrics data:', result.data);
        
        // Transform backend response to match frontend expectations
        const transformedData: Metrics = {
          userStats: {
            totalActive: parseInt(result.data.users?.totalActive || '0'),
            pendingApproval: parseInt(result.data.users?.totalPending || '0'),
            newRegistrationsToday: 0, // Not provided by backend yet
            newRegistrationsWeek: 0,  // Not provided by backend yet
            newRegistrationsMonth: 0, // Not provided by backend yet
          },
          projectStats: {
            totalProjects: parseInt(result.data.projects?.totalProjects || '0'),
            avgProjectsPerDay: 0, // Calculate or get from backend
            recentActivity: 0,    // Not provided by backend yet
          },
          pipelineMetrics: {
            avgTimeToApproval: 'N/A', // Not provided by backend yet
            avgTimeInPipeline: 'N/A', // Not provided by backend yet
            conversionRate: 'N/A',    // Not provided by backend yet
          }
        };
        
        console.log('📊 [METRICS] Transformed data:', transformedData);
        setMetrics(transformedData);
        setLastUpdated(new Date());
      } else {
        console.error('📊 [METRICS] API returned error:', result.message);
        Alert.alert('Error', result.message || 'Failed to load metrics');
      }
    } catch (error: any) {
      console.error('📊 [METRICS] Error fetching metrics:', error);
      Alert.alert('Error', 'Failed to load metrics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  useEffect(() => {
    if (refreshing) {
      fetchMetrics();
    }
  }, [refreshing]);

  const MetricCard = ({ 
    title, 
    value, 
    subtitle, 
    icon, 
    trend, 
    color = '#FD7332' 
  }: { 
    title: string; 
    value: string | number; 
    subtitle?: string; 
    icon: string; 
    trend?: { direction: 'up' | 'down'; value: string }; 
    color?: string;
  }) => (
    <View style={styles.metricCard}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
        style={styles.cardGradient}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>{icon}</Text>
          <Text style={styles.cardTitle}>{title}</Text>
        </View>
        
        <Text style={[styles.cardValue, { color }]}>{value}</Text>
        
        {subtitle && (
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
        )}
        
        {trend && (
          <View style={styles.trendContainer}>
            <Text style={[
              styles.trendText,
              { color: trend.direction === 'up' ? '#4CAF50' : '#FF6B6B' }
            ]}>
              {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
            </Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FD7332" />
        <Text style={styles.loadingText}>Loading metrics...</Text>
      </View>
    );
  }

  if (!metrics || !metrics.userStats) {
    console.log('📊 [METRICS] Missing metrics or userStats:', { 
      hasMetrics: !!metrics, 
      hasUserStats: !!metrics?.userStats,
      metricsKeys: metrics ? Object.keys(metrics) : 'none'
    });
    
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Unable to load metrics</Text>
        <Text style={styles.errorText}>Data structure issue detected</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchMetrics}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
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
          refreshing={loading}
          onRefresh={fetchMetrics}
          tintColor="#FD7332"
          colors={["#FD7332"]}
        />
      }
    >
      {lastUpdated && (
        <Text style={styles.lastUpdated}>
          Last updated: {lastUpdated.toLocaleTimeString()}
        </Text>
      )}

      {/* User Stats Section */}
      <Text style={styles.sectionTitle}>User Statistics</Text>
      <View style={styles.metricsRow}>
        <MetricCard
          title="Active Users"
          value={metrics.userStats?.totalActive || 0}
          icon="👥"
          color="#4CAF50"
        />
        <MetricCard
          title="Pending Approval"
          value={metrics.userStats?.pendingApproval || 0}
          icon="⏳"
          color="#FFC107"
        />
      </View>

      <View style={styles.metricsRow}>
        <MetricCard
          title="New Today"
          value={metrics.userStats?.newRegistrationsToday || 0}
          subtitle="Registrations"
          icon="📈"
        />
        <MetricCard
          title="This Week"
          value={metrics.userStats?.newRegistrationsWeek || 0}
          subtitle="Registrations"
          icon="📊"
        />
      </View>

      {/* Project Stats Section */}
      <Text style={styles.sectionTitle}>Project Statistics</Text>
      <View style={styles.metricsRow}>
        <MetricCard
          title="Total Projects"
          value={metrics.projectStats?.totalProjects || 0}
          icon="🏗️"
          color="#2196F3"
        />
        <MetricCard
          title="Avg Per Day"
          value={(metrics.projectStats?.avgProjectsPerDay || 0).toFixed(1)}
          subtitle="Projects"
          icon="📅"
          color="#2196F3"
        />
      </View>

      {/* Pipeline Metrics Section */}
      <Text style={styles.sectionTitle}>Pipeline Metrics</Text>
      <View style={styles.metricsRow}>
        <MetricCard
          title="Approval Time"
          value={metrics.pipelineMetrics?.avgTimeToApproval || 'N/A'}
          subtitle="Average"
          icon="⚡"
          color="#9C27B0"
        />
        <MetricCard
          title="Conversion Rate"
          value={metrics.pipelineMetrics?.conversionRate || 'N/A'}
          icon="🎯"
          color="#9C27B0"
        />
      </View>

      {/* Refresh Button */}
      <TouchableOpacity style={styles.refreshButton} onPress={fetchMetrics}>
        <LinearGradient
          colors={["#FD7332", "#EF3826"]}
          style={styles.refreshButtonGradient}
        >
          <Text style={styles.refreshButtonText}>🔄 Refresh Metrics</Text>
        </LinearGradient>
      </TouchableOpacity>
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
    lastUpdated: {
      fontSize: font(12),
      color: '#FFF',
      opacity: 0.6,
      textAlign: 'center',
      marginBottom: verticalScale(20),
    },
    sectionTitle: {
      fontSize: font(18),
      fontWeight: '600',
      color: '#FFF',
      marginBottom: verticalScale(12),
      marginTop: verticalScale(10),
    },
    metricsRow: {
      flexDirection: 'row',
      marginBottom: verticalScale(10),
      gap: moderateScale(10),
    },
    metricCard: {
      flex: 1,
    },
    cardGradient: {
      borderRadius: moderateScale(12),
      padding: moderateScale(16),
      borderWidth: 1,
      borderColor: 'rgba(253, 115, 50, 0.2)',
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: verticalScale(8),
    },
    cardIcon: {
      fontSize: font(16),
      marginRight: moderateScale(6),
    },
    cardTitle: {
      fontSize: font(12),
      color: '#FFF',
      opacity: 0.8,
      flex: 1,
    },
    cardValue: {
      fontSize: font(24),
      fontWeight: '700',
      marginBottom: verticalScale(4),
    },
    cardSubtitle: {
      fontSize: font(10),
      color: '#FFF',
      opacity: 0.6,
    },
    trendContainer: {
      marginTop: verticalScale(4),
    },
    trendText: {
      fontSize: font(10),
      fontWeight: '600',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: verticalScale(40),
    },
    loadingText: {
      fontSize: font(16),
      color: '#FFF',
      opacity: 0.7,
      marginTop: verticalScale(10),
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: verticalScale(40),
    },
    errorText: {
      fontSize: font(16),
      color: '#FF6B6B',
      marginBottom: verticalScale(20),
    },
    retryButton: {
      paddingVertical: verticalScale(8),
      paddingHorizontal: moderateScale(16),
      borderRadius: moderateScale(6),
      borderWidth: 1,
      borderColor: '#FD7332',
    },
    retryText: {
      fontSize: font(14),
      color: '#FD7332',
    },
    refreshButton: {
      marginTop: verticalScale(20),
      alignSelf: 'center',
    },
    refreshButtonGradient: {
      paddingVertical: verticalScale(10),
      paddingHorizontal: moderateScale(20),
      borderRadius: moderateScale(20),
    },
    refreshButtonText: {
      fontSize: font(14),
      fontWeight: '600',
      color: '#FFF',
    },
  });

export default MetricsDashboard;