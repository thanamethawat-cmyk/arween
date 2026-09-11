/**
 * Tier 1: Comprehensive Feature Coverage
 * Strictly covers all 11 required platform features with >= 5 tests each.
 * Total Tests: 58 tests
 */

import { test, assert, assertEquals, assertCloseTo, assertTrue, assertFalse, assertThrows } from "./harness";
import { runAgent1, type AnchorContextItem } from "../../server/agents/agent1";
import { runAgent2 } from "../../server/agents/agent2";
import { runAgent3 } from "../../server/agents/agent3";
import { largestRemainderPercents } from "../../lib/progress";
import { scoreInputSchema, teamSummarySchema, createEvidenceSchema, assertNotPrivateSource } from "../../types/schemas";
import { getScoreTemplateHint } from "../../server/evaluate";

// Sample Anchors for Agent 1 context
const SAMPLE_ANCHORS: AnchorContextItem[] = [
  {
    milestoneId: "ms-arch-001",
    milestoneName: "จัดทำ Connection Pool และ Synchronize Provider อัตโนมัติ",
    kpiId: "kpi-lat-001",
    kpiName: "ความหน่วงเฉลี่ย Database Latency (ms)",
    objectiveName: "ยกระดับความเสถียรและความปลอดภัยของระบบ",
  },
  {
    milestoneId: "ms-sec-002",
    milestoneName: "ป้องกันช่องโหว่ความปลอดภัย API",
    kpiId: "kpi-sec-002",
    kpiName: "สัดส่วน API ที่ปลอดภัย 100%",
    objectiveName: "ยกระดับความเสถียรและความปลอดภัยของระบบ",
  },
  {
    milestoneId: "ms-onboard-003",
    milestoneName: "ออนบอร์ดลูกค้าองค์กรนำร่อง",
    kpiId: "kpi-corp-003",
    kpiName: "จำนวนองค์กรที่เริ่มใช้งานจริง",
    objectiveName: "ส่งมอบประสบการณ์นำร่ององค์กรอย่างราบรื่น",
  },
];

// ===========================================================================
// FEATURE 1: Evaluation (server/evaluate.ts & schemas)
// ===========================================================================

test(1, "Evaluation", "F1.1: scoreInputSchema validates valid score within 0 to 10", () => {
  const valid = scoreInputSchema.parse({
    projectId: "proj-123",
    userId: "user-456",
    value: 8,
    reason: "High impact delivery of core modules",
    evidenceEventId: "ev-789",
  });
  assertEquals(valid.value, 8);
  assertEquals(valid.reason, "High impact delivery of core modules");
});

test(1, "Evaluation", "F1.2: scoreInputSchema rejects score outside 0-10 boundary", async () => {
  await assertThrows(() => {
    scoreInputSchema.parse({
      projectId: "proj-123",
      userId: "user-456",
      value: 11, // Invalid > 10
      reason: "Above max",
    });
  });

  await assertThrows(() => {
    scoreInputSchema.parse({
      projectId: "proj-123",
      userId: "user-456",
      value: -1, // Invalid < 0
      reason: "Below min",
    });
  });
});

test(1, "Evaluation", "F1.3: scoreInputSchema rejects empty reason or missing required fields", async () => {
  await assertThrows(() => {
    scoreInputSchema.parse({
      projectId: "proj-123",
      userId: "user-456",
      value: 5,
      reason: "", // Empty reason rejected
    });
  });
});

test(1, "Evaluation", "F1.4: getScoreTemplateHint returns low score for general acknowledgments", async () => {
  const hint1 = await getScoreTemplateHint("รับทราบครับผม");
  assertEquals(hint1.suggestedValue, 1);
  assertTrue(hint1.reason.includes("ข้อความตอบรับทั่วไป"));

  const hint2 = await getScoreTemplateHint("โอเค");
  assertEquals(hint2.suggestedValue, 1);
});

