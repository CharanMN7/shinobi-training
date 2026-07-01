import { describe, it, expect } from "vitest";
import {
  getLiftTargets,
  getPctToTarget,
  computeNinjaRank,
  computeLiftRank,
  shouldSuggestOverload,
  LIFT_RATIOS,
  type LiftStat,
} from "../src/lib/engines";

describe("getLiftTargets", () => {
  it("rounds to nearest 2.5 kg", () => {
    const targets = getLiftTargets("squat", 80);
    // 80 * 1.5 = 120 — already a 2.5 multiple
    expect(targets.strong).toBe(120);
    // 80 * 2.0 = 160
    expect(targets.advanced).toBe(160);
  });

  it("pull-up ratios are lower than squat ratios", () => {
    const pullup = getLiftTargets("pullup", 80);
    const squat = getLiftTargets("squat", 80);
    expect(pullup.strong).toBeLessThan(squat.strong);
    expect(pullup.advanced).toBeLessThan(squat.advanced);
  });

  it("scales linearly with bodyweight", () => {
    const a = getLiftTargets("bench", 80);
    const b = getLiftTargets("bench", 160);
    expect(b.strong).toBeCloseTo(a.strong * 2, 0);
  });
});

describe("getPctToTarget", () => {
  it("returns 100 when best equals target", () => {
    expect(getPctToTarget(100, 100)).toBe(100);
  });

  it("returns 0 when target is 0", () => {
    expect(getPctToTarget(50, 0)).toBe(0);
  });

  it("can exceed 100 when best surpasses target", () => {
    expect(getPctToTarget(150, 100)).toBe(150);
  });

  it("returns correct fraction", () => {
    expect(getPctToTarget(75, 100)).toBe(75);
  });
});

describe("computeNinjaRank", () => {
  const stat = (pctToStrong: number, pctToAdvanced: number): LiftStat => ({
    lift: "squat",
    bestKg: 100,
    pctToStrong,
    pctToAdvanced,
    strongTarget: 120,
    advancedTarget: 160,
  });

  it("returns Academy Student for empty lifts", () => {
    const result = computeNinjaRank([]);
    expect(result.rank).toBe("Academy Student");
    expect(result.avgPctToStrong).toBe(0);
  });

  it("returns Kage when all lifts are at advanced", () => {
    const lifts: LiftStat[] = [
      stat(110, 110),
      stat(120, 105),
    ];
    expect(computeNinjaRank(lifts).rank).toBe("Kage");
  });

  it("returns ANBU when all at strong but not all at advanced", () => {
    const lifts: LiftStat[] = [
      stat(100, 80),
      stat(105, 85),
    ];
    expect(computeNinjaRank(lifts).rank).toBe("ANBU");
  });

  it("returns Jōnin when avg >= 80 but not all at strong", () => {
    const lifts: LiftStat[] = [
      stat(90, 60),
      stat(80, 50),
    ];
    expect(computeNinjaRank(lifts).rank).toBe("Jōnin");
  });

  it("returns Chūnin when avg >= 60", () => {
    const lifts: LiftStat[] = [stat(60, 40), stat(65, 45)];
    expect(computeNinjaRank(lifts).rank).toBe("Chūnin");
  });

  it("returns Genin when avg >= 40", () => {
    const lifts: LiftStat[] = [stat(40, 20), stat(45, 25)];
    expect(computeNinjaRank(lifts).rank).toBe("Genin");
  });

  it("returns Academy Student when avg < 40", () => {
    const lifts: LiftStat[] = [stat(10, 5), stat(20, 10)];
    expect(computeNinjaRank(lifts).rank).toBe("Academy Student");
  });
});

describe("computeLiftRank", () => {
  it("Kage at 100% advanced", () => {
    expect(computeLiftRank(110, 100)).toBe("Kage");
  });

  it("ANBU at 100% strong but < 100% advanced", () => {
    expect(computeLiftRank(100, 90)).toBe("ANBU");
  });

  it("Jōnin at 80% strong", () => {
    expect(computeLiftRank(80, 50)).toBe("Jōnin");
  });

  it("Chūnin at 60% strong", () => {
    expect(computeLiftRank(60, 30)).toBe("Chūnin");
  });

  it("Genin at 40% strong", () => {
    expect(computeLiftRank(40, 10)).toBe("Genin");
  });

  it("Academy Student below 40%", () => {
    expect(computeLiftRank(39, 10)).toBe("Academy Student");
  });
});

describe("shouldSuggestOverload", () => {
  it("suggests overload when reps at max and RPE <= 8", () => {
    expect(shouldSuggestOverload(5, 7)).toBe(true);
  });

  it("does not suggest overload when RPE > 8", () => {
    expect(shouldSuggestOverload(5, 9)).toBe(false);
  });

  it("does not suggest overload when reps below max", () => {
    expect(shouldSuggestOverload(4, 7)).toBe(false);
  });

  it("suggests overload with null RPE (bodyweight / unrated sets)", () => {
    expect(shouldSuggestOverload(5, null)).toBe(true);
  });

  it("uses custom rep target range", () => {
    expect(shouldSuggestOverload(8, 7, { min: 6, max: 8 })).toBe(true);
    expect(shouldSuggestOverload(7, 7, { min: 6, max: 8 })).toBe(false);
  });
});
