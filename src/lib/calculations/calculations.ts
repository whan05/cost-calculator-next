import Decimal from "decimal.js";
import { ProfitMethod, CalculationType } from "@/types/database";

// Configurar precisión de Decimal para asegurar alta fidelidad matemática
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

/**
 * Calcular el costo unitario de un material o insumo
 * Costo unitario = Precio total de compra / Cantidad adquirida
 */
export function calculateUnitCost(
  totalPrice: number | string,
  quantity: number | string
): string {
  const price = new Decimal(totalPrice || 0);
  const qty = new Decimal(quantity || 0);

  if (qty.lte(0)) {
    throw new Error("La cantidad adquirida debe ser mayor a cero");
  }
  if (price.lt(0)) {
    throw new Error("El precio de compra no puede ser negativo");
  }

  return price.dividedBy(qty).toString();
}

/**
 * Calcular el subtotal de un material consumido
 * Subtotal = Costo unitario × Cantidad utilizada
 */
export function calculateMaterialSubtotal(
  unitCost: number | string,
  quantityUsed: number | string
): string {
  const cost = new Decimal(unitCost || 0);
  const qty = new Decimal(quantityUsed || 0);

  if (qty.lt(0)) {
    throw new Error("La cantidad utilizada no puede ser negativa");
  }
  if (cost.lt(0)) {
    throw new Error("El costo unitario no puede ser negativo");
  }

  return cost.times(qty).toString();
}

/**
 * Convertir tiempo ingresado a minutos
 */
export function convertTimeToMinutes(
  time: number | string,
  unit: "minutes" | "hours"
): number {
  const t = new Decimal(time || 0);
  if (t.lt(0)) {
    throw new Error("El tiempo no puede ser negativo");
  }

  if (unit === "hours") {
    return t.times(60).toNumber();
  }
  return t.toNumber();
}

/**
 * Calcular el costo de mano de obra
 * Costo = (Minutos de trabajo / 60) × Tarifa por hora
 */
export function calculateLaborCost(
  minutes: number | string,
  hourlyRate: number | string
): string {
  const mins = new Decimal(minutes || 0);
  const rate = new Decimal(hourlyRate || 0);

  if (mins.lt(0)) {
    throw new Error("Los minutos no pueden ser negativos");
  }
  if (rate.lt(0)) {
    throw new Error("La tarifa por hora no puede ser negativa");
  }

  return mins.dividedBy(60).times(rate).toString();
}

/**
 * Calcular costo total del lote o servicio
 * Costo total = Materiales + Mano de obra + Gastos adicionales
 */
export function calculateTotalCost(
  materialsCost: number | string,
  laborCost: number | string,
  additionalCost: number | string
): string {
  const matCost = new Decimal(materialsCost || 0);
  const labCost = new Decimal(laborCost || 0);
  const addCost = new Decimal(additionalCost || 0);

  if (matCost.lt(0) || labCost.lt(0) || addCost.lt(0)) {
    throw new Error("Los componentes del costo no pueden ser negativos");
  }

  return matCost.plus(labCost).plus(addCost).toString();
}

/**
 * Calcular costo por unidad de producto
 * Costo por unidad = Costo total del lote / Cantidad de productos terminados
 */
export function calculateUnitCostFromTotal(
  totalCost: number | string,
  outputQuantity: number | string
): string {
  const cost = new Decimal(totalCost || 0);
  const qty = new Decimal(outputQuantity || 0);

  if (qty.lte(0)) {
    throw new Error("La cantidad producida debe ser mayor a cero");
  }
  if (cost.lt(0)) {
    throw new Error("El costo total no puede ser negativo");
  }

  return cost.dividedBy(qty).toString();
}

/**
 * Calcular precio con Markup sobre costo
 * Precio = Costo × (1 + Porcentaje / 100)
 */
export function calculatePriceWithMarkup(
  cost: number | string,
  profitPercentage: number | string
): string {
  const costDecimal = new Decimal(cost || 0);
  const percentage = new Decimal(profitPercentage || 0);

  if (percentage.lt(0)) {
    throw new Error("El porcentaje de ganancia no puede ser negativo");
  }
  if (costDecimal.lt(0)) {
    throw new Error("El costo no puede ser negativo");
  }

  return costDecimal.times(new Decimal(1).plus(percentage.dividedBy(100))).toString();
}

/**
 * Calcular precio con Margen sobre precio de venta
 * Precio = Costo / (1 - Porcentaje / 100)
 */
export function calculatePriceWithMargin(
  cost: number | string,
  profitPercentage: number | string
): string {
  const costDecimal = new Decimal(cost || 0);
  const percentage = new Decimal(profitPercentage || 0);

  if (percentage.lt(0)) {
    throw new Error("El porcentaje de margen no puede ser negativo");
  }
  if (percentage.gte(100)) {
    throw new Error("El porcentaje de margen sobre venta debe ser estrictamente menor al 100%");
  }
  if (costDecimal.lt(0)) {
    throw new Error("El costo no puede ser negativo");
  }

  const denominator = new Decimal(1).minus(percentage.dividedBy(100));
  return costDecimal.dividedBy(denominator).toString();
}

