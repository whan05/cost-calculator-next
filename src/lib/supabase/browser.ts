import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client para el navegador usando @supabase/ssr
 * Sincroniza cookies automáticamente con el servidor
 */
export function createBrowserSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "placeholder-anon-key";

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Instancia singleton para reutilizar en componentes del cliente
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getBrowserSupabaseClient() {
  if (typeof window === "undefined") {
    return createBrowserSupabaseClient();
  }
  if (!browserClient) {
    browserClient = createBrowserSupabaseClient();
  }
  return browserClient;
}

export const supabaseBrowser = typeof window !== "undefined" 
  ? getBrowserSupabaseClient() 
  : null as unknown as ReturnType<typeof createBrowserClient>;