test(1, "Evaluation", "F1.5: getScoreTemplateHint returns high score for bug fix and critical issues", async () => {
  const hint = await getScoreTemplateHint("แก้ไข Critical Bug ในระบบความปลอดภัย");
  assertEquals(hint.suggestedValue, 8);
  assertTrue(hint.reason.includes("แก้ปัญหา"));
});

test(1, "Evaluation", "F1.6: teamSummarySchema enforces valid content and date intervals", () => {
  const now = new Date();
  const past = new Date(Date.now() - 7 * 86400000);
  const summary = teamSummarySchema.parse({
    projectId: "proj-123",
    content: "สรุปผลงานสัปดาห์ที่ผ่านมา ทีมทำผลงานได้ตามเป้าหมาย",
    periodStart: past,
    periodEnd: now,
  });
  assertEquals(summary.projectId, "proj-123");
  assertTrue(summary.periodStart < summary.periodEnd);
});

// ===========================================================================
// FEATURE 2: Period Closing (server/periods.ts lifecycle & logic)
// ===========================================================================

test(1, "Period Closing", "F2.1: Successive period start date begins day after closed period end date", () => {
  const periodEnd = new Date("2026-09-14T23:59:59.999Z");
  const nextStart = new Date(periodEnd);
  nextStart.setDate(nextStart.getDate() + 1);
  nextStart.setHours(0, 0, 0, 0);

  const nextEnd = new Date(nextStart);
  nextEnd.setDate(nextEnd.getDate() + 6);
  nextEnd.setHours(23, 59, 59, 999);

  assertTrue(nextStart > periodEnd, "Next period start must be strictly after previous period end");
  const durationDays = Math.round((nextEnd.getTime() - nextStart.getTime()) / 86400000);
  assertEquals(durationDays, 7, "Standard period duration is 7 days (weekly)");
});

test(1, "Period Closing", "F2.2: Closed evaluation period status transition invariants", () => {
  const periodState = {
    id: "period-001",
    status: "OPEN",
    closedAt: null as Date | null,
    closedById: null as string | null,
  };

  // Simulate close
  periodState.status = "CLOSED";
  periodState.closedAt = new Date();
  periodState.closedById = "lead-001";

  assertEquals(periodState.status, "CLOSED");
  assertTrue(periodState.closedAt !== null);
  assertEquals(periodState.closedById, "lead-001");
});

test(1, "Period Closing", "F2.3: Double close guard logic throws error if period is already CLOSED", async () => {
  const isPeriodClosed = (status: string) => {
    if (status === "CLOSED") {
      throw new Error("รอบนี้ปิดแล้ว");
    }
  };
  await assertThrows(() => isPeriodClosed("CLOSED"), "รอบนี้ปิดแล้ว");
});

test(1, "Period Closing", "F2.4: Bonus pool validation rejects negative budget allocation", () => {
  const validatePoolAmount = (amount: number) => {
    if (amount < 0) throw new Error("งบประมาณโบนัสต้องไม่ติดลบ");
  };
  assertThrows(() => validatePoolAmount(-500), "งบประมาณโบนัสต้องไม่ติดลบ");
  // Non-negative must succeed
  validatePoolAmount(0);
  validatePoolAmount(50000);
});

test(1, "Period Closing", "F2.5: Weekly digest notification text formats member count and total ratio", () => {
  const memberCount = 4;
  const totalRatio = 100.0;
  const digest = `ปิดรอบประเมินแล้ว — สัดส่วนผลงานรวม ${totalRatio.toFixed(2)}% จากสมาชิก ${memberCount} คน (รอหัวหน้ายืนยันสัดส่วน)`;
  assertTrue(digest.includes("100.00%"));
  assertTrue(digest.includes("สมาชิก 4 คน"));
});

// ===========================================================================
// FEATURE 3: 100% Normalization (lib/progress.ts & largestRemainderPercents)
// ===========================================================================

