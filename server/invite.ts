"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/session";
import { createInviteSchema } from "@/types/schemas";
import {
  assertCanInvite,
  canUserInvite,
  createInviteRecord,
  getInviteByToken,
  acceptInviteForUser,
} from "@/lib/invite-service";

export { getInviteByToken, acceptInviteForUser, canUserInvite };

export async function createProjectInvite(input: {
  projectId: string;
  email: string;
  role?: "member" | "lead";
}) {
  const sessionUser = await requireSessionUser();
  const parsed = createInviteSchema.parse(input);
  await assertCanInvite(parsed.projectId, sessionUser.id);

  const project = await prisma.project.findUnique({
    where: { id: parsed.projectId },
  });
  if (!project) {
    throw new Error("ไม่พบโปรเจกต์");
  }

  const invite = await createInviteRecord({
    projectId: parsed.projectId,
    email: parsed.email,
    role: parsed.role ?? "member",
    invitedById: sessionUser.id,
  });

  revalidatePath(`/projects/${parsed.projectId}`);
  return invite;
}

export async function listProjectInvites(projectId: string) {
  const sessionUser = await requireSessionUser();
  await assertCanInvite(projectId, sessionUser.id);

  return prisma.projectInvite.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}
