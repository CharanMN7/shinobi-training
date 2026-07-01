import { auth } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/src/db";
import { userSettings, users } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { Header, DesktopPageHeader } from "@/components/layout/header";
import { SettingsClient } from "./settings-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [user, settings] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, session.user.id) }),
    db.query.userSettings.findFirst({ where: eq(userSettings.userId, session.user.id) }),
  ]);

  return (
    <div className="min-h-screen bg-[#0D0D0F]">
      <Header title="SETTINGS" subtitle="設" />
      <div className="px-4 pt-4 pb-safe-nav md:px-6 md:pt-6 md:pb-6 max-w-2xl mx-auto">
        <DesktopPageHeader title="Settings" subtitle="設 — configure your training" />
        <SettingsClient
          displayName={user?.displayName ?? ""}
          email={user?.email ?? ""}
          goalWeightKg={settings ? parseFloat(settings.goalWeightKg) : 80}
          timezone={settings?.timezone ?? "Asia/Kolkata"}
        />
      </div>
    </div>
  );
}
