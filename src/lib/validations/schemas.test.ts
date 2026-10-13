import { describe, it, expect } from "vitest";
import {
  MaterialSchema,
  CalculationFormSchema,
  ProfileSchema,
  RegisterSchema,
  LoginSchema,
} from "./schemas";

describe("Validaciones de Esquemas con Zod", () => {
  describe("MaterialSchema", () => {
    it("acepta materiales con valores válidos", () => {
      const valid = {
        name: "Resina Epóxica",
        description: "Transparente para joyería",
        unit: "ml",
        purchased_quantity: 1000,
        total_purchase_cost: 15000,
      };
      const result = MaterialSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("acepta materiales con cantidades decimales", () => {
      const validDecimal = {
        name: "Pigmento Azul",
        unit: "g",
        purchased_quantity: 0.25,
        total_purchase_cost: 2500.5,
      };
      const result = MaterialSchema.safeParse(validDecimal);
      expect(result.success).toBe(true);
    });

    it("rechaza cantidad adquirida igual a cero o negativa", () => {
      const zeroQty = {
        name: "Filamento PLA",
        unit: "kg",
        purchased_quantity: 0,
        total_purchase_cost: 12000,
      };
      expect(MaterialSchema.safeParse(zeroQty).success).toBe(false);

      const negQty = { ...zeroQty, purchased_quantity: -5 };
      expect(MaterialSchema.safeParse(negQty).success).toBe(false);
    });

    it("rechaza costo de compra negativo", () => {
      const negCost = {
        name: "Madera Pino",
        unit: "cm",
        purchased_quantity: 100,
        total_purchase_cost: -500,
      };
      expect(MaterialSchema.safeParse(negCost).success).toBe(false);
    });
  });

  describe("CalculationFormSchema", () => {
    it("valida cálculo de producto correctamente", () => {
      const validProduct = {
        type: "product",
        name: "Lámpara de Resina",
        output_quantity: 5,
        work_minutes: 120,
        hourly_rate: 3000,
        profit_percentage: 35,
        profit_method: "markup",
        materials: [
          {
            material_name_snapshot: "Resina",
            unit_snapshot: "ml",
            unit_cost_snapshot: 15,
            quantity_used: 250,
          },
        ],
        expenses: [{ name: "Empaque", amount: 1000 }],
      };
      const result = CalculationFormSchema.safeParse(validProduct);
      expect(result.success).toBe(true);
    });

    it("rechaza margen sobre venta igual o superior al 100%", () => {
      const invalidMargin = {
        type: "service",
        name: "Consultoría",
        output_quantity: 1,
        work_minutes: 60,
        hourly_rate: 5000,
        profit_percentage: 100,
        profit_method: "margin",
      };
      const result = CalculationFormSchema.safeParse(invalidMargin);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("estrictamente menor al 100%");
      }
    });

    it("acepta servicio sin materiales", () => {
      const serviceNoMaterials = {
        type: "service",
        name: "Reparación y Diagnóstico",
        output_quantity: 1,
        work_minutes: 45,
        hourly_rate: 4000,
        profit_percentage: 20,
        profit_method: "margin",
        materials: [],
        expenses: [],
      };
      const result = CalculationFormSchema.safeParse(serviceNoMaterials);
      expect(result.success).toBe(true);
    });

    it("permite tarifa por hora igual a cero", () => {
      const zeroRate = {
        type: "product",
        name: "Regalo Artesanal",
        output_quantity: 1,
        work_minutes: 30,
        hourly_rate: 0,
        profit_percentage: 0,
        profit_method: "markup",
      };
      const result = CalculationFormSchema.safeParse(zeroRate);
      expect(result.success).toBe(true);
    });
  });

  describe("ProfileSchema y Auth", () => {
    it("valida configuración de perfil con moneda por defecto", () => {
      const profile = {
        full_name: "Juan Pérez",
        business_name: "Taller 3D",
        currency: "CRC",
        default_hourly_rate: 3500,
        default_profit_percentage: 30,
      };
      expect(ProfileSchema.safeParse(profile).success).toBe(true);
    });

    it("rechaza contraseñas de menos de 6 caracteres", () => {
      const invalid = {
        email: "test@example.com",
        password: "123",
        full_name: "Test",
      };
      expect(RegisterSchema.safeParse(invalid).success).toBe(false);
    });
  });
});

