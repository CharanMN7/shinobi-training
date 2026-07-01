/* Strength standards engine — all math lives here, never on the client */

export type LiftKey = "squat" | "deadlift" | "bench" | "ohp" | "pullup";

export type NinjaRank =
  | "Academy Student"
  | "Genin"
  | "Chūnin"
  | "Jōnin"
  | "ANBU"
  | "Kage";

export interface LiftRatios {
  strong: number;
  advanced: number;
}

/* Standard ratios × bodyweight (pull-up = added weight) */
export const LIFT_RATIOS: Record<LiftKey, LiftRatios> = {
  squat:    { strong: 1.50, advanced: 2.00 },
  deadlift: { strong: 2.00, advanced: 2.50 },
  bench:    { strong: 1.25, advanced: 1.50 },
  ohp:      { strong: 0.75, advanced: 1.00 },
  pullup:   { strong: 0.25, advanced: 0.50 },
};

export const LIFT_LABELS: Record<LiftKey, string> = {
  squat:    "Squat",
  deadlift: "Deadlift",
  bench:    "Bench",
  ohp:      "OHP",
  pullup:   "Pull-up",
};

/* Round to nearest 2.5 kg */
function round2_5(kg: number) {
  return Math.round(kg / 2.5) * 2.5;
}

export function getLiftTargets(lift: LiftKey, goalWeightKg: number) {
  const r = LIFT_RATIOS[lift];
  return {
    strong:   round2_5(goalWeightKg * r.strong),
    advanced: round2_5(goalWeightKg * r.advanced),
  };
}

export function getPctToTarget(best: number, target: number): number {
  if (target <= 0) return 0;
  return (best / target) * 100;
}

/* Upper = bench / ohp / pullup; Lower = squat / deadlift */
export const UPPER_LIFTS: LiftKey[] = ["bench", "ohp", "pullup"];
export const LOWER_LIFTS: LiftKey[] = ["squat", "deadlift"];
export const OVERLOAD_STEP: Record<"upper" | "lower", number> = {
  upper: 2.5,
  lower: 5.0,
};

export function getOverloadStep(lift: LiftKey): number {
  return UPPER_LIFTS.includes(lift) ? OVERLOAD_STEP.upper : OVERLOAD_STEP.lower;
}

/* Ninja rank from per-lift stats */
export interface LiftStat {
  lift: LiftKey;
  bestKg: number;
  pctToStrong: number;   // 0–∞ (can exceed 100)
  pctToAdvanced: number;
  strongTarget: number;
  advancedTarget: number;
}

export function computeNinjaRank(lifts: LiftStat[]): {
  rank: NinjaRank;
  avgPctToStrong: number;
  allAtStrong: boolean;
  allAtAdvanced: boolean;
} {
  if (lifts.length === 0) {
    return { rank: "Academy Student", avgPctToStrong: 0, allAtStrong: false, allAtAdvanced: false };
  }

  const avgPctToStrong =
    lifts.reduce((sum, l) => sum + Math.min(l.pctToStrong, 100), 0) / lifts.length;

  const allAtStrong   = lifts.every((l) => l.pctToStrong >= 100);
  const allAtAdvanced = lifts.every((l) => l.pctToAdvanced >= 100);

  let rank: NinjaRank;
  if (allAtAdvanced) {
    rank = "Kage";
  } else if (allAtStrong) {
    rank = "ANBU";
  } else if (avgPctToStrong >= 80) {
    rank = "Jōnin";
  } else if (avgPctToStrong >= 60) {
    rank = "Chūnin";
  } else if (avgPctToStrong >= 40) {
    rank = "Genin";
  } else {
    rank = "Academy Student";
  }

  return { rank, avgPctToStrong, allAtStrong, allAtAdvanced };
}

export function computeLiftRank(pctToStrong: number, pctToAdvanced: number): NinjaRank {
  if (pctToAdvanced >= 100) return "Kage";
  if (pctToStrong >= 100)   return "ANBU";
  if (pctToStrong >= 80)    return "Jōnin";
  if (pctToStrong >= 60)    return "Chūnin";
  if (pctToStrong >= 40)    return "Genin";
  return "Academy Student";
}

