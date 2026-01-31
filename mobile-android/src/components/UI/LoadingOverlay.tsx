// LoadingOverlay.tsx
// Full-screen loading overlay with spinner and message
// Used during BOS auto-population to hide rendering flash

import React from 'react';
import { Modal, View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { moderateScale, verticalScale } from '../../utils/responsive';
import { colors, radius, spacing, fontSize, fontWeight, shadows } from '../../theme/tokens/tokens';

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
          <ActivityIndicator size="large" color={colors.primary} />
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
    backgroundColor: colors.overlayMedium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: colors.bgSurface,
    borderRadius: moderateScale(radius.lg),
    padding: moderateScale(spacing.wide),
    minWidth: moderateScale(250),
    alignItems: 'center',
    ...shadows.lg,
  },
  message: {
    color: colors.textPrimary,
    fontSize: moderateScale(fontSize.lg),
    fontWeight: fontWeight.semibold,
    marginTop: verticalScale(spacing.base),
    textAlign: 'center',
  },
  submessage: {
    color: colors.textMuted,
    fontSize: moderateScale(fontSize.sm),
    marginTop: verticalScale(spacing.tight),
    textAlign: 'center',
  },
});
