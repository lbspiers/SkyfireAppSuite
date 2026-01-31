// src/shims/voiceEmitterShim.ts
import { NativeModules } from "react-native";

// Safely initialize Voice module with proper error handling for iOS 18.5 compatibility
try {
  const V = NativeModules?.Voice;
  
  // Only patch if Voice module exists and is an object
  if (V && typeof V === 'object') {
    // Use Object.defineProperty for safer property definition
    if (typeof V.addListener !== "function") {
      try {
        Object.defineProperty(V, 'addListener', {
          value: () => {
            // No-op function to prevent crashes
            console.debug('Voice.addListener called (shimmed)');
          },
          writable: false,
          configurable: false,
          enumerable: true
        });
      } catch (defineError) {
        // Fallback if defineProperty fails
        V.addListener = () => {};
      }
    }
    
    if (typeof V.removeListeners !== "function") {
      try {
        Object.defineProperty(V, 'removeListeners', {
          value: () => {
            // No-op function to prevent crashes
            console.debug('Voice.removeListeners called (shimmed)');
          },
          writable: false,
          configurable: false,
          enumerable: true
        });
      } catch (defineError) {
        // Fallback if defineProperty fails
        V.removeListeners = () => {};
      }
    }
  } else if (!V) {
    // Log warning only in development
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn('Voice native module not available - voice features will be disabled');
    }
  }
} catch (error) {
  // Catch any initialization errors to prevent app crash
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.warn('Voice module shim initialization failed:', error);
  }
  // App continues without voice support rather than crashing
}
