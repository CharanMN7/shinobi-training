import { auth } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/src/db";
import { bodyStats, userSettings } from "@/src/db/schema";
import { eq, desc } from "drizzle-orm";
import { Header, DesktopPageHeader } from "@/components/layout/header";
import { BodyStatsClient } from "./body-stats-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Body Stats" };

export default async function BodyStatsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [settings, entries] = await Promise.all([
    db.query.userSettings.findFirst({ where: eq(userSettings.userId, session.user.id) }),
    db.query.bodyStats.findMany({
      where: eq(bodyStats.userId, session.user.id),
      orderBy: [desc(bodyStats.date)],
      limit: 180,
    }),
  ]);

  const goalKg = settings ? parseFloat(settings.goalWeightKg) : 80;

  return (
    <div className="min-h-screen bg-[#0D0D0F]">
      <Header title="BODY" subtitle="体" />
      <div className="px-4 py-4 md:px-6 md:py-6 max-w-3xl mx-auto">
        <DesktopPageHeader title="Body Stats" subtitle="体 — track weight toward 80 kg goal" />
        <BodyStatsClient
          entries={entries.map((e) => ({
            ...e,
            weightKg: e.weightKg.toString(),
            waistCm: e.waistCm?.toString() ?? null,
          }))}
          goalKg={goalKg}
        />
      </div>
    </div>
  );
}
