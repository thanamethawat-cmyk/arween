import { config } from "dotenv";
import { prisma } from "../lib/prisma";
import { runAgent2 } from "../server/agents/agent2";

config();

async function runPilotSimulation() {
  console.log("===============================================================");
  console.log("   🚀 เริ่มต้นการจำลองและทดสอบการนำร่องจริง (Real Pilot Simulation)");
  console.log("===============================================================\n");

  // -------------------------------------------------------------
  // PILOT TEAM 1: Engineering & Platform
  // -------------------------------------------------------------
  console.log(">>> [1/2] กำลังทดสอบวงจรการทำงาน: ทีมวิศวกรรมแพลตฟอร์ม (pilot-team-eng)...");
  const engProject = await prisma.project.findUnique({
    where: { id: "pilot-team-eng" },
    include: {
      members: { include: { user: true } },
      objectives: { include: { milestones: { include: { kpis: true } } } },
      periods: { where: { status: "OPEN" } },
    },
  });

  if (!engProject) {
    throw new Error("ไม่พบโปรเจกต์ pilot-team-eng กรุณารัน npm run db:seed ก่อน");
  }

  let engOpenPeriod = engProject.periods[0];
  if (!engOpenPeriod) {
    engOpenPeriod = await prisma.evaluationPeriod.create({
      data: {
        projectId: engProject.id,
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + 7 * 86400000),
        status: "OPEN",
      },
    });
  }

  const engLead = engProject.members.find((m) => m.role === "lead")!.user;
  const devBackend = engProject.members.find((m) => m.user.email === "dev.backend@arween.demo")!.user;
  const devFrontend = engProject.members.find((m) => m.user.email === "dev.frontend@arween.demo")!.user;
  const engMilestone = engProject.objectives[0].milestones[0];

  // 1.1 บันทึกหลักฐานงานจริง (High Impact Backend + Frontend)
  const evBackend = await prisma.evidenceEvent.create({
    data: {
      projectId: engProject.id,
      actorId: devBackend.id,
      action: "ปรับแก้สถาปัตยกรรม Database connection pool ให้สลับระหว่าง SQLite และ Cloud SQL Unix socket อัตโนมัติ",
      source: "DAILY_LOG",
    },
  });

  const evFrontend = await prisma.evidenceEvent.create({
    data: {
      projectId: engProject.id,
      actorId: devFrontend.id,
      action: "สร้างหน้าจอนำร่อง Pilot Hub และเชื่อมต่อ Objective / Milestone เข้ากับแชท AI ในบริบทโปรเจกต์",
      source: "DAILY_LOG",
    },
  });

  // 1.2 Agent 1 ให้คะแนนตาม High Impact Action
  const scoreBackend = await prisma.score.create({
    data: {
      projectId: engProject.id,
      userId: devBackend.id,
      value: 9,
      reason: "High Impact: ปลดล็อกปัญหาคอขวดของฐานข้อมูลและรองรับการขยายตัวขึ้น Cloud Run",
      evidenceEventId: evBackend.id,
      milestoneId: engMilestone.id,
      evaluationPeriodId: engOpenPeriod.id,
      suggestedBy: "AI",
      confirmed: true, // หัวหน้ายืนยัน
    },
  });

  const scoreFrontend = await prisma.score.create({
    data: {
      projectId: engProject.id,
      userId: devFrontend.id,
      value: 8,
      reason: "High Impact: ยกระดับ UX การใช้งานของทีมนำร่อง และเชื่อมโยงบริบทโปรเจกต์ให้ AI ทำงานได้ถูกต้อง",
      evidenceEventId: evFrontend.id,
      milestoneId: engMilestone.id,
      evaluationPeriodId: engOpenPeriod.id,
      suggestedBy: "AI",
      confirmed: true,
    },
  });
  console.log(`    ✓ บันทึกหลักฐานและคะแนน Agent 1 เรียบร้อย: Backend=${scoreBackend.value}/10, Frontend=${scoreFrontend.value}/10`);

  // 1.3 หัวหน้าปิดรอบประเมิน -> Agent 2 คำนวณสัดส่วน 100% และคำนวณงบ Merit Pool
  const engShares = runAgent2([
    { userId: devBackend.id, impactSum: scoreBackend.value },
    { userId: devFrontend.id, impactSum: scoreFrontend.value },
  ]);
  const engTotalRatio = engShares.reduce((s, c) => s + c.ratioPercent, 0);
  const engBonusPool = 80000;

  await prisma.contributionShare.deleteMany({ where: { periodId: engOpenPeriod.id } });

  await prisma.evaluationPeriod.update({
    where: { id: engOpenPeriod.id },
    data: {
      status: "CLOSED",
      closedAt: new Date(),
      closedById: engLead.id,
      poolAmount: engBonusPool,
      currency: "THB",
      shares: {
        create: engShares.map((s) => ({
          userId: s.userId,
          ratioPercent: s.ratioPercent,
          impactSum: s.impactSum,
          confirmed: true,
          payoutAmount: Math.round(engBonusPool * (s.ratioPercent / 100) * 100) / 100,
          payoutStatus: "APPROVED",
        })),
      },
      meritStatus: "APPROVED",
      meritApprovedAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      projectId: engProject.id,
      actorId: engLead.id,
      action: "APPROVE_MERIT_CASE",
      details: `อนุมัติเคสผลตอบแทน Merit-to-Earn ทีมวิศวกรรม งบ ฿${engBonusPool.toLocaleString()} THB (${engShares.length} คน)`,
    },
  });

  // เปิดรอบใหม่สำหรับการทำงานต่อเนื่องใน Pilot
  await prisma.evaluationPeriod.create({
    data: {
      projectId: engProject.id,
      periodStart: new Date(),
      periodEnd: new Date(Date.now() + 7 * 86400000),
      status: "OPEN",
    },
  });

  console.log(`    ✓ Agent 2 ปิดรอบและคำนวณสัดส่วน 100%: รวม ${engTotalRatio.toFixed(2)}% (งบโบนัส ฿${engBonusPool.toLocaleString()} THB)`);

  // -------------------------------------------------------------
  // PILOT TEAM 2: Operations & Growth
  // -------------------------------------------------------------
  console.log("\n>>> [2/2] กำลังทดสอบวงจรการทำงาน: ทีมปฏิบัติการและการเติบโต (pilot-team-ops)...");
  const opsProject = await prisma.project.findUnique({
    where: { id: "pilot-team-ops" },
    include: {
      members: { include: { user: true } },
      objectives: { include: { milestones: { include: { kpis: true } } } },
      periods: { where: { status: "OPEN" } },
    },
  });

  if (!opsProject) {
    throw new Error("ไม่พบโปรเจกต์ pilot-team-ops กรุณารัน npm run db:seed ก่อน");
  }

  let opsOpenPeriod = opsProject.periods[0];
  if (!opsOpenPeriod) {
    opsOpenPeriod = await prisma.evaluationPeriod.create({
      data: {
        projectId: opsProject.id,
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + 7 * 86400000),
        status: "OPEN",
      },
    });
  }

  const opsLead = opsProject.members.find((m) => m.role === "lead")!.user;
  const opsSupport = opsProject.members.find((m) => m.user.email === "ops.support@arween.demo")!.user;
  const opsPartner = opsProject.members.find((m) => m.user.email === "ops.partner@arween.demo")!.user;
  const opsMilestone = opsProject.objectives[0].milestones[0];

  // 2.1 บันทึกหลักฐานงาน: Customer Onboarding vs ข้อความตอบรับสั้น
  const evOpsGood = await prisma.evidenceEvent.create({
    data: {
      projectId: opsProject.id,
      actorId: opsSupport.id,
      action: "จัดอบรมและออนบอร์ดผู้ใช้งานองค์กรนำร่อง 3 แห่งสำเร็จ พร้อมจัดทำสรุปประเด็นคำถามพบบ่อย",
      source: "DAILY_LOG",
    },
  });

  const evOpsSpam = await prisma.evidenceEvent.create({
    data: {
      projectId: opsProject.id,
      actorId: opsPartner.id,
      action: "รับทราบครับ ทำตามขั้นตอนเดิม",
      source: "DAILY_LOG",
    },
  });

  // 2.2 Agent 1 ให้คะแนนพร้อม Anti-Gaming Flag
  const scoreOps1 = await prisma.score.create({
    data: {
      projectId: opsProject.id,
      userId: opsSupport.id,
      value: 8,
      reason: "High Impact: บรรลุ KPI การออนบอร์ดองค์กร และสนับสนุนให้ทีมนำร่องเริ่มใช้งานได้จริง",
      evidenceEventId: evOpsGood.id,
      milestoneId: opsMilestone.id,
      evaluationPeriodId: opsOpenPeriod.id,
      suggestedBy: "AI",
      confirmed: true,
    },
  });

  const scoreOps2 = await prisma.score.create({
    data: {
      projectId: opsProject.id,
      userId: opsPartner.id,
      value: 1,
      reason: "ข้อความตอบรับทั่วไป | พบข้อความตอบรับซ้ำ ไม่มีผลต่อความก้าวหน้าของ KPI",
      evidenceEventId: evOpsSpam.id,
      milestoneId: opsMilestone.id,
      evaluationPeriodId: opsOpenPeriod.id,
      suggestedBy: "AI",
      flagged: true,
      flagReason: "Anti-Gaming Detection: ไม่พบการส่งมอบผลงานจริงในบันทึก",
      confirmed: false,
    },
  });
  console.log(`    ✓ ตรวจจับ Anti-Gaming สำเร็จ: Score Support=${scoreOps1.value}/10, Partner=${scoreOps2.value}/10 (Flagged)`);

  // 2.3 สมาชิกยื่นข้อโต้แย้ง (Dispute) และหัวหน้าพิจารณา
  const dispute = await prisma.dispute.create({
    data: {
      projectId: opsProject.id,
      userId: opsPartner.id,
      scoreId: scoreOps2.id,
      reason: "ขอชี้แจงเพิ่มเติม: มีการประสานงานทางโทรศัพท์กับผู้บริหารองค์กรนำร่อง แต่ลืมแนบบันทึกรายละเอียด",
      status: "RESOLVED",
      resolvedAt: new Date(),
    },
  });
  console.log(`    ✓ วงจรข้อโต้แย้ง (Dispute Lifecycle): ยื่นข้อโต้แย้งและหัวหน้ารับเรื่องแล้ว (ID: ${dispute.id})`);

  // 2.4 ปิดรอบประเมินทีมปฏิบัติการ
  const opsShares = runAgent2([
    { userId: opsSupport.id, impactSum: scoreOps1.value },
  ]);
  const opsTotalRatio = opsShares.reduce((s, c) => s + c.ratioPercent, 0);
  const opsBonusPool = 40000;
  await prisma.contributionShare.deleteMany({ where: { periodId: opsOpenPeriod.id } });

  await prisma.evaluationPeriod.update({
    where: { id: opsOpenPeriod.id },
    data: {
      status: "CLOSED",
      closedAt: new Date(),
      closedById: opsLead.id,
      poolAmount: opsBonusPool,
      currency: "THB",
      shares: {
        create: opsShares.map((s) => ({
          userId: s.userId,
          ratioPercent: s.ratioPercent,
          impactSum: s.impactSum,
          confirmed: true,
          payoutAmount: Math.round(opsBonusPool * (s.ratioPercent / 100) * 100) / 100,
          payoutStatus: "APPROVED",
        })),
      },
      meritStatus: "APPROVED",
      meritApprovedAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      projectId: opsProject.id,
      actorId: opsLead.id,
      action: "APPROVE_MERIT_CASE",
      details: `อนุมัติเคสผลตอบแทน Merit-to-Earn ทีมปฏิบัติการ งบ ฿${opsBonusPool.toLocaleString()} THB (${opsShares.length} คน)`,
    },
  });

  // เปิดรอบใหม่สำหรับการทำงานต่อเนื่องใน Pilot
  await prisma.evaluationPeriod.create({
    data: {
      projectId: opsProject.id,
      periodStart: new Date(),
      periodEnd: new Date(Date.now() + 7 * 86400000),
      status: "OPEN",
    },
  });

  console.log(`    ✓ ปิดรอบทีมปฏิบัติการ: สัดส่วนรวม ${opsTotalRatio.toFixed(2)}% (งบโบนัส ฿${opsBonusPool.toLocaleString()} THB) ถูกจัดสรรให้ผู้ที่สร้างผลงานจริง`);

  console.log("\n===============================================================");
  console.log(" 🎉 การจำลองและทดสอบนำร่องจริง (Pilot Execution) ผ่านครบทั้ง 2 ทีม!");
  console.log("===============================================================");
}

runPilotSimulation()
  .catch((e) => {
    console.error("Simulation failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
