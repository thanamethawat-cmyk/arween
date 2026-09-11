import { largestRemainderPercents } from "@/lib/progress";

export type ImpactRow = {
  userId: string;
  impactSum: number;
};

export type ContributionRow = {
  userId: string;
  impactSum: number;
  ratioPercent: number;
};

/** Agent 2: แปลง Impact รวมเป็นสัดส่วน 100% (ไม่นับ flagged) */
export function runAgent2(rows: ImpactRow[]): ContributionRow[] {
  if (rows.length === 0) return [];

  // Deduplicate / aggregate by userId if duplicate userIds are provided
  const userMap = new Map<string, number>();
  for (const r of rows) {
    userMap.set(r.userId, (userMap.get(r.userId) || 0) + r.impactSum);
  }

  const aggregatedRows: ImpactRow[] = Array.from(userMap.entries()).map(
    ([userId, impactSum]) => ({ userId, impactSum })
  );

  const eligible = aggregatedRows.filter((r) => r.impactSum > 0);

  // If all members have 0 or negative impact, return 0.00% gracefully without crashing
  if (eligible.length === 0) {
    return aggregatedRows.map((r) => ({
      userId: r.userId,
      impactSum: Math.max(0, r.impactSum),
      ratioPercent: 0,
    }));
  }

  const percents = largestRemainderPercents(
    eligible.map((r) => ({ id: r.userId, value: r.impactSum }))
  );

  const percentMap = new Map<string, number>();
  for (const p of percents) {
    percentMap.set(p.id, p.percent);
  }

  return aggregatedRows.map((r) => ({
    userId: r.userId,
    impactSum: Math.max(0, r.impactSum),
    ratioPercent: percentMap.get(r.userId) ?? 0,
  }));
}
