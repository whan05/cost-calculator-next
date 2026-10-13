"use client";

import React, { useState } from "react";
import { Loader2, Save, Building, Coins, Clock, Percent, User, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { updateProfile } from "@/features/settings/actions";
import { UserProfile, Currency } from "@/types/database";
import { toast } from "sonner";

interface SettingsFormProps {
  initialProfile: UserProfile | null;
}

export function SettingsForm({ initialProfile }: SettingsFormProps) {
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState(initialProfile?.full_name || "");
  const [businessName, setBusinessName] = useState(initialProfile?.business_name || "");
  const [currency, setCurrency] = useState<Currency>(initialProfile?.currency || "CRC");
  const [defaultHourlyRate, setDefaultHourlyRate] = useState<number>(
    initialProfile?.default_hourly_rate ?? 0
  );
  const [defaultProfitPercentage, setDefaultProfitPercentage] = useState<number>(
    initialProfile?.default_profit_percentage ?? 30
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await updateProfile({
        full_name: fullName,
        business_name: businessName,
        currency: currency,
        default_hourly_rate: Number(defaultHourlyRate),
        default_profit_percentage: Number(defaultProfitPercentage),
      });

      if (res.success) {
        toast.success("Configuración actualizada correctamente");
      } else {
        toast.error("Error al actualizar configuración", { description: res.error });
      }
    } catch {
      toast.error("Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building className="h-5 w-5 text-emerald-600" />
              <span>Datos del Negocio y Perfil</span>
            </CardTitle>
            <CardDescription>
              Información de tu emprendimiento o taller que aparecerá en tus cálculos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nombre de Contacto / Propietario</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="full_name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Tu nombre completo"
                    required
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_name">Nombre del Emprendimiento / Marca</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="business_name"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Ej. Estudio Creativo / Taller 3D"
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Coins className="h-5 w-5 text-emerald-600" />
              <span>Parámetros Financieros y de Mano de Obra</span>
            </CardTitle>
            <CardDescription>
              Valores predeterminados que se autocompletarán en la calculadora (podrás modificarlos individualmente en cada cotización)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Moneda Predeterminada</Label>
                <Select value={currency} onValueChange={(val) => setCurrency(val as Currency)}>
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Selecciona moneda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CRC">CRC - Colones Costarricenses (₡)</SelectItem>
                    <SelectItem value="USD">USD - Dólares Estadounidenses ($)</SelectItem>
                    <SelectItem value="EUR">EUR - Euros (€)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Se utilizará para dar formato a los subtotales y precios sugeridos.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hourly_rate">Tarifa por Hora Predeterminada ({currency})</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="hourly_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={defaultHourlyRate}
                    onChange={(e) => setDefaultHourlyRate(parseFloat(e.target.value) || 0)}
                    placeholder="Ej. 3000"
                    className="pl-9 font-mono"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Tarifa base para calcular el costo del tiempo de trabajo. Puede ser 0 si se especifica conscientemente.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profit_percentage">Porcentaje de Ganancia Predeterminado (%)</Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="profit_percentage"
                    type="number"
                    step="0.1"
                    min="0"
                    max="99.9"
                    value={defaultProfitPercentage}
                    onChange={(e) => setDefaultProfitPercentage(parseFloat(e.target.value) || 0)}
                    placeholder="Ej. 30"
                    className="pl-9 font-mono"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Porcentaje sugerido para aplicar en productos o servicios nuevos.
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end border-t pt-4 bg-muted/10">
            <Button type="submit" disabled={loading} className="gap-2">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Guardar Configuración</span>
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </form>
  );
}

