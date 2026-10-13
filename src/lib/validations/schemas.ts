import { z } from "zod";

/**
 * Validación de monedas
 */
export const CurrencySchema = z.enum(["CRC", "USD", "EUR"]);

/**
 * Validación de unidades de medida (estándar o texto personalizado)
 */
export const MeasurementUnitSchema = z.string().min(1, "La unidad es requerida").max(20, "La unidad es muy larga");

/**
 * Validación de tipo de cálculo
 */
export const CalculationTypeSchema = z.enum(["product", "service"]);

/**
 * Validación de método de ganancia
 */
export const ProfitMethodSchema = z.enum(["markup", "margin"]);

/**
 * Schema para perfil de usuario
 */
export const ProfileSchema = z.object({
  full_name: z.string().min(1, "El nombre es requerido").max(100, "El nombre es demasiado largo"),
  business_name: z.string().max(100, "El nombre del negocio es demasiado largo").optional().nullable(),
  currency: CurrencySchema.default("CRC"),
  default_hourly_rate: z.coerce.number().min(0, "La tarifa no puede ser negativa"),
  default_profit_percentage: z.coerce.number().min(0, "La ganancia no puede ser negativa").max(99.99, "La ganancia debe ser menor al 100%"),
});

/**
 * Schema para categoría de material
 */
export const MaterialCategorySchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(50, "El nombre es demasiado largo"),
});

/**
 * Schema para crear/editar material en el catálogo
 */
export const MaterialSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100, "El nombre es demasiado largo"),
  description: z.string().max(500, "La descripción es demasiado larga").optional().nullable(),
  category_id: z.string().uuid("ID de categoría inválido").optional().nullable().or(z.literal("")),
  unit: MeasurementUnitSchema,
  purchased_quantity: z.coerce.number().gt(0, "La cantidad adquirida debe ser mayor a cero"),
  total_purchase_cost: z.coerce.number().min(0, "El costo total no puede ser negativo"),
});

/**
 * Schema para gasto adicional
 */
export const CalculationExpenseSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "El nombre del gasto es requerido").max(100, "Nombre demasiado largo"),
  amount: z.coerce.number().min(0, "El monto no puede ser negativo"),
});

/**
 * Schema para material utilizado en un cálculo
 */
export const CalculationMaterialInputSchema = z.object({
  id: z.string().optional(),
  material_id: z.string().uuid().optional().nullable().or(z.literal("")),
  material_name_snapshot: z.string().min(1, "El nombre del material es requerido"),
  unit_snapshot: z.string().min(1, "La unidad es requerida"),
  unit_cost_snapshot: z.coerce.number().min(0, "El costo unitario no puede ser negativo"),
  quantity_used: z.coerce.number().gt(0, "La cantidad utilizada debe ser mayor a cero"),
  subtotal: z.coerce.number().optional(),
});

/**
 * Schema principal para formulario de cálculo (Producto o Servicio)
 */
export const CalculationFormSchema = z.object({
  id: z.string().uuid().optional(),
  type: CalculationTypeSchema,
  name: z.string().min(1, "El nombre del cálculo es requerido").max(120, "El nombre es demasiado largo"),
  description: z.string().max(500, "La descripción es demasiado larga").optional().nullable(),
  output_quantity: z.coerce.number().gt(0, "La cantidad producida debe ser mayor a cero"),
  work_minutes: z.coerce.number().min(0, "El tiempo de trabajo no puede ser negativo"),
  hourly_rate: z.coerce.number().min(0, "La tarifa por hora no puede ser negativa"),
  profit_percentage: z.coerce.number().min(0, "El porcentaje de ganancia no puede ser negativo"),
  profit_method: ProfitMethodSchema,
  materials: z.array(CalculationMaterialInputSchema).default([]),
  expenses: z.array(CalculationExpenseSchema).default([]),
}).refine((data) => {
  if (data.profit_method === "margin" && data.profit_percentage >= 100) {
    return false;
  }
  return true;
}, {
  message: "En el método de margen sobre venta, el porcentaje debe ser estrictamente menor al 100%",
  path: ["profit_percentage"],
});

/**
 * Schemas de Autenticación
 */
export const EmailSchema = z.string().email("Correo electrónico inválido");

export const RegisterSchema = z.object({
  email: EmailSchema,
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  full_name: z.string().min(1, "El nombre es requerido").max(100, "El nombre es demasiado largo"),
  business_name: z.string().max(100).optional(),
});

export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, "La contraseña es requerida"),
});

export const ForgotPasswordSchema = z.object({
  email: EmailSchema,
});

export const ResetPasswordSchema = z.object({
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string().min(6, "Confirme la contraseña"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});
