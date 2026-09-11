"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/session";
import { scoreInputSchema, teamSummarySchema } from "@/types/schemas";
import { createDisputePendingNotification } from "@/server/notify";
import { listPeriods } from "@/server/periods";

async function requireLead(projectId: string) {
  const user = await requireSessionUser();
  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  });
  const isLead =
    membership?.role === "lead" ||
    user.role === "ADMIN" ||
    user.role === "LEAD";
  if (!isLead) throw new Error("เฉพาะหัวหน้าโปรเจกต์เท่านั้น");
  return user;
}

export async function saveScore(input: {
  projectId: string;
  userId: string;
  value: number;
  reason: string;
  evidenceEventId?: string;
}) {
  await requireLead(input.projectId);
  const parsed = scoreInputSchema.parse(input);

  const score = await prisma.score.create({
    data: {
      projectId: parsed.projectId,
      userId: parsed.userId,
      value: parsed.value,
      reason: parsed.reason,
      evidenceEventId: parsed.evidenceEventId,
      suggestedBy: "LEAD",
      confirmed: false,
    },
    include: {
      user: { select: { name: true } },
      evidenceEvent: true,
    },
  });

  revalidatePath(`/projects/${parsed.projectId}/evaluation`);
  return score;
}

export async function confirmScore(scoreId: string, projectId: string) {
  await requireLead(projectId);
  await prisma.score.update({
    where: { id: scoreId },
    data: { confirmed: true },
  });
  revalidatePath(`/projects/${projectId}/evaluation`);
}

export async function saveTeamSummary(input: {
  projectId: string;
  content: string;
  periodStart: Date;
  periodEnd: Date;
}) {
  await requireLead(input.projectId);
  const parsed = teamSummarySchema.parse(input);

  const summary = await prisma.teamSummary.create({
    data: parsed,
  });

  revalidatePath(`/projects/${parsed.projectId}/evaluation`);
  return summary;
}

/** เรียก Gemini สรุปทีมจากหลักฐานล่าสุด แล้วบันทึก TeamSummary */
export async function generateAndSaveTeamSummary(projectId: string) {
  await requireLead(projectId);

  const { summarizeProjectStatus, isGeminiConfigured } = await import(
    "@/lib/gemini"
  );
  if (!isGeminiConfigured()) {
    throw new Error("ยังไม่ได้ตั้งค่า GEMINI_API_KEY");
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { name: true, description: true },
  });
  if (!project) throw new Error("ไม่พบโปรเจกต์");

  const evidence = await prisma.evidenceEvent.findMany({
    where: { projectId },
    orderBy: { occurredAt: "desc" },
    take: 20,
    include: {
      actor: { select: { name: true } },
      scores: { select: { value: true }, take: 1 },
    },
  });

  const dailyLogs = evidence.map((e) => ({
    date: e.occurredAt.toISOString().slice(0, 10),
    summary: `${e.actor.name}: ${e.action}`,
    meritScore: e.scores[0]?.value ?? 0,
  }));

  const result = await summarizeProjectStatus(
    project.name,
    project.description || "",
    dailyLogs
  );

  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 7);

  const content = [
    result.executiveSummary,
    "",
    "ข้อเสนอแนะ:",
    ...(result.recommendations || []).map((r) => `- ${r}`),
  ].join("\n");

  return saveTeamSummary({
    projectId,
    content,
    periodStart: start,
    periodEnd: end,
  });
}

export async function createDispute(input: {
  projectId: string;
  userId: string;
  reason: string;
  scoreId?: string;
}) {
  const user = await requireSessionUser();
  if (user.id !== input.userId && user.role !== "ADMIN") {
    throw new Error("สร้างข้อโต้แย้งได้เฉพาะของตนเอง");
  }

  const dispute = await prisma.dispute.create({
    data: {
      projectId: input.projectId,
      userId: input.userId,
      reason: input.reason,
      scoreId: input.scoreId,
      status: "PENDING",
    },
  });

  await createDisputePendingNotification(
    input.projectId,
    `มีข้อโต้แย้งใหม่: ${input.reason}`
  );

  revalidatePath(`/projects/${input.projectId}/evaluation`);
  revalidatePath(`/projects/${input.projectId}/notifications`);
  return dispute;
}

export async function resolveDispute(disputeId: string, projectId: string) {
  await requireLead(projectId);
  await prisma.dispute.update({
    where: { id: disputeId },
    data: { status: "RESOLVED", resolvedAt: new Date() },
  });
  revalidatePath(`/projects/${projectId}/evaluation`);
}

export async function rejectDispute(disputeId: string, projectId: string) {
  await requireLead(projectId);
  await prisma.dispute.update({
    where: { id: disputeId },
    data: { status: "REJECTED", resolvedAt: new Date() },
  });
  revalidatePath(`/projects/${projectId}/evaluation`);
}

/** แจ้งข้อโต้แย้งค้างเกิน 72 ชม. */
export async function flagStaleDisputes(projectId: string) {
  const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000);
  const stale = await prisma.dispute.findMany({
    where: {
      projectId,
      status: "PENDING",
      createdAt: { lte: cutoff },
    },
  });

  for (const d of stale) {
    await createDisputePendingNotification(
      projectId,
      `ข้อโต้แย้งค้างเกิน 72 ชั่วโมง: ${d.reason}`
    );
  }
  return stale.length;
}

export async function getEvaluationData(projectId: string) {
  const [scores, summaries, disputes, members, periods] = await Promise.all([
    prisma.score.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true } },
        evidenceEvent: true,
        milestone: { select: { id: true, name: true } },
        kpi: { select: { id: true, name: true } },
      },
    }),
    prisma.teamSummary.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.dispute.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } } },
    }),
    prisma.projectMember.findMany({
      where: { projectId },
      include: { user: { select: { id: true, name: true } } },
    }),
    listPeriods(projectId),
  ]);

  return { scores, summaries, disputes, members, periods };
}

export async function getScoreTemplateHint(action: string): Promise<{
  suggestedValue: number;
  reason: string;
}> {
  const lower = action.toLowerCase();
  if (
    lower.includes("รับทราบ") ||
    lower.includes("ขอบคุณ") ||
    lower === "โอเค"
  ) {
    return {
      suggestedValue: 1,
      reason: "ข้อความตอบรับทั่วไป ไม่มีการทำงานเพิ่ม",
    };
  }
  if (lower.includes("แก้") || lower.includes("bug") || lower.includes("ปัญหา")) {
    return {
      suggestedValue: 8,
      reason: "มีการแก้ปัญหาที่มีผลต่องาน",
    };
  }
  return {
    suggestedValue: 5,
    reason: "งานระดับปานกลาง — ควรผูกกับ Milestone/KPI",
  };
}
