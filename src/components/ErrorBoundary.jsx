import React from 'react';
import { error as logError } from '../utils/errorHandler';

/**
 * Error Boundary Component
 * Catches React errors in component tree and displays fallback UI
 * Logs errors to error handler system
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so next render shows fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to error handler
    logError(
      `React error: ${error.message}`,
      this.props.context || 'ErrorBoundary',
      {
        componentStack: errorInfo.componentStack,
        error: error.toString()
      }
    );
    
    this.setState({ errorInfo });
    
    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          reset: this.handleReset
        });
      }

      // Default fallback UI
      return (
        <div style={{
          padding: '24px',
          backgroundColor: 'var(--theme-surface)',
          border: '2px solid var(--theme-accent)',
          borderRadius: '8px',
          margin: '16px',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <span style={{ fontSize: '32px' }}>⚠️</span>
            <div>
              <h2 style={{ 
                margin: 0, 
                fontSize: '18px', 
                fontWeight: '600',
                color: 'var(--theme-text)'
              }}>
                Something went wrong
              </h2>
              <p style={{ 
                margin: '4px 0 0 0', 
                fontSize: '14px',
                color: 'var(--theme-text-secondary)'
              }}>
                {this.props.message || 'An error occurred while rendering this component.'}
              </p>
            </div>
          </div>

          {import.meta.env.MODE !== 'production' && (
            <details style={{ 
              marginTop: '12px',
              padding: '12px',
              backgroundColor: 'var(--theme-background)',
              borderRadius: '4px',
              fontSize: '12px',
              fontFamily: 'monospace',
              color: 'var(--theme-text)'
            }}>
              <summary style={{ cursor: 'pointer', fontWeight: '600', marginBottom: '8px' }}>
                Error Details (Development Only)
              </summary>
              <div style={{ marginTop: '8px' }}>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Error:</strong>
                  <pre style={{ 
                    margin: '4px 0 0 0', 
                    padding: '8px',
                    backgroundColor: 'rgba(255, 0, 0, 0.1)',
                    borderRadius: '4px',
                    overflow: 'auto'
                  }}>
                    {this.state.error?.toString()}
                  </pre>
                </div>
                {this.state.errorInfo?.componentStack && (
                  <div>
                    <strong>Component Stack:</strong>
                    <pre style={{ 
                      margin: '4px 0 0 0', 
                      padding: '8px',
                      backgroundColor: 'rgba(0, 0, 0, 0.05)',
                      borderRadius: '4px',
                      overflow: 'auto',
                      fontSize: '11px'
                    }}>
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}

          <button
            onClick={this.handleReset}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              backgroundColor: 'var(--theme-accent)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Lightweight error boundary for app shells
 * Shows minimal UI when app crashes
 */
export class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logError(
      `App ${this.props.appId} crashed: ${error.message}`,
      'AppErrorBoundary',
      { appId: this.props.appId, componentStack: errorInfo.componentStack }
    );
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    // Could also close and reopen the window here
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
          backgroundColor: 'var(--theme-background)',
          color: 'var(--theme-text)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>💥</div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>
            {this.props.appName || 'App'} crashed
          </h3>
          <p style={{ 
            margin: '0 0 16px 0', 
            fontSize: '13px',
            color: 'var(--theme-text-secondary)'
          }}>
            {import.meta.env.MODE !== 'production' 
              ? this.state.error?.message 
              : 'An unexpected error occurred'}
          </p>
          <button
            onClick={this.handleReload}
            style={{
              padding: '6px 12px',
              backgroundColor: 'var(--theme-accent)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
