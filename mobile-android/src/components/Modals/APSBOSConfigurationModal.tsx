// APSBOSConfigurationModal.tsx
// Modal for displaying APS BOS equipment requirements

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
import { moderateScale, verticalScale, fontSize } from '../../utils/responsive';
import { BLUE_TC_TB } from '../../styles/gradient';
import { ConfigurationOutput } from '../../utils/Apsconfigurationswitchboard';

interface APSBOSConfigurationModalProps {
  visible: boolean;
  configuration: ConfigurationOutput | null;
  onAccept: () => void;
  onDecline: () => void;
  onAskLater: () => void;
}

export const APSBOSConfigurationModal: React.FC<APSBOSConfigurationModalProps> = ({
  visible,
  configuration,
  onAccept,
  onDecline,
  onAskLater,
}) => {
  if (!configuration) return null;

  const requiredEquipmentList: string[] = [];

  // Build list of required equipment
  if (configuration.requiredEquipment.solarPanels) {
    requiredEquipmentList.push('Solar Panel Array');
  }

  if (configuration.requiredEquipment.batteryQuantity > 0) {
    requiredEquipmentList.push(
      `Battery System (Quantity: ${configuration.requiredEquipment.batteryQuantity})`
    );
  }

  if (configuration.requiredEquipment.hybridInverter > 0) {
    requiredEquipmentList.push(
      `Hybrid Inverter (${configuration.requiredEquipment.hybridInverter})`
    );
  }

  if (configuration.requiredEquipment.gridFormingFollowingInverter > 0) {
    requiredEquipmentList.push(
      `Grid Forming/Following Inverter (${configuration.requiredEquipment.gridFormingFollowingInverter})`
    );
  }

  if (configuration.requiredEquipment.gridFollowingInverter > 0) {
    requiredEquipmentList.push(
      `Grid Following Inverter (${configuration.requiredEquipment.gridFollowingInverter})`
    );
  }

  if (configuration.requiredEquipment.backupLoadPanel) {
    requiredEquipmentList.push('Backup Load Panel');
  }

  if (configuration.requiredEquipment.automaticDisconnectSwitch) {
    requiredEquipmentList.push('Automatic Disconnect Switch (ADS)');
  }

  if (configuration.requiredEquipment.transferSwitch) {
    requiredEquipmentList.push('Transfer Switch');
  }

  if (configuration.requiredEquipment.batteryCharger) {
    requiredEquipmentList.push('Battery Charger');
  }

  if (configuration.requiredEquipment.dedicatedDERCombiner) {
    requiredEquipmentList.push('Dedicated DER Combiner Panel');
  }

  // Add BOS equipment
  const bosTypes: string[] = [];
  Object.entries(configuration.equipmentSections.bos).forEach(([key, value]) => {
    if (value) {
      const typeNum = key.replace('type', '');
      bosTypes.push(`BOS Type ${typeNum}`);
    }
  });

  if (bosTypes.length > 0) {
    requiredEquipmentList.push(...bosTypes);
  }

  // Add meters
  if (configuration.requiredEquipment.biDirectionalMeters > 0) {
    requiredEquipmentList.push(
      `Bi-Directional Meters (${configuration.requiredEquipment.biDirectionalMeters})`
    );
  }

  if (configuration.requiredEquipment.uniDirectionalMeters > 0) {
    requiredEquipmentList.push(
      `Uni-Directional Meters (${configuration.requiredEquipment.uniDirectionalMeters})`
    );
  }

  return (
    <Modal
      key={`aps-bos-modal-${configuration.configurationId}`}
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onAskLater}
    >
      <View style={styles.overlay}>
        <View style={styles.borderContainer}>
          <LinearGradient
            {...BLUE_TC_TB}
            style={styles.modalContainer}
          >
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <Text style={styles.title}>
              APS Configuration: {configuration.configurationName}
            </Text>

            {/* Description */}
            <Text style={styles.description}>{configuration.description}</Text>

            {/* Required Equipment */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Required Equipment:</Text>
              {requiredEquipmentList.map((item, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={styles.bullet}>{'\u2022'}</Text>
                  <Text style={styles.listText}>{item}</Text>
                </View>
              ))}
            </View>

            {/* Notes */}
            {configuration.notes.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Important Notes:</Text>
                {configuration.notes.map((note, index) => (
                  <View key={index} style={styles.listItem}>
                    <Text style={styles.bullet}>{'\u2022'}</Text>
                    <Text style={styles.noteText}>{note}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={onAccept}>
              <LinearGradient
                colors={['#FD7332', '#B92011']}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.buttonText}>Accept</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.buttonOutline} onPress={onDecline}>
              <Text style={styles.buttonOutlineText}>Custom Equipment</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.buttonOutline} onPress={onAskLater}>
              <Text style={styles.buttonOutlineText}>Ask Later</Text>
            </TouchableOpacity>
          </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(12,31,63,0.75)",
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
  },
  borderContainer: {
    width: '100%',
    maxWidth: moderateScale(400),
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
    maxHeight: verticalScale(400),
  },
  scrollContent: {
    paddingBottom: verticalScale(10),
  },
  title: {
    color: '#FD7332',
    fontSize: fontSize(24),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: verticalScale(8),
    fontFamily: 'Lato-Bold',
  },
  description: {
    color: '#CCCCCC',
    fontSize: fontSize(13),
    textAlign: 'center',
    marginBottom: verticalScale(16),
    fontFamily: 'Lato-Regular',
    fontStyle: 'italic',
  },
  section: {
    marginBottom: verticalScale(16),
  },
  sectionTitle: {
    fontSize: fontSize(18),
    fontWeight: '600',
    color: '#FD7332',
    marginBottom: verticalScale(8),
    fontFamily: 'Lato-Bold',
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: verticalScale(10),
    paddingLeft: moderateScale(8),
  },
  bullet: {
    color: '#FD7332',
    fontSize: fontSize(20),
    marginRight: moderateScale(12),
    lineHeight: fontSize(20),
  },
  listText: {
    flex: 1,
    color: '#FFF',
    fontSize: fontSize(16),
    fontFamily: 'Lato-Regular',
  },
  noteText: {
    flex: 1,
    color: '#CCCCCC',
    fontSize: fontSize(14),
    fontFamily: 'Lato-Regular',
    fontStyle: 'italic',
  },
  buttonContainer: {
    marginTop: verticalScale(10),
    gap: verticalScale(12),
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
    fontSize: fontSize(16),
    fontWeight: '700',
    fontFamily: 'Lato-Bold',
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
    fontSize: fontSize(14),
    fontWeight: '600',
    fontFamily: 'Lato-Bold',
  },
});
