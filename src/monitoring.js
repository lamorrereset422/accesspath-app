import * as Sentry from "@sentry/react";

/* ---------------------------------------------------------------
   Error monitoring (Sentry)
   - The browser DSN is intentionally public: it only allows sending
     error reports to this project. It comes from VITE_SENTRY_DSN in
     Netlify and is NOT a secret.
   - Preview and live are both production builds, so the environment
     is decided by hostname, not by build mode.
   - Privacy: no personal data, no session replay, no tracing, no
     console or click breadcrumbs, no request headers or extra data,
     and query strings / #fragments are removed from every web
     address (page, breadcrumbs, and stack frames) before sending.
----------------------------------------------------------------*/
const DSN = import.meta.env.VITE_SENTRY_DSN;

// If the site moves to a custom domain, add it here or reporting stops.
export function environmentFromHostname(hostname) {
  if (hostname === "accesspath-app.netlify.app") return "production";
  if (/^deploy-preview-\d+--accesspath-app\.netlify\.app$/.test(hostname)) return "preview";
  if (hostname === "localhost" || hostname === "127.0.0.1") return "development";
  return "unknown";
}

// Remove query strings and #fragments, which can hold tokens, user IDs,
// or reset-link details. Values without "?" or "#" are left untouched,
// so stack-frame names like "<anonymous>" are not turned into fake URLs.
function stripUrl(value) {
  if (typeof value !== "string" || !/[?#]/.test(value)) return value;
  try {
    const url = new URL(value, window.location.origin);
    return url.origin + url.pathname;
  } catch {
    return value.split(/[?#]/)[0];
  }
}

function scrubFrames(stacktrace) {
  if (!stacktrace || !Array.isArray(stacktrace.frames)) return;
  stacktrace.frames.forEach((frame) => {
    if (frame.filename) frame.filename = stripUrl(frame.filename);
    if (frame.abs_path) frame.abs_path = stripUrl(frame.abs_path);
  });
}

function scrubBreadcrumb(breadcrumb) {
  if (!breadcrumb) return null;
  const category = breadcrumb.category || "";
  if (category === "console" || category.startsWith("ui.")) return null;
  if (breadcrumb.data) {
    const data = { ...breadcrumb.data };
    if (data.url) data.url = stripUrl(data.url);
    if (data.from) data.from = stripUrl(data.from);
    if (data.to) data.to = stripUrl(data.to);
    breadcrumb.data = data;
  }
  return breadcrumb;
}

function scrubEvent(event) {
  delete event.user;
  delete event.extra;
  if (event.request) {
    if (event.request.url) event.request.url = stripUrl(event.request.url);
    delete event.request.query_string;
    delete event.request.cookies;
    delete event.request.data;
    delete event.request.headers;
  }
  const exceptions = (event.exception && event.exception.values) || [];
  exceptions.forEach((exception) => scrubFrames(exception.stacktrace));
  scrubFrames(event.stacktrace);
  const threads = (event.threads && event.threads.values) || [];
  threads.forEach((thread) => scrubFrames(thread.stacktrace));
  if (Array.isArray(event.breadcrumbs)) {
    event.breadcrumbs = event.breadcrumbs.map(scrubBreadcrumb).filter(Boolean);
  }
  return event;
}

let started = false;

export function startMonitoring() {
  if (started || !DSN) return;
  const environment = environmentFromHostname(window.location.hostname);
  // Only the deployed live and preview sites report. Localhost and unknown hosts never send anything.
  if (environment !== "production" && environment !== "preview") return;

  try {
    Sentry.init({
      dsn: DSN,
      environment,
      sendDefaultPii: false,
      integrations: [Sentry.breadcrumbsIntegration({ console: false, dom: false })],
      maxBreadcrumbs: 30,
      beforeBreadcrumb: scrubBreadcrumb,
      beforeSend: scrubEvent,
    });
    started = true;
  } catch {
    /* monitoring must never break the app */
  }
}

// Called by ErrorBoundary when the screen crashes while drawing.
export function reportCrash(error, info) {
  if (!started) return;
  Sentry.captureException(error, {
    contexts: { react: { componentStack: (info && info.componentStack) || "" } },
  });
}