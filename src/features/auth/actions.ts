"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { LoginSchema, RegisterSchema, ForgotPasswordSchema } from "@/lib/validations/schemas";

export type AuthActionResult = {
  success?: boolean;
  hasSession?: boolean;
  error?: string;
};

/**
 * Iniciar sesión con email y contraseña
 */
export async function loginAction(formData: FormData): Promise<AuthActionResult> {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = LoginSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Datos inválidos" };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        return { error: "Credenciales incorrectas. Verifica tu correo y contraseña o crea una cuenta si aún no tienes una." };
      }
      if (error.message.includes("Email not confirmed")) {
        return {
          error: "El correo aún no ha sido confirmado. Revisa tu bandeja de entrada o desactiva 'Confirm email' en tu consola de Supabase (Authentication > Providers > Email) para acceso inmediato.",
        };
      }
      return { error: error.message };
    }

    revalidatePath("/", "layout");
    return { success: true, hasSession: !!data?.session };
  } catch (err: any) {
    return { error: err.message || "Error al conectar con el servidor de autenticación" };
  }
}

/**
 * Registro de nuevo usuario
 */
export async function registerAction(formData: FormData): Promise<AuthActionResult> {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
    full_name: formData.get("full_name"),
    business_name: formData.get("business_name") || "",
  };

  const parsed = RegisterSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Datos inválidos" };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: {
          full_name: parsed.data.full_name,
          business_name: parsed.data.business_name,
        },
      },
    });

    if (error) {
      if (error.message.includes("rate limit") || (error as any).code === "over_email_send_rate_limit") {
        return {
          error: "Límite de correos por hora excedido en Supabase (rate limit). Para registrarte sin restricciones de correo, desactiva la opción 'Confirm email' en tu panel de Supabase: Authentication > Providers > Email.",
        };
      }
      if (error.message.includes("Email address") && error.message.includes("invalid")) {
        return {
          error: "Formato de correo inválido según las políticas de Supabase. Utiliza un correo real (ej. @gmail.com o @outlook.com).",
        };
      }
      return { error: error.message };
    }

    revalidatePath("/", "layout");
    return {
      success: true,
      hasSession: !!data?.session,
    };
  } catch (err: any) {
    return { error: err.message || "Error al registrar cuenta" };
  }
}

/**
 * Cerrar sesión
 */
export async function logoutAction(): Promise<void> {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
}

/**
 * Recuperación de contraseña
 */
export async function forgotPasswordAction(formData: FormData): Promise<AuthActionResult> {
  const rawData = {
    email: formData.get("email"),
  };

  const parsed = ForgotPasswordSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Correo inválido" };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/reset-password`,
    });

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Error al enviar correo de recuperación" };
  }
}
