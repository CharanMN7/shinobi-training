import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { DashboardData } from "@/src/db/queries/dashboard";
import { LIFT_LABELS, type LiftKey } from "@/src/lib/engines";
import { format } from "date-fns";

const ORANGE = "#F97316";
const BLUE = "#3B82F6";
const GREEN = "#2F9E44";
const GOLD = "#F4C20D";
const RED = "#E63946";
const DARK = "#0D0D0F";
const CARD = "#161719";
const BORDER = "#2A2D31";
const TEXT = "#F5F6F7";
const MUTED = "#A1A6AD";

const styles = StyleSheet.create({
  page: {
    backgroundColor: DARK,
    color: TEXT,
    fontFamily: "Helvetica",
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 40,
  },
  coverPage: {
    backgroundColor: DARK,
    justifyContent: "center",
    alignItems: "center",
    padding: 60,
  },
  coverTitle: {
    fontSize: 36,
    fontFamily: "Helvetica-Bold",
    color: ORANGE,
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 4,
  },
  coverSubtitle: {
    fontSize: 12,
    color: MUTED,
    textAlign: "center",
    letterSpacing: 2,
    marginBottom: 32,
  },
  coverKanji: {
    fontSize: 64,
    color: ORANGE,
    opacity: 0.15,
    textAlign: "center",
    marginBottom: 24,
  },
  coverDate: {
    fontSize: 10,
    color: MUTED,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: ORANGE,
    letterSpacing: 2,
    marginBottom: 8,
    marginTop: 16,
    textTransform: "uppercase",
  },
  card: {
    backgroundColor: CARD,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeft: `3pt solid ${BORDER}`,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  label: {
    fontSize: 9,
    color: MUTED,
    width: 140,
  },
  value: {
    fontSize: 9,
    color: TEXT,
    flex: 1,
  },
  valueBig: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: ORANGE,
  },
  barContainer: {
    height: 6,
    backgroundColor: "#2A2D31",
    borderRadius: 3,
    marginTop: 4,
    marginBottom: 2,
  },
  kpiGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: CARD,
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
  },
  kpiLabel: { fontSize: 7, color: MUTED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 },
  kpiValue: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  liftGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  liftCard: {
    width: "18%",
    backgroundColor: CARD,
    borderRadius: 6,
    padding: 8,
  },
  rankBadge: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: ORANGE,
    textAlign: "center",
    marginVertical: 8,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    fontSize: 8,
    color: MUTED,
    textAlign: "center",
    borderTop: `1pt solid ${BORDER}`,
    paddingTop: 6,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1E2023",
    padding: 6,
    borderRadius: 4,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row",
    padding: "4pt 6pt",
    borderBottom: `1pt solid ${BORDER}`,
  },
  thCell: { fontSize: 7, color: MUTED, fontFamily: "Helvetica-Bold", textTransform: "uppercase" },
  tdCell: { fontSize: 8, color: TEXT },
});

function BarViz({ pct, color }: { pct: number; color: string }) {
  const w = Math.min(100, Math.max(0, pct));
  return (
    <View style={styles.barContainer}>
      <View style={{ height: 6, width: `${w}%`, backgroundColor: color, borderRadius: 3 }} />
    </View>
  );
}

