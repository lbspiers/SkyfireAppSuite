import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Dropdown } from 'react-native-element-dropdown';
import Toast from 'react-native-toast-message';

// Utils and Constants
import COLORS from '../../utils/styleConstant/Color';
import fontFamily from '../../utils/styleConstant/FontFamily';
import { useResponsive } from '../../utils/responsive';

// This would be the admin version of the support ticket API
// For now, we'll simulate it since we haven't implemented the admin endpoints yet
interface AdminSupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  user: {
    name: string;
    email: string;
  };
  company: {
    name: string;
  };
  assignedTo?: {
    name: string;
    email: string;
  };
}

interface SupportTicketsAdminProps {
  refreshing?: boolean;
}

const SupportTicketsAdmin: React.FC<SupportTicketsAdminProps> = ({ refreshing = false }) => {
  const { moderateScale, verticalScale, font } = useResponsive();
  const styles = makeStyles({ moderateScale, verticalScale, font });

  // State
  const [tickets, setTickets] = useState<AdminSupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<AdminSupportTicket | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
  });

  // Filter options
  const statusOptions = [
    { label: 'All Status', value: '' },
    { label: 'Open', value: 'open' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Waiting Response', value: 'waiting_response' },
    { label: 'Resolved', value: 'resolved' },
    { label: 'Closed', value: 'closed' },
  ];

  const priorityOptions = [
    { label: 'All Priorities', value: '' },
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' },
    { label: 'Urgent', value: 'urgent' },
  ];

  // Sample data - replace with actual API call
  const sampleTickets: AdminSupportTicket[] = [
    {
      id: '1',
      ticketNumber: 'SKY-20241201-0001',
      subject: 'App crashes on project load',
      category: 'bug',
      priority: 'high',
      status: 'open',
      createdAt: '2024-12-01T10:30:00Z',
      updatedAt: '2024-12-01T10:30:00Z',
      user: {
        name: 'John Doe',
        email: 'john.doe@company.com',
      },
      company: {
        name: 'ABC Solar Company',
      },
    },
    {
      id: '2',
      ticketNumber: 'SKY-20241201-0002',
      subject: 'Feature request: Dark mode',
      category: 'feature_request',
      priority: 'medium',
      status: 'in_progress',
      createdAt: '2024-12-01T09:15:00Z',
      updatedAt: '2024-12-01T14:20:00Z',
      user: {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
      },
      company: {
        name: 'XYZ Solar Inc',
      },
      assignedTo: {
        name: 'Support Team',
        email: 'support@skyfiresd.com',
      },
    },
  ];

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    if (refreshing) {
      loadTickets();
    }
  }, [refreshing]);

  const loadTickets = async () => {
    try {
      setIsLoading(true);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // In real implementation, this would be:
      // const response = await adminSupportTicketAPI.getAllTickets(filters);

      setTickets(sampleTickets);

      // Calculate stats
      const stats = {
        total: sampleTickets.length,
        open: sampleTickets.filter(t => t.status === 'open').length,
        inProgress: sampleTickets.filter(t => t.status === 'in_progress').length,
        resolved: sampleTickets.filter(t => t.status === 'resolved').length,
        closed: sampleTickets.filter(t => t.status === 'closed').length,
      };
      setStats(stats);

    } catch (error) {
      console.error('Error loading tickets:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load support tickets',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return '#17A2B8';
      case 'in_progress': return '#FFC107';
      case 'waiting_response': return '#FD7332';
      case 'resolved': return '#28A745';
      case 'closed': return '#6C757D';
      default: return '#17A2B8';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent': return '#DC3545';
      case 'high': return '#FD7332';
      case 'medium': return '#FFC107';
      case 'low': return '#28A745';
      default: return '#FFC107';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleTicketPress = (ticket: AdminSupportTicket) => {
    setSelectedTicket(ticket);
    setModalVisible(true);
  };

  const handleStatusUpdate = (ticketId: string, newStatus: string) => {
    Alert.alert(
      'Update Status',
      `Update ticket status to "${newStatus}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: () => {
            // In real implementation:
            // adminSupportTicketAPI.updateTicket(ticketId, { status: newStatus });

            setTickets(prev =>
              prev.map(ticket =>
                ticket.id === ticketId
                  ? { ...ticket, status: newStatus, updatedAt: new Date().toISOString() }
                  : ticket
              )
            );

            Toast.show({
              type: 'success',
              text1: 'Status Updated',
              text2: `Ticket status updated to ${newStatus}`,
            });
          },
        },
      ]
    );
  };

  const filteredTickets = tickets.filter(ticket => {
    const statusMatch = !filterStatus || ticket.status === filterStatus;
    const priorityMatch = !filterPriority || ticket.priority === filterPriority;
    return statusMatch && priorityMatch;
  });

  const renderStatsCard = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Support Tickets Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#17A2B8' }]}>{stats.open}</Text>
            <Text style={styles.statLabel}>Open</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#FFC107' }]}>{stats.inProgress}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#28A745' }]}>{stats.resolved}</Text>
            <Text style={styles.statLabel}>Resolved</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <View style={styles.filterRow}>
        <View style={styles.filterItem}>
          <Text style={styles.filterLabel}>Status</Text>
          <Dropdown
            style={styles.filterDropdown}
            data={statusOptions}
            labelField="label"
            valueField="value"
            placeholder="All Status"
            value={filterStatus}
            onChange={(item) => setFilterStatus(item.value)}
            selectedTextStyle={styles.dropdownText}
            placeholderStyle={styles.dropdownPlaceholder}
            itemTextStyle={styles.dropdownText}
          />
        </View>
        <View style={styles.filterItem}>
          <Text style={styles.filterLabel}>Priority</Text>
          <Dropdown
            style={styles.filterDropdown}
            data={priorityOptions}
            labelField="label"
            valueField="value"
            placeholder="All Priorities"
            value={filterPriority}
            onChange={(item) => setFilterPriority(item.value)}
            selectedTextStyle={styles.dropdownText}
            placeholderStyle={styles.dropdownPlaceholder}
            itemTextStyle={styles.dropdownText}
          />
        </View>
      </View>
    </View>
  );

  const renderTicketItem = ({ item }: { item: AdminSupportTicket }) => (
    <TouchableOpacity
      style={styles.ticketCard}
      onPress={() => handleTicketPress(item)}
    >
      <View style={styles.ticketHeader}>
        <Text style={styles.ticketNumber}>{item.ticketNumber}</Text>
        <View style={styles.ticketBadges}>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
            <Text style={styles.badgeText}>{item.priority.toUpperCase()}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.badgeText}>{item.status.replace('_', ' ').toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.ticketSubject} numberOfLines={2}>
        {item.subject}
      </Text>

      <View style={styles.ticketMeta}>
        <Text style={styles.ticketUser}>👤 {item.user.name}</Text>
        <Text style={styles.ticketCompany}>🏢 {item.company.name}</Text>
      </View>

      <View style={styles.ticketFooter}>
        <Text style={styles.ticketDate}>Created: {formatDate(item.createdAt)}</Text>
        {item.assignedTo && (
          <Text style={styles.assignedTo}>Assigned: {item.assignedTo.name}</Text>
        )}
      </View>

      {/* Quick Status Actions */}
      <View style={styles.quickActions}>
        {item.status === 'open' && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#FFC107' }]}
            onPress={() => handleStatusUpdate(item.id, 'in_progress')}
          >
            <Text style={styles.actionButtonText}>Start Work</Text>
          </TouchableOpacity>
        )}
        {item.status === 'in_progress' && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#28A745' }]}
            onPress={() => handleStatusUpdate(item.id, 'resolved')}
          >
            <Text style={styles.actionButtonText}>Resolve</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderTicketModal = () => (
    <Modal
      visible={modalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {selectedTicket?.ticketNumber}
          </Text>
          <TouchableOpacity onPress={() => setModalVisible(false)}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {selectedTicket && (
            <>
              <Text style={styles.modalSubject}>{selectedTicket.subject}</Text>

              <View style={styles.modalSection}>
                <Text style={styles.sectionTitle}>Customer Information</Text>
                <Text style={styles.sectionText}>Name: {selectedTicket.user.name}</Text>
                <Text style={styles.sectionText}>Email: {selectedTicket.user.email}</Text>
                <Text style={styles.sectionText}>Company: {selectedTicket.company.name}</Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.sectionTitle}>Ticket Details</Text>
                <Text style={styles.sectionText}>Category: {selectedTicket.category}</Text>
                <Text style={styles.sectionText}>Priority: {selectedTicket.priority}</Text>
                <Text style={styles.sectionText}>Status: {selectedTicket.status}</Text>
                <Text style={styles.sectionText}>Created: {formatDate(selectedTicket.createdAt)}</Text>
              </View>

              {/* Status Update Buttons */}
              <View style={styles.statusActions}>
                <Text style={styles.sectionTitle}>Update Status</Text>
                <View style={styles.statusButtonsGrid}>
                  {statusOptions.slice(1).map((status) => (
                    <TouchableOpacity
                      key={status.value}
                      style={[
                        styles.statusButton,
                        { backgroundColor: getStatusColor(status.value) },
                        selectedTicket.status === status.value && styles.currentStatusButton
                      ]}
                      onPress={() => {
                        if (selectedTicket.status !== status.value) {
                          handleStatusUpdate(selectedTicket.id, status.value);
                          setSelectedTicket({...selectedTicket, status: status.value});
                        }
                      }}
                    >
                      <Text style={styles.statusButtonText}>{status.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryOrange} />
        <Text style={styles.loadingText}>Loading support tickets...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderStatsCard()}
      {renderFilters()}

      <FlatList
        data={filteredTickets}
        renderItem={renderTicketItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={loadTickets}
            colors={[COLORS.primaryOrange]}
            tintColor={COLORS.primaryOrange}
          />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No support tickets found</Text>
          </View>
        }
      />

      {renderTicketModal()}
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
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: verticalScale(16),
      fontSize: font(16),
      color: '#FFF',
      opacity: 0.8,
    },
    statsContainer: {
      paddingHorizontal: moderateScale(20),
      paddingVertical: verticalScale(10),
    },
    statsCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: moderateScale(12),
      padding: moderateScale(16),
    },
    statsTitle: {
      fontSize: font(18),
      fontWeight: 'bold',
      color: '#FFF',
      marginBottom: verticalScale(12),
      textAlign: 'center',
    },
    statsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statItem: {
      alignItems: 'center',
    },
    statNumber: {
      fontSize: font(24),
      fontWeight: 'bold',
      color: '#FFF',
    },
    statLabel: {
      fontSize: font(12),
      color: '#FFF',
      opacity: 0.8,
    },
    filtersContainer: {
      paddingHorizontal: moderateScale(20),
      paddingVertical: verticalScale(10),
    },
    filterRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    filterItem: {
      flex: 1,
      marginHorizontal: moderateScale(5),
    },
    filterLabel: {
      fontSize: font(14),
      color: '#FFF',
      marginBottom: verticalScale(4),
      fontWeight: '500',
    },
    filterDropdown: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: moderateScale(8),
      padding: moderateScale(10),
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    dropdownText: {
      fontSize: font(12),
      color: '#FFF',
    },
    dropdownPlaceholder: {
      fontSize: font(12),
      color: 'rgba(255, 255, 255, 0.6)',
    },
    listContainer: {
      paddingHorizontal: moderateScale(20),
    },
    ticketCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: moderateScale(12),
      padding: moderateScale(16),
      marginBottom: verticalScale(12),
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    ticketHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: verticalScale(8),
    },
    ticketNumber: {
      fontSize: font(14),
      fontWeight: 'bold',
      color: '#FFF',
    },
    ticketBadges: {
      flexDirection: 'row',
      gap: moderateScale(6),
    },
    priorityBadge: {
      paddingHorizontal: moderateScale(6),
      paddingVertical: verticalScale(2),
      borderRadius: moderateScale(10),
    },
    statusBadge: {
      paddingHorizontal: moderateScale(6),
      paddingVertical: verticalScale(2),
      borderRadius: moderateScale(10),
    },
    badgeText: {
      fontSize: font(9),
      color: '#FFF',
      fontWeight: 'bold',
    },
    ticketSubject: {
      fontSize: font(16),
      color: '#FFF',
      fontWeight: '600',
      marginBottom: verticalScale(8),
    },
    ticketMeta: {
      marginBottom: verticalScale(8),
    },
    ticketUser: {
      fontSize: font(12),
      color: '#FFF',
      opacity: 0.8,
      marginBottom: verticalScale(2),
    },
    ticketCompany: {
      fontSize: font(12),
      color: '#FFF',
      opacity: 0.8,
    },
    ticketFooter: {
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.1)',
      paddingTop: verticalScale(8),
      marginBottom: verticalScale(8),
    },
    ticketDate: {
      fontSize: font(11),
      color: '#FFF',
      opacity: 0.6,
    },
    assignedTo: {
      fontSize: font(11),
      color: COLORS.primaryOrange,
      marginTop: verticalScale(2),
    },
    quickActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    actionButton: {
      paddingHorizontal: moderateScale(12),
      paddingVertical: verticalScale(4),
      borderRadius: moderateScale(6),
    },
    actionButtonText: {
      fontSize: font(10),
      color: '#FFF',
      fontWeight: '600',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: verticalScale(40),
    },
    emptyText: {
      fontSize: font(16),
      color: '#FFF',
      opacity: 0.6,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: '#FFF',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: moderateScale(20),
      borderBottomWidth: 1,
      borderBottomColor: '#E9ECEF',
    },
    modalTitle: {
      fontSize: font(18),
      fontWeight: 'bold',
      color: COLORS.primaryBlue,
    },
    closeButton: {
      fontSize: font(18),
      color: COLORS.mediumGray,
      padding: moderateScale(4),
    },
    modalContent: {
      flex: 1,
      padding: moderateScale(20),
    },
    modalSubject: {
      fontSize: font(16),
      fontWeight: '600',
      color: COLORS.darkGray,
      marginBottom: verticalScale(20),
    },
    modalSection: {
      marginBottom: verticalScale(20),
    },
    sectionTitle: {
      fontSize: font(14),
      fontWeight: 'bold',
      color: COLORS.primaryBlue,
      marginBottom: verticalScale(8),
    },
    sectionText: {
      fontSize: font(14),
      color: COLORS.darkGray,
      marginBottom: verticalScale(4),
    },
    statusActions: {
      marginTop: verticalScale(20),
    },
    statusButtonsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: moderateScale(8),
    },
    statusButton: {
      paddingHorizontal: moderateScale(12),
      paddingVertical: verticalScale(8),
      borderRadius: moderateScale(6),
      minWidth: '30%',
    },
    currentStatusButton: {
      opacity: 0.6,
    },
    statusButtonText: {
      fontSize: font(12),
      color: '#FFF',
      fontWeight: '600',
      textAlign: 'center',
    },
  });

export default SupportTicketsAdmin;