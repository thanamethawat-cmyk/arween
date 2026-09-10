"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/session";
import {
  createWorkItemSchema,
  updateWorkItemSchema,
  createDocumentSchema,
} from "@/types/schemas";
import { recordEvidence } from "@/server/collect";

async function requireMembership(projectId: string, userId: string) {
  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (!membership) {
    throw new Error("คุณไม่ใช่สมาชิกของโปรเจกต์นี้");
  }
  return membership;
}

export async function createWorkItem(input: {
  projectId: string;
  title: string;
  description?: string;
  status?: "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED";
  actorId: string;
}) {
  const user = await requireSessionUser();
  await requireMembership(input.projectId, user.id);
  const parsed = createWorkItemSchema.parse(input);

  const item = await prisma.workItem.create({
    data: {
      projectId: parsed.projectId,
      title: parsed.title,
      description: parsed.description,
      status: parsed.status ?? "TODO",
    },
  });

  await recordEvidence({
    projectId: parsed.projectId,
    actorId: user.id,
    action: `สร้างงาน: ${parsed.title}`,
    source: "WORK_ITEM",
    metadata: { workItemId: item.id },
  });

  revalidatePath(`/projects/${parsed.projectId}`);
  revalidatePath(`/projects/${parsed.projectId}/hub`);
  revalidatePath(`/projects/${parsed.projectId}/evidence`);
  return item;
}

export async function updateWorkItem(input: {
  id: string;
  title?: string;
  description?: string;
  status?: "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED";
  actorId: string;
  projectId: string;
}) {
  const user = await requireSessionUser();
  await requireMembership(input.projectId, user.id);
  const parsed = updateWorkItemSchema.parse(input);

  const item = await prisma.workItem.update({
    where: { id: parsed.id },
    data: {
      title: parsed.title,
      description: parsed.description,
      status: parsed.status,
    },
  });

  const actionParts: string[] = [];
  if (parsed.status) {
    actionParts.push(`เปลี่ยนสถานะเป็น ${parsed.status}`);
  }
  if (parsed.title) {
    actionParts.push(`แก้ไขชื่องาน: ${parsed.title}`);
  }

  await recordEvidence({
    projectId: input.projectId,
    actorId: user.id,
    action: actionParts.join(" — ") || `อัปเดตงาน: ${item.title}`,
    source: "STATUS_UPDATE",
    metadata: { workItemId: item.id },
  });

  revalidatePath(`/projects/${input.projectId}`);
  revalidatePath(`/projects/${input.projectId}/hub`);
  revalidatePath(`/projects/${input.projectId}/evidence`);
  return item;
}

export async function addDocument(input: {
  projectId: string;
  title: string;
  url: string;
  actorId: string;
}) {
  const user = await requireSessionUser();
  await requireMembership(input.projectId, user.id);
  const parsed = createDocumentSchema.parse(input);

  const doc = await prisma.documentRef.create({
    data: {
      projectId: parsed.projectId,
      title: parsed.title,
      url: parsed.url,
      addedById: user.id,
    },
  });

  await recordEvidence({
    projectId: parsed.projectId,
    actorId: user.id,
    action: `เพิ่มเอกสาร: ${parsed.title}`,
    source: "DOCUMENT",
    metadata: { documentId: doc.id, url: parsed.url },
  });

  revalidatePath(`/projects/${parsed.projectId}`);
  revalidatePath(`/projects/${parsed.projectId}/hub`);
  revalidatePath(`/projects/${parsed.projectId}/chat`);
  revalidatePath(`/projects/${parsed.projectId}/evidence`);
  return doc;
}

export async function getProjectHub(projectId: string) {
  const user = await requireSessionUser();
  await requireMembership(projectId, user.id);

  const [workItems, documents, evidenceCount] = await Promise.all([
    prisma.workItem.findMany({
      where: { projectId },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.documentRef.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.evidenceEvent.count({ where: { projectId } }),
  ]);

  return { workItems, documents, evidenceCount };
}
