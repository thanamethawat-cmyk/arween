"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/session";
import { hasMinimumAnchor } from "@/server/anchor";
import { runAgent1, type AnchorContextItem } from "@/server/agents/agent1";
import { runAgent3 } from "@/server/agents/agent3";
import { createGamingFlag } from "@/server/notify";
import { z } from "zod";

async function requireMembership(projectId: string, userId: string) {
  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (!membership) throw new Error("คุณไม่ใช่สมาชิกของโปรเจกต์นี้");
  return membership;
}

async function getOrCreateOpenPeriod(projectId: string) {
  const open = await prisma.evaluationPeriod.findFirst({
    where: { projectId, status: "OPEN" },
    orderBy: { periodStart: "desc" },
  });
  if (open) return open;

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return prisma.evaluationPeriod.create({
    data: {
      projectId,
      periodStart: weekStart,
      periodEnd: weekEnd,
      status: "OPEN",
    },
  });
}

function buildAnchorContext(
  objectives: Awaited<ReturnType<typeof loadObjectives>>
): AnchorContextItem[] {
  const items: AnchorContextItem[] = [];
  for (const obj of objectives) {
    for (const ms of obj.milestones) {
      if (ms.kpis.length === 0) {
        items.push({
          milestoneId: ms.id,
          milestoneName: ms.name,
          objectiveName: obj.name,
        });
      } else {
        for (const kpi of ms.kpis) {
          items.push({
            milestoneId: ms.id,
            milestoneName: ms.name,
            kpiId: kpi.id,
            kpiName: kpi.name,
            objectiveName: obj.name,
          });
        }
      }
    }
  }
  return items;
}

async function loadObjectives(projectId: string) {
  return prisma.objective.findMany({
    where: { projectId },
    include: {
      milestones: { include: { kpis: true } },
    },
  });
}

const dailyLogSchema = z.object({
  projectId: z.string().min(1),
  action: z.string().min(1).max(2000),
});

/** บันทึกงานรายวัน → Evidence + Agent1 + Agent3 → Score */
export async function submitDailyLog(input: {
  projectId: string;
  action: string;
}) {
  const user = await requireSessionUser();
  const parsed = dailyLogSchema.parse(input);
  await requireMembership(parsed.projectId, user.id);

  const ready = await hasMinimumAnchor(parsed.projectId);
  if (!ready) {
    throw new Error(
      "ตั้งเป้าหมายโปรเจกต์อย่างน้อย 1 วัตถุประสงค์และ 1 งานส่งมอบก่อนบันทึกคะแนน"
    );
  }

  const project = await prisma.project.findUnique({
    where: { id: parsed.projectId },
  });
  if (!project) throw new Error("ไม่พบโปรเจกต์");

  const objectives = await loadObjectives(parsed.projectId);
  const anchors = buildAnchorContext(objectives);
  if (anchors.length === 0) {
    throw new Error("ยังไม่มี Milestone ในแผนเป้าหมาย");
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const recent = await prisma.evidenceEvent.findMany({
    where: {
      projectId: parsed.projectId,
      actorId: user.id,
      occurredAt: { gte: startOfDay },
    },
    select: { action: true },
  });

  const agent3 = runAgent3({
    action: parsed.action,
    recentSameDayActions: recent.map((r) => r.action),
  });

  const agent1 = await runAgent1({
    projectName: project.name,
    action: parsed.action,
    anchors,
  });

  const finalScore =
    agent3.forcedScore !== null ? agent3.forcedScore : agent1.impactScore;
  const rationale =
    agent3.flagged && agent3.flagReason
      ? `${agent1.rationale} | ${agent3.flagReason}`
      : agent1.rationale;

  const period = await getOrCreateOpenPeriod(parsed.projectId);

  const evidence = await prisma.evidenceEvent.create({
    data: {
      projectId: parsed.projectId,
      actorId: user.id,
      action: parsed.action.trim(),
      source: "DAILY_LOG",
    },
  });

  const score = await prisma.score.create({
    data: {
      projectId: parsed.projectId,
      userId: user.id,
      value: finalScore,
      reason: rationale,
      evidenceEventId: evidence.id,
      milestoneId: agent1.milestoneId,
      kpiId: agent1.kpiId,
      evaluationPeriodId: period.id,
      suggestedBy: "AI",
      flagged: agent3.flagged,
      flagReason: agent3.flagReason,
      confirmed: false,
    },
  });

  if (agent3.flagged && agent3.flagReason) {
    await createGamingFlag(parsed.projectId, agent3.flagReason);
  }

  revalidatePath(`/projects/${parsed.projectId}`);
  revalidatePath(`/projects/${parsed.projectId}/evaluation`);
  revalidatePath(`/projects/${parsed.projectId}/evidence`);
  revalidatePath(`/projects/${parsed.projectId}/notifications`);

  return { evidence, score, agent1, agent3 };
}
