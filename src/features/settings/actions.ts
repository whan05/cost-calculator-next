"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient, getCurrentUser } from "@/lib/supabase/server";
import { ProfileSchema } from "@/lib/validations/schemas";
import { UserProfile, ProfileFormData } from "@/types/database";

/**
 * Obtener el perfil del usuario autenticado
 */
export async function getProfile(): Promise<UserProfile | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !data) {
    // Si aún no existe el perfil (por ejemplo usuario creado antes de la migración),
    // crearlo con valores por defecto
    const newProfile: Partial<UserProfile> = {
      id: user.id,
      full_name: (user.user_metadata?.full_name as string) || user.email?.split("@")[0] || "Usuario",
      business_name: (user.user_metadata?.business_name as string) || "",
      currency: "CRC",
      default_hourly_rate: 0,
      default_profit_percentage: 30,
    };

    const { data: created, error: insertError } = await supabase
      .from("profiles")
      .upsert(newProfile)
      .select()
      .single();

    if (insertError) {
      console.error("Error al crear perfil por defecto:", insertError);
      return null;
    }

    return created as UserProfile;
  }

  return data as UserProfile;
}

/**
 * Actualizar configuración de perfil
 */
export async function updateProfile(data: ProfileFormData): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "No autenticado" };
  }

  const parsed = ProfileSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Datos inválidos" };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      full_name: parsed.data.full_name,
      business_name: parsed.data.business_name || null,
      currency: parsed.data.currency,
      default_hourly_rate: parsed.data.default_hourly_rate,
      default_profit_percentage: parsed.data.default_profit_percentage,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/calculator");
  return { success: true };
}

