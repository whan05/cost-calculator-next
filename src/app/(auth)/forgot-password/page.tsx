"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Coins, Loader2, Mail, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { forgotPasswordAction } from "@/features/auth/actions";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await forgotPasswordAction(formData);
      if (res?.error) {
        setErrorMsg(res.error);
        toast.error("Error", { description: res.error });
      } else {
        setSentSuccess(true);
        toast.success("Correo enviado");
      }
    } catch {
      setErrorMsg("Error al enviar el enlace de recuperación.");
    } finally {
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
        </div>

        <Card className="shadow-lg border-border/60">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Recuperar Contraseña</CardTitle>
            <CardDescription>
              Te enviaremos un correo para que puedas restablecer tu contraseña
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sentSuccess ? (
              <div className="flex flex-col items-center text-center py-6 space-y-4">
                <div className="rounded-full bg-emerald-500/10 p-3 text-emerald-600">
                  <CheckCircle className="h-10 w-10" />
                </div>
                <h3 className="font-semibold text-lg">Revisa tu bandeja de entrada</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Hemos enviado las instrucciones para restablecer tu contraseña.
                </p>
                <Link href="/login" className="w-full">
                  <Button className="w-full">Volver al inicio de sesión</Button>
                </Link>
              </div>
            ) : (
              <>
                {errorMsg && (
                  <div className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/15 p-3 text-sm text-destructive font-medium border border-destructive/20">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="tu@negocio.com"
                        required
                        className="pl-9"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full gap-2" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Enviando enlace...</span>
                      </>
                    ) : (
                      <span>Enviar enlace de recuperación</span>
                    )}
                  </Button>
                </form>
              </>
            )}
          </CardContent>
          <CardFooter className="pt-2 text-center text-sm border-t bg-muted/20 justify-center">
            <Link
              href="/login"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Regresar al inicio de sesión
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

