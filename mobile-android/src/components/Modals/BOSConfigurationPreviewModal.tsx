// BOSConfigurationPreviewModal.tsx
// Modal to preview BOS equipment that will be added based on detected configuration

import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { BLUE_TC_TB } from '../../styles/gradient';
import { moderateScale, verticalScale, fontSize } from '../../utils/responsive';
import Button from '../Button';
import { ConfigurationMatch, BOSEquipment } from '../../utils/configurations';

interface BOSConfigurationPreviewModalProps {
  visible: boolean;
  configurationMatch: ConfigurationMatch | null;
  configurationMatches?: ConfigurationMatch[]; // NEW: For multi-system display
  onYes: () => void;
  onNo: () => void;
  onEdit?: () => void; // Optional for future
}

export default function BOSConfigurationPreviewModal({
  visible,
  configurationMatch,
  configurationMatches,
  onYes,
  onNo,
  onEdit,
}: BOSConfigurationPreviewModalProps) {
  // Use configurationMatches if provided (multi-system), otherwise fall back to single configurationMatch
  const configs = configurationMatches && configurationMatches.length > 0 ? configurationMatches : (configurationMatch ? [configurationMatch] : []);

  if (configs.length === 0) return null;

  const isMultiSystem = configs.length > 1;

  // Calculate total items across all configs
  const totalItems = configs.reduce((sum, config) => sum + config.bosEquipment.length, 0);

  // Helper to render a single configuration's BOS equipment
  const renderConfigurationBOS = (config: ConfigurationMatch, configIndex: number) => {
    // Group BOS equipment by section for this config
    const utilityBOS = config.bosEquipment.filter((item) => item.section === 'utility');
    const batteryBOS = config.bosEquipment.filter((item) => item.section === 'battery');
    const backupBOS = config.bosEquipment.filter((item) => item.section === 'backup');
    const postSMSBOS = config.bosEquipment.filter((item) => item.section === 'post-sms');
    const combineBOS = config.bosEquipment.filter((item) => item.section === 'combine');

    return (
      <View key={configIndex} style={styles.configurationContainer}>
        {/* System Header (only show if multiple systems) */}
        {isMultiSystem && (
          <View style={styles.systemHeaderContainer}>
            <View style={styles.systemNumberBadge}>
              <Text style={styles.systemNumberBadgeText}>{config.systemNumber}</Text>
            </View>
            <Text style={styles.systemHeaderText}>{config.configName}</Text>
          </View>
        )}

        {/* Confidence Badge */}
        {!isMultiSystem && (
          <View style={styles.confidenceBadge}>
            <Text style={styles.confidenceText}>
              {config.confidence.toUpperCase()} MATCH
            </Text>
          </View>
        )}

        {/* BOS Equipment Sections */}
        {utilityBOS.length > 0 && (
          <BOSSection
            title="Pre-Combine BOS (String Combiner)"
            subtitle={`${utilityBOS.length} item${utilityBOS.length > 1 ? 's' : ''}`}
            items={utilityBOS}
            color="#4A90E2"
            systemNumber={config.systemNumber}
          />
        )}

        {batteryBOS.length > 0 && (
          <BOSSection
            title="Battery Chain BOS"
            subtitle={`${batteryBOS.length} item${batteryBOS.length > 1 ? 's' : ''}`}
            items={batteryBOS}
            color="#50C878"
            systemNumber={config.systemNumber}
          />
        )}

        {postSMSBOS.length > 0 && (
          <BOSSection
            title="Post-SMS BOS"
            subtitle={`${postSMSBOS.length} item${postSMSBOS.length > 1 ? 's' : ''}`}
            items={postSMSBOS}
            color="#9B59B6"
            systemNumber={config.systemNumber}
          />
        )}

        {backupBOS.length > 0 && (
          <BOSSection
            title="Backup Load Sub Panel BOS"
            subtitle={`${backupBOS.length} item${backupBOS.length > 1 ? 's' : ''}`}
            items={backupBOS}
            color="#FD7332"
            systemNumber={config.systemNumber}
          />
        )}

        {combineBOS.length > 0 && (
          <BOSSection
            title="Combine Systems BOS (Equipment Page)"
            subtitle={`${combineBOS.length} item${combineBOS.length > 1 ? 's' : ''}`}
            items={combineBOS}
            color="#E74C3C"
            systemNumber={config.systemNumber}
          />
        )}

        {/* Warning if any */}
        {config.warnings && config.warnings.length > 0 && (
          <View style={styles.warningSection}>
            <Text style={styles.warningTitle}>⚠️ Warnings:</Text>
            {config.warnings.map((warning, index) => (
              <Text key={index} style={styles.warningText}>
                • {warning}
              </Text>
            ))}
          </View>
        )}

        {/* Separator between systems */}
        {isMultiSystem && configIndex < configs.length - 1 && (
          <View style={styles.systemSeparator} />
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onNo}
    >
      <View style={styles.overlay}>
        <View style={[styles.borderContainer, isMultiSystem && styles.borderContainerLarge]}>
          <LinearGradient {...BLUE_TC_TB} style={[styles.modalContainer, isMultiSystem && styles.modalContainerLarge]}>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Title - Single System */}
              {!isMultiSystem && (
                <>
                  <View style={styles.titleContainer}>
                    <View style={styles.numberCircle}>
                      <Text style={styles.numberText}>
                        {configs[0].systemNumber}
                      </Text>
                    </View>
                    <Text style={styles.title}>
                      {configs[0].configName}
                    </Text>
                  </View>
                </>
              )}

              {/* Title - Multi System */}
              {isMultiSystem && (
                <View style={styles.multiSystemTitleContainer}>
                  <Text style={styles.multiSystemTitle}>
                    Multi-System BOS Configuration
                  </Text>
                  <Text style={styles.multiSystemSubtitle}>
                    {configs.length} systems detected
                  </Text>
                </View>
              )}

              {/* Render all configurations */}
              {configs.map((config, index) => renderConfigurationBOS(config, index))}

              {/* Summary */}
              <View style={styles.summarySection}>
                <Text style={styles.summaryText}>
                  {isMultiSystem
                    ? `Add ${totalItems} BOS equipment items across ${configs.length} systems?`
                    : `Add ${totalItems} BOS equipment item${totalItems > 1 ? 's' : ''} to System ${configs[0].systemNumber}?`
                  }
                </Text>
              </View>
            </ScrollView>

            {/* Buttons */}
            <View style={styles.buttonsContainer}>
              <Button
                title="Yes, Add BOS"
                onPress={() => {
                  console.log('[BOSConfigurationPreviewModal] Yes button pressed in modal!');
                  onYes();
                }}
                selected={true}
                width="48%"
                height={44}
                rounded={24}
                textStyle={styles.buttonText}
              />
              <Button
                title="No, Cancel"
                onPress={onNo}
                selected={false}
                width="48%"
                height={44}
                rounded={24}
                textStyle={styles.buttonText}
              />
            </View>

            {/* Edit button (for future) */}
            {onEdit && (
              <Button
                title="Edit Equipment"
                onPress={onEdit}
                width="100%"
                height={44}
                rounded={24}
                style={styles.editButton}
                textStyle={styles.editButtonText}
              />
            )}
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

// Sub-component for each BOS section
interface BOSSectionProps {
  title: string;
  subtitle: string;
  items: BOSEquipment[];
  color: string;
  systemNumber: number;
}

function BOSSection({ title, subtitle, items, color, systemNumber }: BOSSectionProps) {
  return (
    <View style={styles.bosSection}>
      <View style={[styles.bosSectionHeader, { borderLeftColor: color }]}>
        <Text style={styles.bosSectionTitle}>{title}</Text>
        <Text style={styles.bosSectionSubtitle}>{subtitle}</Text>
      </View>

      {items.map((item, index) => (
        <View key={index} style={styles.bosItem}>
          <View style={styles.bosItemHeader}>
            <View style={styles.bosItemNumberCircle}>
              <Text style={styles.bosItemNumberText}>{systemNumber}</Text>
            </View>
            <Text style={styles.bosItemType}>{item.equipmentType}</Text>
          </View>

          {item.make && item.model ? (
            <View style={styles.bosItemDetails}>
              <Text style={styles.bosItemDetail}>
                <Text style={styles.bosItemLabel}>Make: </Text>
                {item.make}
              </Text>
              <Text style={styles.bosItemDetail}>
                <Text style={styles.bosItemLabel}>Model: </Text>
                {item.model}
              </Text>
              {item.ampRating && (
                <Text style={styles.bosItemDetail}>
                  <Text style={styles.bosItemLabel}>Amp: </Text>
                  {item.ampRating}A
                </Text>
              )}
            </View>
          ) : (
            <Text style={styles.bosItemAutoSelect}>
              {item.autoSelected
                ? '✓ Auto-selected'
                : 'Will auto-select from catalog'}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(12,31,63,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
  },
  borderContainer: {
    width: '100%',
    maxWidth: moderateScale(500),
    maxHeight: '90%',
    borderRadius: moderateScale(24),
    borderWidth: moderateScale(2),
    borderColor: '#888888',
    overflow: 'hidden',
  },
  modalContainer: {
    width: '100%',
    borderRadius: moderateScale(22),
    padding: moderateScale(20),
  },
  scrollView: {
    maxHeight: verticalScale(500),
  },
  scrollContent: {
    paddingBottom: verticalScale(10),
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(8),
  },
  numberCircle: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: moderateScale(12),
    marginTop: -4,
  },
  numberText: {
    color: '#FFFFFF',
    fontSize: moderateScale(24),
    fontWeight: '700',
    fontFamily: 'Lato-Bold',
    lineHeight: moderateScale(24),
    includeFontPadding: false,
    textAlignVertical: 'center',
    marginTop: 4,
  },
  title: {
    color: '#FD7332',
    fontSize: fontSize(22),
    fontWeight: '700',
    fontFamily: 'Lato-Bold',
    marginTop: verticalScale(3),
  },
  description: {
    color: '#CCCCCC',
    fontSize: fontSize(13),
    textAlign: 'center',
    marginBottom: verticalScale(12),
    fontFamily: 'Lato-Regular',
    fontStyle: 'italic',
    lineHeight: fontSize(18),
  },
  confidenceBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(253, 115, 50, 0.2)',
    borderWidth: 1,
    borderColor: '#FD7332',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(4),
    marginBottom: verticalScale(16),
  },
  confidenceText: {
    color: '#FD7332',
    fontSize: fontSize(11),
    fontWeight: '700',
    fontFamily: 'Lato-Bold',
  },

  // BOS Section Styles
  bosSection: {
    marginBottom: verticalScale(16),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: moderateScale(12),
    overflow: 'hidden',
  },
  bosSectionHeader: {
    borderLeftWidth: moderateScale(4),
    paddingLeft: moderateScale(12),
    paddingVertical: verticalScale(8),
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  bosSectionTitle: {
    color: '#FFF',
    fontSize: fontSize(16),
    fontWeight: '700',
    fontFamily: 'Lato-Bold',
  },
  bosSectionSubtitle: {
    color: '#AAAAAA',
    fontSize: fontSize(12),
    fontFamily: 'Lato-Regular',
    marginTop: verticalScale(2),
  },
  bosItem: {
    padding: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  bosItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(6),
  },
  bosItemNumberCircle: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: moderateScale(12),
    marginTop: -3,
  },
  bosItemNumberText: {
    color: '#FFFFFF',
    fontSize: moderateScale(18),
    fontWeight: '700',
    fontFamily: 'Lato-Bold',
    lineHeight: moderateScale(18),
    includeFontPadding: false,
    textAlignVertical: 'center',
    marginTop: 3,
  },
  bosItemType: {
    color: '#FFF',
    fontSize: fontSize(14),
    fontWeight: '600',
    fontFamily: 'Lato-Bold',
    flex: 1,
    marginTop: verticalScale(3),
  },
  bosItemDetails: {
    marginLeft: moderateScale(8),
  },
  bosItemDetail: {
    color: '#CCCCCC',
    fontSize: fontSize(12),
    fontFamily: 'Lato-Regular',
    marginBottom: verticalScale(2),
  },
  bosItemLabel: {
    color: '#888888',
    fontWeight: '600',
  },
  bosItemAutoSelect: {
    color: '#FD7332',
    fontSize: fontSize(11),
    fontFamily: 'Lato-Regular',
    fontStyle: 'italic',
    marginLeft: moderateScale(8),
  },

  // Notes Section
  notesSection: {
    marginBottom: verticalScale(16),
    padding: moderateScale(12),
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.3)',
  },
  notesTitle: {
    color: '#4A90E2',
    fontSize: fontSize(14),
    fontWeight: '700',
    fontFamily: 'Lato-Bold',
    marginBottom: verticalScale(8),
  },
  noteItem: {
    flexDirection: 'row',
    marginBottom: verticalScale(4),
  },
  noteBullet: {
    color: '#4A90E2',
    fontSize: fontSize(14),
    marginRight: moderateScale(8),
  },
  noteText: {
    color: '#CCCCCC',
    fontSize: fontSize(12),
    fontFamily: 'Lato-Regular',
    flex: 1,
    lineHeight: fontSize(16),
  },

  // Warning Section
  warningSection: {
    marginBottom: verticalScale(16),
    padding: moderateScale(12),
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.3)',
  },
  warningTitle: {
    color: '#E74C3C',
    fontSize: fontSize(14),
    fontWeight: '700',
    fontFamily: 'Lato-Bold',
    marginBottom: verticalScale(8),
  },
  warningText: {
    color: '#E74C3C',
    fontSize: fontSize(12),
    fontFamily: 'Lato-Regular',
    marginBottom: verticalScale(4),
  },

  // Summary Section
  summarySection: {
    marginTop: verticalScale(8),
    marginBottom: verticalScale(16),
  },
  summaryText: {
    color: '#FFF',
    fontSize: fontSize(16),
    textAlign: 'center',
    fontFamily: 'Lato-Bold',
    fontWeight: '700',
  },

  // Buttons
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: moderateScale(10),
    marginTop: verticalScale(12),
  },
  editButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#888888',
    marginTop: verticalScale(8),
  },
  buttonText: {
    fontSize: fontSize(14),
    fontWeight: '700',
    fontFamily: 'Lato-Bold',
  },
  editButtonText: {
    fontSize: fontSize(13),
    fontWeight: '600',
    fontFamily: 'Lato-Bold',
    color: '#CCCCCC',
  },

  // Multi-System Styles
  borderContainerLarge: {
    maxWidth: moderateScale(700), // Wider for multi-system
    maxHeight: '95%', // Taller
  },
  modalContainerLarge: {
    paddingHorizontal: moderateScale(16), // Slightly smaller padding for more space
  },
  multiSystemTitleContainer: {
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  multiSystemTitle: {
    color: '#FD7332',
    fontSize: fontSize(24),
    fontWeight: '700',
    fontFamily: 'Lato-Bold',
    textAlign: 'center',
  },
  multiSystemSubtitle: {
    color: '#CCCCCC',
    fontSize: fontSize(14),
    fontFamily: 'Lato-Regular',
    marginTop: verticalScale(4),
  },
  configurationContainer: {
    marginBottom: verticalScale(12),
  },
  systemHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(16),
    paddingBottom: verticalScale(8),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  systemNumberBadge: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    borderWidth: 2,
    borderColor: '#4A90E2',
    backgroundColor: 'rgba(74, 144, 226, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: moderateScale(12),
  },
  systemNumberBadgeText: {
    color: '#4A90E2',
    fontSize: fontSize(18),
    fontWeight: '700',
    fontFamily: 'Lato-Bold',
  },
  systemHeaderText: {
    color: '#FFFFFF',
    fontSize: fontSize(16),
    fontWeight: '600',
    fontFamily: 'Lato-Bold',
    flex: 1,
  },
  systemSeparator: {
    height: 2,
    backgroundColor: 'rgba(253, 115, 50, 0.3)',
    marginVertical: verticalScale(20),
    marginHorizontal: moderateScale(-10),
  },
});
