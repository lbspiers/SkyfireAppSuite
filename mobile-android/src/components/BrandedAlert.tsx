// src/components/BrandedAlert.tsx
// Branded alert component with gradient background and custom styling

import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Button from './Button';

// Gradient configuration
const BLUE_GRADIENT = {
  colors: ['#2E4161', '#0C1F3F'],
  start: { x: 0.5, y: 0 },
  end: { x: 0.5, y: 1 },
};

export interface BrandedAlertButton {
  text: string;
  onPress: () => void;
  style?: 'default' | 'destructive' | 'cancel';
  testID?: string;
}

export interface BrandedAlertProps {
  visible: boolean;
  title: string;
  message: string;
  buttons: BrandedAlertButton[];
  onClose?: () => void;
  onRequestClose?: () => void;
  showCloseButton?: boolean;
  customStyles?: {
    backdrop?: ViewStyle;
    card?: ViewStyle;
    title?: TextStyle;
    message?: TextStyle;
  };
}

/**
 * BrandedAlert - A custom alert modal with branded styling
 * Replaces generic Alert.alert() with a visually consistent component
 */
const BrandedAlert: React.FC<BrandedAlertProps> = ({
  visible,
  title,
  message,
  buttons,
  onClose,
  onRequestClose,
  showCloseButton = false,
  customStyles = {},
}) => {
  const handleButtonPress = (button: BrandedAlertButton) => {
    button.onPress();
    onClose?.();
  };

  const getButtonColors = (style?: string): { color1?: string; color2?: string } => {
    switch (style) {
      case 'destructive':
        return { color1: '#FF4444', color2: '#CC0000' };
      case 'cancel':
        return { color1: '#666666', color2: '#444444' };
      default:
        return {}; // Use default Button gradient
    }
  };

  const getButtonWidth = () => {
    const buttonCount = buttons.length;
    if (buttonCount === 1) return '100%';
    if (buttonCount === 2) return '48%';
    return '30%'; // For 3+ buttons
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onRequestClose || onClose}
      statusBarTranslucent
    >
      <View style={[styles.backdrop, customStyles?.backdrop]}>
        <LinearGradient {...BLUE_GRADIENT} style={[styles.card, customStyles?.card]}>
          {/* Close button if enabled */}
          {showCloseButton && (
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          )}

          {/* Title */}
          <Text style={[styles.title, customStyles?.title]}>{title}</Text>

          {/* Message */}
          <Text style={[styles.message, customStyles?.message]}>{message}</Text>

          {/* Button Row */}
          <View style={[
            styles.buttonRow,
            buttons.length === 1 && styles.singleButtonRow
          ]}>
            {buttons.map((button, index) => {
              const buttonColors = getButtonColors(button.style);
              return (
                <Button
                  key={index}
                  title={button.text}
                  onPress={() => handleButtonPress(button)}
                  width={getButtonWidth()}
                  height={44}
                  selected={button.style !== 'cancel'}
                  color1={buttonColors.color1}
                  color2={buttonColors.color2}
                  rounded={22}
                  testID={button.testID}
                />
              );
            })}
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    paddingTop: 28,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  singleButtonRow: {
    justifyContent: 'center',
  },
});

export default BrandedAlert;

/**
 * Hook for managing BrandedAlert state
 */
export const useBrandedAlert = () => {
  const [alertState, setAlertState] = React.useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons: BrandedAlertButton[];
  }>({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  const showAlert = React.useCallback(
    (title: string, message: string, buttons: BrandedAlertButton[]) => {
      setAlertState({
        visible: true,
        title,
        message,
        buttons,
      });
    },
    []
  );

  const hideAlert = React.useCallback(() => {
    setAlertState(prev => ({ ...prev, visible: false }));
  }, []);

  return {
    alertState,
    showAlert,
    hideAlert,
    AlertComponent: (
      <BrandedAlert
        {...alertState}
        onClose={hideAlert}
      />
    ),
  };
};

/**
 * Utility function to replace Alert.alert() calls
 * This returns the component props needed for BrandedAlert
 */
export const createBrandedAlertProps = (
  title: string,
  message: string,
  buttons?: Array<{
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>
): Omit<BrandedAlertProps, 'visible'> => {
  const defaultButtons: BrandedAlertButton[] = buttons?.map(btn => ({
    text: btn.text,
    onPress: btn.onPress || (() => {}),
    style: btn.style,
  })) || [{ text: 'OK', onPress: () => {}, style: 'default' }];

  return {
    title,
    message,
    buttons: defaultButtons,
  };
};