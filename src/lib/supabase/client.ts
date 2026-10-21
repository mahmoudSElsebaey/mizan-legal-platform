import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "./env";
export function createClient() { const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY } = getSupabasePublicEnv(); return createBrowserClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY); }
