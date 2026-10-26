import React, { useEffect, useRef, useState } from "react";

const SITE_KEY = "0x4AAAAAAFnDa5Ptz5WLwz53";
const SCRIPT_ID = "accesspath-turnstile";
let scriptPromise = null;

function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    let settled = false;
    let timer;
    const script = document.createElement("script");

    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      script.onload = null;
      script.onerror = null;

      if (error) {
        script.remove();
        reject(error);
      } else {
        resolve(window.turnstile);
      }
    };

    document.getElementById(SCRIPT_ID)?.remove();
    script.id = SCRIPT_ID;
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = () => {
      if (!window.turnstile) {
        finish(new Error("Security check unavailable."));
        return;
      }
      window.turnstile.ready(() => finish();
    };
    script.onerror = () => finish(new Error("Security check unavailable."));
    timer = setTimeout(
      () => finish(new Error("Security check took too long to load.")),
      20000
    );
    document.head.appendChild(script);
  }).catch((error) => {
    scriptPromise = null;
    throw error;
  });

  return scriptPromise;
}

export default function TurnstileCaptcha({ onToken, resetKey = 0 }) {
  const containerRef = useRef(null);
  const onTokenRef = useRef(onToken);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState("Loading security check...");
  const [failed, setFailed] = useState(false);

  onTokenRef.current = onToken;

  useEffect(() => {
    let active = true;
    let widgetId = null;
    let api = null;

    onTokenRef.current("");
    setFailed(false);
    setStatus("Loading security check...");

    const unavailable = () => {
      if (!active) return;
      onTokenRef.current("");
      setFailed(true);
      setStatus(
        "The security check couldn't finish. Please retry the security check."
      );
    };

    loadTurnstile()
      .then((turnstile) => {
        if (!active || !containerRef.current) return;
        api = turnstile;

        widgetId = api.render(containerRef.current, {
          sitekey: SITE_KEY,
          theme: "light",
          size: "flexible",
          "response-field": false,
          callback: (token) => {
            if (!active) return;
            onTokenRef.current(token);
            setFailed(false);
            setStatus("Security check complete.");
          },
          "expired-callback": () => {
            if (!active) return;
            onTokenRef.current("");
            setStatus("Security check expired. Please complete it again.");
          },
          "error-callback": () => {
            unavailable();
            return true;
          },
          "timeout-callback": unavailable,
        });

        setStatus("Please complete the security check if prompted.");
      })
      .catch(unavailable);

    return () => {
      active = false;
      if (api && widgetId !== null) {
        api.remove(widgetId);
      }
    };
  }, [resetKey, attempt]);

  return (
    <div style={{ margin: "4px 0 16px" }}>
      <div ref={containerRef} />
      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{ fontSize: 14, color: "#4B5563", margin: "8px 0" }}
      >
        {status}
      </p>
      {failed && (
        <button
          type="button"
          onClick={() => setAttempt((value) => value + 1)}
          style={{
            padding: "8px 12px",
            border: "1px solid #3D6B5C",
            borderRadius: 6,
            background: "#fff",
            color: "#3D6B5C",
            cursor: "pointer",
          }}
        >
          Retry security check
        </button>
      )}
    </div>
  );
}
