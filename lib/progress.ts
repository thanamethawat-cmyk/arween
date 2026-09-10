import { prisma } from "@/lib/prisma";

export type AnchorTree = {
  id: string;
  weight: number;
  milestones: {
    id: string;
    weight: number;
    status: string;
    kpis: { id: string; weight: number; status: string }[];
  }[];
}[];

/** คำนวณความคืบหน้าจากน้ำหนักแผนงาน (KPI เป็นใบ; ถ้าไม่มี KPI ใช้ Milestone) */
export function computeProgressFromAnchors(objectives: AnchorTree): number {
  let achieved = 0;
  let total = 0;

  for (const objective of objectives) {
    const objShare = objective.weight / 100;
    for (const milestone of objective.milestones) {
      const msShare = objShare * (milestone.weight / 100);
      if (milestone.kpis.length === 0) {
        total += msShare * 100;
        if (milestone.status === "ACHIEVED") {
          achieved += msShare * 100;
        }
        continue;
      }
      for (const kpi of milestone.kpis) {
        const leaf = msShare * (kpi.weight / 100) * 100;
        total += leaf;
        if (kpi.status === "ACHIEVED") {
          achieved += leaf;
        }
      }
    }
  }

  if (total <= 0) return 0;
  return Math.round(Math.min(100, Math.max(0, (achieved / total) * 100)) * 100) / 100;
}

export async function recomputeProjectProgress(projectId: string): Promise<number> {
  const objectives = await prisma.objective.findMany({
    where: { projectId },
    include: {
      milestones: {
        include: { kpis: true },
      },
    },
  });

  const progress = computeProgressFromAnchors(objectives);
  await prisma.project.update({
    where: { id: projectId },
    data: { progressPercent: progress },
  });
  return progress;
}

/** ตรวจว่าพี่น้องรวมน้ำหนัก = 100 */
export function assertWeightsSum100(weights: number[], label: string) {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (weights.length > 0 && sum !== 100) {
    throw new Error(`${label} ต้องมีค่าน้ำหนักรวมกันพอดี 100 (ตอนนี้ได้ ${sum})`);
  }
}

/** ปัดเศษสัดส่วนแบบ largest-remainder ให้รวม = 100 */
export function largestRemainderPercents(
  items: { id: string; value: number }[]
): { id: string; percent: number }[] {
  const total = items.reduce((s, i) => s + i.value, 0);
  if (total <= 0 || items.length === 0) return [];

  const raw = items.map((i) => {
    const exact = (i.value / total) * 100;
    const floor = Math.floor(exact * 100) / 100;
    return { id: i.id, floor, remainder: exact - floor };
  });

  let allocated = raw.reduce((s, r) => s + r.floor, 0);
  let remainingCents = Math.round((100 - allocated) * 100);

  const sorted = [...raw].sort((a, b) => b.remainder - a.remainder);
  const bump = new Map<string, number>();
  for (const row of sorted) {
    if (remainingCents <= 0) break;
    bump.set(row.id, 0.01);
    remainingCents -= 1;
  }

  return raw.map((r) => ({
    id: r.id,
    percent: Math.round((r.floor + (bump.get(r.id) || 0)) * 100) / 100,
  }));
}
