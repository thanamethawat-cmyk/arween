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
  const eligible = rows.filter((r) => r.impactSum > 0);
  if (eligible.length === 0) return [];

  const percents = largestRemainderPercents(
    eligible.map((r) => ({ id: r.userId, value: r.impactSum }))
  );

  return percents.map((p) => {
    const row = eligible.find((r) => r.userId === p.id)!;
    return {
      userId: p.id,
      impactSum: row.impactSum,
      ratioPercent: p.percent,
    };
  });
}
