// Email Logs Viewer with Advanced Filtering and Search
// Comprehensive email activity monitoring and analysis

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

// Types
import {
  EmailLog,
  LogFilter,
  EmailTemplate,
  TemplateCategory,
  BaseComponentProps,
} from '../types/emailTemplateTypes';

interface EmailLogsViewerProps extends BaseComponentProps {
  logs: EmailLog[];
  templates: EmailTemplate[];
  isLoading?: boolean;
  onRefresh?: () => Promise<void>;
  onLoadMore?: () => Promise<void>;
  hasMore?: boolean;
  onExportLogs?: (logs: EmailLog[]) => Promise<void>;
}

interface LogItemProps {
  log: EmailLog;
  template?: EmailTemplate;
  onViewDetails: (log: EmailLog) => void;
}

interface FilterModalProps {
  visible: boolean;
  filters: LogFilter;
  templates: EmailTemplate[];
  onClose: () => void;
  onApplyFilters: (filters: LogFilter) => void;
  onClearFilters: () => void;
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    delivered: '#10B981',
    sent: '#3B82F6',
    queued: '#F59E0B',
    bounced: '#EF4444',
    failed: '#DC2626',
    complained: '#7C2D12',
  };
  return colors[status] || '#6B7280';
};

const getStatusIcon = (status: string) => {
  const icons: Record<string, string> = {
    delivered: '✅',
    sent: '📤',
    queued: '⏳',
    bounced: '↩️',
    failed: '❌',
    complained: '🚫',
  };
  return icons[status] || '📧';
};

