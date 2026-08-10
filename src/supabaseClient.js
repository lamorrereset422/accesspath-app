import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://obylhtfhlioplwscecfs.supabase.co";
const supabaseKey = "sb_publishable_kTNhvFU_MUYaE_lSEXmqTQ_pte5rOAT";

export const supabase = createClient(supabaseUrl, supabaseKey);