export const RANK_CONFIG: Record<
  NinjaRank,
  { color: string; bgClass: string; textClass: string; glowClass: string; label: string }
> = {
  "Academy Student": {
    color: "#A1A6AD",
    bgClass: "bg-[#2A2D31]",
    textClass: "text-[#A1A6AD]",
    glowClass: "",
    label: "Academy Student",
  },
  Genin: {
    color: "#3B82F6",
    bgClass: "bg-[#1e3a5f]",
    textClass: "text-[#3B82F6]",
    glowClass: "chakra-glow-blue",
    label: "Genin",
  },
  "Chūnin": {
    color: "#2F9E44",
    bgClass: "bg-[#1a3d26]",
    textClass: "text-[#2F9E44]",
    glowClass: "chakra-glow-green",
    label: "Chūnin",
  },
  "Jōnin": {
    color: "#F4C20D",
    bgClass: "bg-[#3d3100]",
    textClass: "text-[#F4C20D]",
    glowClass: "chakra-glow-gold",
    label: "Jōnin",
  },
  ANBU: {
    color: "#F97316",
    bgClass: "bg-[#3d1a00]",
    textClass: "text-[#F97316]",
    glowClass: "chakra-glow-orange",
    label: "ANBU",
  },
  Kage: {
    color: "#E63946",
    bgClass: "bg-[#3d0a0e]",
    textClass: "text-[#E63946]",
    glowClass: "chakra-glow-red",
    label: "Kage",
  },
};

/* Skill ladder ordered by difficulty */
export type SkillKey =
  | "rolls_cartwheel"
  | "handstand_2h"
  | "handstand_pushup"
  | "pistol_squat"
  | "lsit_planche"
  | "front_split"
  | "middle_split"
  | "windmill"
  | "backflip"
  | "front_flip"
  | "one_arm_handstand";

export const SKILL_ORDER: SkillKey[] = [
  "rolls_cartwheel",
  "handstand_2h",
  "handstand_pushup",
  "pistol_squat",
  "lsit_planche",
  "front_split",
  "middle_split",
  "windmill",
  "backflip",
  "front_flip",
  "one_arm_handstand",
];

export const SKILL_LABELS: Record<SkillKey, { name: string; coached?: boolean; progression: string }> = {
  rolls_cartwheel:  { name: "Rolls & Cartwheel",       progression: "Forward roll → backward roll → side cartwheel → one-arm cartwheel" },
  handstand_2h:     { name: "2-Hand Handstand",        progression: "Wall hold → chest-to-wall → freestanding kick-up → 10 s → 30 s → 60 s" },
  handstand_pushup: { name: "Handstand Push-up",       progression: "Pike push-up → wall HSPU negatives → wall HSPU → freestanding HSPU" },
  pistol_squat:     { name: "Pistol Squat",            progression: "Assisted pistol → elevated heel → full depth → 5×5 each leg" },
  lsit_planche:     { name: "L-sit → Planche",        progression: "Parallel bar L-sit 10 s → floor L-sit → tuck planche → straddle planche" },
  front_split:      { name: "Front Split",             progression: "Active flexiblity drills → 10 cm gap → 5 cm → full split" },
  middle_split:     { name: "Middle Split",            progression: "Active hip opener drills → 15 cm gap → 5 cm → full middle split" },
  windmill:         { name: "Windmill",                progression: "Hip hinge → windmill with KB → full range → windmill + press" },
  backflip:         { name: "Backflip",  coached: true, progression: "Coached on mats: tuck jump → mini tramp backflip → spot on floor → unspotted" },
  front_flip:       { name: "Front Flip", coached: true, progression: "Coached on mats: forward dive roll → mini tramp front flip → spot → unspotted" },
  one_arm_handstand:{ name: "One-Arm Handstand",      progression: "2H HS 60 s solid → shifted weight → one arm lean → tuck OAH → full OAH" },
};

/* Progressive overload prompt logic */
export function shouldSuggestOverload(
  reps: number,
  rpe: number | null,
  repTarget: { min: number; max: number } = { min: 3, max: 5 }
): boolean {
  const cleanRpe = rpe == null || rpe <= 8;
  return reps >= repTarget.max && cleanRpe;
}
