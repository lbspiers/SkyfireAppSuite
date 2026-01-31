// HeaderNotification.tsx - Subtle notification that appears in the header
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { moderateScale } from '../../../../utils/responsive';

type NotificationType = 'success' | 'error';

interface HeaderNotificationProps {
  message: string | null;
  type: NotificationType;
  onComplete?: () => void;
}

const HeaderNotification: React.FC<HeaderNotificationProps> = ({
  message,
  type,
  onComplete,
}) => {
  const translateX = useRef(new Animated.Value(300)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (message) {
      // Slide in from right with fade
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-hide after brief display
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: 300,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onComplete?.();
        });
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [message, translateX, opacity, onComplete]);

  if (!message) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateX }],
          opacity,
        },
      ]}
    >
      <View style={[styles.notification, type === 'error' && styles.errorNotification]}>
        <Text style={styles.text}>{message}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: moderateScale(16),
    top: moderateScale(-28),
    zIndex: 1000,
  },
  notification: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(4),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  errorNotification: {
    backgroundColor: '#F44336',
  },
  text: {
    color: '#FFFFFF',
    fontSize: moderateScale(12),
    fontWeight: '500',
  },
});

export default HeaderNotification;
