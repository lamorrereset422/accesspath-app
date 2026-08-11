import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import AuthScreen from "./AuthScreen.jsx";
import { supabase } from "./supabaseClient.js";
import { installSupabaseStorage } from "./supabaseStorage.js";

function Root() {
  const [session, setSession] = useState(undefined); // undefined = still checking

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return <p style={{ textAlign: "center", marginTop: 80, fontFamily: "sans-serif" }}>Loading...</p>;
  }

  if (!session) {
    return <AuthScreen />;
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
      <App userId={session.user.id} userEmail={session.user.email} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);