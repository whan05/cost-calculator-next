import React from "react";
import { getCurrentUser } from "@/lib/supabase/server";
import { getProfile } from "@/features/settings/actions";
import { Sidebar } from "@/components/layout/sidebar";
import { DatabaseStatusBanner } from "@/components/layout/database-status-banner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const profile = await getProfile();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        userEmail={user?.email || "usuario@ejemplo.com"}
        businessName={profile?.business_name || profile?.full_name || "Mi Emprendimiento"}
        currency={profile?.currency || "CRC"}
      />
      <div className="md:pl-64 flex flex-col min-h-screen">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <DatabaseStatusBanner />
          {children}
        </main>
      </div>
    </div>
  );
}
