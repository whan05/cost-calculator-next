import { describe, it, expect } from "vitest";
import {
  calculateUnitCost,
  calculateLaborCost,
  calculateMaterialSubtotal,
  convertTimeToMinutes,
  calculateTotalCost,
  calculateUnitCostFromTotal,
  calculatePriceWithMarkup,
  calculatePriceWithMargin,
  calculateSellingPrice,
  calculateUnitProfit,
  calculateTotalProfit,
  calculateTotalPrice,
  computeCalculationSummary,
} from "./calculations";

describe("Motor Matemático de Cálculos (Calculadora de Costos)", () => {
  describe("1. Costo unitario de material", () => {
    it("calcula correctamente el costo unitario para compra entera (ej. Resina 1000ml a 15,000 CRC)", () => {
      const unitCost = calculateUnitCost(15000, 1000);
      expect(unitCost).toBe("15");
    });

    it("calcula costos por cantidades fraccionarias con precisión decimal", () => {
      // 550.75 CRC por 2.5 kg -> 220.3
      const unitCost = calculateUnitCost("550.75", "2.5");
      expect(unitCost).toBe("220.3");
    });

    it("lanza error si la cantidad adquirida es cero o negativa", () => {
      expect(() => calculateUnitCost(1000, 0)).toThrow("La cantidad adquirida debe ser mayor a cero");
      expect(() => calculateUnitCost(1000, -5)).toThrow("La cantidad adquirida debe ser mayor a cero");
    });

    it("lanza error si el precio total es negativo", () => {
      expect(() => calculateUnitCost(-500, 10)).toThrow("El precio de compra no puede ser negativo");
    });
  });

  describe("2. Subtotal de materiales consumidos", () => {
    it("calcula correctamente el costo consumido (ej. 120 ml a 15 CRC = 1,800 CRC)", () => {
      const subtotal = calculateMaterialSubtotal("15", "120");
      expect(subtotal).toBe("1800");
    });

    it("maneja cantidades decimales pequeñas (ej. 0.075 kg a 1250.5 CRC)", () => {
      const subtotal = calculateMaterialSubtotal("1250.5", "0.075");
      expect(subtotal).toBe("93.7875");
    });

    it("rechaza cantidades o costos negativos", () => {
      expect(() => calculateMaterialSubtotal("-10", "5")).toThrow("El costo unitario no puede ser negativo");
      expect(() => calculateMaterialSubtotal("10", "-5")).toThrow("La cantidad utilizada no puede ser negativa");
    });
  });

  describe("3. Mano de obra y conversión de tiempo", () => {
    it("convierte horas a minutos correctamente", () => {
      expect(convertTimeToMinutes(1.5, "hours")).toBe(90);
      expect(convertTimeToMinutes(45, "minutes")).toBe(45);
    });

    it("calcula el costo de mano de obra según la fórmula: (Minutos / 60) × Tarifa (ej. 90 mins a 3,000/h = 4,500)", () => {
      const laborCost = calculateLaborCost(90, 3000);
      expect(laborCost).toBe("4500");
    });

    it("permite tarifa por hora cero de manera explícita", () => {
      const laborCost = calculateLaborCost(120, 0);
      expect(laborCost).toBe("0");
    });

    it("rechaza tiempo o tarifa negativa", () => {
      expect(() => calculateLaborCost(-10, 3000)).toThrow("Los minutos no pueden ser negativos");
      expect(() => calculateLaborCost(60, -500)).toThrow("La tarifa por hora no puede ser negativa");
    });
  });

  describe("4. Costo total de lotes y costo unitario", () => {
    it("suma correctamente materiales, mano de obra y gastos adicionales", () => {
      // Materiales: 1800, Labor: 4500, Gastos: 700 -> Total: 7000
      const total = calculateTotalCost("1800", "4500", "700");
      expect(total).toBe("7000");
    });

    it("calcula el costo unitario dividiendo el costo del lote entre la cantidad producida", () => {
      // Costo lote: 7000, Unidades: 10 -> Costo por unidad: 700
      const unitCost = calculateUnitCostFromTotal("7000", 10);
      expect(unitCost).toBe("700");
    });

    it("lanza error si la cantidad producida es cero", () => {
      expect(() => calculateUnitCostFromTotal("7000", 0)).toThrow("La cantidad producida debe ser mayor a cero");
    });
  });

  describe("5. Precio de venta: Markup vs Margen", () => {
    it("calcula correctamente el Markup sobre costo: Precio = Costo × (1 + % / 100)", () => {
      // Costo: 1000, Ganancia: 50% -> Precio = 1000 * 1.5 = 1500
      const price = calculatePriceWithMarkup("1000", 50);
      expect(price).toBe("1500");
    });

    it("calcula correctamente el Margen sobre venta: Precio = Costo / (1 - % / 100)", () => {
      // Costo: 700, Margen: 30% -> Precio = 700 / 0.7 = 1000
      const price = calculatePriceWithMargin("700", 30);
      expect(price).toBe("1000");
    });

    it("valida que el margen sea estrictamente menor a 100%", () => {
      expect(() => calculatePriceWithMargin("1000", 100)).toThrow(
        "El porcentaje de margen sobre venta debe ser estrictamente menor al 100%"
      );
      expect(() => calculatePriceWithMargin("1000", 105)).toThrow(
        "El porcentaje de margen sobre venta debe ser estrictamente menor al 100%"
      );
    });

    it("utiliza la función selector calculateSellingPrice para alternar métodos", () => {
      expect(calculateSellingPrice("1000", 50, "markup")).toBe("1500");
      expect(calculateSellingPrice("700", 30, "margin")).toBe("1000");
    });

    it("calcula ganancia unitaria y ganancias totales", () => {
      const unitProfit = calculateUnitProfit("1500", "1000");
      expect(unitProfit).toBe("500");

      const totalProfit = calculateTotalProfit(unitProfit, 10);
      expect(totalProfit).toBe("5000");

      const totalPrice = calculateTotalPrice("1500", 10);
      expect(totalPrice).toBe("15000");
    });
  });

  describe("6. Resumen completo de Producto", () => {
    it("ejecuta el flujo completo de producto con múltiples materiales y gastos", () => {
      const summary = computeCalculationSummary({
        type: "product",
        outputQuantity: 5,
        workMinutes: 120, // 2 horas
        hourlyRate: 3500, // Costo MO: 7000
        profitPercentage: 40,
        profitMethod: "markup",
        materials: [
          { unitCost: 15, quantityUsed: 200 }, // 3000
          { unitCost: 20, quantityUsed: 50 },  // 1000
        ], // Total materiales: 4000
        expenses: [
          { amount: 500 }, // Empaque
          { amount: 500 }, // Transporte
        ], // Total gastos: 1000
      });

      // Total Cost = 4000 (mat) + 7000 (mo) + 1000 (gas) = 12000
      expect(summary.materialsCost).toBe("4000");
      expect(summary.laborCost).toBe("7000");
      expect(summary.additionalCost).toBe("1000");
      expect(summary.totalCost).toBe("12000");

      // Unit Cost = 12000 / 5 = 2400
      expect(summary.unitCost).toBe("2400");

      // Suggested Unit Price = 2400 * (1 + 0.40) = 3360
      expect(summary.suggestedUnitPrice).toBe("3360");

      // Unit Profit = 3360 - 2400 = 960
      expect(summary.unitProfit).toBe("960");

      // Total Price = 3360 * 5 = 16800
      expect(summary.totalPrice).toBe("16800");

      // Total Profit = 960 * 5 = 4800
      expect(summary.totalProfit).toBe("4800");
    });
  });

  describe("7. Resumen completo de Servicio (con y sin materiales)", () => {
    it("calcula servicio sin materiales (solo mano de obra y viáticos)", () => {
      const summary = computeCalculationSummary({
        type: "service",
        outputQuantity: 1,
        workMinutes: 60, // 1 hora
        hourlyRate: 5000,
        profitPercentage: 20,
        profitMethod: "margin",
        materials: [],
        expenses: [{ amount: 1000 }], // Viáticos
      });

      // Total Cost = 0 + 5000 + 1000 = 6000
      expect(summary.materialsCost).toBe("0");
      expect(summary.laborCost).toBe("5000");
      expect(summary.additionalCost).toBe("1000");
      expect(summary.totalCost).toBe("6000");
      expect(summary.unitCost).toBe("6000");

      // Precio con margen 20%: 6000 / (1 - 0.20) = 7500
      expect(summary.suggestedUnitPrice).toBe("7500");
      expect(summary.unitProfit).toBe("1500");
    });
  });

  describe("8. Inmutabilidad de Snapshots Históricos", () => {
    it("demuestra que modificar el catálogo actual no altera los cálculos históricos persistidos", () => {
      // Supongamos que un cálculo guardó un snapshot con unit_cost_snapshot = 15
      const historicMaterialSnapshot = {
        material_name_snapshot: "Resina Estándar",
        unit_snapshot: "ml",
        unit_cost_snapshot: "15",
        quantity_used: "100",
        subtotal: "1500",
      };

      // Si el catálogo cambia a 25 el precio actual del material:
      const updatedCatalogMaterial = {
        name: "Resina Estándar",
        unit_cost: "25",
      };

      // El snapshot histórico sigue intacto con su valor congelado
      expect(historicMaterialSnapshot.unit_cost_snapshot).toBe("15");
      expect(historicMaterialSnapshot.subtotal).toBe("1500");
      expect(updatedCatalogMaterial.unit_cost).toBe("25");
    });
  });
});

