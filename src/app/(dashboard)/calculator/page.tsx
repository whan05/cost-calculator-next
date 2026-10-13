import React from "react";
import { getMaterials } from "@/features/materials/actions";
import { getProfile } from "@/features/settings/actions";
import { getCalculationById } from "@/features/calculations/actions";
import { CalculatorForm } from "@/components/calculators/calculator-form";
import { CalculationType } from "@/types/database";

interface CalculatorPageProps {
  searchParams: Promise<{
    type?: string;
    id?: string;
  }>;
}

export default async function CalculatorPage({ searchParams }: CalculatorPageProps) {
  const params = await searchParams;
  const profile = await getProfile();
  const materials = await getMaterials({ includeArchived: false });

  let initialCalculation = null;
  if (params.id) {
    initialCalculation = await getCalculationById(params.id);
  }

  const initialType: CalculationType =
    params.type === "service" || initialCalculation?.type === "service"
      ? "service"
      : "product";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {initialCalculation
            ? `Editar ${initialCalculation.type === "product" ? "Producto" : "Servicio"}: ${initialCalculation.name}`
            : "Calculadora de Costos y Precios"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {initialCalculation
            ? "Modifica insumos, tiempo o tarifa. Los cambios se recalculan en tiempo real."
            : "Configura materiales, tiempo de trabajo y margen de ganancia para obtener tus costos y precios sugeridos."}
        </p>
      </div>

      <CalculatorForm
        availableMaterials={materials}
        userProfile={profile}
        initialType={initialType}
        initialCalculation={initialCalculation}
        currency={profile?.currency || "CRC"}
      />
    </div>
  );
}
