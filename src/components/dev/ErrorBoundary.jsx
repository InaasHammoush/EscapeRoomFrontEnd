import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { err: null };
  }
  static getDerivedStateFromError(err) {
    return { err };
  }
  componentDidCatch(err, info) {
    console.error("ErrorBoundary caught:", err, info);
  }
  render() {
    if (this.state.err) {
      return (
        <div
          style={{
            minHeight: "100vh",
            padding: 24,
            color: "#fff",
            background: "#111",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <h2>Something broke while rendering.</h2>
          <pre style={{ whiteSpace: "pre-wrap" }}>{String(this.state.err)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