const LogItem: React.FC<LogItemProps> = ({ log, template, onViewDetails }) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const truncateEmail = (email: string) => {
    if (email.length <= 25) return email;
    const [local, domain] = email.split('@');
    return `${local.substring(0, 8)}...@${domain}`;
  };

  return (
    <TouchableOpacity
      style={styles.logItem}
      onPress={() => onViewDetails(log)}
      activeOpacity={0.7}
    >
      <View style={styles.logHeader}>
        <View style={styles.statusIndicator}>
          <Text style={styles.statusIcon}>{getStatusIcon(log.deliveryStatus)}</Text>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: getStatusColor(log.deliveryStatus) }
            ]}
          />
        </View>

        <View style={styles.logInfo}>
          <Text style={styles.logRecipient} numberOfLines={1}>
            {truncateEmail(log.recipient)}
          </Text>
          <Text style={styles.logTemplate} numberOfLines={1}>
            {template?.name || 'Unknown Template'}
          </Text>
        </View>

        <View style={styles.logMeta}>
          <Text style={styles.logDate}>{formatDate(log.sentAt)}</Text>
          <Text
            style={[
              styles.logStatus,
              { color: getStatusColor(log.deliveryStatus) }
            ]}
          >
            {log.deliveryStatus.toUpperCase()}
          </Text>
        </View>
      </View>

      <Text style={styles.logSubject} numberOfLines={1}>
        {log.subject}
      </Text>

      {(log.openedAt || log.clickedAt || log.errorMessage) && (
        <View style={styles.logDetails}>
          {log.openedAt && (
            <View style={styles.logDetailItem}>
              <Text style={styles.logDetailIcon}>👁️</Text>
              <Text style={styles.logDetailText}>
                Opened {formatDate(log.openedAt)}
              </Text>
            </View>
          )}

          {log.clickedAt && (
            <View style={styles.logDetailItem}>
              <Text style={styles.logDetailIcon}>👆</Text>
              <Text style={styles.logDetailText}>
                Clicked {formatDate(log.clickedAt)}
              </Text>
            </View>
          )}

          {log.errorMessage && (
            <View style={styles.logDetailItem}>
              <Text style={styles.logDetailIcon}>⚠️</Text>
              <Text style={[styles.logDetailText, styles.errorText]} numberOfLines={1}>
                {log.errorMessage}
              </Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  filters,
  templates,
  onClose,
  onApplyFilters,
  onClearFilters,
}) => {
  const [localFilters, setLocalFilters] = useState<LogFilter>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const categories = Array.from(new Set(templates.map(t => t.category)));
  const statuses = ['delivered', 'sent', 'queued', 'bounced', 'failed', 'complained'];

  const toggleArrayFilter = (
    key: keyof LogFilter,
    value: string,
    array: string[] | undefined
  ) => {
    const current = array || [];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];

    setLocalFilters(prev => ({
      ...prev,
      [key]: updated,
    }));
  };

  const applyFilters = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const clearFilters = () => {
    const clearedFilters: LogFilter = {};
    setLocalFilters(clearedFilters);
    onClearFilters();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.filterModal}>
        <View style={styles.filterHeader}>
          <TouchableOpacity onPress={onClose} style={styles.filterCloseButton}>
            <Text style={styles.filterCloseText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.filterTitle}>Filter Logs</Text>
          <TouchableOpacity onPress={applyFilters} style={styles.filterApplyButton}>
            <Text style={styles.filterApplyText}>Apply</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.filterContent}>
          {/* Status Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Delivery Status</Text>
            <View style={styles.filterOptions}>
              {statuses.map(status => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterOption,
                    localFilters.status?.includes(status) && styles.filterOptionSelected
                  ]}
                  onPress={() => toggleArrayFilter('status', status, localFilters.status)}
                >
                  <Text style={styles.filterOptionIcon}>{getStatusIcon(status)}</Text>
                  <Text
                    style={[
                      styles.filterOptionText,
                      localFilters.status?.includes(status) && styles.filterOptionTextSelected
                    ]}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Category Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Template Category</Text>
            <View style={styles.filterOptions}>
              {categories.map(category => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.filterOption,
                    localFilters.categories?.includes(category as TemplateCategory) && styles.filterOptionSelected
                  ]}
                  onPress={() => toggleArrayFilter('categories', category, localFilters.categories)}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      localFilters.categories?.includes(category as TemplateCategory) && styles.filterOptionTextSelected
                    ]}
                  >
                    {category.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Template Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Templates</Text>
            <View style={styles.filterOptions}>
              {templates.slice(0, 10).map(template => (
                <TouchableOpacity
                  key={template.id}
                  style={[
                    styles.filterOption,
                    localFilters.templateIds?.includes(template.id) && styles.filterOptionSelected
                  ]}
                  onPress={() => toggleArrayFilter('templateIds', template.id, localFilters.templateIds)}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      localFilters.templateIds?.includes(template.id) && styles.filterOptionTextSelected
                    ]}
                  >
                    {template.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Search Query */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Search</Text>
            <TextInput
              style={styles.filterSearchInput}
              placeholder="Search by recipient email or subject..."
              value={localFilters.searchQuery || ''}
              onChangeText={(text) => setLocalFilters(prev => ({ ...prev, searchQuery: text }))}
            />
          </View>
        </ScrollView>

        <View style={styles.filterActions}>
          <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
            <Text style={styles.clearFiltersText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export const EmailLogsViewer: React.FC<EmailLogsViewerProps> = ({
  logs,
  templates,
  isLoading = false,
  onRefresh,
  onLoadMore,
  hasMore = false,
  onExportLogs,
  className,
  style,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<LogFilter>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Filter logs based on search and filters
  const filteredLogs = useMemo(() => {
    let result = [...logs];

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(log =>
        log.recipient.toLowerCase().includes(query) ||
        log.subject.toLowerCase().includes(query) ||
        log.templateName.toLowerCase().includes(query)
      );
    }

    // Apply filters
    if (filters.status?.length) {
      result = result.filter(log => filters.status!.includes(log.deliveryStatus));
    }

    if (filters.categories?.length) {
      result = result.filter(log => {
        const template = templates.find(t => t.id === log.templateId);
        return template && filters.categories!.includes(template.category);
      });
    }

    if (filters.templateIds?.length) {
      result = result.filter(log => filters.templateIds!.includes(log.templateId));
    }

    if (filters.recipients?.length) {
      result = result.filter(log =>
        filters.recipients!.some(recipient =>
          log.recipient.toLowerCase().includes(recipient.toLowerCase())
        )
      );
    }

    if (filters.dateRange) {
      result = result.filter(log => {
        const logDate = new Date(log.sentAt);
        return logDate >= filters.dateRange!.start && logDate <= filters.dateRange!.end;
      });
    }

    return result;
  }, [logs, searchQuery, filters, templates]);

  // Get template for log
  const getTemplate = useCallback((log: EmailLog) => {
    return templates.find(t => t.id === log.templateId);
  }, [templates]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh logs');
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  // Handle export
  const handleExport = useCallback(async () => {
    if (filteredLogs.length === 0) {
      Alert.alert('No Data', 'No logs to export with current filters');
      return;
    }

    try {
      if (onExportLogs) {
        await onExportLogs(filteredLogs);
        Alert.alert('Success', 'Logs exported successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to export logs');
    }
  }, [filteredLogs, onExportLogs]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.status?.length) count++;
    if (filters.categories?.length) count++;
    if (filters.templateIds?.length) count++;
    if (filters.recipients?.length) count++;
    if (filters.dateRange) count++;
    if (filters.searchQuery) count++;
    return count;
  }, [filters]);

  const renderLogItem = ({ item }: { item: EmailLog }) => (
    <LogItem
      log={item}
      template={getTemplate(item)}
      onViewDetails={setSelectedLog}
    />
  );

  const renderFooter = () => {
    if (!hasMore) return null;

    return (
      <TouchableOpacity
        style={styles.loadMoreButton}
        onPress={onLoadMore}
        disabled={isLoading}
      >
        <Text style={styles.loadMoreText}>
          {isLoading ? 'Loading...' : 'Load More'}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, style]} className={className}>
      {/* Header with Search and Filters */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search logs..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFiltersCount > 0 && styles.filterButtonActive
            ]}
            onPress={() => setShowFilters(true)}
          >
            <Text style={styles.filterButtonText}>
              🔍 {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </Text>
          </TouchableOpacity>

          {onExportLogs && (
            <TouchableOpacity
              style={styles.exportButton}
              onPress={handleExport}
              disabled={filteredLogs.length === 0}
            >
              <Text style={styles.exportButtonText}>📄</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{filteredLogs.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {filteredLogs.filter(l => l.deliveryStatus === 'delivered').length}
          </Text>
          <Text style={styles.statLabel}>Delivered</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {filteredLogs.filter(l => l.openedAt).length}
          </Text>
          <Text style={styles.statLabel}>Opened</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {filteredLogs.filter(l => l.clickedAt).length}
          </Text>
          <Text style={styles.statLabel}>Clicked</Text>
        </View>
      </View>

      {/* Logs List */}
      <FlatList
        data={filteredLogs}
        renderItem={renderLogItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#3B82F6']}
            tintColor={'#3B82F6'}
          />
        }
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📧</Text>
            <Text style={styles.emptyTitle}>No Logs Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery || activeFiltersCount > 0
                ? 'Try adjusting your search or filters'
                : 'No email logs available yet'}
            </Text>
          </View>
        }
        contentContainerStyle={
          filteredLogs.length === 0 ? styles.emptyListContainer : undefined
        }
      />

      {/* Filter Modal */}
      <FilterModal
        visible={showFilters}
        filters={filters}
        templates={templates}
        onClose={() => setShowFilters(false)}
        onApplyFilters={setFilters}
        onClearFilters={() => setFilters({})}
      />

      {/* Log Details Modal */}
      {selectedLog && (
        <Modal visible={!!selectedLog} animationType="slide" presentationStyle="pageSheet">
          <View style={styles.detailModal}>
            <View style={styles.detailHeader}>
              <TouchableOpacity
                onPress={() => setSelectedLog(null)}
                style={styles.detailCloseButton}
              >
                <Text style={styles.detailCloseText}>Close</Text>
              </TouchableOpacity>
              <Text style={styles.detailTitle}>Email Details</Text>
              <View style={styles.detailPlaceholder} />
            </View>

            <ScrollView style={styles.detailContent}>
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Delivery Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <Text style={[styles.detailValue, { color: getStatusColor(selectedLog.deliveryStatus) }]}>
                    {getStatusIcon(selectedLog.deliveryStatus)} {selectedLog.deliveryStatus.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Recipient:</Text>
                  <Text style={styles.detailValue}>{selectedLog.recipient}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Template:</Text>
                  <Text style={styles.detailValue}>{selectedLog.templateName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Subject:</Text>
                  <Text style={styles.detailValue}>{selectedLog.subject}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Sent:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedLog.sentAt).toLocaleString()}
                  </Text>
                </View>
              </View>

              {(selectedLog.openedAt || selectedLog.clickedAt) && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Engagement</Text>
                  {selectedLog.openedAt && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Opened:</Text>
                      <Text style={styles.detailValue}>
                        {new Date(selectedLog.openedAt).toLocaleString()}
                      </Text>
                    </View>
                  )}
                  {selectedLog.clickedAt && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Clicked:</Text>
                      <Text style={styles.detailValue}>
                        {new Date(selectedLog.clickedAt).toLocaleString()}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {selectedLog.errorMessage && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Error Details</Text>
                  <Text style={styles.errorMessage}>{selectedLog.errorMessage}</Text>
                </View>
              )}

              {selectedLog.metadata && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Technical Details</Text>
                  {selectedLog.metadata.messageId && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Message ID:</Text>
                      <Text style={styles.detailValue}>{selectedLog.metadata.messageId}</Text>
                    </View>
                  )}
                  {selectedLog.metadata.ipAddress && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>IP Address:</Text>
                      <Text style={styles.detailValue}>{selectedLog.metadata.ipAddress}</Text>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchContainer: {
    flex: 1,
    marginRight: 12,
  },
  searchInput: {
    height: 40,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#374151',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    height: 40,
    paddingHorizontal: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterButtonActive: {
    backgroundColor: '#EBF4FF',
    borderColor: '#3B82F6',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  exportButton: {
    height: 40,
    width: 40,
    backgroundColor: '#10B981',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportButtonText: {
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  logItem: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  statusIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  logInfo: {
    flex: 1,
    marginRight: 12,
  },
  logRecipient: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  logTemplate: {
    fontSize: 12,
    color: '#64748B',
  },
  logMeta: {
    alignItems: 'flex-end',
  },
  logDate: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 2,
  },
  logStatus: {
    fontSize: 10,
    fontWeight: '600',
  },
  logSubject: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  logDetails: {
    gap: 4,
  },
  logDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logDetailIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  logDetailText: {
    fontSize: 11,
    color: '#6B7280',
  },
  errorText: {
    color: '#EF4444',
  },
  emptyListContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
  },
  loadMoreButton: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  loadMoreText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },

  // Filter Modal Styles
  filterModal: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterCloseButton: {
    padding: 8,
  },
  filterCloseText: {
    fontSize: 16,
    color: '#6B7280',
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  filterApplyButton: {
    padding: 8,
  },
  filterApplyText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
  },
  filterContent: {
    flex: 1,
    padding: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterOptionSelected: {
    backgroundColor: '#EBF4FF',
    borderColor: '#3B82F6',
  },
  filterOptionIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  filterOptionText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  filterOptionTextSelected: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  filterSearchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#374151',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterActions: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  clearFiltersButton: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },

  // Detail Modal Styles
  detailModal: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  detailCloseButton: {
    padding: 8,
  },
  detailCloseText: {
    fontSize: 16,
    color: '#6B7280',
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  detailPlaceholder: {
    width: 60,
  },
  detailContent: {
    flex: 1,
    padding: 16,
  },
  detailSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    width: 100,
  },
  detailValue: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  errorMessage: {
    fontSize: 14,
    color: '#EF4444',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
});

export default EmailLogsViewer;