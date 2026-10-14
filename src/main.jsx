import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import AuthScreen from "./AuthScreen.jsx";
import { ResetPasswordScreen } from "./PasswordRecovery.jsx";
import { supabase } from "./supabaseClient.js";
import { installSupabaseStorage } from "./supabaseStorage.js";

/* ---------------------------------------------------------------
   Password recovery helpers
   The recovery gate turns on ONLY from Supabase's PASSWORD_RECOVERY
   event or a session Supabase itself marked as a recovery sign-in.
   The ?reset=1 marker never turns it on by itself.
----------------------------------------------------------------*/
const RECOVERY_FLAG = "accesspath:recovery-pending";

function readRecoveryFlag() {
  try { return window.sessionStorage.getItem(RECOVERY_FLAG) === "1"; } catch { return false; }
}
function setRecoveryFlag() {
  try { window.sessionStorage.setItem(RECOVERY_FLAG, "1"); } catch { /* storage unavailable */ }
}
function clearRecoveryFlag() {
  try { window.sessionStorage.removeItem(RECOVERY_FLAG); } catch { /* storage unavailable */ }
}

// True only when Supabase marked this session as a password-recovery sign-in.
function isRecoverySession(session) {
  try {
    const part = session.access_token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const claims = JSON.parse(window.atob(part));
    return Array.isArray(claims.amr) && claims.amr.some((entry) => entry && entry.method === "recovery");
  } catch {
    return false;
  }
}

// Read the link details once, when the page first loads.
const initialQuery = new URLSearchParams(window.location.search);
const initialHash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
const cameFromResetLink = initialQuery.get("reset") === "1";
const linkError =
  initialQuery.get("error_code") || initialHash.get("error_code") ||
  initialQuery.get("error") || initialHash.get("error");

// Remove our marker and any link-error details from the address bar.
function cleanLinkDetailsFromUrl() {
  const url = new URL(window.location.href);
  ["reset", "error", "error_code", "error_description"].forEach((key) => url.searchParams.delete(key));
  if (/(^#|&)error/.test(url.hash)) url.hash = "";
  window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
}

// Listen from the very start so the PASSWORD_RECOVERY event can't be missed.
supabase.auth.onAuthStateChange((event) => {
  if (event === "PASSWORD_RECOVERY") setRecoveryFlag();
});

function Root() {
  const [session, setSession] = useState(undefined); // undefined = still checking
  const [recovery, setRecovery] = useState(readRecoveryFlag);
  const [leaving, setLeaving] = useState(false);
  const [waitForRecovery, setWaitForRecovery] = useState(cameFromResetLink && !linkError);
  const [notice, setNotice] = useState(() =>
    linkError
      ? {
          type: "error",
          text: cameFromResetLink
            ? "This reset link is invalid or has expired. Please request a new one."
            : "This link is invalid or has expired.",
        }
      : null
  );

  useEffect(() => {
    const applySession = (event, nextSession) => {
      if (event === "PASSWORD_RECOVERY" || (nextSession && isRecoverySession(nextSession))) {
        setRecoveryFlag();
      }
      if (nextSession) setNotice(null);
      setRecovery(readRecoveryFlag());
      setSession(nextSession);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      applySession(null, session);
      cleanLinkDetailsFromUrl();
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      applySession(event, nextSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // A reset link should become a recovery session within a moment. Wait briefly
  // instead of opening the assessment. This only delays; it never turns the gate on.
  useEffect(() => {
    if (!waitForRecovery || session === undefined) return;
    if (!session || recovery) { setWaitForRecovery(false); return; }
    const timer = setTimeout(() => setWaitForRecovery(false), 2000);
    return () => clearTimeout(timer);
  }, [waitForRecovery, session, recovery]);

  // If the recovery session disappears (expired or signed out elsewhere), end recovery safely.
  useEffect(() => {
    if (session === null && recovery && !leaving) {
      clearRecoveryFlag();
      setRecovery(false);
      setNotice({ type: "error", text: "Your password reset session ended. Please request a new reset link." });
    }
  }, [session, recovery, leaving]);

  // Finish or cancel recovery: sign out everywhere, then show the sign-in screen.
  const leaveRecovery = async (nextNotice) => {
    setLeaving(true);
    clearRecoveryFlag();
    setRecovery(false);
    try {
      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (error) await supabase.auth.signOut({ scope: "local" });
    } catch {
      try { await supabase.auth.signOut({ scope: "local" }); } catch { /* checked below */ }
    }
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      // Sign-out did not finish: stay locked on the recovery screen.
      setRecoveryFlag();
      setRecovery(true);
      setLeaving(false);
      return;
    }
    setNotice(nextNotice);
    setLeaving(false);
  };

  if (session === undefined || leaving || (waitForRecovery && session && !recovery)) {
    return <p role="status" style={{ textAlign: "center", marginTop: 80, fontFamily: "sans-serif" }}>Loading...</p>;
  }

  if (session && recovery) {
    return (
      <ResetPasswordScreen
        onSuccess={() => leaveRecovery({ type: "success", text: "Your password has been changed. Please sign in with your new password." })}
        onCancel={() => leaveRecovery({ type: "success", text: "You've been signed out. Your password was not changed." })}
      />
    );
  }

  if (!session) {
    return <AuthScreen notice={notice} />;
  }

  installSupabaseStorage();

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 16px" }}>
        <button
          onClick={() => supabase.auth.signOut()}
          style={{ background: "none", border: "1px solid #ccc", borderRadius: 6, padding: "4px 12px", cursor: "pointer", fontFamily: "sans-serif", fontSize: 13 }}
        >
          Log out
        </button>
      </div>
      <App
        userId={session.user.id}
        userEmail={session.user.email}
        accessToken={session.access_token}
      />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);