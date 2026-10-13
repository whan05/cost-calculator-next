// Tipos base para la aplicación y base de datos Supabase / PostgreSQL

export type MeasurementUnit = 
  | "ud"    // Unidad
  | "g"     // Gramo
  | "kg"    // Kilogramo
  | "ml"    // Mililitro
  | "L"     // Litro
  | "cm"    // Centímetro
  | "m"     // Metro
  | string; // Para unidades personalizadas

export type CalculationType = "product" | "service";

export type ProfitMethod = "markup" | "margin";

export type Currency = "CRC" | "USD" | "EUR";

export interface UserProfile {
  id: string;
  full_name: string | null;
  business_name: string | null;
  currency: Currency;
  default_hourly_rate: number;
  default_profit_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface MaterialCategory {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface Material {
  id: string;
  user_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  unit: MeasurementUnit;
  purchased_quantity: number;
  total_purchase_cost: number;
  unit_cost: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  // Opcional join con categoría
  category?: MaterialCategory | null;
}

export interface CalculationExpense {
  id: string;
  calculation_id: string;
  name: string;
  amount: number;
}

export interface CalculationMaterial {
  id: string;
  calculation_id: string;
  material_id: string | null;
  material_name_snapshot: string;
  unit_snapshot: MeasurementUnit;
  quantity_used: number;
  unit_cost_snapshot: number;
  subtotal: number;
}

export interface Calculation {
  id: string;
  user_id: string;
  type: CalculationType;
  name: string;
  description: string | null;
  output_quantity: number;
  work_minutes: number;
  hourly_rate: number;
  labor_cost: number;
  materials_cost: number;
  additional_cost: number;
  total_cost: number;
  unit_cost: number;
  profit_percentage: number;
  profit_method: ProfitMethod;
  suggested_unit_price: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface CalculationWithDetails extends Calculation {
  materials: CalculationMaterial[];
  expenses: CalculationExpense[];
}

export interface CalculationFormData {
  type: CalculationType;
  name: string;
  description?: string;
  output_quantity: number;
  work_minutes: number;
  hourly_rate: number;
  profit_percentage: number;
  profit_method: ProfitMethod;
  materials: Array<{
    material_id?: string;
    material_name_snapshot: string;
    unit_snapshot: string;
    unit_cost_snapshot: number;
    quantity_used: number;
  }>;
  expenses: Array<{
    name: string;
    amount: number;
  }>;
}

export interface MaterialFormData {
  name: string;
  description?: string;
  category_id?: string | null;
  unit: MeasurementUnit;
  purchased_quantity: number;
  total_purchase_cost: number;
}

export interface MaterialCategoryFormData {
  name: string;
}

export interface ProfileFormData {
  full_name: string;
  business_name?: string;
  currency: Currency;
  default_hourly_rate: number;
  default_profit_percentage: number;
}
