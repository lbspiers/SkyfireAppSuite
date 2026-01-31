import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { adminAPI } from '../../services/adminAPI';
import { useResponsive } from '../../utils/responsive';
import ExceptionFormModal from './ExceptionFormModal';

interface DemoExceptionsProps {
  refreshing?: boolean;
}

export type ExceptionType = 'specific_date' | 'date_range' | 'recurring_weekly' | 'recurring_daily';

export interface DemoException {
  id: number;
  exception_type: ExceptionType;
  specific_date?: string;
  start_date?: string;
  end_date?: string;
  day_of_week?: number;
  start_time?: string;
  end_time?: string;
  reason: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExceptionStats {
  total: number;
  active: number;
  inactive: number;
  byType: {
    specific_date: number;
    date_range: number;
    recurring_weekly: number;
    recurring_daily: number;
  };
}

const DemoExceptions: React.FC<DemoExceptionsProps> = ({ refreshing }) => {
  const { moderateScale, verticalScale, font } = useResponsive();
  const styles = makeStyles({ moderateScale, verticalScale, font });

  const [exceptions, setExceptions] = useState<DemoException[]>([]);
  const [stats, setStats] = useState<ExceptionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<ExceptionType | 'all'>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingException, setEditingException] = useState<DemoException | null>(null);

