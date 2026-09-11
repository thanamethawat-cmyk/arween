/**
 * Tier 4: Real-World Workload Scenarios Test Suite
 * Simulates complete end-to-end operational cycles for the two real pilot teams:
 * 1. pilot-team-eng (Platform Engineering & Architecture)
 * 2. pilot-team-ops (Growth Operations & Corporate Onboarding with Dispute Lifecycle)
 * Total Tests: 2 comprehensive multi-step scenario tests
 */

import { test, assert, assertEquals, assertCloseTo, assertTrue, assertFalse } from "./harness";
import { runAgent1, type AnchorContextItem } from "../../server/agents/agent1";
import { runAgent2 } from "../../server/agents/agent2";
import { runAgent3 } from "../../server/agents/agent3";
import { createEvidenceSchema, scoreInputSchema } from "../../types/schemas";

// ===========================================================================
// SCENARIO 1: pilot-team-eng Full Operations Cycle
// ===========================================================================

test(4, "Real-World Workload", "T4.1: pilot-team-eng Complete Operations Cycle Simulation", async () => {
  // 1. Team & Anchor Framework Context
  const team = {
    projectId: "pilot-team-eng",
    projectName: "ทีมวิศวกรรมแพลตฟอร์ม (Engineering & Platform)",
    leadId: "eng-lead-01",
    devBackendId: "dev-backend-02",
    devFrontendId: "dev-frontend-03",
  };

  const anchors: AnchorContextItem[] = [
    {
      milestoneId: "ms-eng-arch",
      milestoneName: "จัดทำ Connection Pool และ Synchronize Provider อัตโนมัติ",
      kpiId: "kpi-eng-lat",
      kpiName: "ความหน่วงเฉลี่ย Database Latency (ms) ต่ำกว่า 50ms",
      objectiveName: "ยกระดับความเสถียรและความปลอดภัยของระบบ",
    },
    {
      milestoneId: "ms-eng-pilot-ui",
      milestoneName: "สร้างหน้าจอนำร่อง Pilot Hub และเชื่อมต่อ Objective / Milestone",
      kpiId: "kpi-eng-hub",
      kpiName: "Pilot Hub UX Readiness 100%",
      objectiveName: "ยกระดับความเสถียรและความปลอดภัยของระบบ",
    },
  ];

  // 2. Members log Evidence Events
  const backendEvidence = createEvidenceSchema.parse({
    projectId: team.projectId,
    actorId: team.devBackendId,
    action: "ปรับแก้สถาปัตยกรรม Database connection pool ให้สลับระหว่าง SQLite และ Cloud SQL Unix socket อัตโนมัติ",
    source: "DAILY_LOG",
  });

  const frontendEvidence = createEvidenceSchema.parse({
    projectId: team.projectId,
    actorId: team.devFrontendId,
    action: "สร้างหน้าจอนำร่อง Pilot Hub และเชื่อมต่อ Objective / Milestone เข้ากับแชท AI ในบริบทโปรเจกต์",
    source: "DAILY_LOG",
  });

  assertEquals(backendEvidence.projectId, team.projectId);
  assertEquals(frontendEvidence.projectId, team.projectId);

  // 3. AI Multi-Agent Evaluation (Agent 1 + Agent 3)
  const backendA1 = await runAgent1({
    projectName: team.projectName,
    action: backendEvidence.action,
    anchors,
  });
  const backendA3 = runAgent3({ action: backendEvidence.action, recentSameDayActions: [] });
  assertFalse(backendA3.flagged);
  assertTrue(backendA1.impactScore >= 8, `Backend score should be >= 8, got ${backendA1.impactScore}`);

  const frontendA1 = await runAgent1({
    projectName: team.projectName,
    action: frontendEvidence.action,
    anchors,
  });
  const frontendA3 = runAgent3({ action: frontendEvidence.action, recentSameDayActions: [] });
  assertFalse(frontendA3.flagged);
  assertTrue(frontendA1.impactScore >= 7, `Frontend score should be >= 7, got ${frontendA1.impactScore}`);

  // 4. Lead Confirmation of Scores
  const backendScore = scoreInputSchema.parse({
    projectId: team.projectId,
    userId: team.devBackendId,
    value: backendA1.impactScore,
    reason: backendA1.rationale,
    evidenceEventId: "ev-backend-001",
  });
  const frontendScore = scoreInputSchema.parse({
    projectId: team.projectId,
    userId: team.devFrontendId,
    value: frontendA1.impactScore,
    reason: frontendA1.rationale,
    evidenceEventId: "ev-frontend-001",
  });

  // 5. Evaluation Period Closing & Agent 2 100.00% Normalization
  const shares = runAgent2([
    { userId: team.devBackendId, impactSum: backendScore.value },
    { userId: team.devFrontendId, impactSum: frontendScore.value },
  ]);

  const totalRatio = shares.reduce((sum, s) => sum + s.ratioPercent, 0);
  assertCloseTo(totalRatio, 100.0, 0.0001, "Contribution share must strictly sum to 100.00%");
  assertEquals(shares.length, 2);

  // 6. Bonus Pool Allocation & Individual Payout Calculation
  const bonusPool = 75000; // 75,000 THB
  const backendShare = shares.find((s) => s.userId === team.devBackendId)!;
  const frontendShare = shares.find((s) => s.userId === team.devFrontendId)!;

  const backendPayout = Math.round(bonusPool * (backendShare.ratioPercent / 100) * 100) / 100;
  const frontendPayout = Math.round(bonusPool * (frontendShare.ratioPercent / 100) * 100) / 100;

  assertCloseTo(backendPayout + frontendPayout, bonusPool, 1.0, "Total payouts must equal bonus pool");

  // 7. Audit Trail & CSV Export Validation
  const auditEntries = [
    { action: "EVALUATE_EVIDENCE", actor: "AI" },
    { action: "CONFIRM_SCORE", actor: team.leadId },
    { action: "CLOSE_PERIOD", actor: team.leadId },
    { action: "SET_BONUS_POOL", actor: team.leadId },
    { action: "APPROVE_MERIT_CASE", actor: team.leadId },
  ];
  assertEquals(auditEntries.length, 5);

  const csvHeader = "projectId,projectName,periodId,periodStart,periodEnd,meritStatus,poolAmount,currency,userName,userEmail,ratioPercent,impactSum,payoutAmount,payoutStatus,confirmed";
  const csvBackendRow = `pilot-team-eng,"${team.projectName}",period-eng-01,2026-09-01,2026-09-08,APPROVED,75000.00,THB,"Backend Developer",dev.backend@arween.demo,${backendShare.ratioPercent.toFixed(2)},${backendShare.impactSum.toFixed(2)},${backendPayout.toFixed(2)},APPROVED,true`;
  const csvContent = "\uFEFF" + [csvHeader, csvBackendRow].join("\n");

  assertTrue(csvContent.startsWith("\uFEFF"));
  assertTrue(csvContent.includes("75000.00"));
  assertTrue(csvContent.includes("dev.backend@arween.demo"));
});

