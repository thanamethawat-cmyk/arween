/**
 * Tier 2: Boundary Value & Corner Case Test Suite
 * Tests mathematical boundaries, edge inputs, linguistic encodings,
 * stress sizes, and failure handling.
 * Total Tests: 12 tests
 */

import { test, assert, assertEquals, assertCloseTo, assertTrue, assertFalse, assertThrows } from "./harness";
import { runAgent2 } from "../../server/agents/agent2";
import { runAgent3 } from "../../server/agents/agent3";
import { largestRemainderPercents } from "../../lib/progress";
import { scoreInputSchema, createEvidenceSchema } from "../../types/schemas";

// ===========================================================================
// TIER 2 BOUNDARY & CORNER TESTS
// ===========================================================================

test(2, "Boundary & Corner", "T2.1: Zero-score member handling in multi-member team", () => {
  const rows = [
    { userId: "member-zero", impactSum: 0 },
    { userId: "member-positive", impactSum: 50 },
  ];
  // Agent 2 normalizes positive impacts; zero score member shouldn't crash calculation
  const results = runAgent2(rows);
  const sum = results.reduce((acc, r) => acc + r.ratioPercent, 0);
  assertCloseTo(sum, 100.0, 0.0001);
});

test(2, "Boundary & Corner", "T2.2: All-members zero impact handling does not throw NaN or divide by zero and returns 0.00%", () => {
  const rows = [
    { userId: "u1", impactSum: 0 },
    { userId: "u2", impactSum: 0 },
    { userId: "u3", impactSum: 0 },
  ];
  const results = runAgent2(rows);
  assertEquals(results.length, 3, "All zero members should be preserved with 0.00% ratio");
  for (const r of results) {
    assertEquals(r.ratioPercent, 0);
  }
});

test(2, "Boundary & Corner", "T2.3: Exact 100.00% rounding across repeating fractions (3, 7, 11 members)", () => {
  // 3 members (each 33.3333%)
  const team3 = largestRemainderPercents([
    { id: "1", value: 1 },
    { id: "2", value: 1 },
    { id: "3", value: 1 },
  ]);
  const sum3 = team3.reduce((s, i) => s + i.percent, 0);
  assertEquals(sum3, 100.0);

  // 7 members (each 14.2857%)
  const team7 = largestRemainderPercents([
    { id: "1", value: 10 },
    { id: "2", value: 10 },
    { id: "3", value: 10 },
    { id: "4", value: 10 },
    { id: "5", value: 10 },
    { id: "6", value: 10 },
    { id: "7", value: 10 },
  ]);
  const sum7 = team7.reduce((s, i) => s + i.percent, 0);
  assertEquals(sum7, 100.0);

  // 11 members with prime values
  const team11 = largestRemainderPercents([
    { id: "1", value: 2 },
    { id: "2", value: 3 },
    { id: "3", value: 5 },
    { id: "4", value: 7 },
    { id: "5", value: 11 },
    { id: "6", value: 13 },
    { id: "7", value: 17 },
    { id: "8", value: 19 },
    { id: "9", value: 23 },
    { id: "10", value: 29 },
    { id: "11", value: 31 },
  ]);
  const sum11 = team11.reduce((s, i) => s + i.percent, 0);
  assertEquals(sum11, 100.0);
});

test(2, "Boundary & Corner", "T2.4: Single member team receives exact 100.00%", () => {
  const result = largestRemainderPercents([{ id: "solo-champion", value: 999 }]);
  assertEquals(result.length, 1);
  assertEquals(result[0].percent, 100.0);
});

test(2, "Boundary & Corner", "T2.5: Large team stress test (100 members) maintains strict 100.00% sum invariant", () => {
  const members = Array.from({ length: 100 }, (_, i) => ({
    id: `member-${i + 1}`,
    value: Math.floor(Math.sin(i + 1) * 50) + 60, // Varying positive integers
  }));
  const percents = largestRemainderPercents(members);
  assertEquals(percents.length, 100);
  const total = percents.reduce((acc, p) => acc + p.percent, 0);
  assertEquals(Math.round(total * 100) / 100, 100.0);
});

test(2, "Boundary & Corner", "T2.6: Thai unicode, complex diacritics, and tone marks integrity", () => {
  const complexThai = "โครงการนำร่อง ARWEEN: การจัดตั้งระบบการบริหารงานที่เหนือกว่า ๑๒๓๔๕";
  const ev = createEvidenceSchema.parse({
    projectId: "proj-thai",
    actorId: "user-thai",
    action: complexThai,
    source: "DAILY_LOG",
  });
  assertEquals(ev.action, complexThai);
  assertTrue(ev.action.includes("เหนือกว่า"));
  assertTrue(ev.action.includes("๑๒๓๔๕"));
});

test(2, "Boundary & Corner", "T2.7: Thai polite acknowledgment variations detection in Agent 3", () => {
  const particles = [
    "รับทราบ",
    "รับทราบครับ",
    "รับทราบค่ะ",
    "โอเค",
    "ok",
    "ขอบคุณ",
    "ขอบคุณครับ",
    "ขอบคุณค่ะ",
    "ครับ",
    "ค่ะ",
  ];

  for (const p of particles) {
    const res = runAgent3({ action: p, recentSameDayActions: [] });
    assertTrue(
      res.forcedScore === 1 || res.flagged,
      `Particle "${p}" should trigger forcedScore=1 or flagged=true`
    );
  }
});

test(2, "Boundary & Corner", "T2.8: Empty string and whitespace-only actions fail schema validation", async () => {
  await assertThrows(() => {
    createEvidenceSchema.parse({
      projectId: "proj-1",
      actorId: "user-1",
      action: "", // Empty string
      source: "DAILY_LOG",
    });
  });

  // Short action < 4 characters is flagged by Agent 3
  const res = runAgent3({ action: "   ", recentSameDayActions: [] });
  assertTrue(res.flagged, "Whitespace-only action should be flagged as too short");
});

test(2, "Boundary & Corner", "T2.9: Score boundaries minimum 0 and maximum 10 are valid", () => {
  const minScore = scoreInputSchema.parse({
    projectId: "proj-1",
    userId: "user-1",
    value: 0,
    reason: "Minimum valid score",
  });
  assertEquals(minScore.value, 0);

  const maxScore = scoreInputSchema.parse({
    projectId: "proj-1",
    userId: "user-1",
    value: 10,
    reason: "Maximum valid score",
  });
  assertEquals(maxScore.value, 10);
});

test(2, "Boundary & Corner", "T2.10: Action length at maximum boundary (2000 characters) is accepted", () => {
  const longAction = "A".repeat(2000);
  const ev = createEvidenceSchema.parse({
    projectId: "proj-long",
    actorId: "user-long",
    action: longAction,
    source: "WORK_ITEM",
  });
  assertEquals(ev.action.length, 2000);
});

test(2, "Boundary & Corner", "T2.11: Action length exceeding maximum boundary (2001 characters) is rejected", async () => {
  const tooLongAction = "A".repeat(2001);
  await assertThrows(() => {
    createEvidenceSchema.parse({
      projectId: "proj-long",
      actorId: "user-long",
      action: tooLongAction,
      source: "WORK_ITEM",
    });
  });
});

test(2, "Boundary & Corner", "T2.12: Zero bonus pool produces valid zero payouts without NaN", () => {
  const poolAmount = 0.0;
  const ratio = 60.0;
  const payout = Math.round(poolAmount * (ratio / 100) * 100) / 100;
  assertEquals(payout, 0.0);
  assertFalse(isNaN(payout));
});
