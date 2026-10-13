"use client";

import React from "react";
import Link from "next/link";
import {
  Package,
  Wrench,
  Boxes,
  Clock,
  Receipt,
  Percent,
  Calendar,
  Edit2,
  Copy,
  Printer,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalculationWithDetails } from "@/types/database";
import { formatCurrency, formatNumber } from "@/lib/utils/currency";

interface CalculationDetailModalProps {
  calculation: CalculationWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency?: string;
  onDuplicate?: (id: string) => void;
}

export function CalculationDetailModal({
  calculation,
  open,
  onOpenChange,
  currency = "CRC",
  onDuplicate,
}: CalculationDetailModalProps) {
  if (!calculation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2 border-b">
          <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
            <div className="flex items-center gap-2">
              {calculation.type === "product" ? (
                <Badge variant="success" className="gap-1">
                  <Package className="h-3.5 w-3.5" />
                  <span>Producto ({calculation.output_quantity} unidades)</span>
                </Badge>
              ) : (
                <Badge variant="info" className="gap-1">
                  <Wrench className="h-3.5 w-3.5" />
                  <span>Servicio</span>
                </Badge>
              )}
              {calculation.is_archived && <Badge variant="secondary">Archivado</Badge>}
            </div>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(calculation.created_at).toLocaleDateString("es-CR", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>

          <DialogTitle className="text-xl font-bold mt-2">
            {calculation.name}
          </DialogTitle>
          {calculation.description && (
            <DialogDescription className="text-sm">
              {calculation.description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Tarjeta de Resumen Principal */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-muted/40 border">
            <div>
              <span className="text-[11px] text-muted-foreground uppercase font-semibold">Costo Total</span>
              <div className="text-lg font-bold font-mono">
                {formatCurrency(calculation.total_cost, { currency })}
              </div>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground uppercase font-semibold">Costo Unitario</span>
              <div className="text-lg font-bold font-mono text-foreground">
                {formatCurrency(calculation.unit_cost, { currency })}
              </div>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground uppercase font-semibold">Precio Venta Unit.</span>
              <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {formatCurrency(calculation.suggested_unit_price, { currency })}
              </div>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground uppercase font-semibold">Estrategia</span>
              <div className="text-sm font-semibold">
                {calculation.profit_percentage}%{" "}
                <span className="text-xs text-muted-foreground font-normal">
                  ({calculation.profit_method === "markup" ? "Markup" : "Margen"})
                </span>
              </div>
            </div>
          </div>

          {/* 1. Desglose de Mano de Obra */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span>Mano de Obra y Tiempo</span>
            </h4>
            <div className="p-3 rounded-lg border bg-card text-sm flex flex-col sm:flex-row justify-between gap-2">
              <div>
                <span className="text-muted-foreground">Tiempo invertido: </span>
                <strong className="font-mono">{calculation.work_minutes} min</strong> (
                {formatNumber(calculation.work_minutes / 60)} hrs)
              </div>
              <div>
                <span className="text-muted-foreground">Tarifa por hora: </span>
                <strong className="font-mono">{formatCurrency(calculation.hourly_rate, { currency })}/hr</strong>
              </div>
              <div>
                <span className="text-muted-foreground">Subtotal Labor: </span>
                <strong className="font-mono text-foreground">{formatCurrency(calculation.labor_cost, { currency })}</strong>
              </div>
            </div>
          </div>

          {/* 2. Desglose de Materiales (Snapshots Inmutables) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Boxes className="h-4 w-4 text-purple-600" />
                <span>Materiales e Insumos (Snapshot Inmutable)</span>
              </h4>
              <span className="text-xs font-mono font-semibold">
                Subtotal: {formatCurrency(calculation.materials_cost, { currency })}
              </span>
            </div>

            {calculation.materials.length === 0 ? (
              <p className="text-xs text-muted-foreground italic p-2 border rounded-lg bg-muted/20">
                Este cálculo no utilizó materiales registrados.
              </p>
            ) : (
              <div className="rounded-lg border overflow-hidden text-xs">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material</TableHead>
                      <TableHead className="text-right">Costo Unit. Snapshot</TableHead>
                      <TableHead className="text-center">Cantidad Usada</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calculation.materials.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">
                          {m.material_name_snapshot} ({m.unit_snapshot})
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(m.unit_cost_snapshot, { currency })}/{m.unit_snapshot}
                        </TableCell>
                        <TableCell className="text-center font-mono">
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
          </div>

          {/* 3. Desglose de Gastos Adicionales */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Receipt className="h-4 w-4 text-amber-600" />
                <span>Gastos Adicionales</span>
              </h4>
              <span className="text-xs font-mono font-semibold">
                Subtotal: {formatCurrency(calculation.additional_cost, { currency })}
              </span>
            </div>

            {calculation.expenses.length === 0 ? (
              <p className="text-xs text-muted-foreground italic p-2 border rounded-lg bg-muted/20">
                Sin gastos adicionales.
              </p>
            ) : (
              <div className="rounded-lg border overflow-hidden text-xs">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Concepto</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calculation.expenses.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{e.name}</TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          {formatCurrency(e.amount, { currency })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>

        {/* Footer con acciones */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>

          <div className="flex items-center gap-2">
            {onDuplicate && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => onDuplicate(calculation.id)}
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Duplicar</span>
              </Button>
            )}

            <Link href={`/calculator?id=${calculation.id}`}>
              <Button size="sm" className="gap-1.5">
                <Edit2 className="h-3.5 w-3.5" />
                <span>Editar en Calculadora</span>
              </Button>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

