"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Loader2, Plus, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createMaterial, updateMaterial } from "@/features/materials/actions";
import { Material, MaterialCategory, MeasurementUnit } from "@/types/database";
import { calculateUnitCost } from "@/lib/calculations/calculations";
import { formatCurrency } from "@/lib/utils/currency";
import { toast } from "sonner";

const STANDARD_UNITS: { label: string; value: string }[] = [
  { label: "Unidad (ud)", value: "ud" },
  { label: "Gramo (g)", value: "g" },
  { label: "Kilogramo (kg)", value: "kg" },
  { label: "Mililitro (ml)", value: "ml" },
  { label: "Litro (L)", value: "L" },
  { label: "Centímetro (cm)", value: "cm" },
  { label: "Metro (m)", value: "m" },
  { label: "Personalizada...", value: "custom" },
];

interface MaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materialToEdit?: Material | null;
  categories: MaterialCategory[];
  currency?: string;
  onSuccess?: () => void;
}

export function MaterialDialog({
  open,
  onOpenChange,
  materialToEdit,
  categories,
  currency = "CRC",
  onSuccess,
}: MaterialDialogProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("none");
  const [selectedUnit, setSelectedUnit] = useState<string>("ud");
  const [customUnit, setCustomUnit] = useState<string>("");
  const [purchasedQuantity, setPurchasedQuantity] = useState<string>("1");
  const [totalPurchaseCost, setTotalPurchaseCost] = useState<string>("0");

  useEffect(() => {
    if (materialToEdit) {
      setName(materialToEdit.name);
      setDescription(materialToEdit.description || "");
      setCategoryId(materialToEdit.category_id || "none");
      setPurchasedQuantity(materialToEdit.purchased_quantity.toString());
      setTotalPurchaseCost(materialToEdit.total_purchase_cost.toString());

      const isStandard = STANDARD_UNITS.some((u) => u.value === materialToEdit.unit);
      if (isStandard) {
        setSelectedUnit(materialToEdit.unit);
        setCustomUnit("");
      } else {
        setSelectedUnit("custom");
        setCustomUnit(materialToEdit.unit);
      }
    } else {
      // Reset form
      setName("");
      setDescription("");
      setCategoryId("none");
      setSelectedUnit("ud");
      setCustomUnit("");
      setPurchasedQuantity("1");
      setTotalPurchaseCost("0");
    }
  }, [materialToEdit, open]);

  const activeUnit = selectedUnit === "custom" ? customUnit || "ud" : selectedUnit;

  // Cálculo en vivo del costo unitario
  const calculatedUnitCostStr = useMemo(() => {
    try {
      const qtyNum = parseFloat(purchasedQuantity);
      const costNum = parseFloat(totalPurchaseCost);
      if (isNaN(qtyNum) || qtyNum <= 0 || isNaN(costNum) || costNum < 0) {
        return null;
      }
      return calculateUnitCost(costNum, qtyNum);
    } catch {
      return null;
    }
  }, [purchasedQuantity, totalPurchaseCost]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    const qty = parseFloat(purchasedQuantity);
    const cost = parseFloat(totalPurchaseCost);

    if (isNaN(qty) || qty <= 0) {
      toast.error("La cantidad adquirida debe ser un número mayor a cero");
      return;
    }
    if (isNaN(cost) || cost < 0) {
      toast.error("El costo total no puede ser negativo");
      return;
    }
    if (selectedUnit === "custom" && !customUnit.trim()) {
      toast.error("Por favor especifica la unidad personalizada");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        category_id: categoryId === "none" ? null : categoryId,
        unit: activeUnit,
        purchased_quantity: qty,
        total_purchase_cost: cost,
      };

      let res;
      if (materialToEdit) {
        res = await updateMaterial(materialToEdit.id, payload);
      } else {
        res = await createMaterial(payload);
      }

      if (res.success) {
        toast.success(materialToEdit ? "Material actualizado" : "Material registrado");
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        toast.error("Error al guardar material", { description: res.error });
      }
    } catch (err: any) {
      toast.error("Ocurrió un error inesperado", { description: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {materialToEdit ? "Editar Material / Insumo" : "Registrar Nuevo Material o Insumo"}
          </DialogTitle>
          <DialogDescription>
            Ingresa los datos de compra para calcular con exactitud el costo unitario de consumo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="mat_name">Nombre del Material o Insumo</Label>
            <Input
              id="mat_name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Resina Epóxica Transparente, Filamento PLA, etc."
              required
              disabled={loading}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select value={categoryId} onValueChange={setCategoryId} disabled={loading}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Sin categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin categoría</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unidad de Medida</Label>
              <Select value={selectedUnit} onValueChange={setSelectedUnit} disabled={loading}>
                <SelectTrigger id="unit">
                  <SelectValue placeholder="Selecciona unidad" />
                </SelectTrigger>
                <SelectContent>
                  {STANDARD_UNITS.map((u) => (
                    <SelectItem key={u.value} value={u.value}>
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedUnit === "custom" && (
            <div className="space-y-2">
              <Label htmlFor="custom_unit">Unidad personalizada (ej. rollo, paquete, pliego)</Label>
              <Input
                id="custom_unit"
                value={customUnit}
                onChange={(e) => setCustomUnit(e.target.value)}
                placeholder="Ej. pliego"
                required
                disabled={loading}
              />
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchased_qty">Cantidad Adquirida ({activeUnit})</Label>
              <Input
                id="purchased_qty"
                type="number"
                step="any"
                min="0.0001"
                value={purchasedQuantity}
                onChange={(e) => setPurchasedQuantity(e.target.value)}
                placeholder="Ej. 1000"
                required
                disabled={loading}
                className="font-mono"
              />
              <p className="text-[11px] text-muted-foreground">
                Total comprado (ej. 1000 ml o 1 kg)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase_cost">Precio Total de Compra ({currency})</Label>
              <Input
                id="purchase_cost"
                type="number"
                step="any"
                min="0"
                value={totalPurchaseCost}
                onChange={(e) => setTotalPurchaseCost(e.target.value)}
                placeholder="Ej. 15000"
                required
                disabled={loading}
                className="font-mono"
              />
              <p className="text-[11px] text-muted-foreground">
                Costo pagado por el paquete/lote
              </p>
            </div>
          </div>

          {/* Banner de cálculo de costo unitario en vivo */}
          <div className="rounded-xl border bg-muted/40 p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                Costo Unitario Calculado
              </span>
              <span className="text-xs font-mono bg-background px-2 py-0.5 rounded border">
                {currency} / {activeUnit}
              </span>
            </div>

            <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 pt-1">
              {calculatedUnitCostStr !== null
                ? `${formatCurrency(calculatedUnitCostStr, { currency, minimumFractionDigits: 4, maximumFractionDigits: 4 })} por ${activeUnit}`
                : "Ingrese valores válidos"}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Fórmula: Precio Total ({totalPurchaseCost}) ÷ Cantidad ({purchasedQuantity} {activeUnit})
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mat_desc">Descripción o Notas (Opcional)</Label>
            <Input
              id="mat_desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. Proveedor local, tiempo de secado 24h, etc."
              disabled={loading}
            />
          </div>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>{materialToEdit ? "Actualizar Material" : "Guardar en Catálogo"}</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

