import React from "react";
import { getProfile } from "@/features/settings/actions";
import { SettingsForm } from "@/components/settings/settings-form";

export default async function SettingsPage() {
  const profile = await getProfile();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Configuración General
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ajusta la moneda de tu cuenta, valores iniciales de mano de obra y márgenes de ganancia.
        </p>
      </div>

      <SettingsForm initialProfile={profile} />
    </div>
  );
}