  const fetchExceptions = async () => {
    try {
      setLoading(true);
      const [exceptionsResult, statsResult] = await Promise.all([
        adminAPI.getDemoExceptions(),
        adminAPI.getDemoExceptionStats(),
      ]);

      if (exceptionsResult.status === 'SUCCESS') {
        setExceptions(exceptionsResult.data || []);
      }

      if (statsResult.status === 'SUCCESS') {
        setStats(statsResult.data || null);
      }
    } catch (error: any) {
      console.error('Error fetching exceptions:', error);
      Alert.alert('Error', 'Failed to load demo exceptions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExceptions();
  }, []);

  useEffect(() => {
    if (refreshing) {
      fetchExceptions();
    }
  }, [refreshing]);

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    setProcessingIds(prev => new Set(prev).add(id));

    try {
      const result = await adminAPI.toggleDemoException(id);

      if (result.status === 'SUCCESS') {
        setExceptions(prev => prev.map(exc =>
          exc.id === id ? { ...exc, is_active: !currentStatus } : exc
        ));
        Alert.alert('Success', `Exception ${!currentStatus ? 'activated' : 'deactivated'}`);
      } else {
        Alert.alert('Error', result.message || 'Failed to toggle exception');
      }
    } catch (error: any) {
      console.error('Error toggling exception:', error);
      Alert.alert('Error', 'Failed to toggle exception. Please try again.');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleDelete = async (id: number, reason: string) => {
    Alert.alert(
      'Delete Exception',
      `Are you sure you want to delete this exception?\n\n"${reason}"`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setProcessingIds(prev => new Set(prev).add(id));

            try {
              const result = await adminAPI.deleteDemoException(id);

              if (result.status === 'SUCCESS') {
                setExceptions(prev => prev.filter(exc => exc.id !== id));
                Alert.alert('Success', 'Exception deleted successfully');
                fetchExceptions(); // Refresh stats
              } else {
                Alert.alert('Error', result.message || 'Failed to delete exception');
              }
            } catch (error: any) {
              console.error('Error deleting exception:', error);
              Alert.alert('Error', 'Failed to delete exception. Please try again.');
            } finally {
              setProcessingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(id);
                return newSet;
              });
            }
          },
        },
      ]
    );
  };

  const handleEdit = (exception: DemoException) => {
    setEditingException(exception);
    setModalVisible(true);
  };

  const handleCreateNew = () => {
    setEditingException(null);
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setEditingException(null);
  };

  const handleSaveSuccess = () => {
    handleModalClose();
    fetchExceptions();
  };

  const getTypeLabel = (type: ExceptionType): string => {
    switch (type) {
      case 'specific_date': return 'Single Date';
      case 'date_range': return 'Date Range';
      case 'recurring_weekly': return 'Weekly';
      case 'recurring_daily': return 'Daily';
      default: return type;
    }
  };

  const getTypeColor = (type: ExceptionType): string => {
    switch (type) {
      case 'specific_date': return '#FF9800';
      case 'date_range': return '#F44336';
      case 'recurring_weekly': return '#9C27B0';
      case 'recurring_daily': return '#3F51B5';
      default: return '#757575';
    }
  };

  const getDayName = (dayNum: number): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNum] || '';
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (timeStr: string): string => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getExceptionDetails = (exc: DemoException): string => {
    switch (exc.exception_type) {
      case 'specific_date':
        if (!exc.specific_date) return '';
        const dateStr = formatDate(exc.specific_date);
        // Show time range if available
        if (exc.start_time && exc.end_time) {
          return `${dateStr} • ${formatTime(exc.start_time)} - ${formatTime(exc.end_time)}`;
        }
        return `${dateStr} • All Day`;
      case 'date_range':
        return exc.start_date && exc.end_date
          ? `${formatDate(exc.start_date)} - ${formatDate(exc.end_date)}`
          : '';
      case 'recurring_weekly':
        const day = exc.day_of_week !== undefined ? getDayName(exc.day_of_week) : '';
        const time = exc.start_time && exc.end_time
          ? `${formatTime(exc.start_time)} - ${formatTime(exc.end_time)}`
          : 'All day';
        return `${day} • ${time}`;
      case 'recurring_daily':
        return exc.start_time && exc.end_time
          ? `Daily • ${formatTime(exc.start_time)} - ${formatTime(exc.end_time)}`
          : 'Daily';
      default:
        return '';
    }
  };

  const filteredExceptions = exceptions.filter(exc => {
    const matchesSearch = exc.reason.toLowerCase().includes(searchText.toLowerCase()) ||
                         getExceptionDetails(exc).toLowerCase().includes(searchText.toLowerCase());
    const matchesType = typeFilter === 'all' || exc.exception_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const TypeFilterButton = ({ type, label }: { type: ExceptionType | 'all'; label: string }) => {
    const count = type === 'all'
      ? stats?.total || 0
      : stats?.byType[type as ExceptionType] || 0;

    return (
      <TouchableOpacity
        style={[styles.filterButton, typeFilter === type && styles.filterButtonActive]}
        onPress={() => setTypeFilter(type)}
      >
        <Text style={[styles.filterButtonText, typeFilter === type && styles.filterButtonTextActive]}>
          {label}
        </Text>
        <View style={[styles.filterBadge, typeFilter === type && styles.filterBadgeActive]}>
          <Text style={[styles.filterBadgeText, typeFilter === type && styles.filterBadgeTextActive]}>
            {count}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const ExceptionCard = ({ exception }: { exception: DemoException }) => {
    const isProcessing = processingIds.has(exception.id);

    return (
      <View style={styles.exceptionCard}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
          style={styles.cardGradient}
        >
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={styles.typeContainer}>
              <View style={[styles.typeBadge, { backgroundColor: getTypeColor(exception.exception_type) }]}>
                <Text style={styles.typeText}>{getTypeLabel(exception.exception_type)}</Text>
              </View>
              <View style={[styles.statusIndicator, exception.is_active && styles.statusActive]} />
            </View>
            <Text style={[styles.statusText, { color: exception.is_active ? '#4CAF50' : '#757575' }]}>
              {exception.is_active ? 'Active' : 'Inactive'}
            </Text>
          </View>

          {/* Details */}
          <Text style={styles.detailsText}>{getExceptionDetails(exception)}</Text>
          <Text style={styles.reasonText}>{exception.reason}</Text>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, isProcessing && styles.buttonDisabled]}
              onPress={() => handleToggleActive(exception.id, exception.is_active)}
              disabled={isProcessing}
            >
              <LinearGradient
                colors={exception.is_active ? ['#757575', '#616161'] : ['#4CAF50', '#45A049']}
                style={styles.actionButtonGradient}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.actionButtonText}>
                    {exception.is_active ? '⏸ Pause' : '▶ Activate'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, isProcessing && styles.buttonDisabled]}
              onPress={() => handleEdit(exception)}
              disabled={isProcessing}
            >
              <LinearGradient
                colors={['#2196F3', '#1976D2']}
                style={styles.actionButtonGradient}
              >
                <Text style={styles.actionButtonText}>✏️ Edit</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, isProcessing && styles.buttonDisabled]}
              onPress={() => handleDelete(exception.id, exception.reason)}
              disabled={isProcessing}
            >
              <LinearGradient
                colors={['#FF6B6B', '#E53E3E']}
                style={styles.actionButtonGradient}
              >
                <Text style={styles.actionButtonText}>🗑️ Delete</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FD7332" />
        <Text style={styles.loadingText}>Loading demo exceptions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Stats Overview */}
      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#4CAF50' }]}>{stats.active}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#757575' }]}>{stats.inactive}</Text>
            <Text style={styles.statLabel}>Inactive</Text>
          </View>
        </View>
      )}

      {/* Type Filters */}
      <View style={styles.filtersContainer}>
        <TypeFilterButton type="all" label="All" />
        <TypeFilterButton type="specific_date" label="Date" />
        <TypeFilterButton type="date_range" label="Range" />
        <TypeFilterButton type="recurring_weekly" label="Weekly" />
        <TypeFilterButton type="recurring_daily" label="Daily" />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search exceptions..."
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Create Button */}
      <TouchableOpacity
        style={styles.createButton}
        onPress={handleCreateNew}
      >
        <LinearGradient
          colors={['#FD7332', '#EF3826']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.createButtonGradient}
        >
          <Text style={styles.createButtonText}>+ Block Time Slots</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Exception Count */}
      <Text style={styles.exceptionCount}>
        {filteredExceptions.length} exception{filteredExceptions.length !== 1 ? 's' : ''}
        {searchText || typeFilter !== 'all' ? ' (filtered)' : ''}
      </Text>

      {/* Exceptions List */}
      {filteredExceptions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchText || typeFilter !== 'all'
              ? 'No exceptions match your filters'
              : 'No demo exceptions created yet'}
          </Text>
          <Text style={styles.emptySubtext}>
            Block specific dates or times from being booked
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredExceptions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <ExceptionCard exception={item} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={fetchExceptions}
        />
      )}

      {/* Form Modal */}
      <ExceptionFormModal
        visible={modalVisible}
        exception={editingException}
        onClose={handleModalClose}
        onSaveSuccess={handleSaveSuccess}
      />
    </View>
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
    container: {
      flex: 1,
      paddingHorizontal: moderateScale(20),
    },
    statsContainer: {
      flexDirection: 'row',
      gap: moderateScale(10),
      marginBottom: verticalScale(15),
    },
    statCard: {
      flex: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: moderateScale(8),
      padding: moderateScale(12),
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(253, 115, 50, 0.2)',
    },
    statValue: {
      fontSize: font(20),
      fontWeight: '700',
      color: '#FD7332',
      marginBottom: verticalScale(2),
    },
    statLabel: {
      fontSize: font(12),
      color: '#FFF',
      opacity: 0.7,
    },
    filtersContainer: {
      flexDirection: 'row',
      gap: moderateScale(6),
      marginBottom: verticalScale(15),
    },
    filterButton: {
      flex: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: moderateScale(8),
      paddingVertical: verticalScale(8),
      paddingHorizontal: moderateScale(8),
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      alignItems: 'center',
    },
    filterButtonActive: {
      backgroundColor: 'rgba(253, 115, 50, 0.2)',
      borderColor: '#FD7332',
    },
    filterButtonText: {
      fontSize: font(11),
      color: '#FFF',
      opacity: 0.7,
      fontWeight: '500',
      marginBottom: verticalScale(2),
    },
    filterButtonTextActive: {
      opacity: 1,
      fontWeight: '700',
    },
    filterBadge: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: moderateScale(10),
      paddingHorizontal: moderateScale(6),
      paddingVertical: verticalScale(2),
      minWidth: moderateScale(20),
    },
    filterBadgeActive: {
      backgroundColor: '#FD7332',
    },
    filterBadgeText: {
      fontSize: font(10),
      color: '#FFF',
      fontWeight: '600',
      textAlign: 'center',
    },
    filterBadgeTextActive: {
      color: '#FFF',
    },
    searchContainer: {
      marginBottom: verticalScale(15),
    },
    searchInput: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: moderateScale(8),
      paddingHorizontal: moderateScale(15),
      paddingVertical: verticalScale(10),
      fontSize: font(14),
      color: '#FFF',
      borderWidth: 1,
      borderColor: 'rgba(253, 115, 50, 0.3)',
    },
    createButton: {
      marginBottom: verticalScale(15),
    },
    createButtonGradient: {
      paddingVertical: verticalScale(12),
      borderRadius: moderateScale(8),
      alignItems: 'center',
    },
    createButtonText: {
      fontSize: font(14),
      fontWeight: '700',
      color: '#FFF',
    },
    exceptionCount: {
      fontSize: font(14),
      color: '#FFF',
      opacity: 0.8,
      marginBottom: verticalScale(15),
      textAlign: 'center',
    },
    listContainer: {
      paddingBottom: verticalScale(20),
    },
    exceptionCard: {
      marginBottom: verticalScale(12),
    },
    cardGradient: {
      borderRadius: moderateScale(12),
      padding: moderateScale(16),
      borderWidth: 1,
      borderColor: 'rgba(253, 115, 50, 0.2)',
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: verticalScale(10),
    },
    typeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: moderateScale(8),
    },
    typeBadge: {
      paddingHorizontal: moderateScale(8),
      paddingVertical: verticalScale(4),
      borderRadius: moderateScale(12),
    },
    typeText: {
      fontSize: font(11),
      fontWeight: '700',
      color: '#FFF',
    },
    statusIndicator: {
      width: moderateScale(8),
      height: moderateScale(8),
      borderRadius: moderateScale(4),
      backgroundColor: '#757575',
    },
    statusActive: {
      backgroundColor: '#4CAF50',
    },
    statusText: {
      fontSize: font(12),
      fontWeight: '600',
    },
    detailsText: {
      fontSize: font(14),
      color: '#FD7332',
      fontWeight: '600',
      marginBottom: verticalScale(6),
    },
    reasonText: {
      fontSize: font(13),
      color: '#FFF',
      opacity: 0.9,
      marginBottom: verticalScale(12),
    },
    actionButtons: {
      flexDirection: 'row',
      gap: moderateScale(6),
    },
    actionButton: {
      flex: 1,
    },
    actionButtonGradient: {
      paddingVertical: verticalScale(8),
      borderRadius: moderateScale(6),
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: verticalScale(32),
    },
    actionButtonText: {
      fontSize: font(11),
      fontWeight: '600',
      color: '#FFF',
    },
    buttonDisabled: {
      opacity: 0.6,
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
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: verticalScale(40),
    },
    emptyText: {
      fontSize: font(16),
      color: '#FFF',
      opacity: 0.8,
      textAlign: 'center',
      marginBottom: verticalScale(8),
    },
    emptySubtext: {
      fontSize: font(14),
      color: '#FD7332',
      textAlign: 'center',
    },
  });

export default DemoExceptions;
