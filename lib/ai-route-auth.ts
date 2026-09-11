import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Membership = {
  id: string;
  projectId: string;
  userId: string;
  role: string;
};

export type ProjectApiAccess =
  | { ok: true; session: Session; membership: Membership | null }
  | { ok: false; error: string; status: 401 | 403 };

export async function requireProjectApiAccess(
  projectId: string
): Promise<ProjectApiAccess> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { ok: false, error: "กรุณาเข้าสู่ระบบ", status: 401 };
  }

  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId: session.user.id,
      },
    },
  });

  if (!membership && session.user.role !== "ADMIN") {
    return {
      ok: false,
      error: "คุณไม่ใช่สมาชิกของโปรเจกต์นี้",
      status: 403,
    };
  }

  return { ok: true, session, membership };
}
