import { auth } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/src/db";
import { runningSessions } from "@/src/db/schema";
import { eq, desc } from "drizzle-orm";
import { Header, DesktopPageHeader } from "@/components/layout/header";
import { RunningClient } from "./running-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Running Log" };

export default async function RunningPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const entries = await db.query.runningSessions.findMany({
    where: eq(runningSessions.userId, session.user.id),
    orderBy: [desc(runningSessions.date)],
    limit: 200,
  });

  return (
    <div className="min-h-screen bg-[#0D0D0F]">
      <Header title="RUNNING" subtitle="走" />
      <div className="px-4 py-4 md:px-6 md:py-6 max-w-3xl mx-auto">
        <DesktopPageHeader title="Running Log" subtitle="走 — build your base" />
        <RunningClient
          entries={entries.map((e) => ({
            ...e,
            distanceKm: e.distanceKm.toString(),
            durationMin: e.durationMin.toString(),
          }))}
        />
      </div>
    </div>
  );
}
