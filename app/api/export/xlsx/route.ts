export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { getDashboard } from "@/src/db/queries/dashboard";
import { db } from "@/src/db";
import { liftEntries, bodyStats, runningSessions, mobilityStats, skillCheckpoints } from "@/src/db/schema";
import { eq, desc } from "drizzle-orm";
import * as ExcelJS from "exceljs";
import { format } from "date-fns";
import { LIFT_LABELS, SKILL_LABELS, type LiftKey, type SkillKey } from "@/src/lib/engines";

const THEME = {
  dark:   "FF0D0D0F",
  card:   "FF161719",
  border: "FF2A2D31",
  orange: "FFF97316",
  blue:   "FF3B82F6",
  green:  "FF2F9E44",
  gold:   "FFF4C20D",
  red:    "FFE63946",
  text:   "FFF5F6F7",
  muted:  "FFA1A6AD",
};

function headerFill(color: string): ExcelJS.Fill {
  return { type: "pattern", pattern: "solid", fgColor: { argb: color } };
}

function applyHeader(row: ExcelJS.Row, bgArgb: string) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: THEME.text }, size: 10 };
    cell.fill = headerFill(bgArgb);
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      bottom: { style: "thin", color: { argb: THEME.border } },
    };
  });
  row.height = 20;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;

  const [dashboard, lifts, body, runs, mobility, skills] = await Promise.all([
    getDashboard(userId),
    db.query.liftEntries.findMany({ where: eq(liftEntries.userId, userId), orderBy: [desc(liftEntries.date)], limit: 1000 }),
    db.query.bodyStats.findMany({ where: eq(bodyStats.userId, userId), orderBy: [desc(bodyStats.date)], limit: 500 }),
    db.query.runningSessions.findMany({ where: eq(runningSessions.userId, userId), orderBy: [desc(runningSessions.date)], limit: 500 }),
    db.query.mobilityStats.findMany({ where: eq(mobilityStats.userId, userId), orderBy: [desc(mobilityStats.date)], limit: 200 }),
    db.query.skillCheckpoints.findMany({ where: eq(skillCheckpoints.userId, userId) }),
  ]);

  const wb = new ExcelJS.Workbook();
  wb.creator = "Shinobi Training";
  wb.created = new Date();

  const goalKg = dashboard.settings.goalWeightKg;

  // ── Sheet 1: Dashboard ──
  {
    const ws = wb.addWorksheet("Dashboard");
    ws.pageSetup.orientation = "landscape";
    ws.properties.defaultColWidth = 18;

    ws.addRow(["SHINOBI TRAINING — MISSION REPORT"]);
    ws.getRow(1).getCell(1).font = { bold: true, size: 16, color: { argb: THEME.orange } };
    ws.addRow([`Generated: ${format(new Date(), "PPP")}`]);
    ws.getRow(2).getCell(1).font = { color: { argb: THEME.muted }, size: 10 };
    ws.addRow([]);

    ws.addRow(["RANK", dashboard.rank.rank]);
    ws.addRow(["Avg % to Strong", `${dashboard.rank.avgPctToStrong.toFixed(1)}%`]);
    ws.addRow(["Current Weight", dashboard.currentWeightKg != null ? `${dashboard.currentWeightKg.toFixed(1)} kg` : "—"]);
    ws.addRow(["Goal Weight", `${goalKg} kg`]);
    ws.addRow(["To Go", dashboard.currentWeightKg != null ? `${Math.abs(goalKg - dashboard.currentWeightKg).toFixed(1)} kg` : "—"]);
    ws.addRow(["Skills Achieved", `${dashboard.skillsAchieved}/${dashboard.skillsTotal}`]);
    ws.addRow(["Total Runs", dashboard.runningTotals.sessionsTotal]);
    ws.addRow(["Total km", dashboard.runningTotals.kmTotal.toFixed(1)]);

    ws.addRow([]);
    const header = ws.addRow(["Lift", "Best (kg)", "Strong Target", "Advanced Target", "% to Strong", "% to Advanced", "Lift Rank"]);
    applyHeader(header, THEME.dark);
    for (const lift of dashboard.lifts) {
      const row = ws.addRow([
        LIFT_LABELS[lift.lift],
        lift.bestKg > 0 ? lift.bestKg.toFixed(1) : "—",
        lift.strongTarget,
        lift.advancedTarget,
        `${lift.pctToStrong.toFixed(0)}%`,
        `${lift.pctToAdvanced.toFixed(0)}%`,
        lift.lift,
      ]);
      row.getCell(1).font = { bold: true, color: { argb: THEME.orange } };
    }
  }

  // ── Sheet 2: Lift Log ──
  {
    const ws = wb.addWorksheet("Lift Log");
    ws.properties.defaultColWidth = 14;
    ws.views = [{ state: "frozen", ySplit: 1 }];
    const header = ws.addRow(["Date", "Lift", "Weight (kg)", "Reps", "RPE", "Notes"]);
    applyHeader(header, THEME.card);
    for (const e of lifts) {
      ws.addRow([e.date, LIFT_LABELS[e.lift as LiftKey] ?? e.lift, parseFloat(e.weightKg).toFixed(1), e.reps, e.rpe ?? "", e.notes ?? ""]);
    }
  }

  // ── Sheet 3: Body Stats ──
  {
    const ws = wb.addWorksheet("Body Stats");
    ws.properties.defaultColWidth = 14;
    ws.views = [{ state: "frozen", ySplit: 1 }];
    const header = ws.addRow(["Date", "Weight (kg)", "Waist (cm)", "Notes"]);
    applyHeader(header, THEME.card);
    for (const e of body) {
      ws.addRow([e.date, parseFloat(e.weightKg).toFixed(1), e.waistCm ? parseFloat(e.waistCm).toFixed(1) : "", e.notes ?? ""]);
    }
  }

  // ── Sheet 4: Running Log ──
  {
    const ws = wb.addWorksheet("Running Log");
    ws.properties.defaultColWidth = 14;
    ws.views = [{ state: "frozen", ySplit: 1 }];
    const header = ws.addRow(["Date", "Type", "Distance (km)", "Duration (min)", "Pace (/km)", "Notes"]);
    applyHeader(header, THEME.card);
    for (const e of runs) {
      const dist = parseFloat(e.distanceKm);
      const dur = parseFloat(e.durationMin);
      const paceMin = dur / dist;
      const paceStr = `${Math.floor(paceMin)}:${String(Math.round((paceMin % 1) * 60)).padStart(2, "0")}`;
      ws.addRow([e.date, e.type, dist.toFixed(2), dur.toFixed(0), paceStr, e.notes ?? ""]);
    }
  }

  // ── Sheet 5: Mobility ──
  {
    const ws = wb.addWorksheet("Mobility & Skill Stats");
    ws.properties.defaultColWidth = 18;
    ws.views = [{ state: "frozen", ySplit: 1 }];
    const header = ws.addRow(["Date", "Front Split Gap (cm)", "Middle Split Gap (cm)", "Wall HS (s)", "Free HS (s)", "L-Sit (s)", "Notes"]);
    applyHeader(header, THEME.card);
    for (const e of mobility) {
      ws.addRow([
        e.date,
        e.frontSplitGapCm ?? "",
        e.middleSplitGapCm ?? "",
        e.wallHsHoldS ?? "",
        e.freestandingHsHoldS ?? "",
        e.lsitHoldS ?? "",
        e.notes ?? "",
      ]);
    }
  }

  // ── Sheet 6: Strength Standards ──
  {
    const ws = wb.addWorksheet("Strength Standards");
    ws.properties.defaultColWidth = 16;
    ws.addRow(["Goal Weight (kg)", goalKg]);
    ws.addRow([]);
    const header = ws.addRow(["Lift", "Best (kg)", "Strong Target", "% to Strong", "Advanced Target", "% to Advanced"]);
    applyHeader(header, THEME.card);
    for (const lift of dashboard.lifts) {
      ws.addRow([
        LIFT_LABELS[lift.lift],
        lift.bestKg > 0 ? lift.bestKg.toFixed(1) : 0,
        lift.strongTarget,
        `${lift.pctToStrong.toFixed(0)}%`,
        lift.advancedTarget,
        `${lift.pctToAdvanced.toFixed(0)}%`,
      ]);
    }
  }

  // ── Sheet 7: Skill Checkpoints ──
  {
    const ws = wb.addWorksheet("Skill Checkpoints");
    ws.properties.defaultColWidth = 22;
    const header = ws.addRow(["#", "Skill", "Status", "Coached?", "Notes"]);
    applyHeader(header, THEME.card);
    let i = 1;
    for (const ck of skills) {
      const info = SKILL_LABELS[ck.skillKey as SkillKey];
      ws.addRow([i++, info?.name ?? ck.skillKey, ck.status, info?.coached ? "YES — on mats" : "", ck.notes ?? ""]);
    }
  }

  const buffer = await wb.xlsx.writeBuffer();
  const filename = `shinobi-training-export-${format(new Date(), "yyyy-MM-dd")}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
