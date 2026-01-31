import React from 'react';
import styles from './ErrorBoundary.module.css';
import { analytics } from '../../services/analyticsService';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });

    // Log error details
    console.error('=== APP ERROR ===');
    console.error('Error:', error);
    console.error('Component Stack:', errorInfo?.componentStack);

    // Track error in analytics
    try {
      const componentStack = errorInfo?.componentStack || '';
      const componentName = this.extractComponentName(componentStack);

      analytics.trackError(
        'react_error',
        error.name || 'Error',
        error.message || 'Unknown error',
        error.stack,
        componentName,
        'react_render'
      );
    } catch (analyticsError) {
      console.error('[Analytics] Failed to track error:', analyticsError);
    }
  }

  extractComponentName(componentStack) {
    if (!componentStack) return 'Unknown';
    // Extract first component name from stack
    const match = componentStack.match(/at (\w+)/);
    return match ? match[1] : 'Unknown';
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    // Clear any potentially corrupted state
    sessionStorage.removeItem('lastRoute');
    window.location.reload();
  };

  handleClearAndReload = () => {
    // Nuclear option - clear everything
    sessionStorage.clear();
    localStorage.removeItem('skyfire_draft');
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.errorContainer}>
          <div className={styles.errorCard}>
            <div className={styles.errorIcon}>⚠️</div>
            <h1 className={styles.errorTitle}>Something went wrong</h1>
            <p className={styles.errorMessage}>
              We're sorry, but something unexpected happened.
              Your work may have been saved automatically.
            </p>

            <div className={styles.errorActions}>
              <button
                onClick={this.handleRetry}
                className={styles.primaryButton}
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className={styles.secondaryButton}
              >
                Reload App
              </button>
            </div>

            <details className={styles.errorDetails}>
              <summary>Technical Details</summary>
              <pre>
                {this.state.error?.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>

            <button
              onClick={this.handleClearAndReload}
              className={styles.dangerLink}
            >
              Clear data and start fresh
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
