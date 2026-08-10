import { supabase } from "./supabaseClient.js";

// This replaces window.storage, but saves everything to your
// Supabase database instead of the browser, tied to whichever
// user is currently logged in.

async function getCurrentUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No user is logged in");
  return user.id;
}

export function installSupabaseStorage() {
  window.storage = {
    async get(key) {
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from("accesspath_storage")
        .select("value")
        .eq("user_id", userId)
        .eq("key", key)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error(`No value found for "${key}"`);
      return { key, value: data.value, shared: false };
    },

    async set(key, value) {
      const userId = await getCurrentUserId();
      const { error } = await supabase
        .from("accesspath_storage")
        .upsert(
          { user_id: userId, key, value, updated_at: new Date().toISOString() },
          { onConflict: "user_id,key" }
        );
      if (error) throw error;
      return { key, value, shared: false };
    },

    async delete(key) {
      const userId = await getCurrentUserId();
      const { error } = await supabase
        .from("accesspath_storage")
        .delete()
        .eq("user_id", userId)
        .eq("key", key);
      if (error) throw error;
      return { key, deleted: true, shared: false };
    },

    async list(prefix = "") {
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from("accesspath_storage")
        .select("key")
        .eq("user_id", userId)
        .like("key", `${prefix}%`);
      if (error) throw error;
      return { keys: data.map((row) => row.key), prefix, shared: false };
    },
  };
}