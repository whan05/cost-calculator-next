"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Package,
  Wrench,
  Boxes,
  Clock,
  Receipt,
  TrendingUp,
  Percent,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  DollarSign,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CalculationType,
  ProfitMethod,
  Material,
  UserProfile,
  CalculationWithDetails,
} from "@/types/database";
import {
  computeCalculationSummary,
  convertTimeToMinutes,
  calculateMaterialSubtotal,
} from "@/lib/calculations/calculations";
import { formatCurrency, formatNumber } from "@/lib/utils/currency";
import { saveCalculation } from "@/features/calculations/actions";
import { toast } from "sonner";

interface MaterialRow {
  material_id?: string;
  material_name_snapshot: string;
  unit_snapshot: string;
  unit_cost_snapshot: number;
  quantity_used: number;
}

interface ExpenseRow {
  name: string;
  amount: number;
}

interface CalculatorFormProps {
  availableMaterials: Material[];
  userProfile: UserProfile | null;
  initialType?: CalculationType;
  initialCalculation?: CalculationWithDetails | null;
  currency?: string;
}

export function CalculatorForm({
  availableMaterials,
  userProfile,
  initialType = "product",
  initialCalculation = null,
  currency = "CRC",
}: CalculatorFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // 1. Selector Principal: Producto o Servicio
  const [type, setType] = useState<CalculationType>(
    initialCalculation?.type || initialType || "product"
  );

  // 2. Información básica
  const [name, setName] = useState(initialCalculation?.name || "");
  const [description, setDescription] = useState(initialCalculation?.description || "");
  const [outputQuantity, setOutputQuantity] = useState<number>(
    initialCalculation ? initialCalculation.output_quantity : type === "product" ? 10 : 1
  );

  // 3. Mano de obra
  const [timeValue, setTimeValue] = useState<number>(
    initialCalculation
      ? initialCalculation.work_minutes >= 60 && initialCalculation.work_minutes % 60 === 0
        ? initialCalculation.work_minutes / 60
        : initialCalculation.work_minutes
      : 60
  );
  const [timeUnit, setTimeUnit] = useState<"minutes" | "hours">(
    initialCalculation && initialCalculation.work_minutes >= 60 && initialCalculation.work_minutes % 60 === 0
      ? "hours"
      : "minutes"
  );
  const [hourlyRate, setHourlyRate] = useState<number>(
    initialCalculation
      ? initialCalculation.hourly_rate
      : userProfile?.default_hourly_rate ?? 0
  );
  // Confirmación explícita si la tarifa es 0
  const [confirmedZeroRate, setConfirmedZeroRate] = useState<boolean>(hourlyRate === 0);

  // 4. Materiales utilizados (Snapshots)
  const [materials, setMaterials] = useState<MaterialRow[]>(() => {
    if (initialCalculation && initialCalculation.materials) {
      return initialCalculation.materials.map((m) => ({
        material_id: m.material_id || undefined,
        material_name_snapshot: m.material_name_snapshot,
        unit_snapshot: m.unit_snapshot,
        unit_cost_snapshot: m.unit_cost_snapshot,
        quantity_used: m.quantity_used,
      }));
    }
    return [];
  });

  // Selector para agregar material del catálogo
  const [selectedCatalogMaterialId, setSelectedCatalogMaterialId] = useState<string>("");
  const [materialAddQuantity, setMaterialAddQuantity] = useState<string>("1");

  // 5. Gastos adicionales
  const [expenses, setExpenses] = useState<ExpenseRow[]>(() => {
    if (initialCalculation && initialCalculation.expenses) {
      return initialCalculation.expenses.map((e) => ({
        name: e.name,
        amount: e.amount,
      }));
    }
    return [
      { name: "Empaque y Envoltorio", amount: 0 },
      { name: "Electricidad y Servicios", amount: 0 },
    ];
  });
  const [newExpenseName, setNewExpenseName] = useState("");
  const [newExpenseAmount, setNewExpenseAmount] = useState<string>("");

  // 6. Ganancia y Método
  const [profitPercentage, setProfitPercentage] = useState<number>(
    initialCalculation
      ? initialCalculation.profit_percentage
      : userProfile?.default_profit_percentage ?? 30
  );
  const [profitMethod, setProfitMethod] = useState<ProfitMethod>(
    initialCalculation ? initialCalculation.profit_method : "markup"
  );

  // Conversión de tiempo a minutos
  const workMinutes = useMemo(() => {
    return convertTimeToMinutes(timeValue || 0, timeUnit);
  }, [timeValue, timeUnit]);

  // 7. Cálculo en tiempo real usando funciones puras con Decimal.js
  const summary = useMemo(() => {
    try {
      const activeExpenses = expenses.filter((e) => e.amount > 0);
      return computeCalculationSummary({
        type,
        outputQuantity: type === "product" ? Math.max(0.0001, outputQuantity || 1) : 1,
        workMinutes,
        hourlyRate: Math.max(0, hourlyRate || 0),
        profitPercentage: Math.max(0, profitPercentage || 0),
        profitMethod,
        materials: materials.map((m) => ({
          unitCost: m.unit_cost_snapshot,
          quantityUsed: m.quantity_used,
        })),
        expenses: activeExpenses.map((e) => ({
          amount: e.amount,
        })),
      });
    } catch (err: any) {
      console.warn("Error en el recálculo:", err.message);
      return null;
    }
  }, [type, outputQuantity, workMinutes, hourlyRate, profitPercentage, profitMethod, materials, expenses]);

  // Manejar adición de material desde el catálogo
  function handleAddMaterial() {
    if (!selectedCatalogMaterialId) return;

    const catalogItem = availableMaterials.find((m) => m.id === selectedCatalogMaterialId);
    if (!catalogItem) return;

    const qty = parseFloat(materialAddQuantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Ingresa una cantidad consumida válida mayor a cero");
      return;
    }

    // Si ya está en la lista, sumar o agregar
    const existingIndex = materials.findIndex((m) => m.material_id === catalogItem.id);
    if (existingIndex >= 0) {
      setMaterials((prev) => {
        const next = [...prev];
        next[existingIndex].quantity_used += qty;
        return next;
      });
      toast.success(`Se agregaron ${qty} ${catalogItem.unit} a ${catalogItem.name}`);
    } else {
      setMaterials((prev) => [
        ...prev,
        {
          material_id: catalogItem.id,
          material_name_snapshot: catalogItem.name,
          unit_snapshot: catalogItem.unit,
          unit_cost_snapshot: catalogItem.unit_cost,
          quantity_used: qty,
        },
      ]);
      toast.success(`${catalogItem.name} agregado a la lista`);
    }

    setSelectedCatalogMaterialId("");
    setMaterialAddQuantity("1");
  }

  // Eliminar material
  function handleRemoveMaterial(index: number) {
    setMaterials((prev) => prev.filter((_, i) => i !== index));
  }

  // Actualizar cantidad de material en fila
  function handleUpdateMaterialQuantity(index: number, newQty: number) {
    if (newQty < 0) return;
    setMaterials((prev) => {
      const next = [...prev];
      next[index].quantity_used = newQty;
      return next;
    });
  }

  // Función para actualizar precios históricos con el catálogo actual
  function handleSyncCatalogPrices() {
    let updatedCount = 0;
    setMaterials((prev) =>
      prev.map((row) => {
        if (!row.material_id) return row;
        const currentCat = availableMaterials.find((m) => m.id === row.material_id);
        if (currentCat && currentCat.unit_cost !== row.unit_cost_snapshot) {
          updatedCount++;
          return {
            ...row,
            unit_cost_snapshot: currentCat.unit_cost,
            unit_snapshot: currentCat.unit,
            material_name_snapshot: currentCat.name,
          };
        }
        return row;
      })
    );

    if (updatedCount > 0) {
      toast.success(`Se actualizaron los precios de ${updatedCount} material(es) con los valores actuales del catálogo.`);
    } else {
      toast.info("Todos los materiales ya corresponden a los precios actuales del catálogo.");
    }
  }

  // Agregar nuevo gasto
  function handleAddExpense() {
    if (!newExpenseName.trim()) {
      toast.error("Ingresa el nombre del gasto adicional");
      return;
    }
    const amt = parseFloat(newExpenseAmount);
    if (isNaN(amt) || amt < 0) {
      toast.error("Ingresa un monto válido");
      return;
    }

    setExpenses((prev) => [...prev, { name: newExpenseName.trim(), amount: amt }]);
    setNewExpenseName("");
    setNewExpenseAmount("");
  }

  // Guardar cálculo
  async function handleSave() {
    if (!name.trim()) {
      toast.error("Por favor ingresa un nombre para este cálculo");
      return;
    }

    if (type === "product" && outputQuantity <= 0) {
      toast.error("La cantidad de productos terminados debe ser mayor a cero");
      return;
    }

    if (hourlyRate === 0 && !confirmedZeroRate) {
      toast.error("Por favor confirma explícitamente si la tarifa por hora es ₡0");
      return;
    }

    if (profitMethod === "margin" && profitPercentage >= 100) {
      toast.error("En el método de margen sobre venta, el porcentaje debe ser estrictamente menor al 100%");
      return;
    }

    setSaving(true);
    try {
      const res = await saveCalculation({
        id: initialCalculation?.id,
        type,
        name: name.trim(),
        description: description.trim() || undefined,
        output_quantity: type === "product" ? Number(outputQuantity) : 1,
        work_minutes: workMinutes,
        hourly_rate: Number(hourlyRate),
        profit_percentage: Number(profitPercentage),
        profit_method: profitMethod,
        materials: materials.map((m) => ({
          material_id: m.material_id,
          material_name_snapshot: m.material_name_snapshot,
          unit_snapshot: m.unit_snapshot,
          unit_cost_snapshot: m.unit_cost_snapshot,
          quantity_used: m.quantity_used,
        })),
        expenses: expenses.filter((e) => e.amount > 0).map((e) => ({
          name: e.name,
          amount: e.amount,
        })),
      });

      if (res.success && res.data) {
        toast.success(
          initialCalculation
            ? "Cálculo actualizado con éxito"
            : "¡Cálculo guardado exitosamente en tu historial!"
        );
        router.push(`/calculations/${res.data.id}`);
      } else {
        toast.error("Error al guardar cálculo", { description: res.error });
      }
    } catch (err: any) {
      toast.error("Error inesperado al guardar cálculo");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* 1. Selector Principal: Producto vs Servicio */}
      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Tipo de Cotización o Cálculo</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Elige si estás fabricando un lote de productos o prestando un servicio por mano de obra.
              </p>
            </div>

            <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <Button
                type="button"
                variant={type === "product" ? "default" : "ghost"}
                onClick={() => {
                  setType("product");
                  if (outputQuantity <= 1) setOutputQuantity(10);
                }}
                className="gap-2 text-sm font-semibold"
              >
                <Package className="h-4 w-4" />
                <span>Producto</span>
              </Button>
              <Button
                type="button"
                variant={type === "service" ? "default" : "ghost"}
                onClick={() => {
                  setType("service");
                  setOutputQuantity(1);
                }}
                className="gap-2 text-sm font-semibold"
              >
                <Wrench className="h-4 w-4" />
                <span>Servicio</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Formulario Principal (Columna Izquierda / 2 columnas) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Datos Generales */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                {type === "product" ? <Package className="h-4 w-4 text-emerald-600" /> : <Wrench className="h-4 w-4 text-blue-600" />}
                <span>Información del {type === "product" ? "Producto" : "Servicio"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="calc_name">
                    Nombre del {type === "product" ? "Producto" : "Servicio"} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="calc_name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={
                      type === "product"
                        ? "Ej. Lámpara de Resina y Madera, Figura 3D Custom"
                        : "Ej. Servicio de Mantenimiento, Diseño y Render 3D"
                    }
                    required
                  />
                </div>

                {type === "product" ? (
                  <div className="space-y-2">
                    <Label htmlFor="output_quantity">
                      Unidades a Producir <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="output_quantity"
                      type="number"
                      min="1"
                      step="1"
                      value={outputQuantity}
                      onChange={(e) => setOutputQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="font-mono"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Tamaño total del lote terminado
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Cantidad Prestaciones</Label>
                    <Input value="1 servicio" disabled className="bg-muted font-mono" />
                    <p className="text-[11px] text-muted-foreground">
                      Cotización para 1 servicio
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="calc_desc">Descripción o Notas Opcionales</Label>
                <Input
                  id="calc_desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalles sobre especificaciones, cliente, o proceso técnico"
                />
              </div>

              {type === "product" && (
                <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 shrink-0" />
                  <span>
                    <strong>Convención de lote:</strong> Todos los materiales, tiempos y gastos ingresados a continuación se interpretan como el total requerido para fabricar el lote completo de <strong>{outputQuantity} unidades</strong>.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mano de Obra */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-600" />
                <span>Mano de Obra y Tiempo de Trabajo</span>
              </CardTitle>
              <CardDescription>
                Define el tiempo dedicado y la tarifa horaria para este cálculo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tiempo Estimado de Trabajo</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="any"
                      min="0"
                      value={timeValue}
                      onChange={(e) => setTimeValue(parseFloat(e.target.value) || 0)}
                      className="font-mono flex-1"
                      placeholder="Ej. 90"
                    />
                    <Select value={timeUnit} onValueChange={(val: any) => setTimeUnit(val)}>
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minutes">Minutos</SelectItem>
                        <SelectItem value="hours">Horas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Equivalente a: <strong>{workMinutes} minutos</strong> ({formatNumber(workMinutes / 60)} horas)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hourly_rate">
                    Tarifa por Hora ({currency}) <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="hourly_rate"
                      type="number"
                      step="any"
                      min="0"
                      value={hourlyRate}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setHourlyRate(val);
                        setConfirmedZeroRate(val === 0);
                      }}
                      className="pl-9 font-mono"
                    />
                  </div>
                  {hourlyRate === 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="confirm_zero"
                        checked={confirmedZeroRate}
                        onChange={(e) => setConfirmedZeroRate(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="confirm_zero" className="text-[11px] text-amber-700 dark:text-amber-400 font-medium cursor-pointer">
                        Confirmar tarifa ₡0 intencional
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 text-sm font-medium">
                <span className="text-muted-foreground">Subtotal Mano de Obra:</span>
                <span className="font-mono font-bold text-foreground">
                  {summary ? formatCurrency(summary.laborCost, { currency }) : "₡0.00"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Materiales e Insumos Utilizados */}
          <Card>
            <CardHeader className="pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Boxes className="h-4 w-4 text-emerald-600" />
                  <span>Materiales e Insumos Consumidos</span>
                </CardTitle>
                <CardDescription>
                  {type === "service" ? "Opcional para servicios." : "Materiales que componen el producto."}
                </CardDescription>
              </div>

              {initialCalculation && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSyncCatalogPrices}
                  className="gap-1.5 text-xs"
                  title="Actualizar precios con catálogo actual"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Actualizar con Catálogo</span>
                </Button>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Selector para agregar material */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 p-3 rounded-xl border bg-muted/20">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs">Seleccionar Insumo del Catálogo</Label>
                  <Select
                    value={selectedCatalogMaterialId}
                    onValueChange={setSelectedCatalogMaterialId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Elige un material registrado..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMaterials.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No hay materiales registrados en el catálogo
                        </SelectItem>
                      ) : (
                        availableMaterials.map((mat) => (
                          <SelectItem key={mat.id} value={mat.id}>
                            {mat.name} ({formatCurrency(mat.unit_cost, { currency })} / {mat.unit})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full sm:w-32 space-y-1.5">
                  <Label className="text-xs">Cantidad</Label>
                  <Input
                    type="number"
                    step="any"
                    min="0.0001"
                    value={materialAddQuantity}
                    onChange={(e) => setMaterialAddQuantity(e.target.value)}
                    placeholder="1"
                    className="font-mono"
                  />
                </div>

                <Button
                  type="button"
                  onClick={handleAddMaterial}
                  disabled={!selectedCatalogMaterialId}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Añadir</span>
                </Button>
              </div>

              {/* Tabla de Materiales */}
              {materials.length === 0 ? (
                <div className="text-center py-6 border rounded-lg bg-muted/10 text-xs text-muted-foreground">
                  {type === "service"
                    ? "Este servicio no incluye materiales consumibles. Puedes continuar sólo con mano de obra y gastos."
                    : "No has agregado materiales aún. Selecciona uno del catálogo arriba."}
                </div>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead className="text-right">Costo Unit.</TableHead>
                        <TableHead className="text-center">Cantidad Usada</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {materials.map((m, idx) => {
                        const subtotal = calculateMaterialSubtotal(
                          m.unit_cost_snapshot,
                          m.quantity_used
                        );
                        return (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">
                              <div>{m.material_name_snapshot}</div>
                              <span className="text-[11px] text-muted-foreground">
                                Medido en: {m.unit_snapshot}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs">
                              {formatCurrency(m.unit_cost_snapshot, { currency })}/{m.unit_snapshot}
                            </TableCell>
                            <TableCell className="text-center">
                              <Input
                                type="number"
                                step="any"
                                min="0"
                                value={m.quantity_used}
                                onChange={(e) =>
                                  handleUpdateMaterialQuantity(
                                    idx,
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-24 mx-auto text-center font-mono h-8 text-xs"
                              />
                            </TableCell>
                            <TableCell className="text-right font-mono font-semibold">
                              {formatCurrency(subtotal, { currency })}
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive"
                                onClick={() => handleRemoveMaterial(idx)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 text-sm font-medium">
                <span className="text-muted-foreground">Subtotal Materiales:</span>
                <span className="font-mono font-bold text-foreground">
                  {summary ? formatCurrency(summary.materialsCost, { currency }) : "₡0.00"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Gastos Adicionales */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="h-4 w-4 text-emerald-600" />
                <span>Gastos Adicionales e Indirectos</span>
              </CardTitle>
              <CardDescription>
                Empaque, electricidad, transporte, desgaste de herramientas, licencias o comisiones.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {expenses.map((exp, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      value={exp.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setExpenses((prev) => {
                          const next = [...prev];
                          next[idx].name = val;
                          return next;
                        });
                      }}
                      className="flex-1"
                      placeholder="Concepto de gasto"
                    />
                    <div className="relative w-36">
                      <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        step="any"
                        min="0"
                        value={exp.amount}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setExpenses((prev) => {
                            const next = [...prev];
                            next[idx].amount = val;
                            return next;
                          });
                        }}
                        className="pl-8 font-mono text-right"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-destructive"
                      onClick={() => setExpenses((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Agregar nuevo gasto */}
              <div className="flex items-center gap-2 pt-2 border-t">
                <Input
                  value={newExpenseName}
                  onChange={(e) => setNewExpenseName(e.target.value)}
                  placeholder="Otro concepto (ej. Transporte, Comisión pasarela)"
                  className="flex-1 text-sm"
                />
                <Input
                  type="number"
                  step="any"
                  min="0"
                  value={newExpenseAmount}
                  onChange={(e) => setNewExpenseAmount(e.target.value)}
                  placeholder="Monto"
                  className="w-32 font-mono text-sm"
                />
                <Button type="button" variant="outline" size="sm" onClick={handleAddExpense}>
                  <Plus className="h-4 w-4 mr-1" />
                  <span>Agregar</span>
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 text-sm font-medium">
                <span className="text-muted-foreground">Subtotal Gastos Adicionales:</span>
                <span className="font-mono font-bold text-foreground">
                  {summary ? formatCurrency(summary.additionalCost, { currency }) : "₡0.00"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Margen vs Markup */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Percent className="h-4 w-4 text-emerald-600" />
                <span>Estrategia de Precio de Venta y Ganancia</span>
              </CardTitle>
              <CardDescription>
                Elige el método matemático para calcular tu precio sugerido de venta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Método de Cálculo</Label>
                  <Select value={profitMethod} onValueChange={(val: any) => setProfitMethod(val)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="markup">Markup sobre Costo</SelectItem>
                      <SelectItem value="margin">Margen sobre Precio de Venta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profit_perc">Porcentaje de Ganancia (%)</Label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="profit_perc"
                      type="number"
                      step="any"
                      min="0"
                      max={profitMethod === "margin" ? "99.9" : undefined}
                      value={profitPercentage}
                      onChange={(e) => setProfitPercentage(parseFloat(e.target.value) || 0)}
                      className="pl-9 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg border bg-muted/30 text-xs text-muted-foreground leading-relaxed">
                {profitMethod === "markup" ? (
                  <>
                    <strong className="text-foreground">Markup sobre Costo:</strong> El porcentaje se aplica directamente sobre el costo de fabricación. <br />
                    <code>Precio = Costo × (1 + {profitPercentage}% / 100)</code>
                  </>
                ) : (
                  <>
                    <strong className="text-foreground">Margen sobre Precio de Venta:</strong> El porcentaje representa la porción del precio final que será ganancia pura. <br />
                    <code>Precio = Costo / (1 - {profitPercentage}% / 100)</code> (Debe ser menor al 100%)
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resumen Permanente en Vivo (Columna Derecha / Sticky) */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 space-y-4">
            <Card className="border border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
              <div className="bg-emerald-600 p-4 text-white">
                <div className="text-xs uppercase font-semibold tracking-wider opacity-90">
                  Desglose en Tiempo Real
                </div>
                <div className="text-2xl font-bold mt-1">
                  {summary ? formatCurrency(summary.suggestedUnitPrice, { currency }) : "₡0.00"}
                </div>
                <div className="text-xs opacity-90 mt-0.5">
                  Precio Sugerido por {type === "product" ? "Unidad" : "Servicio"}
                </div>
              </div>

              <CardContent className="p-5 space-y-4">
                {/* 1. Materiales */}
                <div className="flex justify-between items-center text-sm border-b pb-2">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Boxes className="h-3.5 w-3.5 text-purple-600" />
                    Materiales:
                  </span>
                  <span className="font-mono font-medium">
                    {summary ? formatCurrency(summary.materialsCost, { currency }) : "₡0.00"}
                  </span>
                </div>

                {/* 2. Mano de Obra */}
                <div className="flex justify-between items-center text-sm border-b pb-2">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-blue-600" />
                    Mano de Obra:
                  </span>
                  <span className="font-mono font-medium">
                    {summary ? formatCurrency(summary.laborCost, { currency }) : "₡0.00"}
                  </span>
                </div>

                {/* 3. Gastos adicionales */}
                <div className="flex justify-between items-center text-sm border-b pb-2">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Receipt className="h-3.5 w-3.5 text-amber-600" />
                    Gastos Adicionales:
                  </span>
                  <span className="font-mono font-medium">
                    {summary ? formatCurrency(summary.additionalCost, { currency }) : "₡0.00"}
                  </span>
                </div>

                {/* 4. Costo Total del Lote */}
                <div className="flex justify-between items-center text-sm border-b pb-2 font-semibold">
                  <span>Costo Total del Lote:</span>
                  <span className="font-mono text-foreground">
                    {summary ? formatCurrency(summary.totalCost, { currency }) : "₡0.00"}
                  </span>
                </div>

                {/* 5. Costo Unitario */}
                <div className="flex justify-between items-center text-sm border-b pb-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 p-2.5 rounded-lg">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    Costo Unitario ({type === "product" ? `÷ ${outputQuantity} uds` : "1 serv"}):
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {summary ? formatCurrency(summary.unitCost, { currency }) : "₡0.00"}
                  </span>
                </div>

                {/* 6. Ganancia por Unidad */}
                <div className="flex justify-between items-center text-sm border-b pb-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    Ganancia por Unidad:
                  </span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    +{summary ? formatCurrency(summary.unitProfit, { currency }) : "₡0.00"}
                  </span>
                </div>

                {/* 7. Totales del lote si es producto */}
                {type === "product" && (
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>Venta Total del Lote ({outputQuantity} uds):</span>
                      <span className="font-mono font-semibold text-foreground">
                        {summary ? formatCurrency(summary.totalPrice, { currency }) : "₡0.00"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>Ganancia Total del Lote:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        +{summary ? formatCurrency(summary.totalProfit, { currency }) : "₡0.00"}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>

              <CardFooter className="p-5 pt-0">
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !summary}
                  className="w-full gap-2 h-11 text-base shadow-md font-semibold"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Guardando cálculo...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      <span>{initialCalculation ? "Actualizar Cálculo" : "Guardar en Historial"}</span>
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

