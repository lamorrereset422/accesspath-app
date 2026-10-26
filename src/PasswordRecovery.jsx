import React, { useEffect, useRef, useState } from "react";
import { supabase } from "./supabaseClient.js";
import TurnstileCaptcha from "./TurnstileCaptcha.jsx";

// Must match the minimum password length configured in Supabase.
export const MIN_PASSWORD_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

const COLORS = {
  brand: "#3D6B5C",
  error: "#9C4636",
  text: "#1F2933",
  muted: "#4B5563",
  border: "#6B7280",
};

const pageStyle = {
  maxWidth: 380,
  margin: "80px auto",
  padding: "0 24px",
  fontFamily: "sans-serif",
  color: COLORS.text,
};

const fieldStyle = { marginBottom: 16 };

const labelStyle = {
  display: "block",
  fontWeight: 600,
  marginBottom: 4,
};

const inputStyle = {
  width: "100%",
  padding: 10,
  boxSizing: "border-box",
  border: `1px solid ${COLORS.border}`,
  borderRadius: 6,
  fontSize: 16,
};

const hintStyle = {
  fontSize: 14,
  color: COLORS.muted,
  margin: "4px 0 0",
};

const fieldErrorStyle = {
  fontSize: 14,
  color: COLORS.error,
  fontWeight: 600,
  margin: "4px 0 0",
};

const primaryButtonStyle = {
  width: "100%",
  padding: 12,
  background: COLORS.brand,
  color: "#fff",
  border: "none",
  borderRadius: 6,
  fontSize: 16,
  cursor: "pointer",
};

const linkButtonStyle = {
  marginTop: 16,
  background: "none",
  border: "none",
  padding: 4,
  color: COLORS.brand,
  fontSize: 15,
  textDecoration: "underline",
  cursor: "pointer",
};

const statusBoxStyle = {
  marginTop: 16,
  padding: "10px 12px",
  border: `1px solid ${COLORS.brand}`,
  borderRadius: 6,
  color: COLORS.text,
};

const errorBoxStyle = {
  marginTop: 16,
  padding: "10px 12px",
  border: `2px solid ${COLORS.error}`,
  borderRadius: 6,
  color: COLORS.error,
  fontWeight: 600,
};

function useFocusOnMount() {
  const ref = useRef(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return ref;
}

/* ---------------------------------------------------------------
   "Reset your password" form (shown inside the sign-in screen)
----------------------------------------------------------------*/
export function ForgotPasswordForm({ onBack }) {
  const headingRef = useFocusOnMount();
  const emailRef = useRef(null);
  const sendingRef = useRef(false);

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaReset, setCaptchaReset] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(
      () => setCooldown((value) => value - 1),
      1000
    );
    return () => clearTimeout(timer);
  }, [cooldown]);

  const busy = sending || cooldown > 0;
  const unavailable = busy || !captchaToken;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (sendingRef.current || cooldown > 0) return;

    setStatus("");
    setError("");

    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setEmailError(
        "Please enter the email address you use for AccessPath."
      );
      emailRef.current?.focus();
      return;
    }

    setEmailError("");

    if (!captchaToken) {
      setError(
        "Please wait for the security check to complete. If it needs your attention, follow the instructions above the button."
      );
      return;
    }

    sendingRef.current = true;
    setSending(true);

    const requestToken = captchaToken;
    setCaptchaToken("");

    try {
      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(trimmed, {
          redirectTo: `${window.location.origin}/?reset=1`,
          captchaToken: requestToken,
        });

      if (resetError) {
        setError(
          "We couldn't send the email right now. Please wait a few minutes and try again."
        );
      } else {
        setStatus(
          "If an account exists for that email, we've sent a link to reset your password. Check your inbox and spam folder. The link expires in 1 hour."
        );
        setCooldown(RESEND_COOLDOWN_SECONDS);
      }
    } catch {
      setError(
        "We couldn't reach the server. Check your connection and try again."
      );
    } finally {
      setCaptchaToken("");
      setCaptchaReset((value) => value + 1);
      sendingRef.current = false;
      setSending(false);
    }
  };

  return (
    <section aria-labelledby="forgot-heading">
      <h2
        id="forgot-heading"
        ref={headingRef}
        tabIndex={-1}
        style={{ fontSize: 22, margin: "0 0 8px" }}
      >
        Reset your password
      </h2>

      <p style={{ color: COLORS.muted, margin: "0 0 20px" }}>
        Enter the email you use for AccessPath. We'll email you a link
        to choose a new password.
      </p>

      <form
        onSubmit={handleSubmit}
        aria-labelledby="forgot-heading"
        noValidate
      >
        <div style={fieldStyle}>
          <label htmlFor="reset-email" style={labelStyle}>
            Email
          </label>
          <input
            id="reset-email"
            ref={emailRef}
            name="email"
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            readOnly={sending}
            aria-invalid={emailError ? "true" : undefined}
            aria-describedby={
              emailError ? "reset-email-error" : undefined
            }
            style={inputStyle}
          />
          {emailError && (
            <p id="reset-email-error" style={fieldErrorStyle}>
              {emailError}
            </p>
          )}
        </div>

        <TurnstileCaptcha
          onToken={setCaptchaToken}
          resetKey={captchaReset}
        />

        <button
          type="submit"
          aria-disabled={unavailable}
          style={{
            ...primaryButtonStyle,
            cursor: unavailable ? "wait" : "pointer",
            opacity: unavailable ? 0.7 : 1,
          }}
        >
          {sending
            ? "Sending..."
            : cooldown > 0
              ? "Link sent"
              : "Send reset link"}
        </button>
      </form>

      {cooldown > 0 && (
        <p style={hintStyle}>
          You can request another link in {cooldown} seconds.
        </p>
      )}

      <div role="status" aria-live="polite" aria-atomic="true">
        {status && <p style={statusBoxStyle}>{status}</p>}
      </div>
      <div role="alert" aria-atomic="true">
        {error && <p style={errorBoxStyle}>{error}</p>}
      </div>

      <button
        type="button"
        disabled={sending}
        onClick={() => {
          if (!sendingRef.current) onBack();
        }}
        style={{
          ...linkButtonStyle,
          cursor: sending ? "wait" : "pointer",
        }}
      >
        Back to sign in
      </button>
    </section>
  );
}

