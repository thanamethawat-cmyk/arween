"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  assertNotPrivateSource,
  createEvidenceSchema,
  createCommentSchema,
  type CreateEvidenceInput,
} from "@/types/schemas";

export async function recordEvidence(input: CreateEvidenceInput) {
  const parsed = createEvidenceSchema.parse(input);
  assertNotPrivateSource(parsed.source);

  const event = await prisma.evidenceEvent.create({
    data: {
      projectId: parsed.projectId,
      actorId: parsed.actorId,
      action: parsed.action,
      source: parsed.source,
      occurredAt: parsed.occurredAt ?? new Date(),
      metadata: parsed.metadata as any,
    },
    include: { actor: { select: { name: true } } },
  });

  revalidatePath(`/projects/${parsed.projectId}`);
  revalidatePath(`/projects/${parsed.projectId}/evidence`);

  return event;
}

export async function addComment(input: {
  projectId: string;
  actorId: string;
  content: string;
}) {
  const parsed = createCommentSchema.parse(input);

  return recordEvidence({
    projectId: parsed.projectId,
    actorId: parsed.actorId,
    action: parsed.content,
    source: "COMMENT",
  });
}

export async function getEvidenceByProject(projectId: string) {
  return prisma.evidenceEvent.findMany({
    where: { projectId },
    orderBy: { occurredAt: "desc" },
    include: {
      actor: { select: { id: true, name: true, email: true } },
    },
  });
}

/** ทดสอบว่าระบบปฏิเสธข้อความส่วนตัว */
export async function tryRecordPrivateMessage(projectId: string, actorId: string) {
  try {
    assertNotPrivateSource("private_message");
    return { ok: false, message: "ไม่ควรผ่านการตรวจ" };
  } catch (error) {
    return {
      ok: true,
      message:
        error instanceof Error
          ? error.message
          : "ไม่รับข้อความส่วนตัว — เก็บได้เฉพาะพื้นที่โปรเจกต์ส่วนรวม",
    };
  }
}
