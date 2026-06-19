import React from 'react';

export default class ErrorBoundary extends React.Component {
  state = { hasError: false };
  
  static getDerivedStateFromError() { return { hasError: true }; }
  
  componentDidCatch(error, info) {
    console.error('App crashed:', error, info);
  }

  render() {
    if (this.state.hasError) return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexDirection: 'column', gap: 16,
        padding: 40, background: 'var(--bg-base)'
      }}>
        <div style={{ fontSize: 52 }}>⚠️</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>
          Something went wrong
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', maxWidth: 400 }}>
          An unexpected error occurred. Please refresh the page.
          If the problem continues, contact support.
        </p>
        <button
          className="btn btn-primary"
          onClick={() => window.location.reload()}
        >
          🔄 Refresh Page
        </button>
        <a href="/dashboard" style={{ fontSize: 13, color: 'var(--accent-light)' }}>
          ← Go to Dashboard
        </a>
      </div>
    );
    return this.props.children;
  }
}