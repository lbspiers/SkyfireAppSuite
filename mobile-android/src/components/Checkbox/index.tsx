// components/Checkbox/index.tsx
import React from 'react';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Text from '../Text';
import { ORANGE_TB } from '../../styles/gradient';
import { moderateScale, verticalScale } from '../../utils/responsive';

export interface CheckboxProps {
  checked: boolean;
  onToggle: () => void;
  label: string;
  disabled?: boolean;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
}

const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onToggle,
  label,
  disabled = false,
  containerStyle,
  labelStyle,
}) => {
  const handlePress = () => {
    console.log('[Checkbox] handlePress called, disabled:', disabled, 'label:', label);
    if (!disabled) {
      console.log('[Checkbox] Calling onToggle for:', label);
      onToggle();
    } else {
      console.log('[Checkbox] Not calling onToggle because disabled is true');
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, containerStyle]}
      onPress={handlePress}
      activeOpacity={disabled ? 1 : 0.7}
      disabled={disabled}
    >
      <View style={[styles.checkboxContainer, disabled && styles.disabled]}>
        {checked ? (
          <LinearGradient
            {...ORANGE_TB}
            style={styles.checkboxChecked}
          >
            <Text style={styles.checkmark}>✓</Text>
          </LinearGradient>
        ) : (
          <View style={styles.checkboxUnchecked} />
        )}
      </View>
      
      <Text 
        style={[
          styles.label, 
          disabled && styles.labelDisabled,
          labelStyle
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: verticalScale(8),
  },
  checkboxContainer: {
    marginRight: moderateScale(12),
  },
  checkboxChecked: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(4),
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxUnchecked: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(4),
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'transparent',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: moderateScale(16),
    fontWeight: '700',
  },
  label: {
    color: '#FFFFFF',
    fontSize: moderateScale(16),
    fontWeight: '400',
    flex: 1,
  },
  disabled: {
    opacity: 0.5,
  },
  labelDisabled: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
});

export default Checkbox;