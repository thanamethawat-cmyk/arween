"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/session";
import { z } from "zod";

async function requireMembership(projectId: string, userId: string) {
  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (!membership) {
    throw new Error("คุณไม่ใช่สมาชิกของโปรเจกต์นี้");
  }
  return membership;
}

export async function listMyProjects() {
  const user = await requireSessionUser();
  const memberships = await prisma.projectMember.findMany({
    where: { userId: user.id },
    include: {
      project: {
        include: {
          _count: { select: { members: true } },
        },
      },
    },
    orderBy: { project: { updatedAt: "desc" } },
  });

  return memberships.map((m) => ({
    id: m.project.id,
    name: m.project.name,
    description: m.project.description,
    status: m.project.status,
    progressPercent: m.project.progressPercent,
    memberCount: m.project._count.members,
    myRole: m.role,
    updatedAt: m.project.updatedAt,
  }));
}

const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
});

export async function createProject(input: {
  name: string;
  description?: string;
}) {
  const user = await requireSessionUser();
  const parsed = createProjectSchema.parse(input);

  const project = await prisma.project.create({
    data: {
      name: parsed.name.trim(),
      description: parsed.description?.trim() || null,
      status: "ACTIVE",
      members: {
        create: {
          userId: user.id,
          role: "lead",
        },
      },
    },
  });

  // เปิดรอบประเมินสัปดาห์ปัจจุบันอัตโนมัติ
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  await prisma.evaluationPeriod.create({
    data: {
      projectId: project.id,
      periodStart: weekStart,
      periodEnd: weekEnd,
      status: "OPEN",
    },
  });

  revalidatePath("/");
  return project;
}

export async function getProjectForUser(projectId: string) {
  const user = await requireSessionUser();
  const membership = await requireMembership(projectId, user.id);

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      objectives: {
        orderBy: { sortOrder: "asc" },
        include: {
          milestones: {
            orderBy: { sortOrder: "asc" },
            include: { kpis: { orderBy: { sortOrder: "asc" } } },
          },
        },
      },
      _count: {
        select: { evidence: true, scores: true },
      },
    },
  });

  if (!project) {
    throw new Error("ไม่พบโปรเจกต์");
  }

  return {
    project,
    membership,
    isLead: membership.role === "lead" || user.role === "ADMIN" || user.role === "LEAD",
    currentUserId: user.id,
  };
}
