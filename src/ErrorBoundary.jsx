import React from "react";

const COLORS = {
  brand: "#3D6B5C",
  text: "#1F2933",
  muted: "#4B5563",
};

/* ---------------------------------------------------------------
   ErrorBoundary
   If anything crashes while drawing the screen, show a calm,
   accessible message instead of a blank page. Error details are
   never shown to users. Part B passes onError to report to Sentry.
----------------------------------------------------------------*/
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
    this.headingRef = React.createRef();
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    if (typeof this.props.onError === "function") {
      try {
        this.props.onError(error, info);
      } catch {
        /* reporting must never break the error screen */
      }
    }
  }

  componentDidUpdate(prevProps, prevState) {
    // Move focus to the heading so screen readers announce the problem.
    if (this.state.hasError && !prevState.hasError && this.headingRef.current) {
      this.headingRef.current.focus();
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main style={{ maxWidth: 420, margin: "80px auto", padding: "0 24px", fontFamily: "sans-serif", color: COLORS.text }}>
        <p style={{ fontSize: 14, letterSpacing: 1, textTransform: "uppercase", color: COLORS.brand, margin: "0 0 8px" }}>
          AccessPath
        </p>
        <h1 ref={this.headingRef} tabIndex={-1} style={{ fontSize: 26, margin: "0 0 12px" }}>
          Something went wrong
        </h1>
        <p style={{ color: COLORS.muted, lineHeight: 1.6, margin: "0 0 12px" }}>
          AccessPath ran into an unexpected problem and couldn't show this screen. Anything you already saved is safe.
        </p>
        <p style={{ color: COLORS.muted, lineHeight: 1.6, margin: "0 0 24px" }}>
          Reloading the page usually fixes this. If it keeps happening, please contact us at hello.accesspath@outlook.com.
        </p>
        <button
          type="button"
          onClick={() => {
            const url = new URL(window.location.href);
            if (url.searchParams.get("crash-test") === "1") {
              url.searchParams.delete("crash-test");
              window.location.replace(url.toString());
            } else {
              window.location.reload();
            }
          }}
          style={{ padding: "12px 20px", background: COLORS.brand, color: "#fff", border: "none", borderRadius: 6, fontSize: 16, cursor: "pointer" }}
        >
          Reload AccessPath
        </button>
      </main>
    );
  }
}

/* ---------------------------------------------------------------
   Development-only crash switch, for testing the error screen.
   On localhost (npm run dev), visit /?crash-test=1 to trigger it.
   import.meta.env.DEV is false in every production build, live and
   preview alike, so this can never trigger for real users.
----------------------------------------------------------------*/
export function DevCrashSwitch() {
  if (import.meta.env.DEV && new URLSearchParams(window.location.search).get("crash-test") === "1") {
    throw new Error("AccessPath development crash test");
  }
  return null;
}