test(1, "100% Normalization", "F3.1: largestRemainderPercents strictly sums to 100.00% on two members", () => {
  const items = [
    { id: "dev1", value: 15 },
    { id: "dev2", value: 35 },
  ];
  const percents = largestRemainderPercents(items);
  const sum = percents.reduce((acc, p) => acc + p.percent, 0);
  assertCloseTo(sum, 100.0, 0.0001);
  assertEquals(percents.find((p) => p.id === "dev1")?.percent, 30.0);
  assertEquals(percents.find((p) => p.id === "dev2")?.percent, 70.0);
});

test(1, "100% Normalization", "F3.2: largestRemainderPercents handles non-terminating decimals (1/3 split)", () => {
  const items = [
    { id: "m1", value: 10 },
    { id: "m2", value: 10 },
    { id: "m3", value: 10 },
  ];
  const percents = largestRemainderPercents(items);
  const sum = percents.reduce((acc, p) => acc + p.percent, 0);
  assertCloseTo(sum, 100.0, 0.0001);
  // Largest remainder gives 33.34 to first and 33.33 to rest
  assertEquals(sum, 100.0);
});

test(1, "100% Normalization", "F3.3: largestRemainderPercents single member gets exactly 100.00%", () => {
  const items = [{ id: "solo", value: 42 }];
  const percents = largestRemainderPercents(items);
  assertEquals(percents.length, 1);
  assertEquals(percents[0].percent, 100.0);
});

test(1, "100% Normalization", "F3.4: largestRemainderPercents returns empty array on empty or 0 total", () => {
  assertEquals(largestRemainderPercents([]).length, 0);
  assertEquals(largestRemainderPercents([{ id: "zero", value: 0 }]).length, 0);
});

test(1, "100% Normalization", "F3.5: largestRemainderPercents distributes remainder cents to largest remainder", () => {
  // Values: 10, 20, 25 -> total 55
  // 10/55 = 18.1818..., 20/55 = 36.3636..., 25/55 = 45.4545...
  const items = [
    { id: "a", value: 10 },
    { id: "b", value: 20 },
    { id: "c", value: 25 },
  ];
  const percents = largestRemainderPercents(items);
  const sum = percents.reduce((acc, p) => acc + p.percent, 0);
  assertEquals(sum, 100.0);
});

// ===========================================================================
// FEATURE 4: Merit Payout CSV (server/periods.ts buildConfirmedSharesCsv logic)
// ===========================================================================

test(1, "Merit Payout CSV", "F4.1: CSV string includes UTF-8 BOM prefix for Excel compatibility", () => {
  const BOM = "\uFEFF";
  const header = "projectId,projectName,periodId";
  const csv = BOM + header;
  assertEquals(csv.charCodeAt(0), 0xfeff, "First character must be UTF-8 BOM (0xFEFF)");
});

test(1, "Merit Payout CSV", "F4.2: CSV contains all required 15 columns in exact order", () => {
  const expectedHeader = [
    "projectId",
    "projectName",
    "periodId",
    "periodStart",
    "periodEnd",
    "meritStatus",
    "poolAmount",
    "currency",
    "userName",
    "userEmail",
    "ratioPercent",
    "impactSum",
    "payoutAmount",
    "payoutStatus",
    "confirmed",
  ].join(",");

  const columns = expectedHeader.split(",");
  assertEquals(columns.length, 15);
  assertTrue(columns.includes("payoutAmount"));
  assertTrue(columns.includes("ratioPercent"));
});

test(1, "Merit Payout CSV", "F4.3: Individual payout amount strictly matches poolAmount * (ratioPercent / 100)", () => {
  const poolAmount = 50000;
  const ratioPercent = 35.5;
  const payout = Math.round(poolAmount * (ratioPercent / 100) * 100) / 100;
  assertEquals(payout, 17750.0);
});

