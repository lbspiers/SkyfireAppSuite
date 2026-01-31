import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';

// Utils and Constants
import COLORS from '../../utils/styleConstant/Color';
import fontFamily from '../../utils/styleConstant/FontFamily';
import { supportTicketAPI, SupportTicket } from '../../services/supportTicketAPI';
import { BLUE_TC_TB } from '../../styles/gradient';

const MyTicketsScreen: React.FC = () => {
  const navigation = useNavigation();

  // State
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Load tickets on screen focus
  useFocusEffect(
    useCallback(() => {
      loadTickets(1, true);
    }, [])
  );

  const loadTickets = async (page: number = 1, reset: boolean = false) => {
    try {
      if (reset) {
        setIsLoading(true);
        setCurrentPage(1);
        setTickets([]);
      } else {
        setIsLoadingMore(true);
      }

      const response = await supportTicketAPI.getUserTickets(page, 10);

      console.log('📋 [MY_TICKETS] API Response:', {
        success: response.success,
        hasTickets: !!response.tickets,
        ticketsCount: response.tickets?.length,
        hasPagination: !!response.pagination,
        pagination: response.pagination
      });

      if (response.success && response.tickets) {
        const newTickets = response.tickets;

        if (reset) {
          setTickets(newTickets);
        } else {
          setTickets(prev => [...prev, ...newTickets]);
        }

        const pagination = response.pagination;
        if (pagination) {
          setCurrentPage(pagination.page);
          const totalPagesCalculated = pagination.totalPages || Math.ceil(pagination.total / 10);
          setTotalPages(totalPagesCalculated);
          setHasMore(pagination.page < totalPagesCalculated);
        } else {
          // If no pagination info, assume single page
          setCurrentPage(1);
          setTotalPages(1);
          setHasMore(false);
        }
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.message || 'Failed to load tickets',
        });
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load tickets',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadTickets(1, true);
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      loadTickets(currentPage + 1, false);
    }
  };

  const handleSearch = async () => {
    if (searchText.trim()) {
      try {
        setIsLoading(true);
        const response = await supportTicketAPI.searchTickets(searchText.trim());

        if (response.success && response.tickets) {
          setTickets(response.tickets);
          setHasMore(false);
        }
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: 'Search Failed',
          text2: 'Failed to search tickets',
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      loadTickets(1, true);
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
    return supportTicketAPI.getPriorityColor(priority);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderTicketItem = ({ item }: { item: SupportTicket }) => (
    <TouchableOpacity
      style={styles.ticketCard}
      onPress={() => navigation.navigate('TicketDetails', { ticketNumber: item.ticketNumber })}
    >
      <View style={styles.ticketHeader}>
        <View style={styles.ticketNumberContainer}>
          <Text style={styles.ticketNumber}>{item.ticketNumber}</Text>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
            <Text style={styles.priorityText}>
              {supportTicketAPI.getPriorityDisplayText(item.priority)}
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>
            {supportTicketAPI.getStatusDisplayText(item.status)}
          </Text>
        </View>
      </View>

      <Text style={styles.ticketSubject} numberOfLines={2}>
        {item.subject}
      </Text>

      <Text style={styles.ticketCategory}>
        {supportTicketAPI.getCategoryDisplayText(item.category)}
      </Text>

      <View style={styles.ticketFooter}>
        <Text style={styles.ticketDate}>
          Created: {formatDate(item.createdAt)}
        </Text>
        {item.assignedTo && (
          <Text style={styles.assignedTo}>
            Assigned to: {item.assignedTo.name}
          </Text>
        )}
      </View>

      <View style={styles.chevron}>
        <Text style={styles.chevronText}>›</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>No Support Tickets</Text>
      <Text style={styles.emptyStateText}>
        {searchText
          ? 'No tickets found matching your search.'
          : 'You haven\'t created any support tickets yet.'}
      </Text>
      <TouchableOpacity
        style={styles.createTicketButton}
        onPress={() => navigation.navigate('SupportTicket')}
      >
        <LinearGradient
          colors={[COLORS.primaryOrange, COLORS.secondaryOrange]}
          style={styles.createTicketGradient}
        >
          <Text style={styles.createTicketButtonText}>Create Your First Ticket</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;

    return (
      <View style={styles.loadMoreContainer}>
        <ActivityIndicator size="small" color={COLORS.primaryOrange} />
        <Text style={styles.loadMoreText}>Loading more tickets...</Text>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={BLUE_TC_TB.colors}
      start={BLUE_TC_TB.start}
      end={BLUE_TC_TB.end}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backButton}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Support Tickets</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SupportTicket')}>
              <Text style={styles.addButton}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchWrapper}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search tickets..."
              placeholderTextColor={COLORS.mediumGray}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSearch}
            >
              <Text style={styles.searchButtonText}>🔍</Text>
            </TouchableOpacity>
          </View>
        </View>

      {/* Tickets List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primaryOrange} />
          <Text style={styles.loadingText}>Loading your tickets...</Text>
        </View>
      ) : (
        <FlatList
          data={tickets}
          renderItem={renderTicketItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primaryOrange]}
              tintColor={COLORS.primaryOrange}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmptyState}
        />
      )}
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    fontSize: 24,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fontFamily.Inter_16pt_Black,
    color: COLORS.white,
    fontWeight: '600',
  },
  addButton: {
    fontSize: 28,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: COLORS.darkGray,
    backgroundColor: 'transparent',
  },
  searchButton: {
    marginLeft: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.primaryOrange,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.mediumGray,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  ticketCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  ticketNumberContainer: {
    flex: 1,
  },
  ticketNumber: {
    fontSize: 14,
    fontFamily: fontFamily.Inter_16pt_Black,
    color: COLORS.primaryBlue,
    fontWeight: '600',
    marginBottom: 4,
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    color: COLORS.white,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '600',
  },
  ticketSubject: {
    fontSize: 16,
    fontFamily: fontFamily.Inter_16pt_Black,
    color: COLORS.darkGray,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 22,
  },
  ticketCategory: {
    fontSize: 14,
    color: COLORS.mediumGray,
    marginBottom: 12,
  },
  ticketFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F1F3F4',
    paddingTop: 12,
  },
  ticketDate: {
    fontSize: 12,
    color: COLORS.mediumGray,
    marginBottom: 4,
  },
  assignedTo: {
    fontSize: 12,
    color: COLORS.primaryBlue,
    fontWeight: '500',
  },
  chevron: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -10,
  },
  chevronText: {
    fontSize: 20,
    color: COLORS.mediumGray,
    fontWeight: '300',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontFamily: fontFamily.Inter_16pt_Black,
    color: COLORS.darkGray,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.mediumGray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  createTicketButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  createTicketGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  createTicketButtonText: {
    fontSize: 16,
    fontFamily: fontFamily.Inter_16pt_Black,
    color: COLORS.white,
    fontWeight: '600',
  },
  loadMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadMoreText: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.mediumGray,
  },
});

export default MyTicketsScreen;