import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          height: "100%", padding: 40, textAlign: "center", fontFamily: "'Inter', sans-serif",
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠</div>
          <h2 style={{ color: "#1A0F3C", marginBottom: 8 }}>Algo deu errado</h2>
          <p style={{ color: "#6B5B8C", marginBottom: 24, maxWidth: 400 }}>
            Ocorreu um erro inesperado.
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={this.handleRetry} style={{
              background: "#7C5CBF", color: "#FFFFFF", border: "none", padding: "12px 24px",
              borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 14,
            }}>
              Tentar novamente
            </button>
            <button onClick={() => window.location.reload()} style={{
              background: "transparent", color: "#7C5CBF", border: "1.5px solid #7C5CBF", padding: "12px 24px",
              borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 14,
            }}>
              Recarregar
            </button>
          </div>
          {process.env.NODE_ENV !== 'production' && this.state.error && (
            <details style={{ marginTop: 16, maxWidth: 400, textAlign: "left" }}>
              <summary style={{ color: "#6B5B8C", cursor: "pointer", fontSize: 12 }}>Detalhes do erro</summary>
              <pre style={{ fontSize: 11, color: "#EF4444", marginTop: 8, whiteSpace: "pre-wrap" }}>{this.state.error.message}</pre>
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}