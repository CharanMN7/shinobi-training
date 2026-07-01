import { auth } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { getDashboard } from "@/src/db/queries/dashboard";
import { RankCard } from "@/components/dashboard/rank-card";
import { KpiStrip } from "@/components/dashboard/kpi-strip";
import { StrengthGrid } from "@/components/dashboard/strength-grid";
import { WeightChart } from "@/components/dashboard/weight-chart";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { Header } from "@/components/layout/header";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const data = await getDashboard(session.user.id);

  const name = data.user.displayName ?? "Shinobi";

  return (
    <div className="min-h-screen bg-[#0D0D0F]">
      <Header />

      <div className="px-4 py-4 md:px-6 md:py-6 max-w-6xl mx-auto space-y-5">
        {/* Desktop page title */}
        <div className="hidden md:block">
          <p className="text-[10px] text-[#6B7076] uppercase tracking-widest">忍 SHINOBI TRAINING</p>
          <h1 className="text-2xl font-black font-[var(--font-archivo)] text-[#F5F6F7] uppercase tracking-tight mt-1">
            Welcome back, {name}
          </h1>
        </div>

        {/* Rank + KPI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <RankCard
              rank={data.rank.rank}
              avgPctToStrong={data.rank.avgPctToStrong}
              allAtStrong={data.rank.allAtStrong}
              allAtAdvanced={data.rank.allAtAdvanced}
            />
          </div>
          <div className="md:col-span-2">
            <KpiStrip data={data} />
          </div>
        </div>

        {/* Strength grid */}
        <section>
          <SectionHeader title="Strength" kanji="力" href="/lifts" />
          <StrengthGrid lifts={data.lifts} goalWeightKg={data.settings.goalWeightKg} />
        </section>

        {/* Weight chart */}
        <section>
          <SectionHeader title="Body Trend" kanji="体" href="/body" />
          <div className="bg-[#161719] border border-[#2A2D31] rounded-2xl p-4">
            <WeightChart data={data.weightHistory} goalKg={data.settings.goalWeightKg} />
          </div>
        </section>

        {/* Running summary */}
        <section>
          <SectionHeader title="Running" kanji="走" href="/running" />
          <div className="grid grid-cols-3 gap-3">
            <StatMini label="Sessions" value={data.runningTotals.sessionsTotal.toString()} color="#2F9E44" />
            <StatMini label="Total km" value={data.runningTotals.kmTotal.toFixed(1)} color="#2F9E44" />
            <StatMini label="This week" value={`${data.runningTotals.weeklyKm.toFixed(1)} km`} color="#3B82F6" />
          </div>
        </section>

        {/* Mobility snapshot */}
        {data.latestMobility && (
          <section>
            <SectionHeader title="Mobility" kanji="柔" href="/mobility" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {data.latestMobility.frontSplitGapCm != null && (
                <StatMini label="Front Split Gap" value={`${data.latestMobility.frontSplitGapCm} cm`} color="#F4C20D" />
              )}
              {data.latestMobility.wallHsHoldS != null && (
                <StatMini label="Wall HS" value={`${data.latestMobility.wallHsHoldS}s`} color="#F97316" />
              )}
              {data.latestMobility.freestandingHsHoldS != null && (
                <StatMini label="Free HS" value={`${data.latestMobility.freestandingHsHoldS}s / 60s`} color="#F97316" />
              )}
              {data.latestMobility.lsitHoldS != null && (
                <StatMini label="L-Sit" value={`${data.latestMobility.lsitHoldS}s / 10s`} color="#3B82F6" />
              )}
            </div>
          </section>
        )}

        {/* Recent activity */}
        <section>
          <SectionHeader title="Recent Activity" kanji="録" />
          <ActivityFeed items={data.recentActivity} />
        </section>
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  kanji,
  href,
}: {
  title: string;
  kanji: string;
  href?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-[#6B7076]">{kanji}</span>
        <h2 className="text-sm font-black font-[var(--font-archivo)] text-[#F5F6F7] uppercase tracking-wider">
          {title}
        </h2>
      </div>
      {href && (
        <a href={href} className="text-[10px] text-[#F97316] hover:underline uppercase tracking-wider font-semibold">
          View all →
        </a>
      )}
    </div>
  );
}

function StatMini({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-[#161719] border border-[#2A2D31] rounded-xl p-3">
      <p className="text-[10px] text-[#6B7076] uppercase tracking-wider mb-1">{label}</p>
      <p className="text-xl font-black font-[var(--font-archivo)] tabular-nums" style={{ color }}>
        {value}
      </p>
    </div>
  );
}
