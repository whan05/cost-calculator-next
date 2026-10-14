import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Patrón Singleton Global (Node.js runtime):
 * Reutiliza una única instancia del cliente a nivel de proceso de Node.js en globalThis.
 * Esto evita crear y destruir conexiones repetidamente hacia PgBouncer durante
 * recargas en caliente (Fast Refresh) o invocaciones en el servidor.
 */
const globalForDb = globalThis as unknown as {
  supabaseGlobalClient: SupabaseClient | undefined;
};

export function getDatabaseClient(): SupabaseClient {
  if (!globalForDb.supabaseGlobalClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      "placeholder-anon-key";

    globalForDb.supabaseGlobalClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return globalForDb.supabaseGlobalClient;
}

/**
 * Supabase client para servidor con gestión de sesiones SSR y Patrón Singleton Per-Request.
 * 
 * Usando `cache()` de React, garantizamos que dentro de una misma petición HTTP
 * (Layout -> Pages -> Components -> Server Actions), se devuelva EXACTAMENTE la misma
 * instancia en memoria en lugar de instanciar un nuevo cliente en cada invocación.
 */
export const createServerSupabaseClient = cache(async () => {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "placeholder-anon-key";

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // El método `setAll` se llamó desde un Server Component.
          // Puede ignorarse si hay un proxy/middleware actualizando sesiones.
        }
      },
    },
  });
});

/**
 * Obtener el usuario actual desde el servidor con memoización Singleton (React cache).
 * Evita múltiples llamadas redundantes a supabase.auth.getUser() dentro del ciclo
 * de vida de la misma petición (ej. layout + dashboard page + banners).
 */
export const getCurrentUser = cache(async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || url.includes("placeholder")) {
    return null;
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return null;
    }

    return data.user;
  } catch {
    return null;
  }
});

/**
 * Verificar si el usuario está autenticado
 */
export async function requireAuth() {
  return await getCurrentUser();
}

