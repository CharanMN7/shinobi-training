import { auth } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/src/db";
import { skillCheckpoints } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { Header, DesktopPageHeader } from "@/components/layout/header";
import { SkillsClient } from "./skills-client";
import { SKILL_ORDER } from "@/src/lib/engines";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Skill Checkpoints" };

export default async function SkillsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const checkpoints = await db.query.skillCheckpoints.findMany({
    where: eq(skillCheckpoints.userId, session.user.id),
  });

  // Sort by skill order
  const sorted = SKILL_ORDER.map((key) => checkpoints.find((c) => c.skillKey === key)).filter(Boolean);

  return (
    <div className="min-h-screen bg-[#0D0D0F]">
      <Header title="SKILLS" subtitle="技" />
      <div className="px-4 pt-4 pb-safe-nav md:px-6 md:pt-6 md:pb-6 max-w-3xl mx-auto">
        <DesktopPageHeader title="Skill Checkpoints" subtitle="技 — the ninja trick ladder" />
        <SkillsClient checkpoints={sorted as typeof checkpoints} />
      </div>
    </div>
  );
}
