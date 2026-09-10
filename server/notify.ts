"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@/types/schemas";

export async function getNotificationsByProject(projectId: string) {
  return prisma.notification.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createNotification(input: {
  projectId: string;
  type: NotificationType;
  title: string;
  body: string;
}) {
  const notification = await prisma.notification.create({
    data: input,
  });

  revalidatePath(`/projects/${input.projectId}/notifications`);
  return notification;
}

export async function seedWeeklyDigest(projectId: string) {
  const evidenceCount = await prisma.evidenceEvent.count({
    where: { projectId },
  });
  const workDone = await prisma.workItem.count({
    where: { projectId, status: "DONE" },
  });

  return createNotification({
    projectId,
    type: "WEEKLY_DIGEST",
    title: "สรุปงานรายสัปดาห์",
    body: `สัปดาห์นี้มีหลักฐานการทำงาน ${evidenceCount} รายการ และงานที่เสร็จแล้ว ${workDone} รายการ`,
  });
}

export async function createWeeklyDigest(projectId: string, body: string) {
  return createNotification({
    projectId,
    type: "WEEKLY_DIGEST",
    title: "สรุปงานรายสัปดาห์ / ปิดรอบประเมิน",
    body,
  });
}

export async function createGamingFlag(projectId: string, detail: string) {
  return createNotification({
    projectId,
    type: "GAMING_FLAG",
    title: "สัญญาณสงสัยว่าปั่นคะแนน",
    body: detail,
  });
}

export async function createDisputePendingNotification(
  projectId: string,
  disputeReason: string
) {
  return createNotification({
    projectId,
    type: "DISPUTE_PENDING",
    title: "ข้อโต้แย้งที่ยังไม่ปิด",
    body: disputeReason,
  });
}

export async function markNotificationRead(id: string, projectId: string) {
  await prisma.notification.update({
    where: { id },
    data: { read: true },
  });
  revalidatePath(`/projects/${projectId}/notifications`);
}
