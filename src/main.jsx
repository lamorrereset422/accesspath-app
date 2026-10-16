import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import AuthScreen from "./AuthScreen.jsx";
import { ResetPasswordScreen } from "./PasswordRecovery.jsx";
import { supabase } from "./supabaseClient.js";
import { installSupabaseStorage } from "./supabaseStorage.js";
   import ErrorBoundary, { DevCrashSwitch } from "./ErrorBoundary.jsx";

/* ---------------------------------------------------------------
   Password recovery helpers
   The recovery gate turns on ONLY from Supabase's PASSWORD_RECOVERY
   event. The ?reset=1 marker never turns it on by itself.
   The flag lives in localStorage, the same place the login session
   lives, so every tab that can use the recovery session is gated.
   It stores only the user's ID, never a token or password.
----------------------------------------------------------------*/
const RECOVERY_FLAG = "accesspath:recovery-pending";
let memoryRecoveryUserId = null; // backup only if browser storage is unavailable

function readRecoveryUserId() {
  try {
    const raw = window.localStorage.getItem(RECOVERY_FLAG);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed.userId === "string") return parsed.userId;
  } catch { /* fall back to memory */ }
  return memoryRecoveryUserId;
}
function setRecoveryFlag(userId) {
  if (!userId) return;
  try {
    window.localStorage.setItem(RECOVERY_FLAG, JSON.stringify({ userId }));
    memoryRecoveryUserId = null;
  } catch {
    memoryRecoveryUserId = userId;
  }
}
function clearRecoveryFlag() {
  memoryRecoveryUserId = null;
  try { window.localStorage.removeItem(RECOVERY_FLAG); } catch { /* ignore */ }
  try { window.sessionStorage.removeItem(RECOVERY_FLAG); } catch { /* remove the old per-tab flag too */ }
}
function isRecoveryFor(session) {
  const userId = readRecoveryUserId();
  return !!(session && session.user && userId && session.user.id === userId);
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
supabase.auth.onAuthStateChange((event, session) => {
  if (event === "PASSWORD_RECOVERY" && session && session.user) setRecoveryFlag(session.user.id);
});

function Root() {
  const [session, setSession] = useState(undefined); // undefined = still checking
  const [, setFlagVersion] = useState(0); // re-check the shared flag when it changes
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

  const recovery = isRecoveryFor(session);
  const refreshFlag = () => setFlagVersion((v) => v + 1);

  useEffect(() => {
    const applySession = (event, nextSession) => {
      if (event === "PASSWORD_RECOVERY" && nextSession && nextSession.user) {
        setRecoveryFlag(nextSession.user.id);
      } else if (nextSession && nextSession.user) {
        const flaggedUserId = readRecoveryUserId();
        // A leftover flag for a different account is never valid.
        if (flaggedUserId && flaggedUserId !== nextSession.user.id) clearRecoveryFlag();
      }
      if (nextSession) setNotice(null);
      setSession(nextSession);
      refreshFlag();
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

  // Another tab started or finished recovery: re-check right away.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === RECOVERY_FLAG || e.key === null) refreshFlag();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // A reset link should become a recovery session within a moment. Wait briefly
  // instead of opening the assessment. This only delays; it never turns the gate on.
  useEffect(() => {
    if (!waitForRecovery || session === undefined) return;
    if (!session || recovery) { setWaitForRecovery(false); return; }
    const timer = setTimeout(() => setWaitForRecovery(false), 2000);
    return () => clearTimeout(timer);
  }, [waitForRecovery, session, recovery]);

  // If the session disappears while recovery is pending, end recovery safely.
  useEffect(() => {
    if (session === null && !leaving && readRecoveryUserId()) {
      clearRecoveryFlag();
      refreshFlag();
      setNotice({ type: "error", text: "Your password reset session has ended. If you still need to reset your password, request a new link." });
    }
  }, [session, leaving]);

  // Finish or cancel recovery: sign out everywhere, and only then clear the flag.
  const leaveRecovery = async (nextNotice) => {
    setLeaving(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (error) await supabase.auth.signOut({ scope: "local" });
    } catch {
      try { await supabase.auth.signOut({ scope: "local" }); } catch { /* checked below */ }
    }
    let stillSignedIn = true;
    try {
      const { data } = await supabase.auth.getSession();
      stillSignedIn = !!data.session;
    } catch { /* treat as still signed in */ }
    if (stillSignedIn) {
      // Sign-out did not finish: the flag stays, so every tab stays locked.
      setLeaving(false);
      return;
    }
    clearRecoveryFlag();
    refreshFlag();
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
       <ErrorBoundary>
     <DevCrashSwitch />
    <Root />
       </ErrorBoundary>
  </React.StrictMode>
);