import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

if (!supabaseUrl || !supabaseKey) {
  throw new Error("AccessPath database configuration is missing.");
}

const productionHosts = [
  "accesspathliving.com",
  "accesspath-app.netlify.app",
];

const isProduction = productionHosts.includes(
  window.location.hostname
);

const expectedProject = isProduction
  ? "obylhtfhlioplwscecfs"
  : "laxqancsddcufhwhcjlv";

if (supabaseUrl !== `https://${expectedProject}.supabase.co`) {
  throw new Error(
    "AccessPath database configuration does not match this environment."
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
