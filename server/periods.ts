"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/session";
import { runAgent2 } from "@/server/agents/agent2";
import { createWeeklyDigest } from "@/server/notify";

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
    throw new Error("เฉพาะหัวหน้าโปรเจกต์เท่านั้น");
  }
  return user;
}

export async function getOpenPeriod(projectId: string) {
  return prisma.evaluationPeriod.findFirst({
    where: { projectId, status: "OPEN" },
    orderBy: { periodStart: "desc" },
    include: {
      shares: {
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });
}

export async function listPeriods(projectId: string) {
  return prisma.evaluationPeriod.findMany({
    where: { projectId },
    orderBy: { periodStart: "desc" },
    include: {
      shares: {
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });
}

/** ปิดรอบ → Agent 2 คำนวณสัดส่วน 100% จากคะแนนที่ยืนยันแล้วและไม่ถูก flag */
export async function closeEvaluationPeriod(periodId: string) {
  const period = await prisma.evaluationPeriod.findUnique({
    where: { id: periodId },
  });
  if (!period) throw new Error("ไม่พบรอบประเมิน");
  if (period.status === "CLOSED") throw new Error("รอบนี้ปิดแล้ว");

  const user = await requireLead(period.projectId);

  const scores = await prisma.score.findMany({
    where: {
      evaluationPeriodId: periodId,
      flagged: false,
      confirmed: true,
    },
  });

  const byUser = new Map<string, number>();
  for (const s of scores) {
    byUser.set(s.userId, (byUser.get(s.userId) || 0) + s.value);
  }

  const contributions = runAgent2(
    Array.from(byUser.entries()).map(([userId, impactSum]) => ({
      userId,
      impactSum,
    }))
  );

  await prisma.$transaction([
    prisma.contributionShare.deleteMany({ where: { periodId } }),
    ...contributions.map((c) =>
      prisma.contributionShare.create({
        data: {
          periodId,
          userId: c.userId,
          ratioPercent: c.ratioPercent,
          impactSum: c.impactSum,
          confirmed: false,
        },
      })
    ),
    prisma.evaluationPeriod.update({
      where: { id: periodId },
      data: {
        status: "CLOSED",
        closedAt: new Date(),
        closedById: user.id,
      },
    }),
  ]);

  // เปิดรอบใหม่สัปดาห์ถัดไป
  const nextStart = new Date(period.periodEnd);
  nextStart.setDate(nextStart.getDate() + 1);
  nextStart.setHours(0, 0, 0, 0);
  const nextEnd = new Date(nextStart);
  nextEnd.setDate(nextEnd.getDate() + 6);
  nextEnd.setHours(23, 59, 59, 999);

  await prisma.evaluationPeriod.create({
    data: {
      projectId: period.projectId,
      periodStart: nextStart,
      periodEnd: nextEnd,
      status: "OPEN",
    },
  });

  const totalRatio = contributions.reduce((s, c) => s + c.ratioPercent, 0);
  await createWeeklyDigest(
    period.projectId,
    `ปิดรอบประเมินแล้ว — สัดส่วนผลงานรวม ${totalRatio.toFixed(2)}% จากสมาชิก ${contributions.length} คน (รอหัวหน้ายืนยันสัดส่วน)`
  );

  revalidatePath(`/projects/${period.projectId}/evaluation`);
  revalidatePath(`/projects/${period.projectId}/notifications`);
  revalidatePath(`/projects/${period.projectId}`);

  return contributions;
}

export async function confirmContributionShares(periodId: string) {
  const period = await prisma.evaluationPeriod.findUnique({
    where: { id: periodId },
  });
  if (!period) throw new Error("ไม่พบรอบประเมิน");
  await requireLead(period.projectId);

  await prisma.contributionShare.updateMany({
    where: { periodId },
    data: { confirmed: true },
  });

  await prisma.evaluationPeriod.update({
    where: { id: periodId },
    data: { meritStatus: "DRAFT" },
  });

  revalidatePath(`/projects/${period.projectId}/evaluation`);
}

/** อนุมัติเคสผลตอบแทนจากสัดส่วนที่ยืนยันแล้ว — ยังไม่จ่ายเงินอัตโนมัติ */
export async function approveMeritCase(periodId: string) {
  const period = await prisma.evaluationPeriod.findUnique({
    where: { id: periodId },
    include: { shares: true },
  });
  if (!period) throw new Error("ไม่พบรอบประเมิน");
  await requireLead(period.projectId);

  if (period.status !== "CLOSED") {
    throw new Error("ต้องปิดรอบก่อนอนุมัติเคสผลตอบแทน");
  }
  if (period.shares.length === 0) {
    throw new Error("ยังไม่มีสัดส่วนผลงานในรอบนี้");
  }
  if (period.shares.some((s) => !s.confirmed)) {
    throw new Error("ต้องยืนยันสัดส่วนทั้งหมดก่อนอนุมัติเคส");
  }

  await prisma.evaluationPeriod.update({
    where: { id: periodId },
    data: {
      meritStatus: "APPROVED",
      meritApprovedAt: new Date(),
    },
  });

  revalidatePath(`/projects/${period.projectId}/evaluation`);
}

/** สร้าง CSV ของ ContributionShare ที่ยืนยันแล้ว (Merit export v1) */
export async function buildConfirmedSharesCsv(periodId: string) {
  const user = await requireSessionUser();
  const period = await prisma.evaluationPeriod.findUnique({
    where: { id: periodId },
    include: {
      shares: {
        include: { user: { select: { name: true, email: true } } },
        orderBy: { ratioPercent: "desc" },
      },
      project: { select: { id: true, name: true } },
    },
  });
  if (!period) throw new Error("ไม่พบรอบประเมิน");

  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId: period.projectId,
        userId: user.id,
      },
    },
  });
  if (
    !membership &&
    user.role !== "ADMIN" &&
    user.role !== "LEAD"
  ) {
    throw new Error("คุณไม่ใช่สมาชิกของโปรเจกต์นี้");
  }

  const confirmed = period.shares.filter((s) => s.confirmed);
  if (confirmed.length === 0) {
    throw new Error("ยังไม่มีสัดส่วนที่ยืนยันแล้วสำหรับ export");
  }

  const header = [
    "projectId",
    "projectName",
    "periodId",
    "periodStart",
    "periodEnd",
    "meritStatus",
    "userName",
    "userEmail",
    "ratioPercent",
    "impactSum",
    "confirmed",
  ];
  const rows = confirmed.map((s) =>
    [
      period.project.id,
      period.project.name,
      period.id,
      period.periodStart.toISOString(),
      period.periodEnd.toISOString(),
      period.meritStatus,
      s.user.name,
      s.user.email,
      s.ratioPercent.toFixed(2),
      s.impactSum.toFixed(2),
      String(s.confirmed),
    ]
      .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
      .join(",")
  );

  return {
    filename: `arween-merit-${period.projectId}-${period.id}.csv`,
    csv: [header.join(","), ...rows].join("\n"),
    projectId: period.projectId,
  };
}

export async function confirmAllPeriodScores(periodId: string) {
  const period = await prisma.evaluationPeriod.findUnique({
    where: { id: periodId },
  });
  if (!period) throw new Error("ไม่พบรอบประเมิน");
  await requireLead(period.projectId);

  await prisma.score.updateMany({
    where: { evaluationPeriodId: periodId, flagged: false },
    data: { confirmed: true },
  });

  revalidatePath(`/projects/${period.projectId}/evaluation`);
}
