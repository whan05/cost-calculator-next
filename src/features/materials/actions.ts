"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient, getCurrentUser } from "@/lib/supabase/server";
import { MaterialSchema, MaterialCategorySchema } from "@/lib/validations/schemas";
import { calculateUnitCost } from "@/lib/calculations/calculations";
import { Material, MaterialCategory, MaterialFormData } from "@/types/database";

/**
 * Obtener todos los materiales del usuario
 */
export async function getMaterials(options?: { includeArchived?: boolean }): Promise<Material[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("materials")
    .select(`
      *,
      category:material_categories (
        id,
        name
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (!options?.includeArchived) {
    query = query.eq("is_archived", false);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error al obtener materiales:", error);
    return [];
  }

  return (data || []) as Material[];
}

/**
 * Obtener categorías de materiales
 */
export async function getCategories(): Promise<MaterialCategory[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("material_categories")
    .select("*")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error al obtener categorías:", error);
    return [];
  }

  return (data || []) as MaterialCategory[];
}

/**
 * Crear un nuevo material
 */
export async function createMaterial(
  data: MaterialFormData
): Promise<{ success: boolean; data?: Material; error?: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: "No has iniciado sesión o tu sesión ha expirado. Por favor inicia sesión primero.",
    };
  }

  const parsed = MaterialSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Datos inválidos" };
  }

  try {
    const unitCost = calculateUnitCost(
      parsed.data.total_purchase_cost,
      parsed.data.purchased_quantity
    );

    const supabase = await createServerSupabaseClient();
    const { data: created, error } = await supabase
      .from("materials")
      .insert({
        user_id: user.id,
        category_id: parsed.data.category_id || null,
        name: parsed.data.name.trim(),
        description: parsed.data.description?.trim() || null,
        unit: parsed.data.unit.trim(),
        purchased_quantity: parsed.data.purchased_quantity,
        total_purchase_cost: parsed.data.total_purchase_cost,
        unit_cost: parseFloat(unitCost),
        is_archived: false,
      })
      .select()
      .single();

    if (error) {
      if (error.message.includes("Could not find the table") || (error as any).code === "PGRST205") {
        return {
          success: false,
          error: "Las tablas no existen aún en Supabase. Ve a tu panel de Supabase > SQL Editor y ejecuta el script 'supabase/migrations/20261012_initial_schema.sql'.",
        };
      }
      return { success: false, error: error.message };
    }

    revalidatePath("/materials");
    revalidatePath("/calculator");
    revalidatePath("/dashboard");
    return { success: true, data: created as Material };
  } catch (err: any) {
    return { success: false, error: err.message || "Error al calcular el costo unitario" };
  }
}

/**
 * Actualizar material existente
 */
export async function updateMaterial(
  id: string,
  data: MaterialFormData
): Promise<{ success: boolean; data?: Material; error?: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "No autenticado" };
  }

  const parsed = MaterialSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Datos inválidos" };
  }

  try {
    const unitCost = calculateUnitCost(
      parsed.data.total_purchase_cost,
      parsed.data.purchased_quantity
    );

    const supabase = await createServerSupabaseClient();
    const { data: updated, error } = await supabase
      .from("materials")
      .update({
        category_id: parsed.data.category_id || null,
        name: parsed.data.name.trim(),
        description: parsed.data.description?.trim() || null,
        unit: parsed.data.unit.trim(),
        purchased_quantity: parsed.data.purchased_quantity,
        total_purchase_cost: parsed.data.total_purchase_cost,
        unit_cost: parseFloat(unitCost),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/materials");
    revalidatePath("/calculator");
    revalidatePath("/dashboard");
    return { success: true, data: updated as Material };
  } catch (err: any) {
    return { success: false, error: err.message || "Error al actualizar material" };
  }
}

/**
 * Alternar estado archivado de un material
 */
export async function toggleArchiveMaterial(
  id: string,
  isArchived: boolean
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "No autenticado" };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("materials")
    .update({
      is_archived: isArchived,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/materials");
  revalidatePath("/calculator");
  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Eliminar material definitivamente (si no está vinculado a cálculos históricos con restricción o si el usuario lo decide)
 */
export async function deleteMaterial(id: string): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "No autenticado" };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("materials")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/materials");
  revalidatePath("/calculator");
  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Crear categoría de materiales
 */
export async function createCategory(
  name: string
): Promise<{ success: boolean; data?: MaterialCategory; error?: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "No autenticado" };
  }

  const parsed = MaterialCategorySchema.safeParse({ name });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Nombre inválido" };
  }

  const supabase = await createServerSupabaseClient();
  const { data: created, error } = await supabase
    .from("material_categories")
    .insert({
      user_id: user.id,
      name: parsed.data.name.trim(),
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/materials");
  return { success: true, data: created as MaterialCategory };
}

/**
 * Eliminar categoría
 */
export async function deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "No autenticado" };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("material_categories")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/materials");
  return { success: true };
}

