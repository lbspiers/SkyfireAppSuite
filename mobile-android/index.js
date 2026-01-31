/**
 * @format
 */

import { AppRegistry, LogBox } from "react-native";
import "./src/shims/voiceEmitterShim";
import App from "./App";
import { name as appName } from "./app.json";
// Disabled devLogger to prevent memory leaks and crashes
// import "./src/utils/devLogger";

// Suppress all yellow box warnings in the app UI
// Warnings will still appear in Metro bundler console
LogBox.ignoreAllLogs(true);

// Global error handlers to prevent crashes
if (typeof __DEV__ === 'undefined' || !__DEV__) {
  // In production, suppress error dialogs and log to console instead
  if (global.ErrorUtils) {
    const originalHandler = global.ErrorUtils.getGlobalHandler();
    global.ErrorUtils.setGlobalHandler((error, isFatal) => {
      console.error('Global error handler:', error, 'Fatal:', isFatal);
      // You can send to crash reporting service here
      // Sentry.captureException(error);
      
      // Don't call original handler in production to prevent crash dialog
      if (typeof __DEV__ !== 'undefined' && __DEV__ && originalHandler) {
        originalHandler(error, isFatal);
      }
    });
  }
}

// Handle unhandled promise rejections
const onUnhandledRejection = (error, promise) => {
  console.warn('Unhandled Promise Rejection:', error);
  // Prevent the app from crashing
  // You can send to crash reporting service here
};

if (typeof global !== 'undefined') {
  global.onunhandledrejection = onUnhandledRejection;
  
  // For React Native specific promise handling
  if (typeof Promise !== 'undefined') {
    const originalReject = Promise.reject;
    Promise.reject = function(reason) {
      console.warn('Promise rejected:', reason);
      return originalReject.call(Promise, reason);
    };
  }
}

AppRegistry.registerComponent(appName, () => App);
