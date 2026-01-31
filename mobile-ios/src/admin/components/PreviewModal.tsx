// Email Template Preview Modal with Mobile/Desktop Toggle
// Advanced preview system with responsive testing capabilities

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from '@react-native-community/blur';

// Types
import {
  EmailTemplate,
  PreviewOptions,
  PreviewModalProps,
  TemplateVariable
} from '../types/emailTemplateTypes';

// Constants
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PreviewDevice {
  name: string;
  width: number;
  height: number;
  icon: string;
  type: 'mobile' | 'tablet' | 'desktop';
}

const PREVIEW_DEVICES: PreviewDevice[] = [
  { name: 'Mobile', width: 375, height: 812, icon: '📱', type: 'mobile' },
  { name: 'Tablet', width: 768, height: 1024, icon: '📱', type: 'tablet' },
  { name: 'Desktop', width: 1200, height: 800, icon: '💻', type: 'desktop' },
];

const EMAIL_CLIENTS = [
  { name: 'Gmail', value: 'gmail', color: '#EA4335' },
  { name: 'Outlook', value: 'outlook', color: '#0078D4' },
  { name: 'Apple Mail', value: 'apple', color: '#007AFF' },
  { name: 'Generic', value: 'generic', color: '#6B7280' },
];

export const PreviewModal: React.FC<PreviewModalProps> = ({
  template,
  isOpen,
  onClose,
  options,
  onOptionsChange,
  className,
  style,
}) => {
  const [currentDevice, setCurrentDevice] = useState<PreviewDevice>(PREVIEW_DEVICES[0]);
  const [showVariables, setShowVariables] = useState(false);
  const [sampleData, setSampleData] = useState<Record<string, any>>({});
  const [previewContent, setPreviewContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Initialize sample data
  useEffect(() => {
    if (template?.variables) {
      const initialData: Record<string, any> = {};
      template.variables.forEach((variable: TemplateVariable) => {
        initialData[variable.key] = variable.defaultValue || variable.examples[0] || `{{${variable.key}}}`;
      });
      setSampleData(initialData);
    }
  }, [template]);

  // Generate preview content
  const processedContent = useMemo(() => {
    if (!template) return '';

    let content = template.htmlContent;

    // Replace variables with sample data
    template.variables?.forEach((variable: TemplateVariable) => {
      const value = sampleData[variable.key] || variable.defaultValue || variable.examples[0] || `{{${variable.key}}}`;
      content = content.replace(new RegExp(`{{${variable.key}}}`, 'g'), value);
    });

    return content;
  }, [template, sampleData]);

  // Update preview content
  useEffect(() => {
    if (processedContent) {
      setIsLoading(true);
      // Simulate processing time
      setTimeout(() => {
        setPreviewContent(processedContent);
        setIsLoading(false);
      }, 500);
    }
  }, [processedContent]);

  // Device selection
  const selectDevice = (device: PreviewDevice) => {
    setCurrentDevice(device);
    onOptionsChange({
      ...options,
      viewMode: device.type === 'desktop' ? 'desktop' : device.type === 'tablet' ? 'tablet' : 'mobile',
    });
  };

  // Email client selection
  const selectEmailClient = (client: string) => {
    onOptionsChange({
      ...options,
      emailClient: client as any,
    });
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    onOptionsChange({
      ...options,
      darkMode: !options.darkMode,
    });
  };

  // Toggle images
  const toggleImages = () => {
    onOptionsChange({
      ...options,
      showImages: !options.showImages,
    });
  };

  if (!isOpen || !template) {
    return null;
  }

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
            <View style={styles.headerTitle}>
              <Text style={styles.titleText}>Preview: {template.name}</Text>
              <Text style={styles.subtitleText}>{template.category}</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setShowVariables(!showVariables)}
            style={styles.variablesButton}
          >
            <Text style={styles.variablesIcon}>⚙️</Text>
            <Text style={styles.variablesText}>Variables</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Controls */}
          <View style={styles.controls}>
            {/* Device Selection */}
            <View style={styles.controlGroup}>
              <Text style={styles.controlLabel}>Device</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.deviceSelector}>
                  {PREVIEW_DEVICES.map((device) => (
                    <TouchableOpacity
                      key={device.name}
                      style={[
                        styles.deviceButton,
                        currentDevice.name === device.name && styles.deviceButtonActive
                      ]}
                      onPress={() => selectDevice(device)}
                    >
                      <Text style={styles.deviceIcon}>{device.icon}</Text>
                      <Text style={[
                        styles.deviceName,
                        currentDevice.name === device.name && styles.deviceNameActive
                      ]}>
                        {device.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Email Client & Options */}
            <View style={styles.optionsRow}>
              {/* Email Client */}
              <View style={styles.controlGroup}>
                <Text style={styles.controlLabel}>Client</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.clientSelector}>
                    {EMAIL_CLIENTS.map((client) => (
                      <TouchableOpacity
                        key={client.value}
                        style={[
                          styles.clientButton,
                          options.emailClient === client.value && styles.clientButtonActive
                        ]}
                        onPress={() => selectEmailClient(client.value)}
                      >
                        <View
                          style={[
                            styles.clientDot,
                            { backgroundColor: client.color }
                          ]}
                        />
                        <Text style={[
                          styles.clientName,
                          options.emailClient === client.value && styles.clientNameActive
                        ]}>
                          {client.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Toggle Options */}
              <View style={styles.toggles}>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    options.darkMode && styles.toggleButtonActive
                  ]}
                  onPress={toggleDarkMode}
                >
                  <Text style={styles.toggleIcon}>🌙</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    options.showImages && styles.toggleButtonActive
                  ]}
                  onPress={toggleImages}
                >
                  <Text style={styles.toggleIcon}>🖼️</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Preview Area */}
          <View style={styles.previewArea}>
            <View
              style={[
                styles.previewContainer,
                {
                  width: Math.min(currentDevice.width, SCREEN_WIDTH - 40),
                  height: Math.min(currentDevice.height, SCREEN_HEIGHT - 200),
                },
                options.darkMode && styles.previewContainerDark
              ]}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <View style={styles.loadingSpinner} />
                  <Text style={styles.loadingText}>Generating preview...</Text>
                </View>
              ) : (
                <ScrollView
                  style={styles.previewScroll}
                  showsVerticalScrollIndicator={true}
                >
                  {/* Email Header Simulation */}
                  <View style={[
                    styles.emailHeader,
                    options.darkMode && styles.emailHeaderDark
                  ]}>
                    <View style={styles.emailMeta}>
                      <Text style={[
                        styles.emailSubject,
                        options.darkMode && styles.emailSubjectDark
                      ]}>
                        {template.subject}
                      </Text>
                      <Text style={[
                        styles.emailFrom,
                        options.darkMode && styles.emailFromDark
                      ]}>
                        From: Skyfire Solar &lt;noreply@skyfire.com&gt;
                      </Text>
                    </View>
                  </View>

                  {/* Email Content */}
                  <View style={[
                    styles.emailContent,
                    options.darkMode && styles.emailContentDark
                  ]}>
                    {/* For now, we'll show a styled version of the content */}
                    <Text style={[
                      styles.contentText,
                      options.darkMode && styles.contentTextDark
                    ]}>
                      {previewContent.replace(/<[^>]*>/g, '')} {/* Strip HTML for now */}
                    </Text>
                  </View>
                </ScrollView>
              )}
            </View>

            {/* Device Info */}
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceInfoText}>
                {currentDevice.name} • {currentDevice.width}×{currentDevice.height} • {options.emailClient}
              </Text>
            </View>
          </View>
        </View>

        {/* Variables Panel */}
        {showVariables && (
          <BlurView style={styles.variablesOverlay} blurType="dark">
            <View style={styles.variablesPanel}>
              <View style={styles.variablesPanelHeader}>
                <Text style={styles.variablesPanelTitle}>Template Variables</Text>
                <TouchableOpacity
                  onPress={() => setShowVariables(false)}
                  style={styles.variablesPanelClose}
                >
                  <Text style={styles.closeIcon}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.variablesList}>
                {template.variables?.map((variable: TemplateVariable) => (
                  <View key={variable.key} style={styles.variableItem}>
                    <View style={styles.variableHeader}>
                      <Text style={styles.variableName}>{variable.name}</Text>
                      <Text style={styles.variableType}>{variable.type}</Text>
                    </View>
                    <Text style={styles.variableDescription}>{variable.description}</Text>

                    {/* Simple text input for now */}
                    <View style={styles.variableInput}>
                      <Text style={styles.variableValue}>
                        {sampleData[variable.key] || variable.defaultValue || 'No value'}
                      </Text>
                    </View>

                    {variable.examples.length > 0 && (
                      <View style={styles.variableExamples}>
                        <Text style={styles.examplesLabel}>Examples:</Text>
                        {variable.examples.slice(0, 2).map((example, index) => (
                          <TouchableOpacity
                            key={index}
                            style={styles.exampleButton}
                            onPress={() => setSampleData({ ...sampleData, [variable.key]: example })}
                          >
                            <Text style={styles.exampleText}>{example}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>
          </BlurView>
        )}
      </SafeAreaView>
    </Modal>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  closeIcon: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: 'bold',
  },
  headerTitle: {
    flex: 1,
  },
  titleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 2,
  },
  subtitleText: {
    fontSize: 14,
    color: '#64748B',
    textTransform: 'capitalize',
  },
  variablesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  variablesIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  variablesText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  controls: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  controlGroup: {
    marginBottom: 15,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  deviceSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  deviceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  deviceButtonActive: {
    backgroundColor: '#EBF4FF',
    borderColor: '#3B82F6',
  },
  deviceIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  deviceName: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  deviceNameActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  clientSelector: {
    flexDirection: 'row',
    gap: 6,
  },
  clientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  clientButtonActive: {
    backgroundColor: '#EBF4FF',
    borderColor: '#3B82F6',
  },
  clientDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  clientName: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  clientNameActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  toggles: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  toggleButtonActive: {
    backgroundColor: '#EBF4FF',
    borderColor: '#3B82F6',
  },
  toggleIcon: {
    fontSize: 16,
  },
  previewArea: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
  },
  previewContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  previewContainerDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingSpinner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#E2E8F0',
    borderTopColor: '#3B82F6',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
  },
  previewScroll: {
    flex: 1,
  },
  emailHeader: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  emailHeaderDark: {
    backgroundColor: '#0F172A',
    borderBottomColor: '#334155',
  },
  emailMeta: {},
  emailSubject: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  emailSubjectDark: {
    color: '#F1F5F9',
  },
  emailFrom: {
    fontSize: 12,
    color: '#64748B',
  },
  emailFromDark: {
    color: '#94A3B8',
  },
  emailContent: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  emailContentDark: {
    backgroundColor: '#1E293B',
  },
  contentText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
  },
  contentTextDark: {
    color: '#E2E8F0',
  },
  deviceInfo: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
  },
  deviceInfoText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },

  // Variables Panel
  variablesOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
  },
  variablesPanel: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.7,
    paddingTop: 20,
  },
  variablesPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  variablesPanelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  variablesPanelClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  variablesList: {
    paddingHorizontal: 20,
  },
  variableItem: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  variableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  variableName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  variableType: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  variableDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  variableInput: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  variableValue: {
    fontSize: 14,
    color: '#374151',
  },
  variableExamples: {
    marginTop: 8,
  },
  examplesLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  exampleButton: {
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  exampleText: {
    fontSize: 12,
    color: '#3B82F6',
  },
});

export default PreviewModal;