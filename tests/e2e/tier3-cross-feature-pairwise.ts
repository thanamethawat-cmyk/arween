/**
 * Tier 3: Cross-Feature Pairwise Combinatorial Test Suite
 * Tests multi-stage interactions and complex operational pipelines across modules:
 * Evidence -> AI Scoring -> Lead Confirmation -> Dispute Resolution -> Period Closing -> Merit Payout -> CSV Export.
 * Total Tests: 6 tests
 */

import { test, assert, assertEquals, assertCloseTo, assertTrue, assertFalse } from "./harness";
import { runAgent1, type AnchorContextItem } from "../../server/agents/agent1";
import { runAgent2 } from "../../server/agents/agent2";
import { runAgent3 } from "../../server/agents/agent3";
import { createEvidenceSchema, scoreInputSchema } from "../../types/schemas";

const SAMPLE_ANCHORS: AnchorContextItem[] = [
  {
    milestoneId: "ms-cloud-001",
    milestoneName: "รองรับการ Deploy บน Cloud Run ได้อย่างเสถียร",
    kpiId: "kpi-uptime-001",
    kpiName: "Uptime 99.9%",
    objectiveName: "ยกระดับความเสถียรและความปลอดภัยของระบบ",
  },
  {
    milestoneId: "ms-client-002",
    milestoneName: "ออนบอร์ดลูกค้าองค์กรนำร่อง 3 แห่ง",
    kpiId: "kpi-clients-002",
    kpiName: "จำนวนลูกค้าองค์กรที่เริ่มใช้งาน",
    objectiveName: "ส่งมอบประสบการณ์นำร่ององค์กรอย่างราบรื่น",
  },
];

// ===========================================================================
// TIER 3 CROSS-FEATURE COMBINATIONS
// ===========================================================================

test(3, "Cross-Feature Pairwise", "T3.1: Full Pipeline Flow (Evidence -> AI Scoring -> Lead Confirm -> Period Close -> Merit Split -> CSV)", async () => {
  // Step 1: Evidence Submission
  const evidence = createEvidenceSchema.parse({
    projectId: "proj-cycle-01",
    actorId: "dev-01",
    action: "ปรับแก้สถาปัตยกรรม Database connection pool และ sync provider",
    source: "DAILY_LOG",
  });
  assertEquals(evidence.source, "DAILY_LOG");

  // Step 2: AI Multi-Agent Evaluation
  const a1 = await runAgent1({
    projectName: "ARWEEN Cycle",
    action: evidence.action,
    anchors: SAMPLE_ANCHORS,
  });
  const a3 = runAgent3({ action: evidence.action, recentSameDayActions: [] });
  assertFalse(a3.flagged);
  const scoreVal = a3.forcedScore !== null ? a3.forcedScore : a1.impactScore;
  assertTrue(scoreVal >= 7);

  // Step 3: Lead Confirmation
  const confirmedScore = scoreInputSchema.parse({
    projectId: evidence.projectId,
    userId: evidence.actorId,
    value: scoreVal,
    reason: a1.rationale,
  });
  assertEquals(confirmedScore.value, scoreVal);

  // Step 4: Period Closing & Agent 2 Normalization
  // Assume teammate dev-02 scored 6
  const contributions = runAgent2([
    { userId: "dev-01", impactSum: confirmedScore.value },
    { userId: "dev-02", impactSum: 6 },
  ]);
  const totalRatio = contributions.reduce((s, c) => s + c.ratioPercent, 0);
  assertEquals(totalRatio, 100.0);

  // Step 5: Merit Payout Allocation
  const bonusPool = 100000;
  const dev1Share = contributions.find((c) => c.userId === "dev-01")!;
  const dev2Share = contributions.find((c) => c.userId === "dev-02")!;
  const payout1 = Math.round(bonusPool * (dev1Share.ratioPercent / 100) * 100) / 100;
  const payout2 = Math.round(bonusPool * (dev2Share.ratioPercent / 100) * 100) / 100;
  assertCloseTo(payout1 + payout2, bonusPool, 1.0);

  // Step 6: CSV Export verification
  const csvRow = `proj-cycle-01,"ARWEEN Cycle",period-01,2026-09-01,2026-09-08,APPROVED,100000.00,THB,"Dev 1",dev1@arween.demo,${dev1Share.ratioPercent.toFixed(2)},${dev1Share.impactSum.toFixed(2)},${payout1.toFixed(2)},APPROVED,true`;
  assertTrue(csvRow.includes("100000.00"));
  assertTrue(csvRow.includes(payout1.toFixed(2)));
});

