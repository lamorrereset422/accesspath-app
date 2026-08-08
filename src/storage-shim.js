// This file makes the app work outside claude.ai.
//
// Inside claude.ai, "window.storage" is provided automatically. Outside of
// it (a real deployed app), that doesn't exist — so this file creates a
// stand-in version that saves everything to the browser's localStorage
// instead, using the exact same get/set/delete/list functions the app
// already expects.
//
// IMPORTANT LIMITATION: localStorage only saves data on ONE device, in ONE
// browser. If someone uses the app on their phone and then their laptop,
// they will NOT see the same answers on both. Fixing that requires a real
// backend with user accounts (see Step 3 in your roadmap) — this shim is
// just a bridge to get you running for now.

if (typeof window !== "undefined" && !window.storage) {
  window.storage = {
    async get(key) {
      const raw = window.localStorage.getItem(key);
      if (raw === null) {
        throw new Error(`AccessPath storage: no value found for "${key}"`);
      }
      return { key, value: raw, shared: false };
    },
    async set(key, value) {
      window.localStorage.setItem(key, value);
      return { key, value, shared: false };
    },
    async delete(key) {
      window.localStorage.removeItem(key);
      return { key, deleted: true, shared: false };
    },
    async list(prefix = "") {
      const keys = Object.keys(window.localStorage).filter((k) => k.startsWith(prefix));
      return { keys, prefix, shared: false };
    },
  };
}
