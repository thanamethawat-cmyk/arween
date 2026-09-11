import { config } from "dotenv";
import { runAgent1, type AnchorContextItem } from "../server/agents/agent1";
import { runAgent3 } from "../server/agents/agent3";
import { isGeminiConfigured } from "../lib/gemini";

config();

type TestCase = {
  name: string;
  action: string;
  recentSameDayActions?: string[];
  expectedScoreMin: number;
  expectedScoreMax: number;
  expectFlagged?: boolean;
};

const BENCHMARK_CASES: TestCase[] = [
  {
    name: "1. ข้อความสแปม / ตอบรับสั้น (Routine Acknowledgment: รับทราบครับ)",
    action: "รับทราบครับ",
    expectedScoreMin: 0,
    expectedScoreMax: 2,
    expectFlagged: false,
  },
  {
    name: "2. ข้อความตอบรับพร้อมคำสุภาพ (Routine Acknowledgment: โอเคครับ)",
    action: "โอเคครับ",
    expectedScoreMin: 0,
    expectedScoreMax: 2,
    expectFlagged: false,
  },
  {
    name: "3. ข้อความสั้นมากไม่มีเนื้อหา (Very short noise: โอเค)",
    action: "โอเค",
    expectedScoreMin: 0,
    expectedScoreMax: 2,
  },
  {
    name: "4. อัปเดตงานประจำวันทั่วไป (Routine Update)",
    action: "เข้าร่วมประชุม Standup ประจำวัน และอัปเดตสถานะงานในบอร์ด",
    expectedScoreMin: 3,
    expectedScoreMax: 5,
  },
  {
    name: "5. งานสถาปัตยกรรมระบบ High Impact (High-impact Architecture)",
    action: "ปรับแก้สถาปัตยกรรม Database connection pool และ sync provider เพื่อรองรับการ Deploy บน Cloud Run ได้อย่างเสถียร",
    expectedScoreMin: 7,
    expectedScoreMax: 10,
  },
  {
    name: "6. งานแก้ปัญหาวิกฤตความปลอดภัยเร่งด่วน (Critical Security Bug Fix)",
    action: "แก้ไขปัญหาช่องโหว่ความปลอดภัยของ API เส้นทางประเมินผลงาน และทดสอบระบบป้องกันไม่ให้บุคคลภายนอกเข้าถึงข้อมูลได้ 100%",
    expectedScoreMin: 8,
    expectedScoreMax: 10,
  },
  {
    name: "7. งานปฏิบัติการออนบอร์ดลูกค้า (Operations Onboarding)",
    action: "จัดทำ Playbook ขั้นตอนการทำงาน และเข้าอบรมออนบอร์ดลูกค้าองค์กรนำร่อง 3 แห่งจนสามารถใช้งานได้จริง",
    expectedScoreMin: 7,
    expectedScoreMax: 10,
  },
  {
    name: "8. การส่งข้อความเดิมซ้ำหลายครั้งในวันเดียวกัน (Same-day Repeat Spam)",
    action: "ปรับแก้สถาปัตยกรรม Database connection pool และ sync provider เพื่อรองรับการ Deploy บน Cloud Run ได้อย่างเสถียร",
    recentSameDayActions: [
      "ปรับแก้สถาปัตยกรรม Database connection pool และ sync provider เพื่อรองรับการ Deploy บน Cloud Run ได้อย่างเสถียร",
      "ปรับแก้สถาปัตยกรรม Database connection pool และ sync provider เพื่อรองรับการ Deploy บน Cloud Run ได้อย่างเสถียร",
    ],
    expectedScoreMin: 0,
    expectedScoreMax: 0,
    expectFlagged: true,
  },
];

const SAMPLE_ANCHORS: AnchorContextItem[] = [
  {
    milestoneId: "ms-arch",
    milestoneName: "จัดทำ Connection Pool และ Synchronize Provider อัตโนมัติ",
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

async function runCalibrationSuite() {
  console.log("===============================================================");
  console.log("   🧪 เริ่มต้นการประเมินและปรับแต่งความแม่นยำ AI (AI Calibration Suite)");
  console.log(`   สถานะ Gemini API: ${isGeminiConfigured() ? "พร้อมใช้งาน (Online)" : "โหมดสำรอง (Heuristics)"}`);
  console.log("===============================================================\n");

  let passCount = 0;

  for (const tc of BENCHMARK_CASES) {
    console.log(`▶ ทดสอบ: ${tc.name}`);
    console.log(`  ข้อความ: "${tc.action}"`);

    const agent1Result = await runAgent1({
      projectName: "โครงการนำร่อง ARWEEN",
      action: tc.action,
      anchors: SAMPLE_ANCHORS,
    });

    const agent3Result = runAgent3({
      action: tc.action,
      recentSameDayActions: tc.recentSameDayActions ?? [],
    });

    const finalScore =
      agent3Result.forcedScore !== null
        ? agent3Result.forcedScore
        : agent1Result.impactScore;
    const isFlagged = agent3Result.flagged;

    const inRange =
      finalScore >= tc.expectedScoreMin && finalScore <= tc.expectedScoreMax;
    const flagMatches =
      tc.expectFlagged === undefined || isFlagged === tc.expectFlagged;
    const isPass = inRange && flagMatches;

    if (isPass) passCount++;

    const status = isPass ? "✅ PASS" : "⚠️ NEEDS CALIBRATION / FAILED";

    console.log(
      `  คะแนนที่ได้: ${finalScore}/10 (ช่วงที่คาดหวัง: ${tc.expectedScoreMin}-${tc.expectedScoreMax}) [${status}]`
    );
    console.log(`  คำอธิบาย: ${agent1Result.rationale}`);
    if (isFlagged) {
      console.log(`  🚨 Flagged: ${agent3Result.flagReason}`);
    }
    if (tc.expectFlagged !== undefined && !flagMatches) {
      console.log(
        `  ❌ Flag mismatch: คาดหวัง flagged=${tc.expectFlagged} แต่ได้ flagged=${isFlagged}`
      );
    }
    console.log("");
  }

  console.log("===============================================================");
  console.log(
    ` 📊 สรุปผลการ Calibration: ผ่าน ${passCount}/${BENCHMARK_CASES.length} เคส (${Math.round(
      (passCount / BENCHMARK_CASES.length) * 100
    )}%)`
  );
  console.log("===============================================================");

  if (passCount < BENCHMARK_CASES.length) {
    console.error(
      `❌ มีเคสทดสอบไม่ผ่าน ${BENCHMARK_CASES.length - passCount} เคส`
    );
    process.exit(1);
  }
}

runCalibrationSuite().catch((err) => {
  console.error("Calibration error:", err);
  process.exit(1);
});