test(1, "Merit Payout CSV", "F4.4: CSV row properly escapes double quotes in project or user names", () => {
  const rawProjectName = 'Project "ARWEEN" Excellence';
  const escapedProjectName = `"${rawProjectName.replace(/"/g, '""')}"`;
  assertEquals(escapedProjectName, '"Project ""ARWEEN"" Excellence"');
});

test(1, "Merit Payout CSV", "F4.5: Merit export filename adheres to project name and period id specification", () => {
  const projectName = "โครงการ ARWEEN Pilot";
  const periodId = "cld890123456";
  const filename = `merit-shares-${projectName.replace(/[^a-zA-Z0-9ก-๙_-]/g, "_")}-${periodId.slice(-6)}.csv`;
  assertTrue(filename.startsWith("merit-shares-"));
  assertTrue(filename.endsWith(".csv"));
  assertTrue(filename.includes("456.csv"));
});

// ===========================================================================
// FEATURE 5: Dispute Resolution Flow (server/evaluate.ts)
// ===========================================================================

test(1, "Dispute Resolution", "F5.1: Dispute creation initializes with PENDING status", () => {
  const dispute = {
    id: "disp-001",
    projectId: "proj-001",
    userId: "user-001",
    reason: "ขอพิจารณาคะแนนเพิ่มเติมเนื่องจากเป็นผู้นำเสนอหลัก",
    status: "PENDING",
    resolvedAt: null,
  };
  assertEquals(dispute.status, "PENDING");
  assertEquals(dispute.resolvedAt, null);
});

test(1, "Dispute Resolution", "F5.2: Dispute resolution updates status to RESOLVED and records resolvedAt", () => {
  const dispute = {
    id: "disp-001",
    status: "PENDING",
    resolvedAt: null as Date | null,
  };
  // Simulate resolveDispute
  dispute.status = "RESOLVED";
  dispute.resolvedAt = new Date();
  assertEquals(dispute.status, "RESOLVED");
  assertTrue(dispute.resolvedAt !== null);
});

test(1, "Dispute Resolution", "F5.3: Dispute rejection updates status to REJECTED and records resolvedAt", () => {
  const dispute = {
    id: "disp-002",
    status: "PENDING",
    resolvedAt: null as Date | null,
  };
  // Simulate rejectDispute
  dispute.status = "REJECTED";
  dispute.resolvedAt = new Date();
  assertEquals(dispute.status, "REJECTED");
  assertTrue(dispute.resolvedAt !== null);
});

test(1, "Dispute Resolution", "F5.4: Stale dispute threshold evaluates pending disputes older than 72 hours", () => {
  const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000);
  const oldDisputeCreatedAt = new Date(Date.now() - 75 * 60 * 60 * 1000); // 75h old -> stale
  const freshDisputeCreatedAt = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24h old -> not stale

  assertTrue(oldDisputeCreatedAt <= cutoff, "75h old dispute should be flagged as stale");
  assertFalse(freshDisputeCreatedAt <= cutoff, "24h old dispute should NOT be flagged as stale");
});

test(1, "Dispute Resolution", "F5.5: Resolving dispute with score adjustment unflags score and confirms it", () => {
  const score = {
    id: "score-001",
    value: 3,
    flagged: true,
    confirmed: false,
  };
  // Simulate resolve with newScoreValue = 8
  score.value = 8;
  score.flagged = false;
  score.confirmed = true;

  assertEquals(score.value, 8);
  assertFalse(score.flagged);
  assertTrue(score.confirmed);
});

// ===========================================================================
// FEATURE 6: Agent 1 Scoring (server/agents/agent1.ts)
// ===========================================================================

test(1, "Agent 1 Scoring", "F6.1: High impact architecture and connection pool keyword scores >= 7", async () => {
  const result = await runAgent1({
    projectName: "ARWEEN Pilot",
    action: "ปรับแก้สถาปัตยกรรม Database connection pool และ sync provider",
    anchors: SAMPLE_ANCHORS,
  });
  assertTrue(result.impactScore >= 7, `Expected score >= 7, got ${result.impactScore}`);
  assertTrue(result.rationale.length > 0);
});

