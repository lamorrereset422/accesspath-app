import React, { useEffect, useRef, useState } from "react";
import { supabase } from "./supabaseClient.js";
import { ForgotPasswordForm } from "./PasswordRecovery.jsx";

export default function AuthScreen({ notice }) {
  const [mode, setMode] = useState("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [shownNotice, setShownNotice] = useState(null);
  const headingRef = useRef(null);
  const submittingRef = useRef(false);
  const focusHeadingRef = useRef(false);

  // Populate existing notice regions after they mount.
  useEffect(() => {
    const timer = setTimeout(() => setShownNotice(notice || null), 150);
    return () => clearTimeout(timer);
  }, [notice]);

  // Focus the form heading after a user changes forms.
  useEffect(() => {
    if (mode !== "forgot" && focusHeadingRef.current) {
      headingRef.current?.focus();
      focusHeadingRef.current = false;
    }
  }, [mode]);

  const changeMode = (nextMode) => {
    if (submittingRef.current) return;
    setMessage(null);
    setShownNotice(null);
    setPassword("");
    focusHeadingRef.current = nextMode !== "forgot";
    setMode(nextMode);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;

    submittingRef.current = true;
    setLoading(true);
    setMessage(null);
    setShownNotice(null);

    try {
      const credentials = { email: email.trim(), password };

      if (mode === "signUp") {
        const { error } = await supabase.auth.signUp(credentials);
        if (error) {
          setMessage({ type: "error", text: error.message });
        } else {
          setMessage({
            type: "success",
            text: "Check your email to confirm your account, then sign in.",
          });
        }
      } else {
        const { error } =
          await supabase.auth.signInWithPassword(credentials);
        if (error) {
          setMessage({ type: "error", text: error.message });
        }
        // Root displays the assessment when sign-in succeeds.
      }
    } catch {
      setMessage({
        type: "error",
        text: "We couldn't reach the server. Check your connection and try again.",
      });
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  const containerStyle = {
    maxWidth: 380,
    margin: "80px auto",
    padding: "0 24px",
    fontFamily: "sans-serif",
  };

  const labelStyle = {
    display: "block",
    marginBottom: 6,
    fontWeight: 600,
    color: "#1F2933",
  };

  const inputStyle = {
    width: "100%",
    padding: 10,
    marginBottom: 16,
    boxSizing: "border-box",
  };

  const successStyle = {
    margin: "12px 0 16px",
    padding: "10px 12px",
    border: "1px solid #3D6B5C",
    borderRadius: 6,
    color: "#1F2933",
  };

  const errorStyle = {
    margin: "12px 0 16px",
    padding: "10px 12px",
    border: "2px solid #9C4636",
    borderRadius: 6,
    color: "#9C4636",
    fontWeight: 600,
  };

  if (mode === "forgot") {
    return (
      <div style={containerStyle}>
        <h1 style={{ fontSize: 28, marginBottom: 16 }}>AccessPath</h1>
        <ForgotPasswordForm onBack={() => changeMode("signIn")} />
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>AccessPath</h1>
      <h2
        id="auth-heading"
        ref={headingRef}
        tabIndex={-1}
        style={{ fontSize: 22, margin: "0 0 8px" }}
      >
        {mode === "signUp" ? "Create an account" : "Sign in"}
      </h2>
      <p style={{ color: "#666", marginBottom: 24 }}>
        {mode === "signUp"
          ? "Create an account to save your assessment."
          : "Sign in to continue your assessment."}
      </p>

      <div role="status" aria-live="polite" aria-atomic="true">
        {mode === "signIn" && shownNotice?.type === "success" && (
          <p style={successStyle}>{shownNotice.text}</p>
        )}
      </div>
      <div role="alert" aria-atomic="true">
        {mode === "signIn" && shownNotice?.type === "error" && (
          <p style={errorStyle}>{shownNotice.text}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} aria-labelledby="auth-heading">
        <label htmlFor="auth-email" style={labelStyle}>
          Email
        </label>
        <input
          id="auth-email"
          name="email"
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          readOnly={loading}
          style={inputStyle}
        />

        <label htmlFor="auth-password" style={labelStyle}>
          Password
        </label>
        {mode === "signUp" && (
          <p
            id="auth-password-hint"
            style={{ color: "#666", margin: "0 0 8px", fontSize: 14 }}
          >
            Use at least 6 characters.
          </p>
        )}
        <input
          id="auth-password"
          name="password"
          type="password"
          autoComplete={
            mode === "signUp" ? "new-password" : "current-password"
          }
          aria-describedby={
            mode === "signUp" ? "auth-password-hint" : undefined
          }
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={mode === "signUp" ? 6 : undefined}
          readOnly={loading}
          style={inputStyle}
        />

        <button
          type="submit"
          aria-disabled={loading}
          style={{
            width: "100%",
            padding: 10,
            background: "#3D6B5C",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: loading ? "wait" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading
            ? "Please wait..."
            : mode === "signUp"
              ? "Sign Up"
              : "Sign In"}
        </button>
      </form>

      <div role="status" aria-live="polite" aria-atomic="true">
        {loading && <p style={{ marginTop: 12 }}>Please wait...</p>}
        {message?.type === "success" && (
          <p style={successStyle}>{message.text}</p>
        )}
      </div>
      <div role="alert" aria-atomic="true">
        {message?.type === "error" && (
          <p style={errorStyle}>{message.text}</p>
        )}
      </div>

      {mode === "signIn" && (
        <div>
          <button
            type="button"
            disabled={loading}
            onClick={() => changeMode("forgot")}
            style={{
              marginTop: 12,
              background: "none",
              border: "none",
              padding: 4,
              color: "#3D6B5C",
              fontSize: 15,
              cursor: loading ? "wait" : "pointer",
              textDecoration: "underline",
            }}
          >
            Forgot password?
          </button>
        </div>
      )}

      <button
        type="button"
        disabled={loading}
        onClick={() =>
          changeMode(mode === "signUp" ? "signIn" : "signUp")
        }
        style={{
          marginTop: 16,
          background: "none",
          border: "none",
          color: "#3D6B5C",
          cursor: loading ? "wait" : "pointer",
          textDecoration: "underline",
        }}
      >
        {mode === "signUp"
          ? "Already have an account? Sign in"
          : "Need an account? Sign up"}
      </button>
    </div>
  );
}