/* ---------------------------------------------------------------
   "Choose a new password" screen
----------------------------------------------------------------*/
function describeUpdateError(error) {
  const code = (error && error.code) || "";
  const message = ((error && error.message) || "").toLowerCase();
  const status = error && error.status;

  if (
    code === "same_password" ||
    message.includes("different from the old password")
  ) {
    return "Your new password must be different from your current password.";
  }

  if (code === "weak_password") {
    return `Please choose a stronger password. It must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  if (
    code === "session_not_found" ||
    code === "session_expired" ||
    code === "bad_jwt" ||
    status === 401 ||
    status === 403
  ) {
    return 'Your reset session has expired. Choose "Cancel and sign out", then request a new reset link.';
  }

  return "We couldn't update your password. Please try again.";
}

export function ResetPasswordScreen({ onSuccess, onCancel }) {
  const headingRef = useFocusOnMount();
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);
  const savingRef = useRef(false);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (savingRef.current) return;
    setFormError("");

    const next = {};

    if (password.length < MIN_PASSWORD_LENGTH) {
      next.password =
        `Your new password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }

    if (!confirm) {
      next.confirm = "Please type your new password again.";
    } else if (confirm !== password) {
      next.confirm = "The two passwords don't match. Please type them again.";
    }

    setFieldErrors(next);

    if (next.password) {
      passwordRef.current?.focus();
      return;
    }

    if (next.confirm) {
      confirmRef.current?.focus();
      return;
    }

    savingRef.current = true;
    setSaving(true);
    let updated = false;

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setFormError(describeUpdateError(error));
      } else {
        updated = true;
      }
    } catch {
      setFormError(
        "We couldn't reach the server. Check your connection and try again."
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }

    if (updated) onSuccess();
  };

  const describedBy = (hintId, errorId, hasError) =>
    hasError ? `${hintId} ${errorId}` : hintId;

  return (
    <main style={pageStyle}>
      <p
        style={{
          fontSize: 14,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: COLORS.brand,
          margin: "0 0 8px",
        }}
      >
        AccessPath
      </p>

      <h1
        ref={headingRef}
        tabIndex={-1}
        style={{ fontSize: 26, margin: "0 0 8px" }}
      >
        Choose a new password
      </h1>

      <p style={{ color: COLORS.muted, margin: "0 0 20px" }}>
        Your reset link worked. Choose a new password to finish. You
        can't open your assessment until this step is done.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <div style={fieldStyle}>
          <label htmlFor="new-password" style={labelStyle}>
            New password
          </label>
          <input
            id="new-password"
            ref={passwordRef}
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            readOnly={saving}
            aria-invalid={fieldErrors.password ? "true" : undefined}
            aria-describedby={describedBy(
              "new-password-hint",
              "new-password-error",
              !!fieldErrors.password
            )}
            style={inputStyle}
          />
          <p id="new-password-hint" style={hintStyle}>
            At least {MIN_PASSWORD_LENGTH} characters.
          </p>
          {fieldErrors.password && (
            <p id="new-password-error" style={fieldErrorStyle}>
              {fieldErrors.password}
            </p>
          )}
        </div>

        <div style={fieldStyle}>
          <label htmlFor="confirm-password" style={labelStyle}>
            Confirm new password
          </label>
          <input
            id="confirm-password"
            ref={confirmRef}
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            readOnly={saving}
            aria-invalid={fieldErrors.confirm ? "true" : undefined}
            aria-describedby={describedBy(
              "confirm-password-hint",
              "confirm-password-error",
              !!fieldErrors.confirm
            )}
            style={inputStyle}
          />
          <p id="confirm-password-hint" style={hintStyle}>
            Type the same password again.
          </p>
          {fieldErrors.confirm && (
            <p id="confirm-password-error" style={fieldErrorStyle}>
              {fieldErrors.confirm}
            </p>
          )}
        </div>

        <button
          type="submit"
          aria-disabled={saving}
          style={{
            ...primaryButtonStyle,
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Saving..." : "Save new password"}
        </button>
      </form>

      <div role="alert" aria-atomic="true">
        {formError && <p style={errorBoxStyle}>{formError}</p>}
      </div>

      <button
        type="button"
        onClick={() => {
          if (!savingRef.current) onCancel();
        }}
        aria-disabled={saving}
        style={linkButtonStyle}
      >
        Cancel and sign out
      </button>
    </main>
  );
}