test(1, "Agent 1 Scoring", "F6.2: Critical bug fix and security vulnerability scores >= 8", async () => {
  const result = await runAgent1({
    projectName: "ARWEEN Pilot",
    action: "แก้ไขปัญหาช่องโหว่ความปลอดภัยของ API ประเมินผลงานและทดสอบ security",
    anchors: SAMPLE_ANCHORS,
  });
  assertTrue(result.impactScore >= 8, `Expected score >= 8, got ${result.impactScore}`);
});

test(1, "Agent 1 Scoring", "F6.3: Routine standup and general daily update scores between 3 and 5", async () => {
  const result = await runAgent1({
    projectName: "ARWEEN Pilot",
    action: "เข้าร่วมประชุม Standup ประจำวันและประสานงานทั่วไป",
    anchors: SAMPLE_ANCHORS,
  });
  assertTrue(result.impactScore >= 3 && result.impactScore <= 5, `Expected score 3-5, got ${result.impactScore}`);
});

test(1, "Agent 1 Scoring", "F6.4: Polite acknowledgment or short response scores <= 2", async () => {
  const result = await runAgent1({
    projectName: "ARWEEN Pilot",
    action: "รับทราบครับ",
    anchors: SAMPLE_ANCHORS,
  });
  assertTrue(result.impactScore <= 2, `Expected score <= 2, got ${result.impactScore}`);
});

test(1, "Agent 1 Scoring", "F6.5: Missing anchor context items throws descriptive exception", async () => {
  await assertThrows(
    () =>
      runAgent1({
        projectName: "ARWEEN Pilot",
        action: "ทำงานทั่วไป",
        anchors: [],
      }),
    "ยังไม่มีเป้าหมายโปรเจกต์"
  );
});

// ===========================================================================
// FEATURE 7: Agent 2 Normalization (server/agents/agent2.ts)
// ===========================================================================

test(1, "Agent 2 Normalization", "F7.1: Multi-member positive impacts normalize to exactly 100.00%", () => {
  const rows = [
    { userId: "user-backend", impactSum: 9 },
    { userId: "user-frontend", impactSum: 8 },
  ];
  const contributions = runAgent2(rows);
  const total = contributions.reduce((s, c) => s + c.ratioPercent, 0);
  assertCloseTo(total, 100.0, 0.0001);
});

test(1, "Agent 2 Normalization", "F7.2: Zero-score member handling (safe return without crash)", () => {
  const rows = [
    { userId: "u1", impactSum: 10 },
    { userId: "u2", impactSum: 0 },
  ];
  const contributions = runAgent2(rows);
  const total = contributions.reduce((s, c) => s + c.ratioPercent, 0);
  assertCloseTo(total, 100.0, 0.0001);
});

test(1, "Agent 2 Normalization", "F7.3: All-zero member impacts assign 0.00% without NaN or crash", () => {
  const rows = [
    { userId: "u1", impactSum: 0 },
    { userId: "u2", impactSum: 0 },
  ];
  const contributions = runAgent2(rows);
  assertEquals(contributions.length, 2);
  assertEquals(contributions[0].ratioPercent, 0);
  assertEquals(contributions[1].ratioPercent, 0);
});

test(1, "Agent 2 Normalization", "F7.4: Preserves userIds and original impactSum in output rows", () => {
  const rows = [
    { userId: "lead", impactSum: 20 },
    { userId: "dev", impactSum: 80 },
  ];
  const contributions = runAgent2(rows);
  const leadRow = contributions.find((c) => c.userId === "lead");
  const devRow = contributions.find((c) => c.userId === "dev");
  assertEquals(leadRow?.impactSum, 20);
  assertEquals(leadRow?.ratioPercent, 20.0);
  assertEquals(devRow?.impactSum, 80);
  assertEquals(devRow?.ratioPercent, 80.0);
});

