import React from "react";
import { getMaterials, getCategories } from "@/features/materials/actions";
import { getProfile } from "@/features/settings/actions";
import { MaterialsList } from "@/components/materials/materials-list";

export default async function MaterialsPage() {
  const profile = await getProfile();
  const materials = await getMaterials({ includeArchived: true });
  const categories = await getCategories();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Catálogo General de Materiales e Insumos
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Registra tus compras para determinar costos unitarios y reutilizarlos en cualquier cálculo.
        </p>
      </div>

      <MaterialsList
        initialMaterials={materials}
        categories={categories}
        currency={profile?.currency || "CRC"}
      />
    </div>
  );
}
