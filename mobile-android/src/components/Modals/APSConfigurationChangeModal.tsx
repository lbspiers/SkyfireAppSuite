// APSConfigurationChangeModal.tsx
// Modal for displaying configuration changes when equipment changes

import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { moderateScale, verticalScale } from '../../utils/responsive';
import { ConfigurationChange } from '../../services/APSConfigurationManager';

interface APSConfigurationChangeModalProps {
  visible: boolean;
  change: ConfigurationChange | null;
  onAcceptChanges: () => void;
  onCustomEquipment: () => void;
  onCancel: () => void;
}

export const APSConfigurationChangeModal: React.FC<APSConfigurationChangeModalProps> = ({
  visible,
  change,
  onAcceptChanges,
  onCustomEquipment,
  onCancel,
}) => {
  if (!change) return null;

  const hasRemoved = change.removed.length > 0;
  const hasAdded = change.added.length > 0;
  const hasReplaced = change.replaced.length > 0;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <Text style={styles.title}>Configuration Changed</Text>

            {/* Configuration Change Info */}
            <View style={styles.configInfo}>
              <Text style={styles.configLabel}>Previous Configuration:</Text>
              <Text style={styles.configValue}>{change.oldConfig}</Text>
            </View>

            <View style={styles.arrow}>
              <Text style={styles.arrowText}>↓</Text>
            </View>

            <View style={styles.configInfo}>
              <Text style={styles.configLabel}>New Configuration:</Text>
              <Text style={styles.configValueNew}>{change.newConfig}</Text>
            </View>

            {/* Replaced Equipment */}
            {hasReplaced && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Replace Equipment:</Text>
                {change.replaced.map((item, index) => (
                  <View key={index} style={styles.replaceItem}>
                    <Text style={styles.oldEquipment}>{item.old}</Text>
                    <Text style={styles.replaceArrow}>  →  </Text>
                    <Text style={styles.newEquipment}>{item.new}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Removed Equipment */}
            {hasRemoved && (
              <View style={styles.section}>
                <Text style={styles.sectionTitleRemove}>Remove Equipment:</Text>
                {change.removed.map((item, index) => (
                  <View key={index} style={styles.listItem}>
                    <Text style={styles.bulletRemove}>{'\u2022'}</Text>
                    <Text style={styles.listTextRemove}>{item}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Added Equipment */}
            {hasAdded && (
              <View style={styles.section}>
                <Text style={styles.sectionTitleAdd}>Add Equipment:</Text>
                {change.added.map((item, index) => (
                  <View key={index} style={styles.listItem}>
                    <Text style={styles.bulletAdd}>{'\u2022'}</Text>
                    <Text style={styles.listTextAdd}>{item}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Information */}
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Your system configuration has changed based on the equipment you've selected.
                The changes above are required to meet APS ESS requirements.
              </Text>
            </View>
          </ScrollView>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={onAcceptChanges}>
              <LinearGradient
                colors={['#FD7332', '#B92011']}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.buttonText}>Accept Changes</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.buttonOutline} onPress={onCustomEquipment}>
              <Text style={styles.buttonOutlineText}>Custom Equipment</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.buttonOutline} onPress={onCancel}>
              <Text style={styles.buttonOutlineText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(20),
  },
  modalContainer: {
    backgroundColor: '#0C1F3F',
    borderRadius: moderateScale(12),
    width: '100%',
    maxWidth: moderateScale(500),
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#1E3A5F',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: moderateScale(20),
  },
  title: {
    fontSize: moderateScale(20),
    fontWeight: '700',
    color: '#FD7332',
    marginBottom: verticalScale(16),
    textAlign: 'center',
  },
  configInfo: {
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  configLabel: {
    fontSize: moderateScale(12),
    color: '#A8C5E6',
    marginBottom: verticalScale(4),
  },
  configValue: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  configValueNew: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#4CAF50',
  },
  arrow: {
    alignItems: 'center',
    marginVertical: verticalScale(8),
  },
  arrowText: {
    fontSize: moderateScale(24),
    color: '#FD7332',
  },
  section: {
    marginTop: verticalScale(16),
    marginBottom: verticalScale(8),
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#FD7332',
    marginBottom: verticalScale(8),
  },
  sectionTitleRemove: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#FF6B6B',
    marginBottom: verticalScale(8),
  },
  sectionTitleAdd: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: verticalScale(8),
  },
  replaceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(8),
    paddingLeft: moderateScale(8),
  },
  oldEquipment: {
    color: '#FF6B6B',
    fontSize: moderateScale(14),
    textDecorationLine: 'line-through',
  },
  replaceArrow: {
    color: '#FD7332',
    fontSize: moderateScale(14),
    fontWeight: '700',
  },
  newEquipment: {
    color: '#4CAF50',
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: verticalScale(6),
    paddingLeft: moderateScale(8),
  },
  bullet: {
    marginRight: moderateScale(8),
    fontSize: moderateScale(14),
  },
  bulletRemove: {
    color: '#FF6B6B',
    marginRight: moderateScale(8),
    fontSize: moderateScale(14),
  },
  bulletAdd: {
    color: '#4CAF50',
    marginRight: moderateScale(8),
    fontSize: moderateScale(14),
  },
  listText: {
    flex: 1,
    fontSize: moderateScale(14),
    lineHeight: moderateScale(20),
  },
  listTextRemove: {
    flex: 1,
    color: '#FF6B6B',
    fontSize: moderateScale(14),
    lineHeight: moderateScale(20),
  },
  listTextAdd: {
    flex: 1,
    color: '#4CAF50',
    fontSize: moderateScale(14),
    lineHeight: moderateScale(20),
  },
  infoBox: {
    backgroundColor: '#1E3A5F',
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    marginTop: verticalScale(16),
  },
  infoText: {
    color: '#A8C5E6',
    fontSize: moderateScale(13),
    lineHeight: moderateScale(18),
    fontStyle: 'italic',
  },
  buttonContainer: {
    padding: moderateScale(20),
    gap: verticalScale(12),
    borderTopWidth: 1,
    borderTopColor: '#1E3A5F',
  },
  button: {
    borderRadius: moderateScale(24),
    overflow: 'hidden',
  },
  gradient: {
    paddingVertical: verticalScale(12),
    paddingHorizontal: moderateScale(20),
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(16),
    fontWeight: '700',
  },
  buttonOutline: {
    borderWidth: moderateScale(1),
    borderColor: '#888888',
    borderRadius: moderateScale(24),
    paddingVertical: verticalScale(12),
    paddingHorizontal: moderateScale(20),
    alignItems: 'center',
  },
  buttonOutlineText: {
    color: '#BBBBBB',
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
});