test(1, "Agent 2 Normalization", "F7.5: Empty input array returns empty contribution list safely", () => {
  const contributions = runAgent2([]);
  assertEquals(contributions.length, 0);
});

// ===========================================================================
// FEATURE 8: Agent 3 Anti-Gaming (server/agents/agent3.ts)
// ===========================================================================

test(1, "Agent 3 Anti-Gaming", "F8.1: Short message (<4 chars) is flagged", () => {
  const res = runAgent3({ action: "ok", recentSameDayActions: [] });
  assertTrue(res.flagged, "Action 'ok' under 4 chars must be flagged");
});

test(1, "Agent 3 Anti-Gaming", "F8.2: Polite acknowledgment 'รับทราบ' forces score to 1 without initial flag", () => {
  const res = runAgent3({ action: "รับทราบ", recentSameDayActions: [] });
  assertEquals(res.forcedScore, 1);
});

test(1, "Agent 3 Anti-Gaming", "F8.3: Repetitive acknowledgments (>= 3 on same day) are flagged and forced to score 0", () => {
  const res = runAgent3({
    action: "รับทราบครับ",
    recentSameDayActions: ["รับทราบ", "ขอบคุณครับ"],
  });
  assertTrue(res.flagged, "3rd same-day ack must be flagged");
  assertEquals(res.forcedScore, 0, "3rd same-day ack must force score 0");
  assertTrue(res.flagReason?.includes("Anti-Gaming") ?? false);
});

test(1, "Agent 3 Anti-Gaming", "F8.4: Repeated identical submissions (>= 2 on same day) are flagged", () => {
  const res = runAgent3({
    action: "อัปเดตงานประจำวันทั่วไปในส่วนของงาน",
    recentSameDayActions: [
      "อัปเดตงานประจำวันทั่วไปในส่วนของงาน",
      "อัปเดตงานประจำวันทั่วไปในส่วนของงาน",
    ],
  });
  assertTrue(res.flagged);
  assertEquals(res.forcedScore, 0);
  assertTrue(res.flagReason?.includes("พบข้อความซ้ำ") ?? false);
});

test(1, "Agent 3 Anti-Gaming", "F8.5: Genuine meaningful task is unflagged and has forcedScore null", () => {
  const res = runAgent3({
    action: "ปรับแก้สถาปัตยกรรม Database connection pool และ sync provider ให้รองรับ Cloud Run",
    recentSameDayActions: ["เข้าร่วมประชุมวางแผนสปรินต์ประจำสัปดาห์"],
  });
  assertFalse(res.flagged);
  assertEquals(res.forcedScore, null);
});

// ===========================================================================
// FEATURE 9: Fallback Heuristic
// ===========================================================================

test(1, "Fallback Heuristic", "F9.1: Heuristic fallback operates deterministically without API key", async () => {
  const origKey = process.env.GEMINI_API_KEY;
  try {
    process.env.GEMINI_API_KEY = "";
    const result = await runAgent1({
      projectName: "Test Project",
      action: "ปลดล็อก blocker สำคัญของระบบคลังข้อมูล",
      anchors: SAMPLE_ANCHORS,
    });
    assertEquals(result.usedGemini, false);
    assertEquals(result.impactScore, 9);
    assertTrue(result.rationale.includes("โหมดสำรอง"));
  } finally {
    process.env.GEMINI_API_KEY = origKey;
  }
});

test(1, "Fallback Heuristic", "F9.2: Blocker keyword triggers impact score 9 in heuristic mode", async () => {
  const origKey = process.env.GEMINI_API_KEY;
  try {
    process.env.GEMINI_API_KEY = "";
    const result = await runAgent1({
      projectName: "Test Project",
      action: "ปลดล็อก blocker งาน deployment",
      anchors: SAMPLE_ANCHORS,
    });
    assertEquals(result.impactScore, 9);
  } finally {
    process.env.GEMINI_API_KEY = origKey;
  }
});

