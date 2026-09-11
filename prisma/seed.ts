import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

config();

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("demo1234", 10);
  const now = new Date();
  const inviteExpires = new Date();
  inviteExpires.setDate(inviteExpires.getDate() + 14);

  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  // ==========================================
  // 1. BASE USERS
  // ==========================================
  const leadDemo = await prisma.user.upsert({
    where: { email: "lead@arween.demo" },
    update: { passwordHash, role: "LEAD", name: "สมชาย หัวหน้าโปรเจกต์" },
    create: {
      name: "สมชาย หัวหน้าโปรเจกต์",
      email: "lead@arween.demo",
      passwordHash,
      role: "LEAD",
    },
  });

  const memberDemo1 = await prisma.user.upsert({
    where: { email: "somying@arween.demo" },
    update: { passwordHash },
    create: {
      name: "สมหญิง ช่วยงานเบื้องหลัง",
      email: "somying@arween.demo",
      passwordHash,
      role: "MEMBER",
    },
  });

  const memberDemo2 = await prisma.user.upsert({
    where: { email: "somchai@arween.demo" },
    update: { passwordHash },
    create: {
      name: "สมชาย รอง ทำงานหน้า",
      email: "somchai@arween.demo",
      passwordHash,
      role: "MEMBER",
    },
  });

  // Pilot Team 1: Engineering & Platform
  const engLead = await prisma.user.upsert({
    where: { email: "eng.lead@arween.demo" },
    update: { passwordHash, role: "LEAD", name: "ธนวัฒน์ หัวหน้าวิศวกรรม" },
    create: {
      name: "ธนวัฒน์ หัวหน้าวิศวกรรม",
      email: "eng.lead@arween.demo",
      passwordHash,
      role: "LEAD",
    },
  });

  const engDev1 = await prisma.user.upsert({
    where: { email: "dev.backend@arween.demo" },
    update: { passwordHash, role: "MEMBER", name: "มนตรี วิศวกรหลังบ้าน (DevOps/Backend)" },
    create: {
      name: "มนตรี วิศวกรหลังบ้าน (DevOps/Backend)",
      email: "dev.backend@arween.demo",
      passwordHash,
      role: "MEMBER",
    },
  });

  const engDev2 = await prisma.user.upsert({
    where: { email: "dev.frontend@arween.demo" },
    update: { passwordHash, role: "MEMBER", name: "อนันต์ วิศวกรหน้าบ้าน (UI/UX)" },
    create: {
      name: "อนันต์ วิศวกรหน้าบ้าน (UI/UX)",
      email: "dev.frontend@arween.demo",
      passwordHash,
      role: "MEMBER",
    },
  });

  // Pilot Team 2: Operations & Growth
  const opsLead = await prisma.user.upsert({
    where: { email: "ops.lead@arween.demo" },
    update: { passwordHash, role: "LEAD", name: "ภานุมาส ผู้นำฝ่ายปฏิบัติการ" },
    create: {
      name: "ภานุมาส ผู้นำฝ่ายปฏิบัติการ",
      email: "ops.lead@arween.demo",
      passwordHash,
      role: "LEAD",
    },
  });

  const opsMember1 = await prisma.user.upsert({
    where: { email: "ops.support@arween.demo" },
    update: { passwordHash, role: "MEMBER", name: "กานดา ผู้ประสานงานลูกค้า (Customer Success)" },
    create: {
      name: "กานดา ผู้ประสานงานลูกค้า (Customer Success)",
      email: "ops.support@arween.demo",
      passwordHash,
      role: "MEMBER",
    },
  });

  const opsMember2 = await prisma.user.upsert({
    where: { email: "ops.partner@arween.demo" },
    update: { passwordHash, role: "MEMBER", name: "วิชัย ผู้จัดการพันธมิตรองค์กร (Partnership)" },
    create: {
      name: "วิชัย ผู้จัดการพันธมิตรองค์กร (Partnership)",
      email: "ops.partner@arween.demo",
      passwordHash,
      role: "MEMBER",
    },
  });

  // ==========================================
  // 2. PROJECT 1: Demo Project (project-demo-001)
  // ==========================================
  const demoProject = await prisma.project.upsert({
    where: { id: "project-demo-001" },
    update: {
      name: "โปรเจกต์สาธิต ARWEEN",
      description: "โปรเจกต์ตัวอย่าง Outcome-Driven พร้อม Anchor Framework",
      progressPercent: 40,
    },
    create: {
      id: "project-demo-001",
      name: "โปรเจกต์สาธิต ARWEEN",
      description: "โปรเจกต์ตัวอย่าง Outcome-Driven พร้อม Anchor Framework",
      status: "ACTIVE",
      progressPercent: 40,
    },
  });

  for (const userId of [leadDemo.id, memberDemo1.id, memberDemo2.id]) {
    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: demoProject.id, userId } },
      update: { role: userId === leadDemo.id ? "lead" : "member" },
      create: {
        projectId: demoProject.id,
        userId,
        role: userId === leadDemo.id ? "lead" : "member",
      },
    });
  }

  // Anchor for demo
  await prisma.objective.deleteMany({ where: { projectId: demoProject.id } });
  const demoObj = await prisma.objective.create({
    data: {
      projectId: demoProject.id,
      name: "ส่งมอบแพลตฟอร์มประเมินผลงานที่ใช้จริง",
      description: "ให้ทีมทดลองใช้งานครบวงจร Anchor + Agents",
      weight: 100,
      sortOrder: 0,
    },
  });

  const demoMs1 = await prisma.milestone.create({
    data: {
      objectiveId: demoObj.id,
      name: "ตั้งค่า Anchor Framework",
      successCriteria: "มี Objective / Milestone / KPI และน้ำหนักครบ",
      weight: 40,
      status: "ACHIEVED",
      sortOrder: 0,
    },
  });

  const demoMs2 = await prisma.milestone.create({
    data: {
      objectiveId: demoObj.id,
      name: "เปิดใช้การประเมินทีม",
      successCriteria: "มีบันทึกงาน Impact Score และปิดรอบสัดส่วน 100% ได้",
      weight: 60,
      status: "IN_PROGRESS",
      sortOrder: 1,
    },
  });

  await prisma.kpi.create({
    data: {
      milestoneId: demoMs1.id,
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
      milestoneId: demoMs2.id,
      name: "สมาชิกที่บันทึกงานอย่างน้อย 1 ครั้ง",
      unit: "คน",
      targetValue: 3,
      currentValue: 1,
      weight: 100,
      status: "IN_PROGRESS",
    },
  });

  await prisma.evaluationPeriod.deleteMany({ where: { projectId: demoProject.id } });
  const demoPeriod = await prisma.evaluationPeriod.create({
    data: {
      projectId: demoProject.id,
      periodStart: weekStart,
      periodEnd: weekEnd,
      status: "OPEN",
    },
  });

  await prisma.workItem.deleteMany({ where: { projectId: demoProject.id } });
  await prisma.workItem.createMany({
    data: [
      {
        projectId: demoProject.id,
        title: "ออกแบบหน้าแผนเป้าหมาย",
        description: "UI สำหรับ Objective / Milestone / KPI",
        status: "IN_PROGRESS",
        assigneeId: memberDemo1.id,
      },
      {
        projectId: demoProject.id,
        title: "เชื่อม Prisma Schema",
        description: "ตั้งค่า Anchor + EvaluationPeriod",
        status: "DONE",
        assigneeId: memberDemo2.id,
      },
    ],
  });

  await prisma.documentRef.deleteMany({ where: { projectId: demoProject.id } });
  await prisma.documentRef.create({
    data: {
      projectId: demoProject.id,
      title: "เอกสารฉบับสมบูรณ์ ARWEEN",
      url: "/ARWEEN-Complete-Document.md",
      addedById: leadDemo.id,
    },
  });

  await prisma.score.deleteMany({ where: { projectId: demoProject.id } });
  await prisma.evidenceEvent.deleteMany({ where: { projectId: demoProject.id } });
  const demoEvidenceGood = await prisma.evidenceEvent.create({
    data: {
      projectId: demoProject.id,
      actorId: memberDemo1.id,
      action: "สรุปขั้นตอนแก้ blocker ของ KPI สมาชิกที่บันทึกงาน และอัปเดตเอกสารแผนให้ทีมใช้ต่อได้",
      source: "DAILY_LOG",
      occurredAt: new Date(),
    },
  });

  await prisma.evidenceEvent.create({
    data: {
      projectId: demoProject.id,
      actorId: memberDemo2.id,
      action: "รับทราบครับ",
      source: "DAILY_LOG",
      occurredAt: new Date(),
    },
  });

  await prisma.score.create({
    data: {
      projectId: demoProject.id,
      userId: memberDemo1.id,
      value: 9,
      reason: "ช่วยปลดล็อกงานที่ผูกกับ Milestone เปิดใช้การประเมินทีม — อ้างหลักฐานบันทึกรายวัน",
      evidenceEventId: demoEvidenceGood.id,
      milestoneId: demoMs2.id,
      evaluationPeriodId: demoPeriod.id,
      suggestedBy: "AI",
      confirmed: false,
      flagged: false,
    },
  });

  await prisma.score.create({
    data: {
      projectId: demoProject.id,
      userId: memberDemo2.id,
      value: 0,
      reason: "ข้อความตอบรับทั่วไป | พบข้อความตอบรับซ้ำ — สงสัยปั่นคะแนน (ตัวอย่าง)",
      milestoneId: demoMs2.id,
      evaluationPeriodId: demoPeriod.id,
      suggestedBy: "AI",
      confirmed: false,
      flagged: true,
      flagReason: "ตัวอย่างสัญญาณ Anti-Gaming",
    },
  });

  await prisma.projectInvite.upsert({
    where: { token: "demo-invite-token-arween-001" },
    update: { email: "newhire@company.com", expiresAt: inviteExpires, acceptedAt: null },
    create: {
      token: "demo-invite-token-arween-001",
      projectId: demoProject.id,
      email: "newhire@company.com",
      role: "member",
      invitedById: leadDemo.id,
      expiresAt: inviteExpires,
    },
  });

  // ==========================================
  // 3. PILOT TEAM 1: Engineering & Platform (pilot-team-eng)
  // ==========================================
  const engProject = await prisma.project.upsert({
    where: { id: "pilot-team-eng" },
    update: {
      name: "ทีมวิศวกรรมแพลตฟอร์ม (Engineering & Platform)",
      description: "นำร่องทีมเทคนิค: พัฒนา Core Engine, CI/CD Cloud Run และปรับแต่งความปลอดภัย Database",
      progressPercent: 50,
    },
    create: {
      id: "pilot-team-eng",
      name: "ทีมวิศวกรรมแพลตฟอร์ม (Engineering & Platform)",
      description: "นำร่องทีมเทคนิค: พัฒนา Core Engine, CI/CD Cloud Run และปรับแต่งความปลอดภัย Database",
      status: "ACTIVE",
      progressPercent: 50,
    },
  });

  for (const user of [engLead, engDev1, engDev2]) {
    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: engProject.id, userId: user.id } },
      update: { role: user.id === engLead.id ? "lead" : "member" },
      create: {
        projectId: engProject.id,
        userId: user.id,
        role: user.id === engLead.id ? "lead" : "member",
      },
    });
  }

  await prisma.objective.deleteMany({ where: { projectId: engProject.id } });
  const engObj1 = await prisma.objective.create({
    data: {
      projectId: engProject.id,
      name: "ยกระดับความเสถียรและความปลอดภัยของสถาปัตยกรรมระบบ",
      description: "ลดความหน่วงฐานข้อมูล และป้องกันช่องโหว่ความปลอดภัยก่อนขึ้น Staging",
      weight: 100,
      sortOrder: 0,
    },
  });

  const engMs1 = await prisma.milestone.create({
    data: {
      objectiveId: engObj1.id,
      name: "จัดทำ Connection Pool และ Synchronize Provider อัตโนมัติ",
      successCriteria: "รองรับทั้ง SQLite โลคอล และ Cloud SQL Postgres โดยคอนฟิกไม่ชนกัน",
      weight: 50,
      status: "ACHIEVED",
      sortOrder: 0,
    },
  });

  const engMs2 = await prisma.milestone.create({
    data: {
      objectiveId: engObj1.id,
      name: "ป้องกันช่องโหว่สิทธิ์สมาชิกใน API ทุกเส้นทาง",
      successCriteria: "AI routes ทั้งหมดต้องตรวจสอบสิทธิ์สมาชิกโปรเจกต์ 100%",
      weight: 50,
      status: "ACHIEVED",
      sortOrder: 1,
    },
  });

  await prisma.kpi.create({
    data: {
      milestoneId: engMs1.id,
      name: "ความหน่วงเฉลี่ย Database Latency (ms)",
      unit: "ms",
      targetValue: 50,
      currentValue: 32,
      weight: 50,
      status: "ACHIEVED",
    },
  });

  await prisma.kpi.create({
    data: {
      milestoneId: engMs2.id,
      name: "สัดส่วน API routes ที่มี Membership Guard",
      unit: "%",
      targetValue: 100,
      currentValue: 100,
      weight: 50,
      status: "ACHIEVED",
    },
  });

  await prisma.workItem.deleteMany({ where: { projectId: engProject.id } });
  await prisma.workItem.createMany({
    data: [
      {
        projectId: engProject.id,
        title: "ทดสอบการเชื่อมต่อ Cloud SQL Auth Proxy",
        description: "เขียนสคริปต์ sync-prisma-provider รองรับ Unix socket",
        status: "DONE",
        assigneeId: engDev1.id,
      },
      {
        projectId: engProject.id,
        title: "ออกแบบ UI หน้าต่างแชท AI อิง Anchor Framework",
        description: "ส่ง Objectives และ Milestones เข้าไปยัง System Prompt",
        status: "DONE",
        assigneeId: engDev2.id,
      },
      {
        projectId: engProject.id,
        title: "เตรียมไฟล์ cloudbuild.yaml และ Dockerfile ขั้น Staging",
        description: "ทำให้คอนเทนเนอร์คอมไพล์ Next.js standalone รันบน Cloud Run ได้",
        status: "IN_PROGRESS",
        assigneeId: engDev1.id,
      },
    ],
  });

  await prisma.evaluationPeriod.deleteMany({ where: { projectId: engProject.id } });
  const engPeriod = await prisma.evaluationPeriod.create({
    data: {
      projectId: engProject.id,
      periodStart: weekStart,
      periodEnd: weekEnd,
      status: "OPEN",
    },
  });

  await prisma.projectInvite.upsert({
    where: { token: "invite-eng-squad-2026" },
    update: { email: "eng-candidate@company.com", expiresAt: inviteExpires, acceptedAt: null },
    create: {
      token: "invite-eng-squad-2026",
      projectId: engProject.id,
      email: "eng-candidate@company.com",
      role: "member",
      invitedById: engLead.id,
      expiresAt: inviteExpires,
    },
  });

  // ==========================================
  // 4. PILOT TEAM 2: Operations & Growth (pilot-team-ops)
  // ==========================================
  const opsProject = await prisma.project.upsert({
    where: { id: "pilot-team-ops" },
    update: {
      name: "ทีมปฏิบัติการและการเติบโต (Operations & Growth)",
      description: "นำร่องทีมปฏิบัติการ: ออนบอร์ดลูกค้าองค์กร, บริหารจัดการ Playbook และยกระดับ SLA",
      progressPercent: 35,
    },
    create: {
      id: "pilot-team-ops",
      name: "ทีมปฏิบัติการและการเติบโต (Operations & Growth)",
      description: "นำร่องทีมปฏิบัติการ: ออนบอร์ดลูกค้าองค์กร, บริหารจัดการ Playbook และยกระดับ SLA",
      status: "ACTIVE",
      progressPercent: 35,
    },
  });

  for (const user of [opsLead, opsMember1, opsMember2]) {
    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: opsProject.id, userId: user.id } },
      update: { role: user.id === opsLead.id ? "lead" : "member" },
      create: {
        projectId: opsProject.id,
        userId: user.id,
        role: user.id === opsLead.id ? "lead" : "member",
      },
    });
  }

  await prisma.objective.deleteMany({ where: { projectId: opsProject.id } });
  const opsObj1 = await prisma.objective.create({
    data: {
      projectId: opsProject.id,
      name: "ส่งมอบประสบการณ์นำร่ององค์กรอย่างราบรื่น",
      description: "จัดทำเอกสารและออนบอร์ด 5 องค์กรแรกให้เสร็จสมบูรณ์",
      weight: 100,
      sortOrder: 0,
    },
  });

  const opsMs1 = await prisma.milestone.create({
    data: {
      objectiveId: opsObj1.id,
      name: "ออนบอร์ดลูกค้าองค์กรนำร่อง",
      successCriteria: "มีองค์กรผ่านการอบรมและเริ่มทดลองบันทึกงานจริงอย่างน้อย 3 องค์กร",
      weight: 60,
      status: "IN_PROGRESS",
      sortOrder: 0,
    },
  });

  const opsMs2 = await prisma.milestone.create({
    data: {
      objectiveId: opsObj1.id,
      name: "จัดทำคู่มือ Playbook ปฏิบัติการ",
      successCriteria: "คู่มือกระบวนการแก้ปัญหาหน้างานเสร็จสมบูรณ์ 100%",
      weight: 40,
      status: "ACHIEVED",
      sortOrder: 1,
    },
  });

  await prisma.kpi.create({
    data: {
      milestoneId: opsMs1.id,
      name: "จำนวนองค์กรที่เริ่มใช้งานรายวัน",
      unit: "องค์กร",
      targetValue: 5,
      currentValue: 3,
      weight: 60,
      status: "IN_PROGRESS",
    },
  });

  await prisma.kpi.create({
    data: {
      milestoneId: opsMs2.id,
      name: "ความครบถ้วนของ Playbook",
      unit: "%",
      targetValue: 100,
      currentValue: 100,
      weight: 40,
      status: "ACHIEVED",
    },
  });

  await prisma.workItem.deleteMany({ where: { projectId: opsProject.id } });
  await prisma.workItem.createMany({
    data: [
      {
        projectId: opsProject.id,
        title: "จัดประชุม Workshop ออนบอร์ดทีมนำร่องที่ 1",
        description: "อบรมวิธีการบันทึกงาน High Impact Action และการส่งข้อโต้แย้ง",
        status: "DONE",
        assigneeId: opsMember1.id,
      },
      {
        projectId: opsProject.id,
        title: "สรุปคำถามพบบ่อย (FAQ) และข้อเสนอแนะเรื่องถ้อยคำภาษาไทย",
        description: "รวบรวมฟีดแบ็กหน้างานเพื่อนำมา Calibrate Prompt AI",
        status: "IN_PROGRESS",
        assigneeId: opsMember2.id,
      },
      {
        projectId: opsProject.id,
        title: "ประสานงานกำหนดเกณฑ์สัดส่วน Merit กับฝ่ายทรัพยากรบุคคล",
        description: "นำแบบฟอร์มสัดส่วน ContributionShare ไปจัดทำกรอบโบนัสองค์กร",
        status: "TODO",
        assigneeId: opsMember2.id,
      },
    ],
  });

  await prisma.evaluationPeriod.deleteMany({ where: { projectId: opsProject.id } });
  await prisma.evaluationPeriod.create({
    data: {
      projectId: opsProject.id,
      periodStart: weekStart,
      periodEnd: weekEnd,
      status: "OPEN",
    },
  });

  await prisma.projectInvite.upsert({
    where: { token: "invite-ops-squad-2026" },
    update: { email: "ops-partner@company.com", expiresAt: inviteExpires, acceptedAt: null },
    create: {
      token: "invite-ops-squad-2026",
      projectId: opsProject.id,
      email: "ops-partner@company.com",
      role: "member",
      invitedById: opsLead.id,
      expiresAt: inviteExpires,
    },
  });

  console.log("=========================================");
  console.log(" Seed Pilot Teams สำเร็จเรียบร้อย!");
  console.log("=========================================");
  console.log("1) ทีมสาธิตเดิม: project-demo-001");
  console.log("   - เข้าสู่ระบบ: lead@arween.demo / demo1234");
  console.log("   - สมาชิก: somying@arween.demo / demo1234");
  console.log("   - ลิงก์เชิญ: /invite/demo-invite-token-arween-001");
  console.log("-----------------------------------------");
  console.log("2) ทีมวิศวกรรม: pilot-team-eng");
  console.log("   - หัวหน้า: eng.lead@arween.demo / demo1234");
  console.log("   - สมาชิก 1 (Backend): dev.backend@arween.demo / demo1234");
  console.log("   - สมาชิก 2 (Frontend): dev.frontend@arween.demo / demo1234");
  console.log("   - ลิงก์เชิญ: /invite/invite-eng-squad-2026");
  console.log("-----------------------------------------");
  console.log("3) ทีมปฏิบัติการ: pilot-team-ops");
  console.log("   - หัวหน้า: ops.lead@arween.demo / demo1234");
  console.log("   - สมาชิก 1 (Support): ops.support@arween.demo / demo1234");
  console.log("   - สมาชิก 2 (Partner): ops.partner@arween.demo / demo1234");
  console.log("   - ลิงก์เชิญ: /invite/invite-ops-squad-2026");
  console.log("=========================================");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
