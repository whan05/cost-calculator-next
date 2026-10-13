import React from "react";
import { AlertTriangle, Database, ArrowRight, ExternalLink } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function DatabaseStatusBanner() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || url.includes("placeholder")) {
    return (
      <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm">
            <h4 className="font-semibold">Variables de entorno pendientes</h4>
            <p className="text-xs text-muted-foreground">
              Configura <code className="bg-amber-500/20 px-1 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
              <code className="bg-amber-500/20 px-1 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> en tu archivo <code className="font-mono">.env.local</code>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from("materials").select("id").limit(1);

    if (error && (error.message.includes("Could not find the table") || (error as any).code === "PGRST205")) {
      return (
        <div className="mb-6 rounded-xl border-2 border-amber-500/40 bg-amber-500/10 p-4 sm:p-5 text-amber-950 dark:text-amber-100 shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-600 shrink-0">
              <Database className="h-5 w-5" />
            </div>
            <div className="space-y-2 text-sm flex-1">
              <h4 className="font-bold text-base flex items-center gap-2">
                <span>Tablas de base de datos pendientes en Supabase</span>
              </h4>
              <p className="text-xs leading-relaxed text-muted-foreground dark:text-amber-200/80">
                La aplicación está conectada a tu proyecto de Supabase, pero las tablas (
                <code className="font-mono bg-amber-500/20 px-1 rounded">materials</code>,{" "}
                <code className="font-mono bg-amber-500/20 px-1 rounded">calculations</code>,{" "}
                <code className="font-mono bg-amber-500/20 px-1 rounded">profiles</code>) aún no han sido creadas.
              </p>

              <div className="rounded-lg bg-background/80 p-3 text-xs border border-amber-500/20 space-y-1 text-foreground">
                <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Para activarlas en menos de 1 minuto:
                </p>
                <ol className="list-decimal list-inside space-y-0.5 text-muted-foreground">
                  <li>Abre tu consola de Supabase y ve a la sección <strong>SQL Editor</strong>.</li>
                  <li>Copia el archivo local <strong className="text-foreground font-mono">supabase/migrations/20261012_initial_schema.sql</strong>.</li>
                  <li>Pégalo en el editor y haz clic en <strong>Run</strong>.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      );
    }
  } catch {
    // Silently continue if network check fails
  }

  return null;
}