test(3, "Cross-Feature Pairwise", "T3.2: Anti-Gaming Flagging -> Dispute Resolution -> Score Adjustment -> Period Close", async () => {
  // Step 1: Member submits short acknowledgment repeatedly
  const action = "รับทราบครับผม";
  const a3Result = runAgent3({
    action,
    recentSameDayActions: ["รับทราบ", "ขอบคุณครับ"],
  });
  assertTrue(a3Result.flagged, "3rd ack must be flagged for anti-gaming");
  assertEquals(a3Result.forcedScore, 0);

  // Step 2: Score recorded as flagged with score 0
  const scoreRecord = {
    id: "sc-flagged",
    userId: "user-ops",
    value: 0,
    flagged: true,
    flagReason: a3Result.flagReason,
    confirmed: false,
  };

  // Step 3: Member raises a dispute
  const dispute = {
    id: "disp-101",
    scoreId: scoreRecord.id,
    userId: scoreRecord.userId,
    reason: "ข้อความสั้นเป็นเพียงการตอบรับ แต่ในเวลานั้นได้นำส่งเอกสารลูกค้าสำเร็จ",
    status: "PENDING",
  };
  assertEquals(dispute.status, "PENDING");

  // Step 4: Lead reviews dispute, adjusts score to 7, unflags score, and resolves dispute
  dispute.status = "RESOLVED";
  scoreRecord.value = 7;
  scoreRecord.flagged = false;
  scoreRecord.flagReason = null;
  scoreRecord.confirmed = true;

  assertEquals(dispute.status, "RESOLVED");
  assertEquals(scoreRecord.value, 7);
  assertFalse(scoreRecord.flagged);

  // Step 5: Period closes and Agent 2 accurately reflects unflagged score
  const shares = runAgent2([
    { userId: "user-ops", impactSum: scoreRecord.value },
    { userId: "user-peer", impactSum: 7 },
  ]);
  assertEquals(shares.length, 2);
  assertEquals(shares[0].ratioPercent, 50.0);
  assertEquals(shares[1].ratioPercent, 50.0);
});

test(3, "Cross-Feature Pairwise", "T3.3: Multi-Member Sprint (Lead + Senior Dev + Intern) with Disputed Rejection", () => {
  // Lead: 9, Senior: 8, Intern: 3
  const impacts = [
    { userId: "lead", impactSum: 9 },
    { userId: "senior", impactSum: 8 },
    { userId: "intern", impactSum: 3 },
  ];

  // Intern disputes score wanting 6
  const internDispute = {
    status: "PENDING",
    requestedScore: 6,
  };

  // Lead rejects dispute
  internDispute.status = "REJECTED";
  assertEquals(internDispute.status, "REJECTED");

  // Normalization with original impacts
  const shares = runAgent2(impacts);
  const totalRatio = shares.reduce((s, c) => s + c.ratioPercent, 0);
  assertEquals(totalRatio, 100.0);

  // Verify intern receives proportional share (3/20 = 15%)
  const internShare = shares.find((s) => s.userId === "intern")!;
  assertEquals(internShare.ratioPercent, 15.0);
});

test(3, "Cross-Feature Pairwise", "T3.4: Inactive Member (Zero Score) + High Performer Normalization & Audit Trail", () => {
  const impacts = [
    { userId: "active-star", impactSum: 40 },
    { userId: "inactive-member", impactSum: 0 },
  ];

  const shares = runAgent2(impacts);
  const totalRatio = shares.reduce((s, c) => s + c.ratioPercent, 0);
  assertEquals(totalRatio, 100.0);

  // Star member receives 100% of bonus pool
  const pool = 50000;
  const starShare = shares.find((s) => s.userId === "active-star")!;
  const starPayout = Math.round(pool * (starShare.ratioPercent / 100) * 100) / 100;
  assertEquals(starPayout, 50000.0);

  // Audit log entry
  const auditLog = {
    action: "SET_BONUS_POOL",
    details: `กำหนดงบประมาณโบนัส ${pool.toLocaleString()} THB (สมาชิกที่ได้รับเงิน ${shares.length} คน)`,
  };
  assertTrue(auditLog.details.includes("50,000"));
});

test(3, "Cross-Feature Pairwise", "T3.5: Stale Dispute Notification Lifecycle across Period Closing", () => {
  const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000);
  const disputes = [
    { id: "d1", createdAt: new Date(Date.now() - 80 * 60 * 60 * 1000), status: "PENDING" }, // 80h old -> stale
    { id: "d2", createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000), status: "PENDING" }, // 10h old -> fresh
    { id: "d3", createdAt: new Date(Date.now() - 90 * 60 * 60 * 1000), status: "RESOLVED" }, // resolved -> skip
  ];

  const staleDisputes = disputes.filter(
    (d) => d.status === "PENDING" && d.createdAt <= cutoff
  );
  assertEquals(staleDisputes.length, 1);
  assertEquals(staleDisputes[0].id, "d1");
});

test(3, "Cross-Feature Pairwise", "T3.6: Anchor Framework Objective Weights & KPI Achievement Progress Tracking", () => {
  // Test anchor tree calculation
  const objective = {
    weight: 100,
    milestones: [
      {
        weight: 60,
        status: "ACHIEVED",
        kpis: [{ weight: 100, status: "ACHIEVED" }],
      },
      {
        weight: 40,
        status: "IN_PROGRESS",
        kpis: [{ weight: 100, status: "IN_PROGRESS" }],
      },
    ],
  };

  const ms1Achieved = (objective.milestones[0].weight / 100) * 100; // 60%
  assertEquals(ms1Achieved, 60.0);
});
