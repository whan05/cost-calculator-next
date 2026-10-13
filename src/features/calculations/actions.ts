"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient, getCurrentUser } from "@/lib/supabase/server";
import { CalculationFormSchema } from "@/lib/validations/schemas";
import { computeCalculationSummary } from "@/lib/calculations/calculations";
import {
  Calculation,
  CalculationWithDetails,
  CalculationFormData,
  CalculationType,
} from "@/types/database";

/**
 * Obtener listado de cálculos con filtros
 */
export async function getCalculations(options?: {
  type?: CalculationType;
  includeArchived?: boolean;
  search?: string;
}): Promise<CalculationWithDetails[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("calculations")
    .select(`
      *,
      materials:calculation_materials(*),
      expenses:calculation_expenses(*)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (options?.type) {
    query = query.eq("type", options.type);
  }

  if (!options?.includeArchived) {
    query = query.eq("is_archived", false);
  }

  if (options?.search && options.search.trim()) {
    query = query.ilike("name", `%${options.search.trim()}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error al obtener cálculos:", error);
    return [];
  }

  return (data || []) as CalculationWithDetails[];
}

/**
 * Obtener un cálculo específico por ID con todos sus detalles y snapshots
 */
export async function getCalculationById(id: string): Promise<CalculationWithDetails | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("calculations")
    .select(`
      *,
      materials:calculation_materials(*),
      expenses:calculation_expenses(*)
    `)
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    console.error("Error al obtener cálculo por ID:", error);
    return null;
  }

  return data as CalculationWithDetails;
}

/**
 * Guardar o actualizar un cálculo (Producto o Servicio)
 * Almacena snapshots inmutables de los materiales en ese momento.
 */
