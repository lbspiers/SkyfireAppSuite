// LoadingOverlay.tsx
// Full-screen loading overlay with spinner and message
// Used during BOS auto-population to hide rendering flash

import React from 'react';
import { Modal, View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { moderateScale, verticalScale } from '../../utils/responsive';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  submessage?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = 'Loading...',
  submessage,
}) => {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ActivityIndicator size="large" color="#00A3FF" />
          <Text style={styles.message}>{message}</Text>
          {submessage && <Text style={styles.submessage}>{submessage}</Text>}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#1E1E1E',
    borderRadius: moderateScale(12),
    padding: moderateScale(32),
    minWidth: moderateScale(250),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  message: {
    color: '#FFF',
    fontSize: moderateScale(18),
    fontWeight: '600',
    marginTop: verticalScale(16),
    textAlign: 'center',
  },
  submessage: {
    color: '#AAA',
    fontSize: moderateScale(14),
    marginTop: verticalScale(8),
    textAlign: 'center',
  },
});
