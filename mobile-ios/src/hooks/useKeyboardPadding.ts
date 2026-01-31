// src/hooks/useKeyboardPadding.ts
import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

interface UseKeyboardPaddingOptions {
  extraPadding?: number;
  enabledPlatforms?: ('ios' | 'android')[];
}

export const useKeyboardPadding = (options: UseKeyboardPaddingOptions = {}) => {
  const {
    extraPadding = 300,
    enabledPlatforms = ['ios', 'android']
  } = options;

  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    // Only add listeners if current platform is enabled
    if (!enabledPlatforms.includes(Platform.OS as 'ios' | 'android')) {
      return;
    }

    const showListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );

    const hideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      showListener?.remove();
      hideListener?.remove();
    };
  }, [enabledPlatforms]);

  // Return the bottom padding value based on keyboard state
  const bottomPadding = keyboardVisible ? extraPadding : 0;

  return {
    keyboardVisible,
    bottomPadding,
    paddingStyle: { paddingBottom: bottomPadding },
  };
};