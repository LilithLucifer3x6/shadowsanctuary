import React from 'react';
import Icon from './Icon.jsx';

/**
 * ErrorBoundary — catches rendering errors in child components and displays
 * a recovery UI instead of crashing the entire React tree. Wrap around the
 * app root and/or individual screens for granular isolation.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary] Caught rendering error:', error, errorInfo);
  }

  handleRecover = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { fallbackLabel } = this.props;
      const label = fallbackLabel || 'this section';

      return (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          maxWidth: '500px',
          margin: '2rem auto'
        }}>
          <div className="card" style={{ padding: '2rem' }}>
            <div className="corner tl"></div><div className="corner tr"></div>
            <div className="corner bl"></div><div className="corner br"></div>

            <Icon name="ph-warning-circle" style={{ fontSize: '3rem', color: 'var(--crimson-b)', marginBottom: '1rem' }} />
            <h3 style={{ color: 'var(--crimson-b)', marginBottom: '0.5rem' }}>A Rift in the Sanctuary</h3>
            <p style={{ color: 'var(--dim)', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
              Something went wrong while rendering {label}. The rest of the app is unaffected.
            </p>

            {this.state.error && (
              <details style={{ 
                marginBottom: '1.5rem', 
                textAlign: 'left', 
                background: 'var(--card2)', 
                padding: '0.75rem', 
                borderRadius: '8px',
                border: '1px solid var(--border)',
                fontSize: '0.8rem',
                color: 'var(--dim)'
              }}>
                <summary style={{ cursor: 'pointer', color: 'var(--plum)', marginBottom: '0.5rem' }}>
                  Technical Details
                </summary>
                <code style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </code>
              </details>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn" onClick={this.handleRecover}>
                Try to Recover
              </button>
              <button className="btn plum" onClick={this.handleReload}>
                Reload Sanctuary
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
