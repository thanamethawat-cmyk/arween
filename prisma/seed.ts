import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

config();

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("demo1234", 10);

  const lead = await prisma.user.upsert({
    where: { email: "lead@arween.demo" },
    update: {},
    create: {
      name: "สมชาย หัวหน้าโปรเจกต์",
      email: "lead@arween.demo",
      passwordHash,
      role: "LEAD",
    },
  });

  const member1 = await prisma.user.upsert({
    where: { email: "somying@arween.demo" },
    update: {},
    create: {
      name: "สมหญิง ช่วยงานเบื้องหลัง",
      email: "somying@arween.demo",
      passwordHash,
      role: "MEMBER",
    },
  });

  const member2 = await prisma.user.upsert({
    where: { email: "somchai@arween.demo" },
    update: {},
    create: {
      name: "สมชาย รอง ทำงานหน้า",
      email: "somchai@arween.demo",
      passwordHash,
      role: "MEMBER",
    },
  });

  const project = await prisma.project.upsert({
    where: { id: "project-demo-001" },
    update: {},
    create: {
      id: "project-demo-001",
      name: "โปรเจกต์สาธิต ARWEEN",
      description: "โปรเจกต์ตัวอย่างสำหรับทดสอบการเก็บหลักฐานและประเมินทีม",
      status: "ACTIVE",
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

  const workItems = await Promise.all([
    prisma.workItem.create({
      data: {
        projectId: project.id,
        title: "ออกแบบหน้าจอหลัก",
        description: "ออกแบบ UI สำหรับหน้ารวมสถานะงาน",
        status: "IN_PROGRESS",
      },
    }),
    prisma.workItem.create({
      data: {
        projectId: project.id,
        title: "เชื่อมฐานข้อมูล",
        description: "ตั้งค่า Prisma และ PostgreSQL",
        status: "DONE",
      },
    }),
    prisma.workItem.create({
      data: {
        projectId: project.id,
        title: "ทดสอบระบบเก็บหลักฐาน",
        status: "TODO",
      },
    }),
  ]);

  await prisma.documentRef.createMany({
    data: [
      {
        projectId: project.id,
        title: "เอกสารขอบเขตหน้าที่ทีม AI",
        url: "/docs/ทีม-AI-ขอบเขตหน้าที่.md",
        addedById: lead.id,
      },
      {
        projectId: project.id,
        title: "เกณฑ์ให้คะแนน",
        url: "/docs/เกณฑ์ให้คะแนน.md",
        addedById: lead.id,
      },
    ],
  });

  const evidenceData = [
    {
      actorId: member1.id,
      action:
        "อธิบายวิธีแก้ bug ที่ทีมติดมา 3 วัน พร้อมขั้นตอนละเอียด — ช่วยทีมดีไซน์แก้ layout บนมือถือ",
      source: "COMMENT" as const,
      occurredAt: new Date("2026-09-01T10:30:00"),
    },
    {
      actorId: member2.id,
      action: "รับทราบครับ",
      source: "COMMENT" as const,
      occurredAt: new Date("2026-09-01T11:00:00"),
    },
    {
      actorId: lead.id,
      action: "สร้างงาน: ออกแบบหน้าจอหลัก",
      source: "WORK_ITEM" as const,
      occurredAt: new Date("2026-08-28T09:00:00"),
      metadata: { workItemId: workItems[0].id },
    },
    {
      actorId: member1.id,
      action: "เปลี่ยนสถานะเป็น DONE — งาน: เชื่อมฐานข้อมูล",
      source: "STATUS_UPDATE" as const,
      occurredAt: new Date("2026-08-30T16:00:00"),
      metadata: { workItemId: workItems[1].id },
    },
    {
      actorId: member2.id,
      action: "รับทราบครับ รับทราบครับ รับทราบครับ",
      source: "COMMENT" as const,
      occurredAt: new Date("2026-09-02T08:00:00"),
    },
  ];

  for (const ev of evidenceData) {
    await prisma.evidenceEvent.create({
      data: {
        projectId: project.id,
        ...ev,
      },
    });
  }

  await prisma.notification.createMany({
    data: [
      {
        projectId: project.id,
        type: "WEEKLY_DIGEST",
        title: "สรุปงานรายสัปดาห์",
        body: "สัปดาห์นี้มีหลักฐานการทำงาน 5 รายการ และงานที่เสร็จแล้ว 1 รายการ",
      },
      {
        projectId: project.id,
        type: "GAMING_FLAG",
        title: "สัญญาณสงสัยว่าปั่นคะแนน",
        body: 'พบข้อความ "รับทราบครับ" ซ้ำ 3 ครั้งในวันเดียว — รอหัวหน้าตรวจสอบ',
      },
    ],
  });

  await prisma.score.create({
    data: {
      projectId: project.id,
      userId: member1.id,
      value: 9,
      reason:
        "ช่วยแก้ปัญหาซับซ้อนและอธิบายขั้นตอนให้ทีม — อ้างหลักฐานความเห็นเมื่อ 1 ก.ย.",
      confirmed: false,
    },
  });

  await prisma.teamSummary.create({
    data: {
      projectId: project.id,
      content:
        "ทีมทำงานเชื่อมฐานข้อมูลเสร็จแล้ว กำลังออกแบบหน้าจอหลัก มีการช่วยเหลือข้ามสายงานจากสมหญิง ยังมีงานทดสอบระบบเก็บหลักฐานค้างอยู่",
      periodStart: new Date("2026-08-26"),
      periodEnd: new Date("2026-09-02"),
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
  console.log("โปรเจกต์:", project.id);
  console.log("เข้าสู่ระบบ: lead@arween.demo / demo1234");
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
