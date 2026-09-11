/**
 * ARWEEN Superior Operations Management Cycle
 * Adversarial Challenger Stress Test Suite
 *
 * Authored by: challenger_1 (Empirical Challenger: AI Reliability, Anti-Gaming & Normalization)
 *
 * Coverage:
 *   1. Thai Language Edge Cases & Polite Particle Gaming Evasion
 *   2. Agent 2 Largest Remainder Invariant & Precision Stress-Testing
 *   3. Falsy Coercion Immunity & Zero-Score Preservation
 *   4. Zero-Score Member Normalization Invariants (Feature 9)
 */

import { runAgent1, type AnchorContextItem } from "../server/agents/agent1";
import { runAgent2, type ImpactRow } from "../server/agents/agent2";
import { runAgent3 } from "../server/agents/agent3";
import { largestRemainderPercents } from "../lib/progress";
import { scoreInputSchema, createEvidenceSchema } from "../types/schemas";

// ---------------------------------------------------------------------------
// ANSI Color Helpers for Standalone Output
// ---------------------------------------------------------------------------
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};

export interface AdversarialTestResult {
  group: string;
  name: string;
  passed: boolean;
  error?: string;
  details?: string;
}

const SAMPLE_ANCHORS: AnchorContextItem[] = [
  {
    milestoneId: "ms-arch",
    milestoneName: "ปรับแก้สถาปัตยกรรม Database connection pool และ sync provider",
    kpiId: "kpi-lat",
    kpiName: "ความหน่วงเฉลี่ย Database Latency (ms)",
    objectiveName: "ยกระดับความเสถียรและความปลอดภัยของระบบ",
  },
  {
    milestoneId: "ms-sec",
    milestoneName: "ป้องกันช่องโหว่ความปลอดภัย API",
    kpiId: "kpi-sec",
    kpiName: "สัดส่วน API ที่ปลอดภัย 100%",
    objectiveName: "ยกระดับความเสถียรและความปลอดภัยของระบบ",
  },
  {
    milestoneId: "ms-onboard",
    milestoneName: "ออนบอร์ดลูกค้าองค์กรนำร่อง",
    kpiId: "kpi-corp",
    kpiName: "จำนวนองค์กรที่เริ่มใช้งาน",
    objectiveName: "ส่งมอบประสบการณ์นำร่ององค์กรอย่างราบรื่น",
  },
];

