import React from "react";
import Link from "next/link";
import {
  Boxes,
  PlusCircle,
  Package,
  Wrench,
  History,
  TrendingUp,
  Settings,
  ArrowRight,
  Eye,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCalculations } from "@/features/calculations/actions";
import { getMaterials } from "@/features/materials/actions";
import { getProfile } from "@/features/settings/actions";
import { formatCurrency } from "@/lib/utils/currency";

export default async function DashboardPage() {
  const profile = await getProfile();
  const calculations = await getCalculations({ includeArchived: false });
  const materials = await getMaterials({ includeArchived: false });

  const currency = profile?.currency || "CRC";

  const totalProducts = calculations.filter((c) => c.type === "product").length;
  const totalServices = calculations.filter((c) => c.type === "service").length;
  const totalMaterials = materials.length;
  const totalCalculations = calculations.length;

  const recentCalculations = calculations.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Header & Greetings */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Resumen de tu catálogo de insumos, costos de producción y precios de venta.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/calculator?type=product">
            <Button className="gap-2 shadow-sm">
              <Package className="h-4 w-4" />
              <span>Nuevo Producto</span>
            </Button>
          </Link>
          <Link href="/calculator?type=service">
            <Button variant="secondary" className="gap-2 shadow-sm">
              <Wrench className="h-4 w-4" />
              <span>Nuevo Servicio</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Productos Creados
            </CardTitle>
            <Package className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">Modelos y artículos</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Servicios Creados
            </CardTitle>
            <Wrench className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalServices}</div>
            <p className="text-xs text-muted-foreground mt-1">Mano de obra y proyectos</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Insumos Registrados
            </CardTitle>
            <Boxes className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMaterials}</div>
            <p className="text-xs text-muted-foreground mt-1">Materiales en catálogo</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Cálculos
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCalculations}</div>
            <p className="text-xs text-muted-foreground mt-1">Historial activo</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Tiles */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link href="/materials" className="group">
          <Card className="h-full transition-all group-hover:border-primary/50 group-hover:shadow-sm">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600">
                <Boxes className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors">
                  Catálogo de Materiales
                </CardTitle>
                <CardDescription className="text-xs">
                  Gestiona precios de compra y costos unitarios
                </CardDescription>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </CardHeader>
          </Card>
        </Link>

        <Link href="/calculations" className="group">
          <Card className="h-full transition-all group-hover:border-primary/50 group-hover:shadow-sm">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600">
                <History className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors">
                  Historial de Cálculos
                </CardTitle>
                <CardDescription className="text-xs">
                  Consulta, edita o duplica tus cotizaciones
                </CardDescription>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </CardHeader>
          </Card>
        </Link>

        <Link href="/settings" className="group">
          <Card className="h-full transition-all group-hover:border-primary/50 group-hover:shadow-sm">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-600">
                <Settings className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors">
                  Configuración
                </CardTitle>
                <CardDescription className="text-xs">
                  Moneda ({currency}), tarifa por hora y ganancias
                </CardDescription>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Recent Calculations Table */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 gap-2">
          <div>
            <CardTitle className="text-lg">Cálculos Recientes</CardTitle>
            <CardDescription>
              Últimas cotizaciones y costos guardados
            </CardDescription>
          </div>
          <Link href="/calculations">
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              <span>Ver todo el historial</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardHeader>

        <CardContent>
          {recentCalculations.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <Package className="h-10 w-10 text-muted-foreground mx-auto opacity-40" />
              <p className="text-sm font-medium text-muted-foreground">
                Aún no has guardado ningún cálculo.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <Link href="/calculator?type=product">
                  <Button size="sm" className="gap-2">
                    <PlusCircle className="h-4 w-4" />
                    Crear mi primer producto
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Costo Unit.</TableHead>
                  <TableHead className="text-right">Precio Sugerido</TableHead>
                  <TableHead>Ganancia</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentCalculations.map((calc) => (
                  <TableRow key={calc.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{calc.name}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3" />
                          {new Date(calc.created_at).toLocaleDateString("es-CR")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {calc.type === "product" ? (
                        <Badge variant="success">Producto ({calc.output_quantity} uds)</Badge>
                      ) : (
                        <Badge variant="info">Servicio</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {formatCurrency(calc.unit_cost, { currency })}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(calc.suggested_unit_price, { currency })}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-medium">
                        {calc.profit_percentage}% ({calc.profit_method === "markup" ? "Markup" : "Margen"})
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/calculations/${calc.id}`}>
                        <Button variant="ghost" size="sm" className="gap-1 text-xs">
                          <Eye className="h-3.5 w-3.5" />
                          <span>Ver</span>
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
