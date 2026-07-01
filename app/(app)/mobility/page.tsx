import { auth } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/src/db";
import { mobilityStats } from "@/src/db/schema";
import { eq, desc } from "drizzle-orm";
import { Header, DesktopPageHeader } from "@/components/layout/header";
import { MobilityClient } from "./mobility-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mobility & Skill Stats" };

export default async function MobilityPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const entries = await db.query.mobilityStats.findMany({
    where: eq(mobilityStats.userId, session.user.id),
    orderBy: [desc(mobilityStats.date)],
    limit: 100,
  });

  return (
    <div className="min-h-screen bg-[#0D0D0F]">
      <Header title="MOBILITY" subtitle="柔" />
      <div className="px-4 py-4 md:px-6 md:py-6 max-w-3xl mx-auto">
        <DesktopPageHeader title="Mobility & Skill Stats" subtitle="柔 — splits, handstands, L-sit" />
        <MobilityClient
          entries={entries.map((e) => ({
            ...e,
            frontSplitGapCm: e.frontSplitGapCm?.toString() ?? null,
            middleSplitGapCm: e.middleSplitGapCm?.toString() ?? null,
          }))}
        />
      </div>
    </div>
  );
}
