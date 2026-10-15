import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient.js";
import { ForgotPasswordForm } from "./PasswordRecovery.jsx";

export default function AuthScreen({ notice }) {
  const [mode, setMode] = useState("signIn"); // "signIn" or "signUp"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [shownNotice, setShownNotice] = useState(null);

// Show notices (like "password changed") a moment after the screen appears,
// so screen readers announce them.
useEffect(() => {
  const timer = setTimeout(() => setShownNotice(notice || null), 150);
  return () => clearTimeout(timer);
}, [notice]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (mode === "signUp") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMessage(error.message);
      } else {
        setMessage("Check your email to confirm your account, then sign in.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage(error.message);
      }
      // On success, the app automatically re-renders logged in — no action needed here.
    }
    setLoading(false);
  };
  if (mode === "forgot") {
  return (
    <div style={{ maxWidth: 380, margin: "80px auto", padding: "0 24px", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 28, marginBottom: 16 }}>AccessPath</h1>
      <ForgotPasswordForm onBack={() => { setMode("signIn"); setMessage(""); }} />
    </div>
  );
}

  return (
    <div style={{ maxWidth: 380, margin: "80px auto", padding: "0 24px", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>AccessPath</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>
        {mode === "signUp" ? "Create an account to save your assessment." : "Sign in to continue your assessment."}
      </p>
      <div role="status" aria-live="polite">
  {mode === "signIn" && shownNotice && shownNotice.type === "success" && (
    <p style={{ margin: "0 0 16px", padding: "10px 12px", border: "1px solid #3D6B5C", borderRadius: 6, color: "#1F2933" }}>{shownNotice.text}</p>
  )}
</div>
<div role="alert">
  {mode === "signIn" && shownNotice && shownNotice.type === "error" && (
    <p style={{ margin: "0 0 16px", padding: "10px 12px", border: "2px solid #9C4636", borderRadius: 6, color: "#9C4636", fontWeight: 600 }}>{shownNotice.text}</p>
  )}
</div>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: "100%", padding: 10, marginBottom: 10, boxSizing: "border-box" }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          style={{ width: "100%", padding: 10, marginBottom: 10, boxSizing: "border-box" }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ width: "100%", padding: 10, background: "#3D6B5C", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
        >
          {loading ? "Please wait..." : mode === "signUp" ? "Sign Up" : "Sign In"}
        </button>
      </form>
      {message && <p style={{ marginTop: 12, color: "#9C4636" }}>{message}</p>}
      {mode === "signIn" && (
  <div>
    <button
      type="button"
      onClick={() => { setMode("forgot"); setMessage(""); }}
      style={{ marginTop: 12, background: "none", border: "none", padding: 4, color: "#3D6B5C", fontSize: 15, cursor: "pointer", textDecoration: "underline" }}
    >
      Forgot password?
    </button>
  </div>
)}
      <button
        onClick={() => { setMode(mode === "signUp" ? "signIn" : "signUp"); setMessage(""); }}
        style={{ marginTop: 16, background: "none", border: "none", color: "#3D6B5C", cursor: "pointer", textDecoration: "underline" }}
      >
        {mode === "signUp" ? "Already have an account? Sign in" : "Need an account? Sign up"}
      </button>
    </div>
  );
}