export async function saveCalculation(
  formData: CalculationFormData & { id?: string }
): Promise<{ success: boolean; data?: CalculationWithDetails; error?: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: "No has iniciado sesión o tu sesión ha expirado. Por favor inicia sesión primero.",
    };
  }

  const parsed = CalculationFormSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Datos inválidos" };
  }

  try {
    // 1. Recalcular en el servidor para máxima seguridad y fidelidad matemática
    const summary = computeCalculationSummary({
      type: parsed.data.type,
      outputQuantity: parsed.data.output_quantity,
      workMinutes: parsed.data.work_minutes,
      hourlyRate: parsed.data.hourly_rate,
      profitPercentage: parsed.data.profit_percentage,
      profitMethod: parsed.data.profit_method,
      materials: parsed.data.materials.map((m) => ({
        unitCost: m.unit_cost_snapshot,
        quantityUsed: m.quantity_used,
      })),
      expenses: parsed.data.expenses.map((e) => ({
        amount: e.amount,
      })),
    });

    const supabase = await createServerSupabaseClient();

    let calculationId = parsed.data.id;

    if (calculationId) {
      // Actualizar cálculo existente
      const { error: updateError } = await supabase
        .from("calculations")
        .update({
          name: parsed.data.name.trim(),
          description: parsed.data.description?.trim() || null,
          type: parsed.data.type,
          output_quantity: parsed.data.output_quantity,
          work_minutes: parsed.data.work_minutes,
          hourly_rate: parsed.data.hourly_rate,
          labor_cost: parseFloat(summary.laborCost),
          materials_cost: parseFloat(summary.materialsCost),
          additional_cost: parseFloat(summary.additionalCost),
          total_cost: parseFloat(summary.totalCost),
          unit_cost: parseFloat(summary.unitCost),
          profit_percentage: parsed.data.profit_percentage,
          profit_method: parsed.data.profit_method,
          suggested_unit_price: parseFloat(summary.suggestedUnitPrice),
          updated_at: new Date().toISOString(),
        })
        .eq("id", calculationId)
        .eq("user_id", user.id);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      // Eliminar detalles previos para insertar los nuevos snapshots
      await supabase.from("calculation_materials").delete().eq("calculation_id", calculationId);
      await supabase.from("calculation_expenses").delete().eq("calculation_id", calculationId);
    } else {
      // Insertar nuevo cálculo
      const { data: newCalc, error: insertError } = await supabase
        .from("calculations")
        .insert({
          user_id: user.id,
          name: parsed.data.name.trim(),
          description: parsed.data.description?.trim() || null,
          type: parsed.data.type,
          output_quantity: parsed.data.output_quantity,
          work_minutes: parsed.data.work_minutes,
          hourly_rate: parsed.data.hourly_rate,
          labor_cost: parseFloat(summary.laborCost),
          materials_cost: parseFloat(summary.materialsCost),
          additional_cost: parseFloat(summary.additionalCost),
          total_cost: parseFloat(summary.totalCost),
          unit_cost: parseFloat(summary.unitCost),
          profit_percentage: parsed.data.profit_percentage,
          profit_method: parsed.data.profit_method,
          suggested_unit_price: parseFloat(summary.suggestedUnitPrice),
          is_archived: false,
        })
        .select()
        .single();

      if (insertError || !newCalc) {
        if (insertError?.message?.includes("Could not find the table") || (insertError as any)?.code === "PGRST205") {
          return {
            success: false,
            error: "Las tablas no existen aún en Supabase. Ve a tu panel de Supabase > SQL Editor y ejecuta el script 'supabase/migrations/20261012_initial_schema.sql'.",
          };
        }
        return { success: false, error: insertError?.message || "Error al crear cálculo" };
      }

      calculationId = newCalc.id;
    }

    // Insertar snapshots de materiales
    if (parsed.data.materials.length > 0) {
      const materialsToInsert = parsed.data.materials.map((m) => {
        const subtotal = m.unit_cost_snapshot * m.quantity_used;
        return {
          calculation_id: calculationId,
          material_id: m.material_id && m.material_id.trim() ? m.material_id : null,
          material_name_snapshot: m.material_name_snapshot.trim(),
          unit_snapshot: m.unit_snapshot.trim(),
          quantity_used: m.quantity_used,
          unit_cost_snapshot: m.unit_cost_snapshot,
          subtotal: subtotal,
        };
      });

      const { error: matError } = await supabase
        .from("calculation_materials")
        .insert(materialsToInsert);

      if (matError) {
        console.error("Error al insertar materiales del cálculo:", matError);
      }
    }

    // Insertar gastos adicionales
    if (parsed.data.expenses.length > 0) {
      const expensesToInsert = parsed.data.expenses.map((e) => ({
        calculation_id: calculationId,
        name: e.name.trim(),
        amount: e.amount,
      }));

      const { error: expError } = await supabase
        .from("calculation_expenses")
        .insert(expensesToInsert);

      if (expError) {
        console.error("Error al insertar gastos del cálculo:", expError);
      }
    }

    revalidatePath("/calculations");
    revalidatePath("/dashboard");
    revalidatePath(`/calculations/${calculationId}`);

    const saved = await getCalculationById(calculationId!);
    return { success: true, data: saved || undefined };
  } catch (err: any) {
    return { success: false, error: err.message || "Error en el cálculo" };
  }
}

/**
 * Duplicar un cálculo existente (con todos sus materiales y gastos)
 */
export async function duplicateCalculation(id: string): Promise<{ success: boolean; data?: CalculationWithDetails; error?: string }> {
  const original = await getCalculationById(id);
  if (!original) {
    return { success: false, error: "Cálculo no encontrado" };
  }

  const duplicatedData: CalculationFormData = {
    type: original.type,
    name: `${original.name} (Copia)`,
    description: original.description || undefined,
    output_quantity: original.output_quantity,
    work_minutes: original.work_minutes,
    hourly_rate: original.hourly_rate,
    profit_percentage: original.profit_percentage,
    profit_method: original.profit_method,
    materials: original.materials.map((m) => ({
      material_id: m.material_id || undefined,
      material_name_snapshot: m.material_name_snapshot,
      unit_snapshot: m.unit_snapshot,
      unit_cost_snapshot: m.unit_cost_snapshot,
      quantity_used: m.quantity_used,
    })),
    expenses: original.expenses.map((e) => ({
      name: e.name,
      amount: e.amount,
    })),
  };

  return await saveCalculation(duplicatedData);
}

/**
 * Alternar estado archivado de un cálculo
 */
export async function toggleArchiveCalculation(
  id: string,
  isArchived: boolean
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "No autenticado" };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("calculations")
    .update({
      is_archived: isArchived,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/calculations");
  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Eliminar cálculo y sus detalles
 */
export async function deleteCalculation(id: string): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "No autenticado" };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("calculations")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/calculations");
  revalidatePath("/dashboard");
  return { success: true };
}

