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

/**
 * บันทึกคะแนนใหม่โดยหัวหน้าทีม
 * ผูกกับ evaluationPeriodId ของรอบที่เปิดอยู่เสมอเพื่อไม่ให้คะแนนตกหล่น
 */
export async function saveScore(input: {
  projectId: string;
  userId: string;
  value: number;
  reason: string;
  evidenceEventId?: string;
}) {
  await requireLead(input.projectId);
  const parsed = scoreInputSchema.parse(input);

  // ค้นหารอบประเมินปัจจุบันที่เปิดอยู่ หรือสร้างรอบใหม่หากยังไม่มี
  let openPeriod = await prisma.evaluationPeriod.findFirst({
    where: { projectId: parsed.projectId, status: "OPEN" },
    orderBy: { periodStart: "desc" },
  });

  if (!openPeriod) {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    openPeriod = await prisma.evaluationPeriod.create({
      data: {
        projectId: parsed.projectId,
        periodStart: weekStart,
        periodEnd: weekEnd,
        status: "OPEN",
      },
    });
  }

  const score = await prisma.score.create({
    data: {
      projectId: parsed.projectId,
      userId: parsed.userId,
      value: parsed.value,
      reason: parsed.reason,
      evidenceEventId: parsed.evidenceEventId,
      evaluationPeriodId: openPeriod.id,
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

/**
 * แก้ไขคะแนน Impact โดยหัวหน้าทีม
 * ตรวจสอบสิทธิ์ lead, ตรวจสอบค่า 0 <= value <= 10, อัปเดต Score, บันทึก AuditLog
 */
export async function updateScore(
  scoreId: string,
  projectId: string,
  value: number,
  reason: string
) {
  const user = await requireLead(projectId);

  const numVal = Math.round(value);
  if (typeof value !== "number" || isNaN(value) || numVal < 0 || numVal > 10) {
    throw new Error("คะแนนต้องอยู่ระหว่าง 0 ถึง 10");
  }
  if (!reason || !reason.trim()) {
    throw new Error("กรุณาระบุเหตุผลการแก้ไขคะแนน");
  }

  const score = await prisma.score.update({
    where: { id: scoreId },
    data: {
      value: numVal,
      reason: reason.trim(),
    },
    include: {
      user: { select: { name: true } },
      evidenceEvent: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      projectId,
      actorId: user.id,
      action: "UPDATE_SCORE",
      details: `แก้ไขคะแนน ID ${scoreId} เป็น ${numVal}/10 เหตุผล: ${reason.trim()}`,
    },
  });

  revalidatePath(`/projects/${projectId}/evaluation`);
  return score;
}

/**
 * ปลดธง Anti-Gaming โดยหัวหน้าทีม
 * ตรวจสอบสิทธิ์ lead, เคลียร์ flagged และ flagReason, บันทึก AuditLog
 */
export async function dismissScoreFlag(
  scoreId: string,
  projectId: string,
  note?: string
) {
  const user = await requireLead(projectId);

  const score = await prisma.score.update({
    where: { id: scoreId },
    data: {
      flagged: false,
      flagReason: null,
    },
    include: {
      user: { select: { name: true } },
      evidenceEvent: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      projectId,
      actorId: user.id,
      action: "DISMISS_SCORE_FLAG",
      details: `ปลดธงคะแนน ID ${scoreId}${
        note && note.trim() ? ` หมายเหตุ: ${note.trim()}` : ""
      }`,
    },
  });

  revalidatePath(`/projects/${projectId}/evaluation`);
  return score;
}

export async function confirmScore(scoreId: string, projectId: string) {
  const user = await requireLead(projectId);
  const score = await prisma.score.update({
    where: { id: scoreId },
    data: { confirmed: true },
  });

  await prisma.auditLog.create({
    data: {
      projectId,
      actorId: user.id,
      action: "CONFIRM_SCORE",
      details: `หัวหน้ายืนยันคะแนน ID ${scoreId} (คะแนน: ${score.value}/10)`,
    },
  });

  revalidatePath(`/projects/${projectId}/evaluation`);
  return score;
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

/**
 * พิจารณารับข้อโต้แย้ง
 * ตรวจสอบสิทธิ์ lead, หากระบุ newScoreValue จะอัปเดต Score.value, ปลดธง และตั้ง confirmed=true
 * อัปเดต Dispute status='RESOLVED' และ resolvedAt=new Date(), บันทึก AuditLog
 */
export async function resolveDispute(
  disputeId: string,
  projectId: string,
  newScoreValue?: number,
  resolutionNote?: string
) {
  const user = await requireLead(projectId);

  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: { score: true },
  });
  if (!dispute) throw new Error("ไม่พบข้อโต้แย้ง");

  // หากมีการระบุคะแนนใหม่
  if (
    dispute.scoreId &&
    typeof newScoreValue === "number" &&
    !isNaN(newScoreValue)
  ) {
    const numVal = Math.round(newScoreValue);
    if (numVal < 0 || numVal > 10) {
      throw new Error("คะแนนต้องอยู่ระหว่าง 0 ถึง 10");
    }
    await prisma.score.update({
      where: { id: dispute.scoreId },
      data: {
        value: numVal,
        flagged: false,
        flagReason: null,
        confirmed: true,
      },
    });
  }

  const updatedDispute = await prisma.dispute.update({
    where: { id: disputeId },
    data: {
      status: "RESOLVED",
      resolvedAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      projectId,
      actorId: user.id,
      action: "RESOLVE_DISPUTE",
      details: `รับข้อโต้แย้ง ID ${disputeId}${
        typeof newScoreValue === "number"
          ? ` ปรับคะแนนเป็น ${Math.round(newScoreValue)}/10 (ปลดธงและยืนยัน)`
          : ""
      }${resolutionNote ? ` หมายเหตุ: ${resolutionNote.trim()}` : ""}`,
    },
  });

  revalidatePath(`/projects/${projectId}/evaluation`);
  revalidatePath(`/projects/${projectId}/notifications`);
  return updatedDispute;
}

/**
 * ปฏิเสธข้อโต้แย้ง
 * ตรวจสอบสิทธิ์ lead, อัปเดต Dispute status='REJECTED' และ resolvedAt=new Date(), บันทึก AuditLog
 */
export async function rejectDispute(
  disputeId: string,
  projectId: string,
  rejectionNote?: string
) {
  const user = await requireLead(projectId);

  const updatedDispute = await prisma.dispute.update({
    where: { id: disputeId },
    data: {
      status: "REJECTED",
      resolvedAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      projectId,
      actorId: user.id,
      action: "REJECT_DISPUTE",
      details: `ปฏิเสธข้อโต้แย้ง ID ${disputeId}${
        rejectionNote && rejectionNote.trim()
          ? ` เหตุผล: ${rejectionNote.trim()}`
          : ""
      }`,
    },
  });

  revalidatePath(`/projects/${projectId}/evaluation`);
  revalidatePath(`/projects/${projectId}/notifications`);
  return updatedDispute;
}

/**
 * แจ้งข้อโต้แย้งค้างเกิน 72 ชม.
 * มี Idempotency Guard เพื่อไม่ให้เกิดการแจ้งเตือนซ้ำซ้อนในทุกครั้งที่โหลดหน้าเว็บ
 */
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
    const bodyText = `ข้อโต้แย้งค้างเกิน 72 ชั่วโมง: ${d.reason}`;
    const existingNotif = await prisma.notification.findFirst({
      where: {
        projectId,
        type: "DISPUTE_PENDING",
        body: bodyText,
      },
    });

    if (!existingNotif) {
      await createDisputePendingNotification(projectId, bodyText);
    }
  }

  return stale.length;
}

/**
 * ดึงข้อมูลสำหรับการประเมินผลงาน
 * รวม disputes พร้อม user (name, email) และ score (include evidenceEvent)
 */
export async function getEvaluationData(projectId: string) {
  const [scores, summaries, disputesRaw, members, periods, auditLogs] =
    await Promise.all([
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
        include: {
          user: { select: { name: true, email: true } },
          score: {
            include: {
              evidenceEvent: true,
            },
          },
        },
      }),
      prisma.projectMember.findMany({
        where: { projectId },
        include: { user: { select: { id: true, name: true } } },
      }),
      listPeriods(projectId),
      prisma.auditLog.findMany({
        where: { projectId },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

  // แมป alias evidence ให้กับ score.evidenceEvent เพื่อรองรับการเข้าถึงทั้งสองรูปแบบ
  const disputes = disputesRaw.map((d) => ({
    ...d,
    score: d.score
      ? {
          ...d.score,
          evidence: d.score.evidenceEvent,
        }
      : null,
  }));

  return { scores, summaries, disputes, members, periods, auditLogs };
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