/**
 * Calcular precio según el método elegido (markup o margin)
 */
export function calculateSellingPrice(
  cost: number | string,
  profitPercentage: number | string,
  profitMethod: ProfitMethod
): string {
  if (profitMethod === "margin") {
    return calculatePriceWithMargin(cost, profitPercentage);
  }
  return calculatePriceWithMarkup(cost, profitPercentage);
}

/**
 * Calcular ganancia por unidad
 * Ganancia = Precio de venta - Costo unitario
 */
export function calculateUnitProfit(
  sellingPrice: number | string,
  unitCost: number | string
): string {
  const price = new Decimal(sellingPrice || 0);
  const cost = new Decimal(unitCost || 0);

  return price.minus(cost).toString();
}

/**
 * Calcular ganancia total del lote
 */
export function calculateTotalProfit(
  unitProfit: number | string,
  outputQuantity: number | string
): string {
  const profit = new Decimal(unitProfit || 0);
  const qty = new Decimal(outputQuantity || 0);

  return profit.times(qty).toString();
}

/**
 * Calcular precio total del lote
 */
export function calculateTotalPrice(
  unitPrice: number | string,
  outputQuantity: number | string
): string {
  const price = new Decimal(unitPrice || 0);
  const qty = new Decimal(outputQuantity || 0);

  return price.times(qty).toString();
}

export interface CalculationInput {
  type: CalculationType;
  outputQuantity: number | string;
  workMinutes: number | string;
  hourlyRate: number | string;
  profitPercentage: number | string;
  profitMethod: ProfitMethod;
  materials?: Array<{
    unitCost: number | string;
    quantityUsed: number | string;
  }>;
  expenses?: Array<{
    amount: number | string;
  }>;
}

export interface CalculationResult {
  materialsCost: string;
  laborCost: string;
  additionalCost: string;
  totalCost: string;
  unitCost: string;
  suggestedUnitPrice: string;
  unitProfit: string;
  totalPrice: string;
  totalProfit: string;
}

/**
 * Motor integral de cálculo para Productos y Servicios
 * Calcula subtotales, totales, márgenes y ganancias con precisión decimal pura.
 */
export function computeCalculationSummary(input: CalculationInput): CalculationResult {
  // 1. Materiales
  let totalMaterials = new Decimal(0);
  if (input.materials && input.materials.length > 0) {
    for (const mat of input.materials) {
      const subtotal = new Decimal(calculateMaterialSubtotal(mat.unitCost, mat.quantityUsed));
      totalMaterials = totalMaterials.plus(subtotal);
    }
  }

  // 2. Mano de obra
  const laborCostStr = calculateLaborCost(input.workMinutes, input.hourlyRate);
  const laborDecimal = new Decimal(laborCostStr);

  // 3. Gastos adicionales
  let totalExpenses = new Decimal(0);
  if (input.expenses && input.expenses.length > 0) {
    for (const exp of input.expenses) {
      const amt = new Decimal(exp.amount || 0);
      if (amt.lt(0)) {
        throw new Error("Los gastos adicionales no pueden ser negativos");
      }
      totalExpenses = totalExpenses.plus(amt);
    }
  }

  // 4. Costo total
  const materialsCostStr = totalMaterials.toString();
  const additionalCostStr = totalExpenses.toString();
  const totalCostStr = calculateTotalCost(materialsCostStr, laborCostStr, additionalCostStr);

  // 5. Cantidad producida / prestada
  const outputQtyDecimal = new Decimal(input.outputQuantity || 1);
  if (outputQtyDecimal.lte(0)) {
    throw new Error("La cantidad producida debe ser mayor a cero");
  }

  // 6. Costo unitario
  const unitCostStr = calculateUnitCostFromTotal(totalCostStr, outputQtyDecimal.toString());

  // 7. Precio de venta unitario
  const suggestedUnitPriceStr = calculateSellingPrice(
    unitCostStr,
    input.profitPercentage,
    input.profitMethod
  );

  // 8. Ganancias y totales
  const unitProfitStr = calculateUnitProfit(suggestedUnitPriceStr, unitCostStr);
  const totalPriceStr = calculateTotalPrice(suggestedUnitPriceStr, outputQtyDecimal.toString());
  const totalProfitStr = calculateTotalProfit(unitProfitStr, outputQtyDecimal.toString());

  return {
    materialsCost: materialsCostStr,
    laborCost: laborCostStr,
    additionalCost: additionalCostStr,
    totalCost: totalCostStr,
    unitCost: unitCostStr,
    suggestedUnitPrice: suggestedUnitPriceStr,
    unitProfit: unitProfitStr,
    totalPrice: totalPriceStr,
    totalProfit: totalProfitStr,
  };
}
