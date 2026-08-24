import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";

/**
 * Client Supabase pour le NAVIGATEUR (Client Components).
 * Il lit/écrit le cookie de session directement dans le navigateur.
 */
export function createClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createBrowserClient(url, anonKey);
}
