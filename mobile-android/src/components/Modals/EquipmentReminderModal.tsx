// src/components/Modals/EquipmentReminderModal.tsx
import React from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
} from 'react-native';
import { moderateScale, verticalScale } from '../../utils/responsive';

interface Props {
  visible: boolean;
  equipmentType: string; // e.g., "SMS", "Battery Combiner Panel"
  onClose: () => void;
}

export default function EquipmentReminderModal({
  visible,
  equipmentType,
  onClose,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Equipment Not Selected</Text>
          <Text style={styles.message}>
            No {equipmentType} is selected yet. Please choose a make and model for the {equipmentType}.
          </Text>

          <TouchableOpacity
            style={styles.okayButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.okayButtonText}>Okay</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(20),
  },
  modalContent: {
    backgroundColor: '#1E3A5F',
    borderRadius: moderateScale(12),
    padding: moderateScale(24),
    width: '100%',
    maxWidth: moderateScale(400),
    alignItems: 'center',
  },
  title: {
    fontSize: moderateScale(22),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: verticalScale(12),
    textAlign: 'center',
  },
  message: {
    fontSize: moderateScale(18),
    color: '#FFFFFF',
    marginBottom: verticalScale(24),
    textAlign: 'center',
    lineHeight: moderateScale(24),
  },
  okayButton: {
    backgroundColor: '#B92011',
    paddingHorizontal: moderateScale(40),
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(8),
    minWidth: moderateScale(120),
  },
  okayButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(18),
    fontWeight: '700',
    textAlign: 'center',
  },
});
