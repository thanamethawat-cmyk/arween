import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { INVITE_EXPIRY_DAYS } from "@/types/schemas";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function assertCanInvite(projectId: string, userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error("ไม่พบผู้ใช้");
  }

  if (user.role === "ADMIN" || user.role === "LEAD") {
    return user;
  }

  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: { projectId, userId },
    },
  });

  if (
    !membership ||
    (membership.role !== "lead" && membership.role !== "admin")
  ) {
    throw new Error(
      "เฉพาะหัวหน้าโปรเจกต์หรือผู้ดูแลระบบเท่านั้นที่เชิญสมาชิกได้"
    );
  }

  return user;
}

export type InviteLookupResult =
  | {
      ok: true;
      invite: {
        token: string;
        email: string;
        role: string;
        expiresAt: Date;
        project: { id: string; name: string; description: string | null };
      };
    }
  | { ok: false; reason: "not_found" | "expired" | "accepted" };

export async function getInviteByToken(
  token: string
): Promise<InviteLookupResult> {
  const invite = await prisma.projectInvite.findUnique({
    where: { token },
    include: {
      project: {
        select: { id: true, name: true, description: true },
      },
    },
  });

  if (!invite) {
    return { ok: false, reason: "not_found" };
  }
  if (invite.acceptedAt) {
    return { ok: false, reason: "accepted" };
  }
  if (invite.expiresAt < new Date()) {
    return { ok: false, reason: "expired" };
  }

  return {
    ok: true,
    invite: {
      token: invite.token,
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt,
      project: invite.project,
    },
  };
}

export async function createInviteRecord(input: {
  projectId: string;
  email: string;
  role: string;
  invitedById: string;
}) {
  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

  return prisma.projectInvite.create({
    data: {
      token,
      projectId: input.projectId,
      email: normalizeEmail(input.email),
      role: input.role,
      invitedById: input.invitedById,
      expiresAt,
    },
    include: {
      project: { select: { id: true, name: true } },
    },
  });
}

export async function acceptInviteForUser(input: {
  token: string;
  email: string;
  name: string;
}) {
  const email = normalizeEmail(input.email);
  const lookup = await getInviteByToken(input.token);

  if (!lookup.ok) {
    return { ok: false as const, reason: lookup.reason };
  }

  if (normalizeEmail(lookup.invite.email) !== email) {
    return { ok: false as const, reason: "email_mismatch" as const };
  }

  const invite = await prisma.projectInvite.findUnique({
    where: { token: input.token },
  });
  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    return { ok: false as const, reason: "expired" as const };
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: input.name || undefined,
      emailVerified: new Date(),
    },
    create: {
      email,
      name: input.name || email.split("@")[0],
      emailVerified: new Date(),
      role: "MEMBER",
      passwordHash: null,
    },
  });

  await prisma.projectMember.upsert({
    where: {
      projectId_userId: {
        projectId: invite.projectId,
        userId: user.id,
      },
    },
    update: {
      role: invite.role,
    },
    create: {
      projectId: invite.projectId,
      userId: user.id,
      role: invite.role,
    },
  });

  await prisma.projectInvite.update({
    where: { id: invite.id },
    data: { acceptedAt: new Date() },
  });

  return {
    ok: true as const,
    projectId: invite.projectId,
    userId: user.id,
  };
}

export async function canUserInvite(projectId: string, userId: string) {
  try {
    await assertCanInvite(projectId, userId);
    return true;
  } catch {
    return false;
  }
}