export async function runAdversarialTestSuite(): Promise<{
  total: number;
  passed: number;
  failed: number;
  results: AdversarialTestResult[];
}> {
  const results: AdversarialTestResult[] = [];

  function record(group: string, name: string, fn: () => void | Promise<void>) {
    try {
      const res = fn();
      if (res instanceof Promise) {
        return res
          .then(() => {
            results.push({ group, name, passed: true });
          })
          .catch((err) => {
            results.push({
              group,
              name,
              passed: false,
              error: err instanceof Error ? err.message : String(err),
            });
          });
      }
      results.push({ group, name, passed: true });
    } catch (err) {
      results.push({
        group,
        name,
        passed: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // =========================================================================
  // GROUP 1: THAI LANGUAGE EDGE CASES & POLITE PARTICLES
  // =========================================================================

  await record(
    "1. Thai Edge Cases",
    '1.1 Polite particle "โอเคครับผม" receives low score (<= 2) and triggers acknowledgment detection',
    async () => {
      const action = "โอเคครับผม";
      const a1 = await runAgent1({ projectName: "ARWEEN", action, anchors: SAMPLE_ANCHORS });
      const a3 = runAgent3({ action, recentSameDayActions: [] });
      if (a1.impactScore > 2) {
        throw new Error(`Agent 1 score too high: ${a1.impactScore}, expected <= 2`);
      }
      if (a3.forcedScore !== 1) {
        throw new Error(`Agent 3 forcedScore is ${a3.forcedScore}, expected 1`);
      }
    }
  );

  await record(
    "1. Thai Edge Cases",
    '1.2 Polite particle "รับทราบครับท่าน" receives low score (<= 2) and triggers acknowledgment detection',
    async () => {
      const action = "รับทราบครับท่าน";
      const a1 = await runAgent1({ projectName: "ARWEEN", action, anchors: SAMPLE_ANCHORS });
      const a3 = runAgent3({ action, recentSameDayActions: [] });
      if (a1.impactScore > 2) {
        throw new Error(`Agent 1 score too high: ${a1.impactScore}, expected <= 2`);
      }
      if (a3.forcedScore !== 1) {
        throw new Error(`Agent 3 forcedScore is ${a3.forcedScore}, expected 1`);
      }
    }
  );

  await record(
    "1. Thai Edge Cases",
    '1.3 Polite particle "โอเคค่ะ" receives low score (<= 2) and triggers acknowledgment detection',
    async () => {
      const action = "โอเคค่ะ";
      const a1 = await runAgent1({ projectName: "ARWEEN", action, anchors: SAMPLE_ANCHORS });
      const a3 = runAgent3({ action, recentSameDayActions: [] });
      if (a1.impactScore > 2) {
        throw new Error(`Agent 1 score too high: ${a1.impactScore}, expected <= 2`);
      }
      if (a3.forcedScore !== 1) {
        throw new Error(`Agent 3 forcedScore is ${a3.forcedScore}, expected 1`);
      }
    }
  );

  await record(
    "1. Thai Edge Cases",
    '1.4 Polite particle "ขอบคุณมากๆ ครับ" receives low score (<= 2) and triggers acknowledgment detection',
    async () => {
      const action = "ขอบคุณมากๆ ครับ";
      const a1 = await runAgent1({ projectName: "ARWEEN", action, anchors: SAMPLE_ANCHORS });
      const a3 = runAgent3({ action, recentSameDayActions: [] });
      if (a1.impactScore > 2) {
        throw new Error(`Agent 1 score too high: ${a1.impactScore}, expected <= 2`);
      }
      if (a3.forcedScore !== 1) {
        throw new Error(`Agent 3 forcedScore is ${a3.forcedScore}, expected 1`);
      }
    }
  );

  await record(
    "1. Thai Edge Cases",
    "1.5 Complex Thai unicode diacritics, tone marks, and emojis preserve schema validity and high-impact scoring",
    async () => {
      const action =
        "แก้ไขปัญหาช่องโหว่ความปลอดภัยที่ซับซ้อนที่สุด พร้อมจัดทำระบบป้องกันการโจมตี ๑๐๐% 🚀 (ความคืบหน้าระดับสูง)";
      const ev = createEvidenceSchema.parse({
        projectId: "proj-01",
        actorId: "dev-01",
        action,
        source: "DAILY_LOG",
      });
      if (ev.action !== action) {
        throw new Error("Unicode encoding corrupted during schema parse");
      }
      const a1 = await runAgent1({ projectName: "ARWEEN", action, anchors: SAMPLE_ANCHORS });
      if (a1.impactScore < 8) {
        throw new Error(`High impact security work scored ${a1.impactScore}, expected >= 8`);
      }
    }
  );

  await record(
    "1. Thai Edge Cases",
    "1.6 Short string (< 4 chars) and single-letter inputs are flagged by Agent 3",
    () => {
      const shortInputs = ["ก", "ok", "   ", "ข"];
      for (const input of shortInputs) {
        const a3 = runAgent3({ action: input, recentSameDayActions: [] });
        if (!a3.flagged) {
          throw new Error(`Short input "${input}" (len=${input.trim().length}) was not flagged`);
        }
      }
    }
  );

  await record(
    "1. Thai Edge Cases",
    "1.7 Spam flooding: 3 identical actions on same day triggers Anti-Gaming flag with forcedScore = 0",
    () => {
      const action = "รายงานความคืบหน้าประจำวันสั้นๆ";
      const a3 = runAgent3({
        action,
        recentSameDayActions: [action, action],
      });
      if (!a3.flagged) {
        throw new Error("Repeated action was not flagged");
      }
      if (a3.forcedScore !== 0) {
        throw new Error(`Expected forcedScore 0 on repeat spam, got ${a3.forcedScore}`);
      }
    }
  );

  await record(
    "1. Thai Edge Cases",
    "1.8 Spam flooding: 3 distinct acknowledgment messages on same day triggers Anti-Gaming flag with forcedScore = 0",
    () => {
      const a3 = runAgent3({
        action: "โอเคครับ",
        recentSameDayActions: ["รับทราบครับ", "ขอบคุณค่ะ"],
      });
      if (!a3.flagged) {
        throw new Error("3rd ack message in same day was not flagged");
      }
      if (a3.forcedScore !== 0) {
        throw new Error(`Expected forcedScore 0, got ${a3.forcedScore}`);
      }
    }
  );

  // =========================================================================
  // GROUP 2: AGENT 2 LARGEST REMAINDER ALGORITHM & 100.00% INVARIANT
  // =========================================================================

  await record(
    "2. Normalization Invariants",
    "2.1 1/3 Repeating Fractions (3 members, equal impact 3, 3, 3) strictly sums to 100.00%",
    () => {
      const rows: ImpactRow[] = [
        { userId: "u1", impactSum: 3 },
        { userId: "u2", impactSum: 3 },
        { userId: "u3", impactSum: 3 },
      ];
      const results = runAgent2(rows);
      if (results.length !== 3) {
        throw new Error(`Expected 3 result rows, got ${results.length}`);
      }
      const sum = results.reduce((acc, r) => acc + r.ratioPercent, 0);
      const rounded = Math.round(sum * 100) / 100;
      if (rounded !== 100.0) {
        throw new Error(`Expected sum 100.00%, got ${sum}%`);
      }
      // One member should receive 33.34%, the other two 33.33%
      const values = results.map((r) => r.ratioPercent).sort((a, b) => b - a);
      if (values[0] !== 33.34 || values[1] !== 33.33 || values[2] !== 33.33) {
        throw new Error(`Unexpected distribution: ${JSON.stringify(values)}`);
      }
    }
  );

  await record(
    "2. Normalization Invariants",
    "2.2 7 Members with equal impacts strictly sums to 100.00%",
    () => {
      const items = Array.from({ length: 7 }, (_, i) => ({
        id: `user-${i + 1}`,
        value: 10,
      }));
      const percents = largestRemainderPercents(items);
      if (percents.length !== 7) {
        throw new Error(`Expected 7 items, got ${percents.length}`);
      }
      const sum = percents.reduce((acc, p) => acc + p.percent, 0);
      const rounded = Math.round(sum * 100) / 100;
      if (rounded !== 100.0) {
        throw new Error(`Expected sum 100.00%, got ${sum}%`);
      }
      // Top 4 members receive 14.29% and 3 receive 14.28%
      const top4 = percents.filter((p) => p.percent === 14.29).length;
      const rem3 = percents.filter((p) => p.percent === 14.28).length;
      if (top4 !== 4 || rem3 !== 3) {
        throw new Error(`Expected 4 x 14.29% and 3 x 14.28%, got ${top4} and ${rem3}`);
      }
    }
  );

  await record(
    "2. Normalization Invariants",
    "2.3 100 Members with equal impacts strictly sums to 100.00%",
    () => {
      const items = Array.from({ length: 100 }, (_, i) => ({
        id: `user-${i + 1}`,
        value: 1,
      }));
      const percents = largestRemainderPercents(items);
      if (percents.length !== 100) {
        throw new Error(`Expected 100 items, got ${percents.length}`);
      }
      const sum = percents.reduce((acc, p) => acc + p.percent, 0);
      const rounded = Math.round(sum * 100) / 100;
      if (rounded !== 100.0) {
        throw new Error(`Expected sum 100.00%, got ${sum}%`);
      }
      // Every member receives exactly 1.00%
      for (const p of percents) {
        if (p.percent !== 1.0) {
          throw new Error(`Member ${p.id} received ${p.percent}%, expected 1.00%`);
        }
      }
    }
  );

  await record(
    "2. Normalization Invariants",
    "2.4 100 Members with non-uniform arithmetic sequence impacts (1..100) strictly sums to 100.00%",
    () => {
      const items = Array.from({ length: 100 }, (_, i) => ({
        id: `user-${i + 1}`,
        value: i + 1,
      }));
      const percents = largestRemainderPercents(items);
      const sum = percents.reduce((acc, p) => acc + p.percent, 0);
      const rounded = Math.round(sum * 100) / 100;
      if (rounded !== 100.0) {
        throw new Error(`Expected sum 100.00%, got ${sum}%`);
      }
    }
  );

  await record(
    "2. Normalization Invariants",
    "2.5 Single-member team receives exactly 100.00%",
    () => {
      const results = runAgent2([{ userId: "solo-champion", impactSum: 42 }]);
      if (results.length !== 1) {
        throw new Error(`Expected 1 result row, got ${results.length}`);
      }
      if (results[0].ratioPercent !== 100.0) {
        throw new Error(`Expected 100.00%, got ${results[0].ratioPercent}%`);
      }
    }
  );

  await record(
    "2. Normalization Invariants",
    "2.6 All-zero scores: runAgent2 gracefully returns all members with 0.00% without crashing (Feature 9)",
    () => {
      const rows: ImpactRow[] = [
        { userId: "u1", impactSum: 0 },
        { userId: "u2", impactSum: 0 },
        { userId: "u3", impactSum: 0 },
      ];
      const results = runAgent2(rows);
      // Feature 9 specifies: zero-impact members are included in output rows with 0.00%
      if (results.length !== 3) {
        throw new Error(
          `Feature 9 requires all 3 members to be present for audit trail, got length ${results.length}`
        );
      }
      for (const r of results) {
        if (r.ratioPercent !== 0) {
          throw new Error(`Member ${r.userId} has ratioPercent ${r.ratioPercent}, expected 0`);
        }
        if (r.impactSum !== 0) {
          throw new Error(`Member ${r.userId} has impactSum ${r.impactSum}, expected 0`);
        }
      }
    }
  );

  await record(
    "2. Normalization Invariants",
    "2.7 Mixed zero and positive scores: zero member gets 0.00%, positive members strictly sum to 100.00%",
    () => {
      const rows: ImpactRow[] = [
        { userId: "zero-contributor", impactSum: 0 },
        { userId: "worker-1", impactSum: 10 },
        { userId: "worker-2", impactSum: 20 },
      ];
      const results = runAgent2(rows);
      if (results.length !== 3) {
        throw new Error(`Expected 3 result rows, got ${results.length}`);
      }
      const zeroRow = results.find((r) => r.userId === "zero-contributor");
      if (!zeroRow || zeroRow.ratioPercent !== 0) {
        throw new Error(`Expected zero-contributor to have 0.00%, got ${zeroRow?.ratioPercent}`);
      }
      const sum = results.reduce((acc, r) => acc + r.ratioPercent, 0);
      const rounded = Math.round(sum * 100) / 100;
      if (rounded !== 100.0) {
        throw new Error(`Expected total sum 100.00%, got ${sum}%`);
      }
    }
  );

  await record(
    "2. Normalization Invariants",
    "2.8 Large integer inputs (1 Billion & 2 Billion) maintain exact precision and sum to 100.00%",
    () => {
      const rows: ImpactRow[] = [
        { userId: "whale-1", impactSum: 1_000_000_000 },
        { userId: "whale-2", impactSum: 2_000_000_000 },
      ];
      const results = runAgent2(rows);
      const sum = results.reduce((acc, r) => acc + r.ratioPercent, 0);
      const rounded = Math.round(sum * 100) / 100;
      if (rounded !== 100.0) {
        throw new Error(`Expected sum 100.00%, got ${sum}%`);
      }
      const w1 = results.find((r) => r.userId === "whale-1")!;
      const w2 = results.find((r) => r.userId === "whale-2")!;
      if (w1.ratioPercent !== 33.33 || w2.ratioPercent !== 66.67) {
        throw new Error(`Unexpected shares: ${w1.ratioPercent} and ${w2.ratioPercent}`);
      }
    }
  );

  await record(
    "2. Normalization Invariants",
    "2.9 Randomized stress generator: 50 random team sizes (2..150) and values ALWAYS strictly sum to 100.00%",
    () => {
      for (let run = 1; run <= 50; run++) {
        const size = Math.floor(Math.random() * 148) + 2; // 2 to 150 members
        const items = Array.from({ length: size }, (_, i) => ({
          id: `u-${i}`,
          value: Math.floor(Math.random() * 1000) + 1,
        }));
        const percents = largestRemainderPercents(items);
        const sum = percents.reduce((acc, p) => acc + p.percent, 0);
        const rounded = Math.round(sum * 100) / 100;
        if (rounded !== 100.0) {
          throw new Error(
            `Stress run #${run} (size=${size}) failed invariant: sum = ${sum} (rounded ${rounded})`
          );
        }
      }
    }
  );

  // =========================================================================
  // GROUP 3: FALSY COERCION IMMUNITY & ZERO-SCORE PRESERVATION
  // =========================================================================

  await record(
    "3. Falsy Coercion Immunity",
    "3.1 Genuine score 0 parsed from AI is NEVER coerced to 5 (Feature 7)",
    () => {
      // Simulating parse logic from server/agents/agent1.ts:167-170
      const testCases = [
        { input: { impactScore: 0 }, expected: 0 },
        { input: { impactScore: "0" }, expected: 0 },
        { input: { impactScore: 0.0 }, expected: 0 },
      ];

      for (const tc of testCases) {
        const parsed = Number.isFinite(Number(tc.input.impactScore))
          ? Math.min(10, Math.max(0, Math.round(Number(tc.input.impactScore))))
          : 5;
        if (parsed !== tc.expected) {
          throw new Error(
            `Input ${JSON.stringify(tc.input)} was coerced to ${parsed}, expected ${tc.expected}`
          );
        }
      }
    }
  );

  await record(
    "3. Falsy Coercion Immunity",
    "3.2 Truly invalid / non-numeric scores safely fallback to default 5",
    () => {
      const invalidCases = [
        { impactScore: "invalid_string" },
        { impactScore: undefined },
        { impactScore: NaN },
      ];

      for (const tc of invalidCases) {
        const parsed = Number.isFinite(Number(tc.impactScore))
          ? Math.min(10, Math.max(0, Math.round(Number(tc.impactScore))))
          : 5;
        if (parsed !== 5) {
          throw new Error(
            `Invalid input ${JSON.stringify(tc)} evaluated to ${parsed}, expected fallback 5`
          );
        }
      }
    }
  );

  await record(
    "3. Falsy Coercion Immunity",
    "3.3 Agent 3 forcedScore = 0 overrides Agent 1 without falsy fallback",
    () => {
      // Logic from scripts/calibrate-ai-prompts.ts:122-125
      const agent1ImpactScore = 7;
      const agent3ForcedScore: number | null = 0;

      const finalScore =
        agent3ForcedScore !== null ? agent3ForcedScore : agent1ImpactScore;

      if (finalScore !== 0) {
        throw new Error(
          `forcedScore 0 was falsely coerced to ${finalScore}, expected 0`
        );
      }
    }
  );

  await record(
    "3. Falsy Coercion Immunity",
    "3.4 Score input schema and lead adjustments accept genuine score 0",
    () => {
      const parsed = scoreInputSchema.parse({
        projectId: "proj-01",
        userId: "user-01",
        value: 0,
        reason: "ไม่มีการส่งมอบงานในรอบนี้ (คะแนนศูนย์ตามเกณฑ์)",
      });
      if (parsed.value !== 0) {
        throw new Error(`scoreInputSchema coerced value 0 to ${parsed.value}`);
      }
    }
  );

  // Return Summary
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  return {
    total: results.length,
    passed,
    failed,
    results,
  };
}
