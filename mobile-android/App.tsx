/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
import "react-native-gesture-handler";
import React, { useEffect, Component, ErrorInfo, ReactNode } from "react";
import Router from "./src/navigation/router";
import { Provider, useDispatch } from "react-redux";
import store from "./src/store/store";
import { Appearance, Text, View, StyleSheet, StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { setSystemTheme } from "./src/store/slices/themeSlice";
import Toast from "react-native-toast-message";

// Error Boundary Component to catch and handle crashes
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to console in production
    console.error('App Error Boundary caught:', error, errorInfo);

    // You can also log to a service like Sentry here
    // Sentry.captureException(error);
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI when there's an error
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>
            The app encountered an error. Please restart the application.
          </Text>
          {typeof __DEV__ !== 'undefined' && __DEV__ && (
            <Text style={styles.errorDetails}>
              {this.state.error?.toString()}
            </Text>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}

const ThemeListener = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    try {
      const colorSchemeListener = (preferences: any) => {
        const theme = preferences?.colorScheme || 'light';
        dispatch(setSystemTheme(theme));
      };

      const subscription = Appearance.addChangeListener(colorSchemeListener);

      return () => {
        subscription?.remove();
      };
    } catch (error) {
      console.warn('Theme listener setup failed:', error);
      // App continues without theme updates rather than crashing
    }
  }, [dispatch]);

  return null;
};

function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="light-content"
        />
        <ErrorBoundary>
          <Provider store={store}>
            {/* <AppearanceProvider> */}
            <ThemeListener />
            <Router />
            <Toast />
            {/* </AppearanceProvider> */}
          </Provider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  errorDetails: {
    fontSize: 12,
    color: '#999',
    marginTop: 10,
    fontFamily: 'monospace',
  },
});

export default App;
