"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Coins, Loader2, Lock, Mail, User, Building, ArrowRight, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { registerAction } from "@/features/auth/actions";
import { toast } from "sonner";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await registerAction(formData);
      if (res?.error) {
        setErrorMsg(res.error);
        toast.error("Error en el registro", { description: res.error });
        setLoading(false);
      } else if (res?.success) {
        if (res.hasSession) {
          toast.success("¡Cuenta creada exitosamente! Redirigiendo al dashboard...");
          window.location.href = "/dashboard";
        } else {
          setRegisteredSuccess(true);
          toast.success("¡Registro completado! Revisa tu correo o inicia sesión.");
          setLoading(false);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Ocurrió un error inesperado al procesar la solicitud.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md mb-3">
            <Coins className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">CostCalc Pro</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Crea tu cuenta para gestionar materiales, productos y servicios
          </p>
        </div>

        <Card className="shadow-lg border-border/60">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Crear Cuenta</CardTitle>
            <CardDescription>
              Comienza a calcular y optimizar tus costos y precios de venta
            </CardDescription>
          </CardHeader>
          <CardContent>
            {registeredSuccess ? (
              <div className="flex flex-col items-center text-center py-6 space-y-4">
                <div className="rounded-full bg-emerald-500/10 p-3 text-emerald-600">
                  <CheckCircle className="h-10 w-10" />
                </div>
                <h3 className="font-semibold text-lg">¡Registro procesado!</h3>
                <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                  Si tu proyecto de Supabase tiene habilitada la confirmación por correo, revisa tu bandeja de entrada para verificar tu cuenta y luego inicia sesión. Si la confirmación está desactivada, ya puedes iniciar sesión directamente.
                </p>
                <Link href="/login" className="w-full">
                  <Button className="w-full">Ir a Iniciar Sesión</Button>
                </Link>
              </div>
            ) : (
              <>
                {errorMsg && (
                  <div className="mb-4 flex items-start gap-2.5 rounded-lg bg-destructive/15 p-3.5 text-xs text-destructive font-medium border border-destructive/20 leading-relaxed">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nombre Completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="full_name"
                        name="full_name"
                        placeholder="Ej. María Rodríguez"
                        required
                        className="pl-9"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="business_name">Nombre del Negocio (Opcional)</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="business_name"
                        name="business_name"
                        placeholder="Ej. Taller Creativo 3D"
                        className="pl-9"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="tu@correo.com"
                        required
                        className="pl-9"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña (Mínimo 6 caracteres)</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className="pl-9"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full gap-2 mt-2" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Creando cuenta...</span>
                      </>
                    ) : (
                      <>
                        <span>Registrarme</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </>
            )}
          </CardContent>
          {!registeredSuccess && (
            <CardFooter className="flex flex-col space-y-3 pt-2 text-center text-sm border-t bg-muted/20">
              <p className="text-muted-foreground">
                ¿Ya tienes una cuenta?{" "}
                <Link href="/login" className="text-primary font-semibold hover:underline">
                  Inicia sesión aquí
                </Link>
              </p>
              <Link href="/" className="text-xs text-muted-foreground hover:underline">
                Volver a la página principal
              </Link>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
