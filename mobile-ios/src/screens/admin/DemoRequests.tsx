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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { adminAPI } from '../../services/adminAPI';
import { useResponsive } from '../../utils/responsive';

interface DemoRequestsProps {
  refreshing?: boolean;
}

type ViewMode = 'list' | 'calendar';

interface DemoRequest {
  id: string;
  confirmationNumber: string;
  customerName: string;
  companyName: string;
  email: string;
  phone: string;
  demoDate: string;
  demoTime: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  assignedTo?: string;
}

const DemoRequests: React.FC<DemoRequestsProps> = ({ refreshing }) => {
  const { moderateScale, verticalScale, font } = useResponsive();
  const styles = makeStyles({ moderateScale, verticalScale, font });

  const [demos, setDemos] = useState<DemoRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchText, setSearchText] = useState('');
  const [processingDemos, setProcessingDemos] = useState<Set<string>>(new Set());

  const fetchDemoRequests = async () => {
    try {
      setLoading(true);
      const result = await adminAPI.getDemoRequests();
      
      if (result.status === 'SUCCESS') {
        setDemos(result.data || []);
      } else {
        Alert.alert('Error', result.message || 'Failed to load demo requests');
      }
    } catch (error: any) {
      console.error('Error fetching demo requests:', error);
      Alert.alert('Error', 'Failed to load demo requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemoRequests();
  }, []);

  useEffect(() => {
    if (refreshing) {
      fetchDemoRequests();
    }
  }, [refreshing]);

  const updateDemoStatus = async (
    demoId: string, 
    newStatus: DemoRequest['status'],
    customerName: string
  ) => {
    setProcessingDemos(prev => new Set(prev).add(demoId));
    
    try {
      const result = await adminAPI.updateDemoStatus(demoId, newStatus);
      
      if (result.status === 'SUCCESS') {
        setDemos(prev => prev.map(demo => 
          demo.id === demoId ? { ...demo, status: newStatus } : demo
        ));
        
        const statusText = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
        Alert.alert('Success', `${customerName}'s demo marked as ${statusText}`);
      } else {
        Alert.alert('Error', result.message || 'Failed to update demo status');
      }
    } catch (error: any) {
      console.error('Error updating demo status:', error);
      Alert.alert('Error', 'Failed to update demo status. Please try again.');
    } finally {
      setProcessingDemos(prev => {
        const newSet = new Set(prev);
        newSet.delete(demoId);
        return newSet;
      });
    }
  };

  const getStatusColor = (status: DemoRequest['status']) => {
    switch (status) {
      case 'scheduled': return '#FFC107';
      case 'completed': return '#4CAF50';
      case 'cancelled': return '#FF6B6B';
      case 'no_show': return '#9E9E9E';
      default: return '#FFC107';
    }
  };

  const getStatusIcon = (status: DemoRequest['status']) => {
    switch (status) {
      case 'scheduled': return '📅';
      case 'completed': return '✅';
      case 'cancelled': return '❌';
      case 'no_show': return '👻';
      default: return '📅';
    }
  };

  const filteredDemos = demos.filter(demo =>
    demo.customerName.toLowerCase().includes(searchText.toLowerCase()) ||
    demo.companyName.toLowerCase().includes(searchText.toLowerCase()) ||
    demo.email.toLowerCase().includes(searchText.toLowerCase()) ||
    demo.confirmationNumber.toLowerCase().includes(searchText.toLowerCase())
  );

  const DemoCard = ({ demo }: { demo: DemoRequest }) => {
    const isProcessing = processingDemos.has(demo.id);
    const demoDateTime = new Date(`${demo.demoDate}T${demo.demoTime}`);
    
    return (
      <View style={styles.demoCard}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
          style={styles.cardGradient}
        >
          {/* Demo Header */}
          <View style={styles.demoHeader}>
            <View style={styles.statusBadge}>
              <Text style={[styles.statusText, { color: getStatusColor(demo.status) }]}>
                {getStatusIcon(demo.status)} {demo.status.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.confirmationNumber}>#{demo.confirmationNumber}</Text>
          </View>

          {/* Customer Info */}
          <View style={styles.demoInfo}>
            <Text style={styles.customerName}>{demo.customerName}</Text>
            <Text style={styles.companyName}>{demo.companyName}</Text>
            <Text style={styles.contactInfo}>📧 {demo.email}</Text>
            {demo.phone && (
              <Text style={styles.contactInfo}>📞 {demo.phone}</Text>
            )}
          </View>

          {/* Date/Time Info */}
          <View style={styles.dateTimeContainer}>
            <Text style={styles.dateTime}>
              📅 {demoDateTime.toLocaleDateString()} at {demoDateTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </Text>
            {demo.assignedTo && (
              <Text style={styles.assignedTo}>👤 {demo.assignedTo}</Text>
            )}
          </View>

          {/* Notes */}
          {demo.notes && (
            <Text style={styles.notes}>📝 {demo.notes}</Text>
          )}

          {/* Action Buttons */}
          {demo.status === 'scheduled' && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, isProcessing && styles.buttonDisabled]}
                onPress={() => updateDemoStatus(demo.id, 'completed', demo.customerName)}
                disabled={isProcessing}
              >
                <LinearGradient
                  colors={['#4CAF50', '#45A049']}
                  style={styles.actionButtonGradient}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.actionButtonText}>✓ Complete</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, isProcessing && styles.buttonDisabled]}
                onPress={() => updateDemoStatus(demo.id, 'no_show', demo.customerName)}
                disabled={isProcessing}
              >
                <LinearGradient
                  colors={['#9E9E9E', '#757575']}
                  style={styles.actionButtonGradient}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.actionButtonText}>👻 No Show</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, isProcessing && styles.buttonDisabled]}
                onPress={() => updateDemoStatus(demo.id, 'cancelled', demo.customerName)}
                disabled={isProcessing}
              >
                <LinearGradient
                  colors={['#FF6B6B', '#E53E3E']}
                  style={styles.actionButtonGradient}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.actionButtonText}>❌ Cancel</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </LinearGradient>
      </View>
    );
  };

  const ViewModeToggle = () => (
    <View style={styles.viewToggle}>
      <TouchableOpacity
        style={[styles.toggleButton, viewMode === 'list' && styles.activeToggle]}
        onPress={() => setViewMode('list')}
      >
        <Text style={[styles.toggleText, viewMode === 'list' && styles.activeToggleText]}>
          📋 List
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.toggleButton, viewMode === 'calendar' && styles.activeToggle]}
        onPress={() => setViewMode('calendar')}
      >
        <Text style={[styles.toggleText, viewMode === 'calendar' && styles.activeToggleText]}>
          📅 Calendar
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FD7332" />
        <Text style={styles.loadingText}>Loading demo requests...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* View Mode Toggle */}
      <ViewModeToggle />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search demos..."
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Demo Count */}
      <Text style={styles.demoCount}>
        {filteredDemos.length} demo request{filteredDemos.length !== 1 ? 's' : ''}
        {searchText ? ` (filtered)` : ''}
      </Text>

      {viewMode === 'calendar' ? (
        <View style={styles.calendarPlaceholder}>
          <Text style={styles.calendarText}>📅 Calendar View</Text>
          <Text style={styles.calendarSubtext}>
            Calendar implementation coming soon
          </Text>
        </View>
      ) : filteredDemos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchText ? 'No demos match your search' : 'No demo requests'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredDemos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <DemoCard demo={item} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={fetchDemoRequests}
        />
      )}
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
    viewToggle: {
      flexDirection: 'row',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: moderateScale(8),
      padding: moderateScale(4),
      marginBottom: verticalScale(15),
    },
    toggleButton: {
      flex: 1,
      paddingVertical: verticalScale(8),
      borderRadius: moderateScale(6),
      alignItems: 'center',
    },
    activeToggle: {
      backgroundColor: 'rgba(253, 115, 50, 0.8)',
    },
    toggleText: {
      fontSize: font(14),
      color: '#FFF',
      opacity: 0.7,
    },
    activeToggleText: {
      opacity: 1,
      fontWeight: '600',
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
    demoCount: {
      fontSize: font(14),
      color: '#FFF',
      opacity: 0.8,
      marginBottom: verticalScale(15),
      textAlign: 'center',
    },
    listContainer: {
      paddingBottom: verticalScale(20),
    },
    demoCard: {
      marginBottom: verticalScale(12),
    },
    cardGradient: {
      borderRadius: moderateScale(12),
      padding: moderateScale(16),
      borderWidth: 1,
      borderColor: 'rgba(253, 115, 50, 0.2)',
    },
    demoHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: verticalScale(10),
    },
    statusBadge: {
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      paddingHorizontal: moderateScale(8),
      paddingVertical: verticalScale(4),
      borderRadius: moderateScale(12),
    },
    statusText: {
      fontSize: font(12),
      fontWeight: '600',
    },
    confirmationNumber: {
      fontSize: font(12),
      color: '#FD7332',
      fontWeight: '600',
    },
    demoInfo: {
      marginBottom: verticalScale(10),
    },
    customerName: {
      fontSize: font(16),
      fontWeight: '600',
      color: '#FFF',
      marginBottom: verticalScale(4),
    },
    companyName: {
      fontSize: font(14),
      color: '#FFF',
      opacity: 0.8,
      marginBottom: verticalScale(4),
    },
    contactInfo: {
      fontSize: font(12),
      color: '#FFF',
      opacity: 0.7,
      marginBottom: verticalScale(2),
    },
    dateTimeContainer: {
      marginBottom: verticalScale(10),
    },
    dateTime: {
      fontSize: font(14),
      color: '#FD7332',
      fontWeight: '500',
      marginBottom: verticalScale(4),
    },
    assignedTo: {
      fontSize: font(12),
      color: '#4CAF50',
    },
    notes: {
      fontSize: font(12),
      color: '#FFF',
      opacity: 0.8,
      fontStyle: 'italic',
      marginBottom: verticalScale(10),
    },
    actionButtons: {
      flexDirection: 'row',
      gap: moderateScale(6),
    },
    actionButton: {
      flex: 1,
    },
    actionButtonGradient: {
      paddingVertical: verticalScale(6),
      borderRadius: moderateScale(6),
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: verticalScale(28),
    },
    actionButtonText: {
      fontSize: font(12),
      fontWeight: '600',
      color: '#FFF',
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    calendarPlaceholder: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    calendarText: {
      fontSize: font(18),
      color: '#FFF',
      opacity: 0.8,
      marginBottom: verticalScale(10),
    },
    calendarSubtext: {
      fontSize: font(14),
      color: '#FD7332',
      textAlign: 'center',
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
    },
  });

export default DemoRequests;