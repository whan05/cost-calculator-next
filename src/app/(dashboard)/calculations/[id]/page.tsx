import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Package,
  Wrench,
  Boxes,
  Clock,
  Receipt,
  ArrowLeft,
  Edit2,
  Calendar,
  ShieldCheck,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCalculationById } from "@/features/calculations/actions";
import { getProfile } from "@/features/settings/actions";
import { formatCurrency, formatNumber } from "@/lib/utils/currency";

interface CalculationDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CalculationDetailPage({ params }: CalculationDetailPageProps) {
  const { id } = await params;
  const profile = await getProfile();
  const calculation = await getCalculationById(id);

  if (!calculation) {
    notFound();
  }

  const currency = profile?.currency || "CRC";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Barra superior de navegación */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/calculations">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Volver al Historial</span>
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          <Link href={`/calculator?id=${calculation.id}`}>
            <Button size="sm" className="gap-2">
              <Edit2 className="h-4 w-4" />
              <span>Editar en Calculadora</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Tarjeta de Encabezado Principal */}
      <Card className="border-2 border-primary/20 shadow-md">
        <CardHeader className="space-y-2 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {calculation.type === "product" ? (
                <Badge variant="success" className="gap-1">
                  <Package className="h-3.5 w-3.5" />
                  <span>Producto ({calculation.output_quantity} unidades producidas)</span>
                </Badge>
              ) : (
                <Badge variant="info" className="gap-1">
                  <Wrench className="h-3.5 w-3.5" />
                  <span>Servicio</span>
                </Badge>
              )}
              {calculation.is_archived && <Badge variant="secondary">Archivado</Badge>}
            </div>

            <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
              <Calendar className="h-3.5 w-3.5" />
              Creado el {new Date(calculation.created_at).toLocaleDateString("es-CR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>

          <CardTitle className="text-2xl font-bold">{calculation.name}</CardTitle>
          {calculation.description && (
            <CardDescription className="text-base">
              {calculation.description}
            </CardDescription>
          )}
        </CardHeader>

        {/* Cifras Clave */}
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-muted/40 border">
            <span className="text-xs text-muted-foreground font-semibold uppercase">Costo Total del Lote</span>
            <div className="text-xl font-bold font-mono mt-1">
              {formatCurrency(calculation.total_cost, { currency })}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-muted/40 border">
            <span className="text-xs text-muted-foreground font-semibold uppercase">Costo Unitario</span>
            <div className="text-xl font-bold font-mono mt-1">
              {formatCurrency(calculation.unit_cost, { currency })}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold uppercase">
              Precio Sugerido Unitario
            </span>
            <div className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-1">
              {formatCurrency(calculation.suggested_unit_price, { currency })}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-muted/40 border">
            <span className="text-xs text-muted-foreground font-semibold uppercase">Estrategia Ganancia</span>
            <div className="text-lg font-bold mt-1">
              {calculation.profit_percentage}%{" "}
              <span className="text-xs font-normal text-muted-foreground">
                ({calculation.profit_method === "markup" ? "Markup" : "Margen"})
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Desglose Completo */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Mano de Obra */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span>Mano de Obra y Tiempo</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-1 border-b">
              <span className="text-muted-foreground">Tiempo total invertido:</span>
              <strong className="font-mono">{calculation.work_minutes} min ({formatNumber(calculation.work_minutes / 60)} hrs)</strong>
            </div>
            <div className="flex justify-between items-center py-1 border-b">
              <span className="text-muted-foreground">Tarifa horaria aplicada:</span>
              <strong className="font-mono">{formatCurrency(calculation.hourly_rate, { currency })}/hr</strong>
            </div>
            <div className="flex justify-between items-center py-1 font-semibold">
              <span>Costo total mano de obra:</span>
              <span className="font-mono text-blue-600 dark:text-blue-400">
                {formatCurrency(calculation.labor_cost, { currency })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Gastos Adicionales */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4 text-amber-600" />
              <span>Gastos Adicionales e Indirectos</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {calculation.expenses.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-4 text-center">
                Sin gastos adicionales registrados.
              </p>
            ) : (
              <div className="space-y-1">
                {calculation.expenses.map((e) => (
                  <div key={e.id} className="flex justify-between items-center py-1 border-b text-xs">
                    <span className="text-muted-foreground">{e.name}</span>
                    <span className="font-mono font-medium">{formatCurrency(e.amount, { currency })}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between items-center pt-2 font-semibold border-t">
              <span>Total gastos adicionales:</span>
              <span className="font-mono text-amber-600 dark:text-amber-400">
                {formatCurrency(calculation.additional_cost, { currency })}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Materiales con Snapshots Históricos */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Boxes className="h-4 w-4 text-purple-600" />
              <span>Insumos y Materiales Consumidos</span>
            </CardTitle>
            <CardDescription className="text-xs flex items-center gap-1 mt-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Snapshots inmutables: estos precios están congelados al momento de guardar.</span>
            </CardDescription>
          </div>
          <span className="font-mono font-bold text-sm">
            Total: {formatCurrency(calculation.materials_cost, { currency })}
          </span>
        </CardHeader>
        <CardContent>
          {calculation.materials.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-4 text-center">
              No se consumieron materiales registrados en este cálculo.
            </p>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead className="text-right">Costo Unit. Snapshot</TableHead>
                    <TableHead className="text-center">Cantidad Utilizada</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calculation.materials.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">
                        {m.material_name_snapshot} ({m.unit_snapshot})
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {formatCurrency(m.unit_cost_snapshot, { currency })}/{m.unit_snapshot}
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs">
                        {formatNumber(m.quantity_used)} {m.unit_snapshot}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        {formatCurrency(m.subtotal, { currency })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
