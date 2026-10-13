import React from "react";
import { getCalculations } from "@/features/calculations/actions";
import { getProfile } from "@/features/settings/actions";
import { CalculationsList } from "@/components/calculations/calculations-list";

export default async function CalculationsPage() {
  const profile = await getProfile();
  const calculations = await getCalculations({ includeArchived: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Historial y Gestión de Cálculos
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Consulta cotizaciones guardadas, visualiza desgloses con snapshots históricos, duplica o edita productos y servicios.
        </p>
      </div>

      <CalculationsList
        initialCalculations={calculations}
        currency={profile?.currency || "CRC"}
      />
    </div>
  );
}
