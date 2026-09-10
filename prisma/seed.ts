import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

config();

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("demo1234", 10);

  const lead = await prisma.user.upsert({
    where: { email: "lead@arween.demo" },
    update: { passwordHash, role: "LEAD", name: "สมชาย หัวหน้าโปรเจกต์" },
    create: {
      name: "สมชาย หัวหน้าโปรเจกต์",
      email: "lead@arween.demo",
      passwordHash,
      role: "LEAD",
    },
  });

  const member1 = await prisma.user.upsert({
    where: { email: "somying@arween.demo" },
    update: { passwordHash },
    create: {
      name: "สมหญิง ช่วยงานเบื้องหลัง",
      email: "somying@arween.demo",
      passwordHash,
      role: "MEMBER",
    },
  });

  const member2 = await prisma.user.upsert({
    where: { email: "somchai@arween.demo" },
    update: { passwordHash },
    create: {
      name: "สมชาย รอง ทำงานหน้า",
      email: "somchai@arween.demo",
      passwordHash,
      role: "MEMBER",
    },
  });

  const project = await prisma.project.upsert({
    where: { id: "project-demo-001" },
    update: {
      name: "โปรเจกต์สาธิต ARWEEN",
      description: "โปรเจกต์ตัวอย่าง Outcome-Driven พร้อม Anchor Framework",
      progressPercent: 0,
    },
    create: {
      id: "project-demo-001",
      name: "โปรเจกต์สาธิต ARWEEN",
      description: "โปรเจกต์ตัวอย่าง Outcome-Driven พร้อม Anchor Framework",
      status: "ACTIVE",
      progressPercent: 0,
    },
  });

  for (const userId of [lead.id, member1.id, member2.id]) {
    await prisma.projectMember.upsert({
      where: {
        projectId_userId: { projectId: project.id, userId },
      },
      update: {
        role: userId === lead.id ? "lead" : "member",
      },
      create: {
        projectId: project.id,
        userId,
        role: userId === lead.id ? "lead" : "member",
      },
    });
  }

  // ล้างแผนเก่าของโปรเจกต์สาธิตแล้วใส่ใหม่
  await prisma.objective.deleteMany({ where: { projectId: project.id } });

  const objective = await prisma.objective.create({
    data: {
      projectId: project.id,
      name: "ส่งมอบแพลตฟอร์มประเมินผลงานที่ใช้จริง",
      description: "ให้ทีมทดลองใช้งานครบวงจร Anchor + Agents",
      weight: 100,
      sortOrder: 0,
    },
  });

  const ms1 = await prisma.milestone.create({
    data: {
      objectiveId: objective.id,
      name: "ตั้งค่า Anchor Framework",
      successCriteria: "มี Objective / Milestone / KPI และน้ำหนักครบ",
      weight: 40,
      status: "ACHIEVED",
      sortOrder: 0,
    },
  });

  const ms2 = await prisma.milestone.create({
    data: {
      objectiveId: objective.id,
      name: "เปิดใช้การประเมินทีม",
      successCriteria: "มีบันทึกงาน Impact Score และปิดรอบสัดส่วน 100% ได้",
      weight: 60,
      status: "IN_PROGRESS",
      sortOrder: 1,
    },
  });

  await prisma.kpi.create({
    data: {
      milestoneId: ms1.id,
      name: "จำนวน Milestone ที่กำหนดครบ",
      unit: "รายการ",
      targetValue: 2,
      currentValue: 2,
      weight: 100,
      status: "ACHIEVED",
    },
  });

  await prisma.kpi.create({
    data: {
      milestoneId: ms2.id,
      name: "สมาชิกที่บันทึกงานอย่างน้อย 1 ครั้ง",
      unit: "คน",
      targetValue: 3,
      currentValue: 1,
      weight: 100,
      status: "IN_PROGRESS",
    },
  });

  // progress = leaf ACHIEVED: ms1 kpi 40% of plan → 40
  await prisma.project.update({
    where: { id: project.id },
    data: { progressPercent: 40 },
  });

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  await prisma.evaluationPeriod.deleteMany({ where: { projectId: project.id } });
  const period = await prisma.evaluationPeriod.create({
    data: {
      projectId: project.id,
      periodStart: weekStart,
      periodEnd: weekEnd,
      status: "OPEN",
    },
  });

  await prisma.workItem.deleteMany({ where: { projectId: project.id } });
  const workItems = await Promise.all([
    prisma.workItem.create({
      data: {
        projectId: project.id,
        title: "ออกแบบหน้าแผนเป้าหมาย",
        description: "UI สำหรับ Objective / Milestone / KPI",
        status: "IN_PROGRESS",
      },
    }),
    prisma.workItem.create({
      data: {
        projectId: project.id,
        title: "เชื่อม Prisma Schema",
        description: "ตั้งค่า Anchor + EvaluationPeriod",
        status: "DONE",
      },
    }),
  ]);

  await prisma.documentRef.deleteMany({ where: { projectId: project.id } });
  await prisma.documentRef.createMany({
    data: [
      {
        projectId: project.id,
        title: "เอกสารฉบับสมบูรณ์ ARWEEN",
        url: "/ARWEEN-Complete-Document.md",
        addedById: lead.id,
      },
    ],
  });

  await prisma.score.deleteMany({ where: { projectId: project.id } });
  await prisma.evidenceEvent.deleteMany({ where: { projectId: project.id } });

  const evidenceGood = await prisma.evidenceEvent.create({
    data: {
      projectId: project.id,
      actorId: member1.id,
      action:
        "สรุปขั้นตอนแก้ blocker ของ KPI สมาชิกที่บันทึกงาน และอัปเดตเอกสารแผนให้ทีมใช้ต่อได้",
      source: "DAILY_LOG",
      occurredAt: new Date(),
    },
  });

  await prisma.evidenceEvent.create({
    data: {
      projectId: project.id,
      actorId: member2.id,
      action: "รับทราบครับ",
      source: "DAILY_LOG",
      occurredAt: new Date(),
    },
  });

  await prisma.score.create({
    data: {
      projectId: project.id,
      userId: member1.id,
      value: 9,
      reason:
        "ช่วยปลดล็อกงานที่ผูกกับ Milestone เปิดใช้การประเมินทีม — อ้างหลักฐานบันทึกรายวัน",
      evidenceEventId: evidenceGood.id,
      milestoneId: ms2.id,
      evaluationPeriodId: period.id,
      suggestedBy: "AI",
      confirmed: false,
      flagged: false,
    },
  });

  await prisma.score.create({
    data: {
      projectId: project.id,
      userId: member2.id,
      value: 0,
      reason: "ข้อความตอบรับทั่วไป | พบข้อความตอบรับซ้ำ — สงสัยปั่นคะแนน (ตัวอย่าง)",
      milestoneId: ms2.id,
      evaluationPeriodId: period.id,
      suggestedBy: "AI",
      confirmed: false,
      flagged: true,
      flagReason: "ตัวอย่างสัญญาณ Anti-Gaming",
    },
  });

  await prisma.notification.deleteMany({ where: { projectId: project.id } });
  await prisma.notification.createMany({
    data: [
      {
        projectId: project.id,
        type: "WEEKLY_DIGEST",
        title: "สรุปงานรายสัปดาห์",
        body: "มีหลักฐานและคะแนนตัวอย่างในรอบปัจจุบัน — หัวหน้าสามารถยืนยันแล้วปิดรอบได้",
      },
      {
        projectId: project.id,
        type: "GAMING_FLAG",
        title: "สัญญาณสงสัยว่าปั่นคะแนน",
        body: 'พบข้อความ "รับทราบครับ" ที่ไม่มีผลต่อ KPI',
      },
    ],
  });

  await prisma.teamSummary.deleteMany({ where: { projectId: project.id } });
  await prisma.teamSummary.create({
    data: {
      projectId: project.id,
      content:
        "ทีมตั้ง Anchor ครบแล้ว ความคืบหน้า 40% จาก Milestone แรกที่สำเร็จ กำลังเปิดใช้การประเมินทีม",
      periodStart: weekStart,
      periodEnd: weekEnd,
    },
  });

  const inviteExpires = new Date();
  inviteExpires.setDate(inviteExpires.getDate() + 7);

  const sampleInvite = await prisma.projectInvite.upsert({
    where: { token: "demo-invite-token-arween-001" },
    update: {
      email: "newhire@company.com",
      expiresAt: inviteExpires,
      acceptedAt: null,
    },
    create: {
      token: "demo-invite-token-arween-001",
      projectId: project.id,
      email: "newhire@company.com",
      role: "member",
      invitedById: lead.id,
      expiresAt: inviteExpires,
    },
  });

  console.log("Seed สำเร็จ");
  console.log("โปรเจกต์:", project.id, "workItems:", workItems.length);
  console.log("เข้าสู่ระบบ: lead@arween.demo / demo1234");
  console.log("สมาชิก: somying@arween.demo / demo1234");
  console.log("ลิงก์เชิญตัวอย่าง: /invite/" + sampleInvite.token);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
