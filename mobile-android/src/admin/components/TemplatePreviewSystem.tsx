// Email Template Preview System
// Live template preview with real-time editing and multi-device testing

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

// Components
import { PreviewModal } from './PreviewModal';

// Types
import {
  EmailTemplate,
  PreviewOptions,
  TemplateVariable,
  BaseComponentProps
} from '../types/emailTemplateTypes';

interface TemplatePreviewSystemProps extends BaseComponentProps {
  templates: EmailTemplate[];
  selectedTemplate?: EmailTemplate;
  onTemplateSelect: (template: EmailTemplate) => void;
  onPreviewClose: () => void;
  searchQuery?: string;
  categoryFilter?: string;
  isLoading?: boolean;
  onRefresh?: () => void;
}

interface QuickPreviewCardProps {
  template: EmailTemplate;
  isSelected: boolean;
  onSelect: () => void;
  onPreview: () => void;
}

const QuickPreviewCard: React.FC<QuickPreviewCardProps> = ({
  template,
  isSelected,
  onSelect,
  onPreview,
}) => {
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      authentication: '#4F46E5',
      booking: '#059669',
      user_management: '#DC2626',
      notifications: '#D97706',
      admin_tools: '#7C2D12',
      marketing: '#7C3AED',
      transactional: '#0891B2',
      system: '#6B7280',
    };
    return colors[category] || '#6B7280';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: '#10B981',
      draft: '#6B7280',
      disabled: '#EF4444',
      archived: '#78716C',
      pending_approval: '#F59E0B',
    };
    return colors[status] || '#6B7280';
  };

  return (
    <TouchableOpacity
      style={[styles.previewCard, isSelected && styles.previewCardSelected]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {template.name}
          </Text>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: getStatusColor(template.status) }
            ]}
          />
        </View>

        <View style={styles.cardMeta}>
          <View
            style={[
              styles.categoryTag,
              { backgroundColor: getCategoryColor(template.category) + '15' }
            ]}
          >
            <Text
              style={[
                styles.categoryText,
                { color: getCategoryColor(template.category) }
              ]}
            >
              {template.category.replace('_', ' ')}
            </Text>
          </View>
        </View>
      </View>

      {/* Card Content */}
      <View style={styles.cardContent}>
        <Text style={styles.cardSubject} numberOfLines={1}>
          {template.subject}
        </Text>
        <Text style={styles.cardDescription} numberOfLines={2}>
          {template.description}
        </Text>

        {/* Variables Preview */}
        {template.variables && template.variables.length > 0 && (
          <View style={styles.variablesPreview}>
            <Text style={styles.variablesLabel}>
              {template.variables.length} variable{template.variables.length !== 1 ? 's' : ''}
            </Text>
            <View style={styles.variablesList}>
              {template.variables.slice(0, 3).map((variable, index) => (
                <View key={variable.key} style={styles.variableChip}>
                  <Text style={styles.variableChipText}>
                    {variable.key}
                  </Text>
                </View>
              ))}
              {template.variables.length > 3 && (
                <View style={styles.variableChip}>
                  <Text style={styles.variableChipText}>
                    +{template.variables.length - 3}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Card Actions */}
      <View style={styles.cardActions}>
        <View style={styles.cardStats}>
          {template.analytics && (
            <>
              <Text style={styles.statText}>
                📧 {template.analytics.totalSent}
              </Text>
              <Text style={styles.statText}>
                📈 {(template.analytics.openRate * 100).toFixed(1)}%
              </Text>
            </>
          )}
        </View>

        <TouchableOpacity
          style={styles.previewButton}
          onPress={onPreview}
        >
          <Text style={styles.previewButtonText}>Preview</Text>
          <Text style={styles.previewButtonIcon}>👁️</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export const TemplatePreviewSystem: React.FC<TemplatePreviewSystemProps> = ({
  templates,
  selectedTemplate,
  onTemplateSelect,
  onPreviewClose,
  searchQuery = '',
  categoryFilter = '',
  isLoading = false,
  onRefresh,
  className,
  style,
}) => {
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [currentPreviewTemplate, setCurrentPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [previewOptions, setPreviewOptions] = useState<PreviewOptions>({
    viewMode: 'mobile',
    emailClient: 'gmail',
    darkMode: false,
    showImages: true,
  });
  const [refreshing, setRefreshing] = useState(false);

  // Filter templates based on search and category
  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const matchesSearch = !searchQuery ||
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = !categoryFilter ||
        template.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [templates, searchQuery, categoryFilter]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh templates');
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  // Handle template preview
  const handlePreviewTemplate = useCallback((template: EmailTemplate) => {
    setCurrentPreviewTemplate(template);
    setPreviewModalVisible(true);
  }, []);

  // Handle preview close
  const handlePreviewClose = useCallback(() => {
    setPreviewModalVisible(false);
    setCurrentPreviewTemplate(null);
    onPreviewClose();
  }, [onPreviewClose]);

  // Handle preview options change
  const handlePreviewOptionsChange = useCallback((options: PreviewOptions) => {
    setPreviewOptions(options);
  }, []);

  // Group templates by status for better organization
  const groupedTemplates = useMemo(() => {
    const groups: Record<string, EmailTemplate[]> = {
      active: [],
      draft: [],
      pending_approval: [],
      disabled: [],
      archived: [],
    };

    filteredTemplates.forEach(template => {
      if (groups[template.status]) {
        groups[template.status].push(template);
      }
    });

    return groups;
  }, [filteredTemplates]);

  if (isLoading && templates.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingSpinner} />
        <Text style={styles.loadingText}>Loading templates...</Text>
      </View>
    );
  }

  if (filteredTemplates.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📧</Text>
        <Text style={styles.emptyTitle}>No Templates Found</Text>
        <Text style={styles.emptySubtitle}>
          {searchQuery || categoryFilter
            ? 'Try adjusting your search or filter criteria'
            : 'Create your first email template to get started'}
        </Text>
        {(searchQuery || categoryFilter) && (
          <TouchableOpacity
            style={styles.clearFiltersButton}
            onPress={() => {
              // This would be handled by parent component
              console.log('Clear filters requested');
            }}
          >
            <Text style={styles.clearFiltersText}>Clear Filters</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]} className={className}>
      {/* Header Stats */}
      <View style={styles.headerStats}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{filteredTemplates.length}</Text>
          <Text style={styles.statLabel}>Templates</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {groupedTemplates.active.length}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {groupedTemplates.draft.length}
          </Text>
          <Text style={styles.statLabel}>Drafts</Text>
        </View>
      </View>

      {/* Templates List */}
      <ScrollView
        style={styles.templatesList}
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
        {/* Active Templates */}
        {groupedTemplates.active.length > 0 && (
          <View style={styles.templateGroup}>
            <Text style={styles.groupTitle}>
              Active Templates ({groupedTemplates.active.length})
            </Text>
            {groupedTemplates.active.map(template => (
              <QuickPreviewCard
                key={template.id}
                template={template}
                isSelected={selectedTemplate?.id === template.id}
                onSelect={() => onTemplateSelect(template)}
                onPreview={() => handlePreviewTemplate(template)}
              />
            ))}
          </View>
        )}

        {/* Draft Templates */}
        {groupedTemplates.draft.length > 0 && (
          <View style={styles.templateGroup}>
            <Text style={styles.groupTitle}>
              Draft Templates ({groupedTemplates.draft.length})
            </Text>
            {groupedTemplates.draft.map(template => (
              <QuickPreviewCard
                key={template.id}
                template={template}
                isSelected={selectedTemplate?.id === template.id}
                onSelect={() => onTemplateSelect(template)}
                onPreview={() => handlePreviewTemplate(template)}
              />
            ))}
          </View>
        )}

        {/* Pending Approval */}
        {groupedTemplates.pending_approval.length > 0 && (
          <View style={styles.templateGroup}>
            <Text style={styles.groupTitle}>
              Pending Approval ({groupedTemplates.pending_approval.length})
            </Text>
            {groupedTemplates.pending_approval.map(template => (
              <QuickPreviewCard
                key={template.id}
                template={template}
                isSelected={selectedTemplate?.id === template.id}
                onSelect={() => onTemplateSelect(template)}
                onPreview={() => handlePreviewTemplate(template)}
              />
            ))}
          </View>
        )}

        {/* Other Statuses */}
        {[...groupedTemplates.disabled, ...groupedTemplates.archived].length > 0 && (
          <View style={styles.templateGroup}>
            <Text style={styles.groupTitle}>
              Other ({groupedTemplates.disabled.length + groupedTemplates.archived.length})
            </Text>
            {[...groupedTemplates.disabled, ...groupedTemplates.archived].map(template => (
              <QuickPreviewCard
                key={template.id}
                template={template}
                isSelected={selectedTemplate?.id === template.id}
                onSelect={() => onTemplateSelect(template)}
                onPreview={() => handlePreviewTemplate(template)}
              />
            ))}
          </View>
        )}

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Preview Modal */}
      {currentPreviewTemplate && (
        <PreviewModal
          template={currentPreviewTemplate}
          isOpen={previewModalVisible}
          onClose={handlePreviewClose}
          options={previewOptions}
          onOptionsChange={handlePreviewOptionsChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingSpinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#E2E8F0',
    borderTopColor: '#3B82F6',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
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
    marginBottom: 24,
  },
  clearFiltersButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  clearFiltersText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  headerStats: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  templatesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  templateGroup: {
    marginTop: 20,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  previewCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EBF4FF',
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    flex: 1,
    marginRight: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  cardContent: {
    marginBottom: 12,
  },
  cardSubject: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 8,
  },
  variablesPreview: {
    marginTop: 8,
  },
  variablesLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  variablesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  variableChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  variableChipText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  previewButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    marginRight: 4,
  },
  previewButtonIcon: {
    fontSize: 12,
  },
  bottomPadding: {
    height: 40,
  },
});

export default TemplatePreviewSystem;