export function MissionScrollPDF({ data }: { data: DashboardData }) {
  const goal = data.settings.goalWeightKg;
  const toGo = data.currentWeightKg != null ? goal - data.currentWeightKg : null;
  const today = format(new Date(), "MMMM d, yyyy");

  return (
    <Document title="Shinobi Mission Scroll" author="Shinobi Training">
      {/* ── Cover Page ── */}
      <Page size="A4" style={styles.coverPage}>
        <Text style={styles.coverKanji}>忍</Text>
        <Text style={styles.coverTitle}>SHINOBI</Text>
        <Text style={styles.coverSubtitle}>MISSION SCROLL · TRAINING REPORT</Text>

        <View style={{ ...styles.card, width: "80%", alignItems: "center" }}>
          <Text style={{ fontSize: 8, color: MUTED, marginBottom: 4, textTransform: "uppercase", letterSpacing: 2 }}>
            Current Rank
          </Text>
          <Text style={styles.rankBadge}>{data.rank.rank}</Text>
          <Text style={{ fontSize: 9, color: MUTED }}>
            Avg {data.rank.avgPctToStrong.toFixed(0)}% to Strong
          </Text>
        </View>

        <Text style={styles.coverDate}>{today}</Text>
        <Text style={{ ...styles.footer, position: "relative", bottom: undefined, left: undefined, right: undefined, marginTop: 24 }}>
          saate… only shinobi may read this scroll.
        </Text>
      </Page>

      {/* ── Summary Page ── */}
      <Page size="A4" style={styles.page}>
        <Text style={{ fontSize: 14, fontFamily: "Helvetica-Bold", color: ORANGE, marginBottom: 4 }}>
          PROGRESS SUMMARY
        </Text>
        <Text style={{ fontSize: 9, color: MUTED, marginBottom: 16 }}>{today}</Text>

        {/* KPI strip */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Weight</Text>
            <Text style={{ ...styles.kpiValue, color: BLUE }}>
              {data.currentWeightKg != null ? `${data.currentWeightKg.toFixed(1)} kg` : "—"}
            </Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Goal</Text>
            <Text style={{ ...styles.kpiValue, color: GOLD }}>{goal} kg</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>To Go</Text>
            <Text style={{ ...styles.kpiValue, color: toGo != null && toGo <= 0 ? GREEN : ORANGE }}>
              {toGo != null ? `${Math.abs(toGo).toFixed(1)} kg` : "—"}
            </Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Skills</Text>
            <Text style={{ ...styles.kpiValue, color: ORANGE }}>
              {data.skillsAchieved}/{data.skillsTotal}
            </Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Rank</Text>
            <Text style={{ ...styles.kpiValue, color: ORANGE, fontSize: 9 }}>{data.rank.rank}</Text>
          </View>
        </View>

        {/* Lift table */}
        <Text style={styles.sectionTitle}>Strength Standards · 力</Text>
        <View style={styles.tableHeader}>
          {["Lift", "Best", "Strong", "% →S", "Advanced", "% →A"].map((h) => (
            <Text key={h} style={{ ...styles.thCell, flex: h === "Lift" ? 1.2 : 1 }}>{h}</Text>
          ))}
        </View>
        {data.lifts.map((lift) => (
          <View key={lift.lift} style={styles.tableRow}>
            <Text style={{ ...styles.tdCell, flex: 1.2, fontFamily: "Helvetica-Bold", color: ORANGE }}>
              {LIFT_LABELS[lift.lift]}
            </Text>
            <Text style={{ ...styles.tdCell, flex: 1 }}>
              {lift.bestKg > 0 ? `${lift.bestKg.toFixed(1)} kg` : "—"}
            </Text>
            <Text style={{ ...styles.tdCell, flex: 1 }}>{lift.strongTarget} kg</Text>
            <Text style={{ ...styles.tdCell, flex: 1, color: lift.pctToStrong >= 100 ? GREEN : TEXT }}>
              {lift.pctToStrong.toFixed(0)}%
            </Text>
            <Text style={{ ...styles.tdCell, flex: 1 }}>{lift.advancedTarget} kg</Text>
            <Text style={{ ...styles.tdCell, flex: 1, color: lift.pctToAdvanced >= 100 ? GOLD : TEXT }}>
              {lift.pctToAdvanced.toFixed(0)}%
            </Text>
          </View>
        ))}

        {/* Bar visualization */}
        <Text style={{ ...styles.sectionTitle, marginTop: 12 }}>Progress Visualization</Text>
        {data.lifts.map((lift) => (
          <View key={lift.lift} style={{ marginBottom: 6 }}>
            <View style={styles.row}>
              <Text style={{ fontSize: 8, color: MUTED, width: 60 }}>{LIFT_LABELS[lift.lift]}</Text>
              <Text style={{ fontSize: 8, color: ORANGE, width: 40 }}>{lift.pctToStrong.toFixed(0)}%</Text>
              <View style={{ flex: 1 }}>
                <BarViz pct={Math.min(lift.pctToStrong, 100)} color={ORANGE} />
              </View>
            </View>
          </View>
        ))}

        {/* Running totals */}
        <Text style={styles.sectionTitle}>Running · 走</Text>
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Sessions</Text>
            <Text style={{ ...styles.kpiValue, color: GREEN }}>{data.runningTotals.sessionsTotal}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Total km</Text>
            <Text style={{ ...styles.kpiValue, color: GREEN }}>{data.runningTotals.kmTotal.toFixed(1)}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Hours</Text>
            <Text style={{ ...styles.kpiValue, color: BLUE }}>
              {(data.runningTotals.minutesTotal / 60).toFixed(1)}
            </Text>
          </View>
        </View>

        {/* Mobility */}
        {data.latestMobility && (
          <>
            <Text style={styles.sectionTitle}>Mobility · 柔</Text>
            <View style={styles.card}>
              {[
                ["Front Split Gap", data.latestMobility.frontSplitGapCm != null ? `${data.latestMobility.frontSplitGapCm} cm` : "—"],
                ["Wall HS Hold",    data.latestMobility.wallHsHoldS != null    ? `${data.latestMobility.wallHsHoldS}s`         : "—"],
                ["Free HS Hold",    data.latestMobility.freestandingHsHoldS != null ? `${data.latestMobility.freestandingHsHoldS}s / 60s` : "—"],
                ["L-Sit Hold",      data.latestMobility.lsitHoldS != null      ? `${data.latestMobility.lsitHoldS}s / 10s`     : "—"],
              ].map(([label, value]) => (
                <View key={label} style={styles.row}>
                  <Text style={styles.label}>{label}</Text>
                  <Text style={styles.value}>{value}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Skills */}
        <Text style={styles.sectionTitle}>Skill Checkpoints · 技</Text>
        <View style={styles.row}>
          <Text style={{ fontSize: 9, color: MUTED }}>Achieved: </Text>
          <Text style={{ fontSize: 9, color: GREEN, fontFamily: "Helvetica-Bold" }}>
            {data.skillsAchieved}/{data.skillsTotal}
          </Text>
        </View>

        <Text style={styles.footer}>
          Shinobi Training · Private · {today} · "ikuzo."
        </Text>
      </Page>
    </Document>
  );
}
