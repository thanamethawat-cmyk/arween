"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/session";
import {
  assertWeightsSum100,
  recomputeProjectProgress,
} from "@/lib/progress";
import { z } from "zod";

async function requireLead(projectId: string) {
  const user = await requireSessionUser();
  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  });
  const isLead =
    membership?.role === "lead" ||
    user.role === "ADMIN" ||
    user.role === "LEAD";
  if (!isLead) {
    throw new Error("เฉพาะหัวหน้าโปรเจกต์เท่านั้นที่แก้ไขแผนเป้าหมายได้");
  }
  return user;
}

const objectiveSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  weight: z.number().int().min(1).max(100).optional(),
});

export async function listAnchorPlan(projectId: string) {
  await requireSessionUser();
  return prisma.objective.findMany({
    where: { projectId },
    orderBy: { sortOrder: "asc" },
    include: {
      milestones: {
        orderBy: { sortOrder: "asc" },
        include: { kpis: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });
}

export async function hasMinimumAnchor(projectId: string) {
  const objectives = await prisma.objective.count({ where: { projectId } });
  if (objectives < 1) return false;
  const milestones = await prisma.milestone.count({
    where: { objective: { projectId } },
  });
  return milestones >= 1;
}

export async function createObjective(input: {
  projectId: string;
  name: string;
  description?: string;
  weight?: number;
}) {
  await requireLead(input.projectId);
  const parsed = objectiveSchema.parse(input);

  const existing = await prisma.objective.findMany({
    where: { projectId: parsed.projectId },
    select: { id: true },
  });

  const count = existing.length + 1;
  const base = Math.floor(100 / count);
  const remainder = 100 - base * count;
  const newWeight = base + remainder;

  const objective = await prisma.objective.create({
    data: {
      projectId: parsed.projectId,
      name: parsed.name.trim(),
      description: parsed.description?.trim() || null,
      weight: newWeight,
      sortOrder: existing.length,
    },
  });

  if (existing.length > 0) {
    await prisma.$transaction(
      existing.map((o) =>
        prisma.objective.update({ where: { id: o.id }, data: { weight: base } })
      )
    );
  }

  await recomputeProjectProgress(parsed.projectId);
  revalidatePath(`/projects/${parsed.projectId}`);
  revalidatePath(`/projects/${parsed.projectId}/plan`);
  return objective;
}

export async function createMilestone(input: {
  objectiveId: string;
  name: string;
  successCriteria: string;
  weight?: number;
}) {
  const objective = await prisma.objective.findUnique({
    where: { id: input.objectiveId },
  });
  if (!objective) throw new Error("ไม่พบวัตถุประสงค์");
  await requireLead(objective.projectId);

  const schema = z.object({
    objectiveId: z.string().min(1),
    name: z.string().min(1).max(200),
    successCriteria: z.string().min(1).max(2000),
    weight: z.number().int().min(1).max(100).optional(),
  });
  const parsed = schema.parse(input);

  const existing = await prisma.milestone.findMany({
    where: { objectiveId: parsed.objectiveId },
    select: { id: true },
  });
  const count = existing.length + 1;
  const base = Math.floor(100 / count);
  const remainder = 100 - base * count;
  const newWeight = base + remainder;

  const milestone = await prisma.milestone.create({
    data: {
      objectiveId: parsed.objectiveId,
      name: parsed.name.trim(),
      successCriteria: parsed.successCriteria.trim(),
      weight: newWeight,
      sortOrder: existing.length,
    },
  });

  if (existing.length > 0) {
    await prisma.$transaction(
      existing.map((m) =>
        prisma.milestone.update({ where: { id: m.id }, data: { weight: base } })
      )
    );
  }

  await recomputeProjectProgress(objective.projectId);
  revalidatePath(`/projects/${objective.projectId}/plan`);
  revalidatePath(`/projects/${objective.projectId}`);
  return milestone;
}

export async function createKpi(input: {
  milestoneId: string;
  name: string;
  unit: string;
  targetValue: number;
  weight?: number;
}) {
  const milestone = await prisma.milestone.findUnique({
    where: { id: input.milestoneId },
    include: { objective: true },
  });
  if (!milestone) throw new Error("ไม่พบงานส่งมอบ");
  await requireLead(milestone.objective.projectId);

  const schema = z.object({
    milestoneId: z.string().min(1),
    name: z.string().min(1).max(200),
    unit: z.string().min(1).max(50),
    targetValue: z.number(),
    weight: z.number().int().min(1).max(100).optional(),
  });
  const parsed = schema.parse(input);

  const existing = await prisma.kpi.findMany({
    where: { milestoneId: parsed.milestoneId },
    select: { id: true },
  });
  const count = existing.length + 1;
  const base = Math.floor(100 / count);
  const remainder = 100 - base * count;
  const newWeight = base + remainder;

  const kpi = await prisma.kpi.create({
    data: {
      milestoneId: parsed.milestoneId,
      name: parsed.name.trim(),
      unit: parsed.unit.trim(),
      targetValue: parsed.targetValue,
      weight: newWeight,
      sortOrder: existing.length,
    },
  });

  if (existing.length > 0) {
    await prisma.$transaction(
      existing.map((k) =>
        prisma.kpi.update({ where: { id: k.id }, data: { weight: base } })
      )
    );
  }

  await recomputeProjectProgress(milestone.objective.projectId);
  revalidatePath(`/projects/${milestone.objective.projectId}/plan`);
  revalidatePath(`/projects/${milestone.objective.projectId}`);
  return kpi;
}

export async function setMilestoneStatus(
  milestoneId: string,
  status: "NOT_STARTED" | "IN_PROGRESS" | "ACHIEVED" | "AT_RISK"
) {
  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId },
    include: { objective: true },
  });
  if (!milestone) throw new Error("ไม่พบงานส่งมอบ");
  await requireLead(milestone.objective.projectId);

  await prisma.milestone.update({
    where: { id: milestoneId },
    data: { status },
  });

  const progress = await recomputeProjectProgress(milestone.objective.projectId);
  revalidatePath(`/projects/${milestone.objective.projectId}/plan`);
  revalidatePath(`/projects/${milestone.objective.projectId}`);
  return progress;
}

export async function setKpiStatus(
  kpiId: string,
  status: "NOT_STARTED" | "IN_PROGRESS" | "ACHIEVED" | "AT_RISK",
  currentValue?: number
) {
  const kpi = await prisma.kpi.findUnique({
    where: { id: kpiId },
    include: { milestone: { include: { objective: true } } },
  });
  if (!kpi) throw new Error("ไม่พบตัวชี้วัด");
  await requireLead(kpi.milestone.objective.projectId);

  await prisma.kpi.update({
    where: { id: kpiId },
    data: {
      status,
      ...(typeof currentValue === "number" ? { currentValue } : {}),
    },
  });

  const progress = await recomputeProjectProgress(
    kpi.milestone.objective.projectId
  );
  revalidatePath(`/projects/${kpi.milestone.objective.projectId}/plan`);
  revalidatePath(`/projects/${kpi.milestone.objective.projectId}`);
  return progress;
}

export async function replaceObjectiveWeights(
  projectId: string,
  weights: { id: string; weight: number }[]
) {
  await requireLead(projectId);
  assertWeightsSum100(
    weights.map((w) => w.weight),
    "วัตถุประสงค์"
  );
  await prisma.$transaction(
    weights.map((w) =>
      prisma.objective.update({
        where: { id: w.id },
        data: { weight: w.weight },
      })
    )
  );
  await recomputeProjectProgress(projectId);
  revalidatePath(`/projects/${projectId}/plan`);
}
