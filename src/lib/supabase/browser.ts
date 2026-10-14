import { createBrowserClient } from "@supabase/ssr";

type BrowserSupabaseClient = ReturnType<typeof createBrowserClient>;

declare global {
  interface Window {
    __supabaseBrowserClient?: BrowserSupabaseClient;
  }
}

let browserClient: BrowserSupabaseClient | null = null;

function instantiateBrowserClient(): BrowserSupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "placeholder-anon-key";

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Singleton estricto para el navegador usando @supabase/ssr.
 * Reutiliza una única instancia durante todo el ciclo de vida de la aplicación en el cliente,
 * evitando la apertura repetida de canales de conexión WebSocket y re-autenticaciones fantasma.
 */
export function getBrowserSupabaseClient(): BrowserSupabaseClient {
  if (typeof window === "undefined") {
    return instantiateBrowserClient();
  }

  if (window.__supabaseBrowserClient) {
    return window.__supabaseBrowserClient;
  }

  if (!browserClient) {
    browserClient = instantiateBrowserClient();
    window.__supabaseBrowserClient = browserClient;
  }

  return browserClient;
}

/**
 * Retorna la instancia singleton existente o la inicializa si no existe.
 */
export function createBrowserSupabaseClient(): BrowserSupabaseClient {
  return getBrowserSupabaseClient();
}

export const supabaseBrowser = typeof window !== "undefined" 
  ? getBrowserSupabaseClient() 
  : (null as unknown as BrowserSupabaseClient);

