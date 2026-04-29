import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { hasSupabaseBrowserEnv, getSupabaseBrowserEnv } from "./env";

// Cookieless anon client for server-side public reads (e.g. listing
// published quizzes on /quizzes). RLS allows public select on the
// published-quizzes table, so no auth context is needed.
let anonClient: SupabaseClient | null = null;

export function getSupabaseAnonClient(): SupabaseClient | null {
  if (!hasSupabaseBrowserEnv()) return null;
  if (!anonClient) {
    const { url, anonKey } = getSupabaseBrowserEnv();
    anonClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return anonClient;
}
