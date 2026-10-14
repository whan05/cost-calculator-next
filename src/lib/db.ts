import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * ==============================================================================
 * Patrón Singleton para el Cliente de Base de Datos (Node.js Runtime)
 * ==============================================================================
 * 
 * Problema resuelto:
 * En entornos Serverless y frameworks como Next.js, la recarga en caliente
 * (Fast Refresh / HMR) o la instanciación de clientes de base de datos dentro
 * de cada petición provoca la apertura continua de sockets TCP hacia PostgreSQL
 * o PgBouncer. Esto causa mensajes de login masivos y cierres abruptos
 * (`[::1] login attempt / closing because: client close request`).
 * 
 * Solución:
 * Almacenar la instancia del cliente en el objeto global de Node.js (`globalThis`),
 * que sobrevive a las recargas de módulos y garantiza que SOLO exista una conexión
 * reutilizable en todo el ciclo de vida del servidor.
 */

// Tipo para almacenar la instancia única en el ámbito global
interface GlobalDatabase {
  dbInstance?: SupabaseClient;
}

const globalForDb = globalThis as unknown as GlobalDatabase;

/**
 * Obtener la instancia Singleton del cliente de base de datos.
 */
export function getDb(): SupabaseClient {
  if (!globalForDb.dbInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      "placeholder-anon-key";

    globalForDb.dbInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return globalForDb.dbInstance;
}

/**
 * Instancia singleton exportada para consultas en el servidor.
 */
export const db = getDb();

/**
 * NOTA DE ARQUITECTURA PARA MIGRACIÓN A PRISMA / DRIZZLE / PG NATIVO:
 * Si en el futuro se incorpora Prisma, Drizzle o `pg.Pool`, utiliza exactamente
 * este mismo patrón en este archivo para evitar agotar el pooler de PgBouncer:
 * 
 * // Ejemplo Prisma:
 * // import { PrismaClient } from "@prisma/client";
 * // const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
 * // export const prisma = globalForPrisma.prisma ?? new PrismaClient({
 * //   datasources: { db: { url: process.env.DATABASE_URL } },
 * // });
 * // if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
 * 
 * // Ejemplo pg.Pool:
 * // import { Pool } from "pg";
 * // const globalForPg = globalThis as unknown as { pool?: Pool };
 * // export const pool = globalForPg.pool ?? new Pool({
 * //   connectionString: process.env.DATABASE_URL,
 * //   max: 10,
 * //   idleTimeoutMillis: 30000,
 * // });
 * // if (process.env.NODE_ENV !== "production") globalForPg.pool = pool;
 */

