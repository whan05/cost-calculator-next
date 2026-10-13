"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calculator,
  LayoutDashboard,
  Boxes,
  History,
  Settings,
  LogOut,
  Menu,
  X,
  Coins,
  ChevronRight,
  PlusCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/features/auth/actions";

interface SidebarProps {
  userEmail?: string;
  businessName?: string;
  currency?: string;
}

const navItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Calculadora",
    href: "/calculator",
    icon: Calculator,
  },
  {
    name: "Catálogo de Insumos",
    href: "/materials",
    icon: Boxes,
  },
  {
    name: "Historial de Cálculos",
    href: "/calculations",
    icon: History,
  },
  {
    name: "Configuración",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar({ userEmail, businessName, currency }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavLinks = () => (
    <nav className="flex flex-col gap-1.5 px-3">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-all",
              isActive
                ? "bg-emerald-600 text-white shadow-sm font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">{item.name}</span>
            {isActive && <ChevronRight className="h-4 w-4 opacity-80" />}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile top header */}
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-4 backdrop-blur md:hidden shadow-xs">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Abrir menú"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="flex items-center gap-2 font-bold tracking-tight text-slate-900 dark:text-slate-100">
            <Coins className="h-5 w-5 text-emerald-600" />
            <span>CostCalc</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <form action={logoutAction}>
            <Button variant="ghost" size="icon" type="submit" title="Cerrar sesión">
              <LogOut className="h-4 w-4 text-slate-500 hover:text-destructive" />
            </Button>
          </form>
        </div>
      </header>

      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-transform duration-300 ease-in-out md:hidden shadow-2xl",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5">
          <div className="flex items-center gap-2 font-bold tracking-tight text-slate-900 dark:text-slate-100">
            <Coins className="h-5 w-5 text-emerald-600" />
            <span>CostCalc Pro</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Negocio</p>
          <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate mt-0.5">{businessName || "Mi Negocio"}</p>
          <p className="text-xs text-slate-500 truncate">{userEmail || "Usuario"}</p>
        </div>

        <div className="flex-1 py-4 overflow-y-auto">
          <NavLinks />
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
          <Link href="/calculator" onClick={() => setMobileOpen(false)}>
            <Button className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
              <PlusCircle className="h-4 w-4" />
              Nuevo Cálculo
            </Button>
          </Link>
          <form action={logoutAction}>
            <Button variant="outline" className="w-full gap-2 text-destructive hover:bg-destructive/10" type="submit">
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </Button>
          </form>
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs z-30">
        <div className="flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold tracking-tight text-lg text-slate-900 dark:text-slate-100">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
              <Coins className="h-5 w-5" />
            </div>
            <span>CostCalc</span>
          </Link>
          <ThemeToggle />
        </div>

        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Negocio</span>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono px-2 py-0.5 rounded font-bold">
              {currency || "CRC"}
            </span>
          </div>
          <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 mt-1 truncate">{businessName || "Mi Negocio"}</p>
          <p className="text-xs text-slate-500 truncate">{userEmail || "Usuario"}</p>
        </div>

        <div className="flex-1 py-4 overflow-y-auto">
          <NavLinks />
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
          <Link href="/calculator">
            <Button className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs font-semibold">
              <PlusCircle className="h-4 w-4" />
              Nuevo Cálculo
            </Button>
          </Link>

          <form action={logoutAction}>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-slate-500 hover:text-destructive hover:bg-destructive/10"
              type="submit"
            >
              <LogOut className="h-4 w-4" />
              <span>Cerrar Sesión</span>
            </Button>
          </form>
        </div>
      </aside>
    </>
  );
}
