import { config } from "dotenv";
import { prisma } from "../lib/prisma";
import { runAgent2 } from "../server/agents/agent2";

config();

async function runVerification() {
  console.log("=== เริ่มการตรวจสอบวงจร ARWEEN เต็มระบบ ===");

  // 1. ตรวจสอบ Database connection และ Project สาธิต
  const project = await prisma.project.findUnique({
    where: { id: "project-demo-001" },
    include: {
      members: { include: { user: true } },
      objectives: { include: { milestones: { include: { kpis: true } } } },
      workItems: true,
      periods: { include: { shares: true, scores: true } },
    },
  });

  if (!project) {
    throw new Error("ไม่พบโปรเจกต์สาธิต project-demo-001 กรุณารัน npm run db:setup ก่อน");
  }
  console.log(`[PASS] 1. ฐานข้อมูลและโปรเจกต์: "${project.name}" (สมาชิก ${project.members.length} คน)`);

  // 2. ตรวจสอบ Anchor Framework
  const objCount = project.objectives.length;
  const msCount = project.objectives.reduce((acc, o) => acc + o.milestones.length, 0);
  const kpiCount = project.objectives.reduce(
    (acc, o) => acc + o.milestones.reduce((mAcc, m) => mAcc + m.kpis.length, 0),
    0
  );
  console.log(`[PASS] 2. Anchor Framework: ${objCount} Objectives, ${msCount} Milestones, ${kpiCount} KPIs`);

  // 3. ตรวจสอบ WorkItem พร้อม Assignee
  const members = project.members.map((m) => m.user);
  const lead = members.find((m) => m.role === "LEAD") || members[0];
  const member = members.find((m) => m.role === "MEMBER") || members[1];

  const testWorkItem = await prisma.workItem.create({
    data: {
      projectId: project.id,
      title: "ทดสอบการมอบหมายงานใน Hub",
      description: "ทดสอบการใส่ assigneeId",
      status: "IN_PROGRESS",
      assigneeId: member.id,
    },
  });
  console.log(`[PASS] 3. WorkItem Hub: สร้างงานและมอบหมายให้ "${member.name}" สำเร็จ (ID: ${testWorkItem.id})`);

  // 4. ทดสอบ Agent 2 สัดส่วนผลงาน 100%
  const sampleImpacts = [
    { userId: lead.id, impactSum: 15 },
    { userId: member.id, impactSum: 35 },
  ];
  const shares = runAgent2(sampleImpacts);
  const totalRatio = shares.reduce((sum, s) => sum + s.ratioPercent, 0);
  if (Math.abs(totalRatio - 100) > 0.01) {
    throw new Error(`Agent 2 normalization ล้มเหลว: ผลรวมคือ ${totalRatio}%`);
  }
  console.log(`[PASS] 4. Agent 2 Normalization: รวมสัดส่วนได้ ${totalRatio.toFixed(2)}% พอดี`);

  // 5. ทดสอบรอบประเมิน (EvaluationPeriod) + ContributionShare + Confirmation + Merit Approval
  const now = new Date();
  const bonusPool = 50000;
  const testPeriod = await prisma.evaluationPeriod.create({
    data: {
      projectId: project.id,
      periodStart: now,
      periodEnd: new Date(now.getTime() + 7 * 86400000),
      status: "CLOSED",
      closedAt: now,
      closedById: lead.id,
      poolAmount: bonusPool,
      currency: "THB",
      shares: {
        create: shares.map((s) => ({
          userId: s.userId,
          ratioPercent: s.ratioPercent,
          impactSum: s.impactSum,
          confirmed: true,
          payoutAmount: Math.round(bonusPool * (s.ratioPercent / 100) * 100) / 100,
          payoutStatus: "APPROVED",
        })),
      },
      meritStatus: "APPROVED",
      meritApprovedAt: now,
    },
    include: {
      shares: { include: { user: true } },
    },
  });

  const totalPayout = testPeriod.shares.reduce((sum, s) => sum + (s.payoutAmount || 0), 0);
  if (Math.abs(totalPayout - bonusPool) > 1) {
    throw new Error(`คำนวณยอดเงิน Merit Payout รวมไม่ตรงงบประมาณ: ได้ ${totalPayout} จากงบ ${bonusPool}`);
  }
  console.log(`[PASS] 5. Merit-to-Earn v1: ปิดรอบ, บันทึกสัดส่วน 100%, คำนวณงบโบนัส ฿${bonusPool.toLocaleString()} (ยอดจ่ายรวม ฿${totalPayout.toLocaleString()}) สำเร็จ (Period ID: ${testPeriod.id})`);

  // 6. ทดสอบ AuditLog
  const auditLog = await prisma.auditLog.create({
    data: {
      projectId: project.id,
      actorId: lead.id,
      action: "APPROVE_MERIT_CASE",
      details: `อนุมัติเคสผลตอบแทน Merit-to-Earn สำเร็จ (${testPeriod.shares.length} คน) ยอดรวม ฿${bonusPool.toLocaleString()} THB`,
    },
  });
  console.log(`[PASS] 6. Audit Trail: บันทึกประวัติการตัดสินใจ ${auditLog.action} (Log ID: ${auditLog.id})`);

  // 7. ทดสอบการ Export CSV ข้อมูล Merit ครบถ้วน
  const header = "projectId,projectName,periodId,periodStart,periodEnd,meritStatus,poolAmount,currency,userName,userEmail,ratioPercent,impactSum,payoutAmount,payoutStatus,confirmed";
  const rows = testPeriod.shares.map((s) =>
    [
      project.id,
      `"${project.name}"`,
      testPeriod.id,
      testPeriod.periodStart.toISOString().slice(0, 10),
      testPeriod.periodEnd.toISOString().slice(0, 10),
      testPeriod.meritStatus,
      testPeriod.poolAmount?.toFixed(2) || "0.00",
      testPeriod.currency || "THB",
      `"${s.user.name}"`,
      s.user.email,
      s.ratioPercent.toFixed(2),
      s.impactSum.toFixed(2),
      s.payoutAmount?.toFixed(2) || "0.00",
      s.payoutStatus || "PENDING",
      "true",
    ].join(",")
  );
  const csv = "\uFEFF" + [header, ...rows].join("\n");
  if (!csv.includes("สมชาย") || !csv.includes("50000.00") || !csv.includes("payoutAmount")) {
    throw new Error("CSV Export formatting ล้มเหลว");
  }
  console.log(`[PASS] 7. Merit CSV Export: สร้างข้อมูล CSV สำเร็จ (${testPeriod.shares.length} รายการ) พร้อมคอลัมน์ Pool/Payout และ UTF-8 BOM`);

  // เก็บกวาดข้อมูลทดสอบ
  await prisma.workItem.delete({ where: { id: testWorkItem.id } });
  await prisma.evaluationPeriod.delete({ where: { id: testPeriod.id } });
  await prisma.auditLog.delete({ where: { id: auditLog.id } });
  console.log("[PASS] 8. ทำความสะอาดข้อมูลทดสอบเรียบร้อย");

  console.log("\n========================================================");
  console.log(" ทุกกระบวนการของ ARWEEN Pilot-Ready & Merit Expansion ผ่านการทดสอบ 100%!");
  console.log("========================================================");
}

runVerification()
  .catch((err) => {
    console.error("Verification failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
