// src/components/CustomKeyboard/GlobalKeyboardProvider.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import CustomKeyboard from './index';

interface KeyboardConfig {
  visible: boolean;
  fieldId?: string;
  onKeyPress?: (key: string) => void;
  onBackspace?: () => void;
  onEnter?: () => void;
  onTextChange?: (text: string) => void;
  returnKeyType?: 'done' | 'send' | 'search' | 'next' | 'go';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  enableHapticFeedback?: boolean;
  showSuggestions?: boolean;
  theme?: 'dark' | 'light';
}

interface GlobalKeyboardContextType {
  showKeyboard: (config: Omit<KeyboardConfig, 'visible'>) => void;
  hideKeyboard: () => void;
  isVisible: boolean;
  setFocusedField: (fieldId: string) => void;
  clearFocusedField: (fieldId: string) => void;
  focusedFieldId: string | null;
  keyboardConfig: KeyboardConfig; // Expose full keyboard config
  disableGlobalRender: (disabled: boolean) => void; // Allow disabling global keyboard rendering
}

const GlobalKeyboardContext = createContext<GlobalKeyboardContextType | null>(null);

export function useGlobalKeyboard() {
  const context = useContext(GlobalKeyboardContext);
  if (!context) {
    throw new Error('useGlobalKeyboard must be used within a GlobalKeyboardProvider');
  }
  return context;
}

interface GlobalKeyboardProviderProps {
  children: React.ReactNode;
}

export function GlobalKeyboardProvider({ children }: GlobalKeyboardProviderProps) {
  const [keyboardConfig, setKeyboardConfig] = useState<KeyboardConfig>({
    visible: false,
    returnKeyType: 'done',
    autoCapitalize: 'sentences',
    enableHapticFeedback: true,
    showSuggestions: false,
    theme: 'dark',
  });

  const [focusedFieldId, setFocusedFieldIdState] = useState<string | null>(null);
  const [globalRenderDisabled, setGlobalRenderDisabled] = useState(false);

  const showKeyboard = useCallback((config: Omit<KeyboardConfig, 'visible'>) => {
    setKeyboardConfig({
      ...config,
      visible: true,
    });
  }, []);

  const hideKeyboard = useCallback(() => {
    setKeyboardConfig(prev => ({
      ...prev,
      visible: false,
    }));
  }, []);

  const setFocusedField = useCallback((fieldId: string) => {
    setFocusedFieldIdState(fieldId);
  }, []);

  const clearFocusedField = useCallback((fieldId: string) => {
    // Only clear if this field is currently focused
    setFocusedFieldIdState(currentId => currentId === fieldId ? null : currentId);
  }, []);

  const disableGlobalRender = useCallback((disabled: boolean) => {
    setGlobalRenderDisabled(disabled);
  }, []);

  const contextValue = {
    showKeyboard,
    hideKeyboard,
    isVisible: keyboardConfig.visible,
    setFocusedField,
    clearFocusedField,
    focusedFieldId,
    keyboardConfig, // Expose full keyboard config
    disableGlobalRender, // Expose disable function
  };

  return (
    <GlobalKeyboardContext.Provider value={contextValue}>
      <View style={styles.container}>
        {children}

        {/* Global Keyboard Overlay - Only render if not disabled (e.g., when modal has its own) */}
        {!globalRenderDisabled && (
          <CustomKeyboard
            visible={keyboardConfig.visible}
            fieldId={keyboardConfig.fieldId}
            onKeyPress={keyboardConfig.onKeyPress}
            onBackspace={keyboardConfig.onBackspace}
            onEnter={keyboardConfig.onEnter}
            onTextChange={keyboardConfig.onTextChange}
            returnKeyType={keyboardConfig.returnKeyType}
            autoCapitalize={keyboardConfig.autoCapitalize}
            enableHapticFeedback={keyboardConfig.enableHapticFeedback}
            showSuggestions={keyboardConfig.showSuggestions}
            theme={keyboardConfig.theme}
            onVisibilityChange={(visible) => {
              if (!visible) hideKeyboard();
            }}
          />
        )}
      </View>
    </GlobalKeyboardContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    width: '100%',
    height: '100%',
  },
});