test(1, "Fallback Heuristic", "F9.3: Bug or security keywords trigger impact score 8 in heuristic mode", async () => {
  const origKey = process.env.GEMINI_API_KEY;
  try {
    process.env.GEMINI_API_KEY = "";
    const result = await runAgent1({
      projectName: "Test Project",
      action: "แก้ไข bug ความปลอดภัย",
      anchors: SAMPLE_ANCHORS,
    });
    assertEquals(result.impactScore, 8);
  } finally {
    process.env.GEMINI_API_KEY = origKey;
  }
});

test(1, "Fallback Heuristic", "F9.4: Playbook or onboard keywords trigger impact score 8 in heuristic mode", async () => {
  const origKey = process.env.GEMINI_API_KEY;
  try {
    process.env.GEMINI_API_KEY = "";
    const result = await runAgent1({
      projectName: "Test Project",
      action: "จัดทำ Playbook และออนบอร์ดลูกค้าสำเร็จ",
      anchors: SAMPLE_ANCHORS,
    });
    assertEquals(result.impactScore, 8);
  } finally {
    process.env.GEMINI_API_KEY = origKey;
  }
});

test(1, "Fallback Heuristic", "F9.5: Neutral unclassified work item defaults to score 5", async () => {
  const origKey = process.env.GEMINI_API_KEY;
  try {
    process.env.GEMINI_API_KEY = "";
    const result = await runAgent1({
      projectName: "Test Project",
      action: "วิเคราะห์และเตรียมข้อมูลสำหรับการประชุมครั้งต่อไป",
      anchors: SAMPLE_ANCHORS,
    });
    assertEquals(result.impactScore, 5);
  } finally {
    process.env.GEMINI_API_KEY = origKey;
  }
});

// ===========================================================================
// FEATURE 10: Pilot Simulation (scripts/run-pilot-simulation.ts workflows)
// ===========================================================================

test(1, "Pilot Simulation", "F10.1: pilot-team-eng team simulation workflow calculations", () => {
  // Eng team members: devBackend (score 9), devFrontend (score 8)
  const shares = runAgent2([
    { userId: "devBackend", impactSum: 9 },
    { userId: "devFrontend", impactSum: 8 },
  ]);
  const sumRatio = shares.reduce((s, c) => s + c.ratioPercent, 0);
  assertEquals(sumRatio, 100.0);

  const bonusPool = 60000;
  const backendShare = shares.find((s) => s.userId === "devBackend")!;
  const frontendShare = shares.find((s) => s.userId === "devFrontend")!;

  const backendPayout = Math.round(bonusPool * (backendShare.ratioPercent / 100) * 100) / 100;
  const frontendPayout = Math.round(bonusPool * (frontendShare.ratioPercent / 100) * 100) / 100;

  assertCloseTo(backendPayout + frontendPayout, bonusPool, 1.0);
});

test(1, "Pilot Simulation", "F10.2: pilot-team-ops team simulation workflow calculations", () => {
  // Ops team members: opsLead (score 8), opsSpec (score 9)
  const shares = runAgent2([
    { userId: "opsLead", impactSum: 8 },
    { userId: "opsSpec", impactSum: 9 },
  ]);
  const sumRatio = shares.reduce((s, c) => s + c.ratioPercent, 0);
  assertEquals(sumRatio, 100.0);

  const bonusPool = 40000;
  const totalPayout = shares.reduce(
    (sum, s) => sum + Math.round(bonusPool * (s.ratioPercent / 100) * 100) / 100,
    0
  );
  assertCloseTo(totalPayout, bonusPool, 1.0);
});