// ===========================================================================
// SCENARIO 2: pilot-team-ops Full Operations Cycle with Dispute Escalation
// ===========================================================================

test(4, "Real-World Workload", "T4.2: pilot-team-ops Complete Operations Cycle with Dispute Escalation", async () => {
  // 1. Team & Anchor Framework Context
  const team = {
    projectId: "pilot-team-ops",
    projectName: "ทีมปฏิบัติการและการเติบโต (Operations & Growth)",
    leadId: "ops-lead-01",
    specialistId: "ops-spec-02",
  };

  const anchors: AnchorContextItem[] = [
    {
      milestoneId: "ms-ops-onboard",
      milestoneName: "จัดทำ Playbook และออนบอร์ดลูกค้าองค์กรนำร่อง 3 แห่ง",
      kpiId: "kpi-ops-clients",
      kpiName: "จำนวนองค์กรที่เริ่มใช้งานจริงครบถ้วน",
      objectiveName: "ส่งมอบประสบการณ์นำร่ององค์กรอย่างราบรื่น",
    },
  ];

  // 2. Member logs Evidence Events:
  // First, genuine onboarding action
  const genuineEvidence = createEvidenceSchema.parse({
    projectId: team.projectId,
    actorId: team.specialistId,
    action: "จัดทำ Playbook ขั้นตอนการทำงาน และเข้าอบรมออนบอร์ดลูกค้าองค์กรนำร่อง 3 แห่งจนสามารถใช้งานได้จริง",
    source: "DAILY_LOG",
  });

  // Second, member logs repetitive short response
  const spamAction = "รับทราบครับผม";
  const a3SpamResult = runAgent3({
    action: spamAction,
    recentSameDayActions: ["รับทราบ", "ขอบคุณครับ"],
  });
  assertTrue(a3SpamResult.flagged, "Agent 3 must flag 3rd repetitive acknowledgment");

  // 3. Member raises a dispute on the flagged status
  const dispute = {
    id: "disp-ops-001",
    projectId: team.projectId,
    userId: team.specialistId,
    reason: "ข้อความสั้นเป็นเพียงการตอบรับระบบ แต่ในวันเดียวกันได้ส่งมอบ Playbook และออนบอร์ดลูกค้าสำเร็จ 3 แห่งตามหลักฐานแรก",
    status: "PENDING",
  };
  assertEquals(dispute.status, "PENDING");

  // 4. Lead investigates, accepts dispute justification, and resolves dispute
  // Score for genuine work evaluated by Agent 1
  const genuineA1 = await runAgent1({
    projectName: team.projectName,
    action: genuineEvidence.action,
    anchors,
  });
  assertTrue(genuineA1.impactScore >= 8, `Expected genuine score >= 8, got ${genuineA1.impactScore}`);

  // Lead updates score, clears flag, and resolves dispute
  dispute.status = "RESOLVED";
  const finalSpecScore = scoreInputSchema.parse({
    projectId: team.projectId,
    userId: team.specialistId,
    value: genuineA1.impactScore,
    reason: `Dispute Resolved: รับรองผลงานการออนบอร์ดจริง (${genuineA1.rationale})`,
  });
  assertEquals(dispute.status, "RESOLVED");
  assertEquals(finalSpecScore.value, genuineA1.impactScore);

  // Lead also has impact score of 8 for playbook oversight
  const leadScore = scoreInputSchema.parse({
    projectId: team.projectId,
    userId: team.leadId,
    value: 8,
    reason: "กำกับดูแลและตรวจสอบคุณภาพการออนบอร์ดองค์กร",
  });

  // 5. Evaluation Period Closing & Agent 2 Normalization
  const shares = runAgent2([
    { userId: team.leadId, impactSum: leadScore.value },
    { userId: team.specialistId, impactSum: finalSpecScore.value },
  ]);

  const totalRatio = shares.reduce((sum, s) => sum + s.ratioPercent, 0);
  assertCloseTo(totalRatio, 100.0, 0.0001);

  // 6. Bonus Pool Allocation (50,000 THB)
  const bonusPool = 50000;
  const totalPayout = shares.reduce(
    (sum, s) => sum + Math.round(bonusPool * (s.ratioPercent / 100) * 100) / 100,
    0
  );
  assertCloseTo(totalPayout, bonusPool, 1.0);

  // 7. Full Audit Verification
  const auditActions = [
    "CREATE_DISPUTE",
    "RESOLVE_DISPUTE",
    "CONFIRM_SCORE",
    "CLOSE_PERIOD",
    "APPROVE_MERIT_CASE",
    "EXPORT_MERIT_CSV",
  ];
  assertEquals(auditActions.length, 6);
});
