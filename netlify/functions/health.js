// Health check for uptime monitoring.
// Runs on Netlify's servers. Answers GET and HEAD with a tiny JSON status:
//   200 {"status":"ok"}        - functions are running and Supabase answered
//   503 {"status":"degraded"}  - Supabase did not answer in time or returned an error
// It never returns error details, versions, or user data, and it reads no user tables.

const SUPABASE_URL = "https://obylhtfhlioplwscecfs.supabase.co";
// Publishable key: public by design (it is also in the browser app and create-checkout.js).
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_kTNhvFU_MUYaE_lSEXmqTQ_pte5rOAT";
const TIMEOUT_MS = 5000;

const HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

function reply(statusCode, status, method) {
  return {
    statusCode,
    headers: HEADERS,
    body: method === "HEAD" ? "" : JSON.stringify({ status }),
  };
}

async function supabaseIsReachable() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      method: "GET",
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY },
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

exports.handler = async (event) => {
  const method = event.httpMethod;
  if (method !== "GET" && method !== "HEAD") {
    return {
      statusCode: 405,
      headers: { ...HEADERS, Allow: "GET, HEAD" },
      body: JSON.stringify({ status: "method_not_allowed" }),
    };
  }

  const ok = await supabaseIsReachable();
  if (!ok) {
    console.warn("Health check: Supabase did not respond successfully.");
    return reply(503, "degraded", method);
  }
  return reply(200, "ok", method);
};