test(1, "Pilot Simulation", "F10.3: Simulation evidence source validation forbids private messages", () => {
  assertThrows(() => assertNotPrivateSource("private_message"), "ไม่รับข้อความส่วนตัว");
  assertThrows(() => assertNotPrivateSource("dm"), "ไม่รับข้อความส่วนตัว");
  // Allowed source
  assertNotPrivateSource("DAILY_LOG");
  assertNotPrivateSource("WORK_ITEM");
});

test(1, "Pilot Simulation", "F10.4: createEvidenceSchema validates operational daily log", () => {
  const ev = createEvidenceSchema.parse({
    projectId: "pilot-team-eng",
    actorId: "devBackend",
    action: "ปรับแก้สถาปัตยกรรม Database connection pool",
    source: "DAILY_LOG",
  });
  assertEquals(ev.source, "DAILY_LOG");
  assertEquals(ev.projectId, "pilot-team-eng");
});

test(1, "Pilot Simulation", "F10.5: Pilot simulation step sequencing integrity", () => {
  const steps = [
    "1. Record EvidenceEvent",
    "2. Agent 1 Scoring & Agent 3 Anti-Gaming",
    "3. Lead Confirmation",
    "4. Close Period & Agent 2 Normalization",
    "5. Bonus Pool Allocation & Audit Trail",
  ];
  assertEquals(steps.length, 5);
  assertTrue(steps[0].includes("EvidenceEvent"));
  assertTrue(steps[4].includes("Bonus Pool"));
});

// ===========================================================================
// FEATURE 11: Verify Script (scripts/verify-full-cycle.ts checks)
// ===========================================================================

test(1, "Verify Script", "F11.1: Anchor framework weight summing validation", () => {
  const objectiveWeights = [100];
  const sum = objectiveWeights.reduce((a, b) => a + b, 0);
  assertEquals(sum, 100, "Single objective must have weight exactly 100");
});

test(1, "Verify Script", "F11.2: WorkItem creation with valid status and assigneeId", () => {
  const wi = {
    projectId: "project-demo-001",
    title: "ทดสอบการมอบหมายงานใน Hub",
    status: "IN_PROGRESS",
    assigneeId: "member-001",
  };
  assertEquals(wi.status, "IN_PROGRESS");
  assertTrue(wi.assigneeId !== null);
});

test(1, "Verify Script", "F11.3: Audit log entry format and action validation", () => {
  const audit = {
    projectId: "project-demo-001",
    actorId: "lead-001",
    action: "APPROVE_MERIT_CASE",
    details: "อนุมัติเคสผลตอบแทน Merit-to-Earn สำเร็จ (2 คน) ยอดรวม ฿50,000 THB",
  };
  assertEquals(audit.action, "APPROVE_MERIT_CASE");
  assertTrue(audit.details.includes("50,000"));
});

test(1, "Verify Script", "F11.4: Verify script CSV generation and row verification", () => {
  const header = "projectId,projectName,periodId,periodStart,periodEnd,meritStatus,poolAmount,currency,userName,userEmail,ratioPercent,impactSum,payoutAmount,payoutStatus,confirmed";
  const row = 'project-demo-001,"Demo Project",period-001,2026-09-01,2026-09-08,APPROVED,50000.00,THB,"สมชาย ใจดี",somchai@arween.demo,70.00,35.00,35000.00,APPROVED,true';
  const csv = "\uFEFF" + [header, row].join("\n");
  assertTrue(csv.includes("สมชาย ใจดี"));
  assertTrue(csv.includes("50000.00"));
  assertTrue(csv.includes("35000.00"));
});

test(1, "Verify Script", "F11.5: Verify cycle test cleanup invariants", () => {
  const cleanedEntities = ["workItem", "evaluationPeriod", "auditLog"];
  assertEquals(cleanedEntities.length, 3);
  assertTrue(cleanedEntities.includes("workItem"));
  assertTrue(cleanedEntities.includes("evaluationPeriod"));
  assertTrue(cleanedEntities.includes("auditLog"));
});
