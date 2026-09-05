"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { scoreInputSchema, teamSummarySchema } from "@/types/schemas";
import { createDisputePendingNotification } from "@/server/notify";

export async function saveScore(input: {
  projectId: string;
  userId: string;
  value: number;
  reason: string;
  evidenceEventId?: string;
}) {
  const parsed = scoreInputSchema.parse(input);

  const score = await prisma.score.create({
    data: {
      projectId: parsed.projectId,
      userId: parsed.userId,
      value: parsed.value,
      reason: parsed.reason,
      evidenceEventId: parsed.evidenceEventId,
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
  const parsed = teamSummarySchema.parse(input);

  const summary = await prisma.teamSummary.create({
    data: parsed,
  });

  revalidatePath(`/projects/${parsed.projectId}/evaluation`);
  return summary;
}

export async function createDispute(input: {
  projectId: string;
  userId: string;
  reason: string;
  scoreId?: string;
}) {
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

export async function getEvaluationData(projectId: string) {
  const [scores, summaries, disputes, members] = await Promise.all([
    prisma.score.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true } },
        evidenceEvent: true,
      },
    }),
    prisma.teamSummary.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.dispute.findMany({
      where: { projectId, status: "PENDING" },
      include: { user: { select: { name: true } } },
    }),
    prisma.projectMember.findMany({
      where: { projectId },
      include: { user: { select: { id: true, name: true } } },
    }),
  ]);

  return { scores, summaries, disputes, members };
}

/** ยังไม่เรียก Gemini — คืนรูปแบบคำตอบตามเกณฑ์ในเอกสาร */
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
      reason: "ข้อความตอบรับทั่วไป ไม่มีการทำงานเพิ่ม (ตามเกณฑ์ในเอกสาร)",
    };
  }
  if (lower.includes("แก้") || lower.includes("bug") || lower.includes("ปัญหา")) {
    return {
      suggestedValue: 8,
      reason: "มีการแก้ปัญหาที่มีผลต่องาน (ตามเกณฑ์ในเอกสาร — ยังไม่คิดคะแนนจริง)",
    };
  }
  return {
    suggestedValue: 5,
    reason: "งานระดับปานกลาง — กรุณาตรวจสอบและกรอกคะแนนด้วยตนเอง",
  };
}
