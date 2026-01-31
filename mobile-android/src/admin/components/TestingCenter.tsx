// Email Template Testing Center
// Comprehensive testing system with bulk send capabilities

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Switch,
  FlatList,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

// Types
import {
  EmailTemplate,
  TestEmailRequest,
  TestRecipient,
  BulkTestRequest,
  RecipientGroup,
  BaseComponentProps,
  TemplateVariable,
} from '../types/emailTemplateTypes';

interface TestingCenterProps extends BaseComponentProps {
  templates: EmailTemplate[];
  onSendTest: (request: TestEmailRequest) => Promise<boolean>;
  onSendBulkTest: (request: BulkTestRequest) => Promise<boolean>;
  isLoading?: boolean;
}

interface TestRecipientInputProps {
  recipient: TestRecipient;
  onUpdate: (recipient: TestRecipient) => void;
  onRemove: () => void;
  showPersonalization?: boolean;
  templateVariables: TemplateVariable[];
}

interface RecipientGroupManagerProps {
  groups: RecipientGroup[];
  onAddGroup: (group: RecipientGroup) => void;
  onUpdateGroup: (groupName: string, group: RecipientGroup) => void;
  onRemoveGroup: (groupName: string) => void;
}

const TestRecipientInput: React.FC<TestRecipientInputProps> = ({
  recipient,
  onUpdate,
  onRemove,
  showPersonalization = false,
  templateVariables,
}) => {
  const [expanded, setExpanded] = useState(false);

  const updateRecipient = (field: keyof TestRecipient, value: string) => {
    onUpdate({
      ...recipient,
      [field]: value,
    });
  };

  const updatePersonalizedData = (key: string, value: string) => {
    const personalizedData = recipient.personalizedData || {};
    onUpdate({
      ...recipient,
      personalizedData: {
        ...personalizedData,
        [key]: value,
      },
    });
  };

  return (
    <View style={styles.recipientCard}>
      <View style={styles.recipientHeader}>
        <View style={styles.recipientInfo}>
          <TextInput
            style={styles.recipientInput}
            placeholder="Email address"
            value={recipient.email}
            onChangeText={(text) => updateRecipient('email', text)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.recipientInput}
            placeholder="Name"
            value={recipient.name}
            onChangeText={(text) => updateRecipient('name', text)}
          />
          <TextInput
            style={[styles.recipientInput, styles.roleInput]}
            placeholder="Role (optional)"
            value={recipient.role}
            onChangeText={(text) => updateRecipient('role', text)}
          />
        </View>

        <View style={styles.recipientActions}>
          {showPersonalization && templateVariables.length > 0 && (
            <TouchableOpacity
              style={styles.expandButton}
              onPress={() => setExpanded(!expanded)}
            >
              <Text style={styles.expandIcon}>{expanded ? '▲' : '▼'}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
            <Text style={styles.removeIcon}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      {expanded && showPersonalization && (
        <View style={styles.personalizationSection}>
          <Text style={styles.personalizationTitle}>Personalized Data</Text>
          {templateVariables.map((variable) => (
            <View key={variable.key} style={styles.variableInput}>
              <Text style={styles.variableLabel}>
                {variable.name} ({variable.type})
              </Text>
              <TextInput
                style={styles.variableTextInput}
                placeholder={variable.defaultValue || variable.examples[0] || `Enter ${variable.name}`}
                value={recipient.personalizedData?.[variable.key] || ''}
                onChangeText={(text) => updatePersonalizedData(variable.key, text)}
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const RecipientGroupManager: React.FC<RecipientGroupManagerProps> = ({
  groups,
  onAddGroup,
  onUpdateGroup,
  onRemoveGroup,
}) => {
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const addGroup = () => {
    if (newGroupName.trim()) {
      onAddGroup({
        name: newGroupName.trim(),
        recipients: [],
      });
      setNewGroupName('');
      setShowAddGroup(false);
    }
  };

  return (
    <View style={styles.groupManager}>
      <View style={styles.groupHeader}>
        <Text style={styles.groupTitle}>Recipient Groups</Text>
        <TouchableOpacity
          style={styles.addGroupButton}
          onPress={() => setShowAddGroup(true)}
        >
          <Text style={styles.addGroupText}>+ Add Group</Text>
        </TouchableOpacity>
      </View>

      {showAddGroup && (
        <View style={styles.addGroupForm}>
          <TextInput
            style={styles.groupNameInput}
            placeholder="Group name"
            value={newGroupName}
            onChangeText={setNewGroupName}
            autoFocus
          />
          <View style={styles.addGroupActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAddGroup(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={addGroup}>
              <Text style={styles.confirmText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.groupsList}>
          {groups.map((group) => (
            <View key={group.name} style={styles.groupChip}>
              <Text style={styles.groupChipText}>
                {group.name} ({group.recipients.length})
              </Text>
              <TouchableOpacity
                style={styles.groupRemoveButton}
                onPress={() => onRemoveGroup(group.name)}
              >
                <Text style={styles.groupRemoveIcon}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export const TestingCenter: React.FC<TestingCenterProps> = ({
  templates,
  onSendTest,
  onSendBulkTest,
  isLoading = false,
  className,
  style,
}) => {
  // State
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [testRecipients, setTestRecipients] = useState<TestRecipient[]>([]);
  const [recipientGroups, setRecipientGroups] = useState<RecipientGroup[]>([]);
  const [testNotes, setTestNotes] = useState('');
  const [sendImmediately, setSendImmediately] = useState(true);
  const [showBulkTest, setShowBulkTest] = useState(false);
  const [sampleData, setSampleData] = useState<Record<string, any>>({});

  // Initialize with default recipient
  useEffect(() => {
    if (testRecipients.length === 0) {
      addRecipient();
    }
  }, []);

  // Get selected template for single test
  const selectedTemplate = useMemo(() => {
    return selectedTemplates.length === 1
      ? templates.find(t => t.id === selectedTemplates[0])
      : null;
  }, [selectedTemplates, templates]);

  // Get template variables for personalization
  const templateVariables = useMemo(() => {
    if (selectedTemplate) {
      return selectedTemplate.variables || [];
    }
    // For bulk test, get all unique variables from selected templates
    const allVariables: TemplateVariable[] = [];
    selectedTemplates.forEach(templateId => {
      const template = templates.find(t => t.id === templateId);
      if (template?.variables) {
        template.variables.forEach(variable => {
          if (!allVariables.find(v => v.key === variable.key)) {
            allVariables.push(variable);
          }
        });
      }
    });
    return allVariables;
  }, [selectedTemplate, selectedTemplates, templates]);

  // Add recipient
  const addRecipient = useCallback(() => {
    setTestRecipients(prev => [
      ...prev,
      {
        email: '',
        name: '',
        role: '',
      },
    ]);
  }, []);

  // Update recipient
  const updateRecipient = useCallback((index: number, recipient: TestRecipient) => {
    setTestRecipients(prev => {
      const updated = [...prev];
      updated[index] = recipient;
      return updated;
    });
  }, []);

  // Remove recipient
  const removeRecipient = useCallback((index: number) => {
    setTestRecipients(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Toggle template selection
  const toggleTemplateSelection = useCallback((templateId: string) => {
    setSelectedTemplates(prev => {
      if (prev.includes(templateId)) {
        return prev.filter(id => id !== templateId);
      }
      return [...prev, templateId];
    });
  }, []);

  // Add recipient group
  const addRecipientGroup = useCallback((group: RecipientGroup) => {
    setRecipientGroups(prev => [...prev, group]);
  }, []);

  // Update recipient group
  const updateRecipientGroup = useCallback((groupName: string, group: RecipientGroup) => {
    setRecipientGroups(prev =>
      prev.map(g => g.name === groupName ? group : g)
    );
  }, []);

  // Remove recipient group
  const removeRecipientGroup = useCallback((groupName: string) => {
    setRecipientGroups(prev => prev.filter(g => g.name !== groupName));
  }, []);

  // Send single test
  const sendSingleTest = useCallback(async () => {
    if (!selectedTemplate) {
      Alert.alert('Error', 'Please select a template');
      return;
    }

    const validRecipients = testRecipients.filter(r => r.email.trim());
    if (validRecipients.length === 0) {
      Alert.alert('Error', 'Please add at least one valid email address');
      return;
    }

    try {
      const request: TestEmailRequest = {
        templateId: selectedTemplate.id,
        recipients: validRecipients,
        sampleData,
        notes: testNotes.trim() || undefined,
        sendImmediately,
      };

      const success = await onSendTest(request);
      if (success) {
        Alert.alert('Success', 'Test email sent successfully');
        // Clear form
        setTestRecipients([{ email: '', name: '', role: '' }]);
        setTestNotes('');
        setSampleData({});
      } else {
        Alert.alert('Error', 'Failed to send test email');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while sending test email');
      console.error('Test send error:', error);
    }
  }, [selectedTemplate, testRecipients, sampleData, testNotes, sendImmediately, onSendTest]);

  // Send bulk test
  const sendBulkTest = useCallback(async () => {
    if (selectedTemplates.length === 0) {
      Alert.alert('Error', 'Please select at least one template');
      return;
    }

    if (recipientGroups.length === 0) {
      Alert.alert('Error', 'Please create at least one recipient group');
      return;
    }

    try {
      const request: BulkTestRequest = {
        templateIds: selectedTemplates,
        recipientGroups,
        sampleData,
        notes: testNotes.trim() || undefined,
      };

      const success = await onSendBulkTest(request);
      if (success) {
        Alert.alert('Success', 'Bulk test emails sent successfully');
        // Clear selections
        setSelectedTemplates([]);
        setRecipientGroups([]);
        setTestNotes('');
        setSampleData({});
      } else {
        Alert.alert('Error', 'Failed to send bulk test emails');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while sending bulk test emails');
      console.error('Bulk test send error:', error);
    }
  }, [selectedTemplates, recipientGroups, sampleData, testNotes, onSendBulkTest]);

  if (templates.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🧪</Text>
        <Text style={styles.emptyTitle}>No Templates Available</Text>
        <Text style={styles.emptySubtitle}>
          Create some templates first to start testing
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]} className={className}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Mode Toggle */}
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeButton, !showBulkTest && styles.modeButtonActive]}
            onPress={() => setShowBulkTest(false)}
          >
            <Text style={[styles.modeButtonText, !showBulkTest && styles.modeButtonTextActive]}>
              Single Test
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, showBulkTest && styles.modeButtonActive]}
            onPress={() => setShowBulkTest(true)}
          >
            <Text style={[styles.modeButtonText, showBulkTest && styles.modeButtonTextActive]}>
              Bulk Test
            </Text>
          </TouchableOpacity>
        </View>

        {/* Template Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Select Template{showBulkTest ? 's' : ''}
          </Text>
          <View style={styles.templatesGrid}>
            {templates.map((template) => (
              <TouchableOpacity
                key={template.id}
                style={[
                  styles.templateCard,
                  selectedTemplates.includes(template.id) && styles.templateCardSelected,
                ]}
                onPress={() => {
                  if (showBulkTest) {
                    toggleTemplateSelection(template.id);
                  } else {
                    setSelectedTemplates([template.id]);
                  }
                }}
              >
                <View style={styles.templateCardHeader}>
                  <Text style={styles.templateCardTitle} numberOfLines={1}>
                    {template.name}
                  </Text>
                  <View style={styles.templateCardStatus}>
                    <Text style={styles.templateCardStatusText}>
                      {template.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.templateCardSubject} numberOfLines={1}>
                  {template.subject}
                </Text>
                <Text style={styles.templateCardCategory}>
                  {template.category.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recipients Section */}
        {!showBulkTest ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Test Recipients</Text>
              <TouchableOpacity style={styles.addButton} onPress={addRecipient}>
                <Text style={styles.addButtonText}>+ Add Recipient</Text>
              </TouchableOpacity>
            </View>

            {testRecipients.map((recipient, index) => (
              <TestRecipientInput
                key={index}
                recipient={recipient}
                onUpdate={(updated) => updateRecipient(index, updated)}
                onRemove={() => removeRecipient(index)}
                showPersonalization={!!selectedTemplate}
                templateVariables={templateVariables}
              />
            ))}
          </View>
        ) : (
          <View style={styles.section}>
            <RecipientGroupManager
              groups={recipientGroups}
              onAddGroup={addRecipientGroup}
              onUpdateGroup={updateRecipientGroup}
              onRemoveGroup={removeRecipientGroup}
            />
          </View>
        )}

        {/* Sample Data */}
        {templateVariables.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sample Data (Global)</Text>
            <Text style={styles.sectionSubtitle}>
              Default values for all template variables
            </Text>
            {templateVariables.map((variable) => (
              <View key={variable.key} style={styles.sampleDataInput}>
                <Text style={styles.sampleDataLabel}>
                  {variable.name} ({variable.type})
                  {variable.required && <Text style={styles.required}> *</Text>}
                </Text>
                <TextInput
                  style={styles.sampleDataTextInput}
                  placeholder={variable.defaultValue || variable.examples[0] || `Enter ${variable.name}`}
                  value={sampleData[variable.key] || ''}
                  onChangeText={(text) => setSampleData(prev => ({ ...prev, [variable.key]: text }))}
                />
              </View>
            ))}
          </View>
        )}

        {/* Test Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Options</Text>

          {!showBulkTest && (
            <View style={styles.optionRow}>
              <Text style={styles.optionLabel}>Send Immediately</Text>
              <Switch
                value={sendImmediately}
                onValueChange={setSendImmediately}
                trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                thumbColor={'#FFFFFF'}
              />
            </View>
          )}

          <View style={styles.notesInput}>
            <Text style={styles.notesLabel}>Test Notes (Optional)</Text>
            <TextInput
              style={styles.notesTextInput}
              placeholder="Add notes about this test..."
              value={testNotes}
              onChangeText={setTestNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Send Button */}
        <View style={styles.sendSection}>
          <TouchableOpacity
            style={[
              styles.sendButton,
              isLoading && styles.sendButtonDisabled,
              selectedTemplates.length === 0 && styles.sendButtonDisabled,
            ]}
            onPress={showBulkTest ? sendBulkTest : sendSingleTest}
            disabled={isLoading || selectedTemplates.length === 0}
          >
            <LinearGradient
              colors={['#3B82F6', '#1D4ED8']}
              style={styles.sendButtonGradient}
            >
              <Text style={styles.sendButtonText}>
                {isLoading ? 'Sending...' : `Send ${showBulkTest ? 'Bulk' : ''} Test`}
              </Text>
              <Text style={styles.sendButtonIcon}>🚀</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
  modeToggle: {
    flexDirection: 'row',
    margin: 20,
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    padding: 2,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  modeButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  modeButtonTextActive: {
    color: '#1E293B',
    fontWeight: '600',
  },
  section: {
    margin: 20,
    marginTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 20,
  },
  addButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  templatesGrid: {
    gap: 12,
  },
  templateCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  templateCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EBF4FF',
  },
  templateCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  templateCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
    flex: 1,
    marginRight: 8,
  },
  templateCardStatus: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  templateCardStatusText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  templateCardSubject: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 4,
  },
  templateCardCategory: {
    fontSize: 11,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  recipientCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  recipientHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  recipientInfo: {
    flex: 1,
    marginRight: 12,
  },
  recipientInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    color: '#374151',
    backgroundColor: '#F8FAFC',
    marginBottom: 8,
  },
  roleInput: {
    marginBottom: 0,
  },
  recipientActions: {
    flexDirection: 'row',
    gap: 8,
  },
  expandButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  expandIcon: {
    fontSize: 12,
    color: '#64748B',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  removeIcon: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: 'bold',
  },
  personalizationSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  personalizationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  variableInput: {
    marginBottom: 12,
  },
  variableLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  variableTextInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    padding: 8,
    fontSize: 14,
    color: '#374151',
    backgroundColor: '#FFFFFF',
  },
  groupManager: {
    marginBottom: 16,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  addGroupButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addGroupText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  addGroupForm: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  groupNameInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
  },
  addGroupActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  cancelText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  groupsList: {
    flexDirection: 'row',
    gap: 8,
  },
  groupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  groupChipText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
    marginRight: 8,
  },
  groupRemoveButton: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupRemoveIcon: {
    fontSize: 10,
    color: '#6B7280',
  },
  sampleDataInput: {
    marginBottom: 12,
  },
  sampleDataLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
    fontWeight: '500',
  },
  required: {
    color: '#EF4444',
  },
  sampleDataTextInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    color: '#374151',
    backgroundColor: '#FFFFFF',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginBottom: 16,
  },
  optionLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  notesInput: {
    marginBottom: 16,
  },
  notesLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    fontWeight: '500',
  },
  notesTextInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    color: '#374151',
    backgroundColor: '#FFFFFF',
    height: 80,
  },
  sendSection: {
    margin: 20,
    marginTop: 0,
  },
  sendButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 8,
  },
  sendButtonIcon: {
    fontSize: 16,
  },
  bottomPadding: {
    height: 40,
  },
});

export default TestingCenter;