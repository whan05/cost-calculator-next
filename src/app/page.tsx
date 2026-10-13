import React from "react";
import Link from "next/link";
import {
  Coins,
  Calculator,
  Boxes,
  TrendingUp,
  Clock,
  ShieldCheck,
  ArrowRight,
  Check,
  Percent,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { getCurrentUser } from "@/lib/supabase/server";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <Coins className="h-5 w-5" />
            </div>
            <span>CostCalc Pro</span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <Link href="/dashboard">
                <Button className="gap-2">
                  <span>Ir al Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Iniciar Sesión</Button>
                </Link>
                <Link href="/register">
                  <Button className="gap-2">
                    <span>Empezar Gratis</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-muted/50 text-xs font-semibold text-muted-foreground">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Precisión Decimal & Snapshots Históricos
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
            Calcula los costos de tus{" "}
            <span className="text-emerald-600 dark:text-emerald-500">productos</span> y{" "}
            <span className="text-blue-600 dark:text-blue-500">servicios</span> con exactitud
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Administra materiales, mano de obra, gastos adicionales y determina precios de venta
            estratégicos utilizando <strong className="text-foreground">Markup sobre costo</strong> o{" "}
            <strong className="text-foreground">Margen sobre venta</strong> sin errores de redondeo.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href={user ? "/dashboard" : "/register"} className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto gap-2 text-base px-8 h-12 shadow-md">
                <span>Comenzar Ahora</span>
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href={user ? "/calculator" : "/login"} className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8 h-12">
                Ver Calculadora
              </Button>
            </Link>
          </div>

          {/* Quick Value Points */}
          <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
            <div className="p-4 rounded-xl border bg-card/60 shadow-sm">
              <div className="text-emerald-600 font-bold text-2xl">100%</div>
              <div className="text-xs text-muted-foreground mt-1">Precisión decimal garantizada</div>
            </div>
            <div className="p-4 rounded-xl border bg-card/60 shadow-sm">
              <div className="text-blue-600 font-bold text-2xl">2 Modos</div>
              <div className="text-xs text-muted-foreground mt-1">Productos y Servicios dedicados</div>
            </div>
            <div className="p-4 rounded-xl border bg-card/60 shadow-sm">
              <div className="text-purple-600 font-bold text-2xl">Snapshots</div>
              <div className="text-xs text-muted-foreground mt-1">Historial inmutable de precios</div>
            </div>
            <div className="p-4 rounded-xl border bg-card/60 shadow-sm">
              <div className="text-amber-600 font-bold text-2xl">RLS Supabase</div>
              <div className="text-xs text-muted-foreground mt-1">Seguridad estricta por usuario</div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-16 bg-muted/30 border-y px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold tracking-tight">Diseñado para Emprendedores y Creadores</h2>
              <p className="text-muted-foreground">
                Deja de improvisar tus cotizaciones. Obtén métricas claras y rentables para hacer crecer tu negocio.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl border bg-card space-y-3 shadow-sm hover:shadow transition">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <Boxes className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg">Catálogo Inteligente de Insumos</h3>
                <p className="text-sm text-muted-foreground">
                  Registra compras en gramos, kilogramos, mililitros, litros, metros o unidades. El sistema calcula
                  automáticamente el costo exacto por unidad consumida.
                </p>
              </div>

              <div className="p-6 rounded-2xl border bg-card space-y-3 shadow-sm hover:shadow transition">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <Clock className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg">Tarifa de Mano de Obra Clara</h3>
                <p className="text-sm text-muted-foreground">
                  Configura tu valor por hora o adáptalo para cada producto. El sistema calcula los minutos con
                  exactitud y exige confirmación explícita para evitar valores invisibles.
                </p>
              </div>

              <div className="p-6 rounded-2xl border bg-card space-y-3 shadow-sm hover:shadow transition">
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
                  <Percent className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg">Margen Real vs Markup</h3>
                <p className="text-sm text-muted-foreground">
                  Entiende la diferencia entre markup y margen de ganancia real. Visualiza tu precio sugerido unitario
                  y total del lote al instante en tiempo real.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-emerald-600" />
            <span className="font-semibold text-foreground">CostCalc Pro</span>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
          <p className="text-xs">
            Desarrollado con Next.js App Router, Supabase PostgreSQL y Tailwind CSS.
          </p>
        </div>
      </footer>
    </div>
  );
}
