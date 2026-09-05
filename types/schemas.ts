import { z } from "zod";

/** แหล่งข้อมูลที่รับได้ — ห้าม private_message */
export const evidenceSourceSchema = z.enum([
  "WORK_ITEM",
  "COMMENT",
  "DOCUMENT",
  "STATUS_UPDATE",
]);

export type EvidenceSource = z.infer<typeof evidenceSourceSchema>;

export const createEvidenceSchema = z.object({
  projectId: z.string().min(1),
  actorId: z.string().min(1),
  action: z.string().min(1).max(2000),
  source: evidenceSourceSchema,
  occurredAt: z.coerce.date().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateEvidenceInput = z.infer<typeof createEvidenceSchema>;

export const notificationTypeSchema = z.enum([
  "WEEKLY_DIGEST",
  "GAMING_FLAG",
  "DISPUTE_PENDING",
]);

export type NotificationType = z.infer<typeof notificationTypeSchema>;

export const workItemStatusSchema = z.enum([
  "TODO",
  "IN_PROGRESS",
  "DONE",
  "BLOCKED",
]);

export const createWorkItemSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  status: workItemStatusSchema.optional(),
});

export const updateWorkItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  status: workItemStatusSchema.optional(),
});

export const createDocumentSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1).max(200),
  url: z.string().url(),
});

export const createCommentSchema = z.object({
  projectId: z.string().min(1),
  actorId: z.string().min(1),
  content: z.string().min(1).max(2000),
});

export const scoreInputSchema = z.object({
  projectId: z.string().min(1),
  userId: z.string().min(1),
  value: z.number().int().min(0).max(10),
  reason: z.string().min(1).max(2000),
  evidenceEventId: z.string().optional(),
});

export const teamSummarySchema = z.object({
  projectId: z.string().min(1),
  content: z.string().min(1).max(5000),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
});

/** ปฏิเสธข้อความส่วนตัว — ใช้ตรวจฝั่งเซิร์ฟเวอร์ */
export function assertNotPrivateSource(source: string): void {
  const forbidden = ["private_message", "dm", "direct_message", "PRIVATE_MESSAGE"];
  if (forbidden.includes(source) || forbidden.includes(source.toLowerCase())) {
    throw new Error("ไม่รับข้อความส่วนตัว — เก็บได้เฉพาะพื้นที่โปรเจกต์ส่วนรวม");
  }
}

export const WORK_ITEM_STATUS_LABELS: Record<string, string> = {
  TODO: "รอทำ",
  IN_PROGRESS: "กำลังทำ",
  DONE: "เสร็จแล้ว",
  BLOCKED: "ติดขัด",
};

export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  WEEKLY_DIGEST: "สรุปงานรายสัปดาห์",
  GAMING_FLAG: "สัญญาณปั่นคะแนน",
  DISPUTE_PENDING: "ข้อโต้แย้งที่ยังไม่ปิด",
};

export const EVIDENCE_SOURCE_LABELS: Record<string, string> = {
  WORK_ITEM: "งาน",
  COMMENT: "ความเห็น",
  DOCUMENT: "เอกสาร",
  STATUS_UPDATE: "อัปเดตสถานะ",
};

export const createInviteSchema = z.object({
  projectId: z.string().min(1),
  email: z.string().email().transform((v) => v.trim().toLowerCase()),
  role: z.enum(["member", "lead"]).default("member"),
});

export type CreateInviteInput = z.infer<typeof createInviteSchema>;

export const INVITE_COOKIE_NAME = "arween_invite_token";
export const INVITE_EXPIRY_DAYS = 7;
