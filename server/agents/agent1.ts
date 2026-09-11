import {
  assertGeminiConfigured,
  getGenAIModelJson,
  isGeminiConfigured,
  parseJsonFromModelText,
} from "@/lib/gemini-agents";

export type AnchorContextItem = {
  milestoneId: string;
  milestoneName: string;
  kpiId?: string;
  kpiName?: string;
  objectiveName: string;
};

export type Agent1Result = {
  impactScore: number;
  rationale: string;
  milestoneId: string | null;
  kpiId: string | null;
  keyHighlight: string;
  usedGemini: boolean;
};

function heuristicScore(
  action: string,
  anchors: AnchorContextItem[]
): Agent1Result {
  const lower = action.toLowerCase();
  const first = anchors[0];
  let impactScore = 5;
  let rationale = "งานระดับปานกลางที่ผูกกับเป้าหมายได้บางส่วน";

  if (
    lower.includes("รับทราบ") ||
    lower.includes("ขอบคุณ") ||
    lower.startsWith("โอเค") ||
    lower.startsWith("ok") ||
    lower === "โอเค" ||
    lower === "ok" ||
    lower.startsWith("ครับ") ||
    lower.startsWith("ค่ะ") ||
    lower === "ครับผม"
  ) {
    impactScore = 1;
    rationale = "ข้อความตอบรับทั่วไป ไม่มีผลต่อ Milestone/KPI ชัดเจน";
  } else if (
    lower.includes("blocker") ||
    lower.includes("ปลดล็อก") ||
    lower.includes("ติดขัด")
  ) {
    impactScore = 9;
    rationale = "มีการจัดการอุปสรรคที่มีผลต่อ KPI หลัก";
  } else if (
    lower.includes("แก้") ||
    lower.includes("bug") ||
    lower.includes("ปัญหา") ||
    lower.includes("ช่องโหว่") ||
    lower.includes("security")
  ) {
    impactScore = 8;
    rationale = "แก้ไขปัญหาหรือช่องโหว่ที่มีผลต่อความคืบหน้าและความปลอดภัยของระบบ";
  } else if (
    lower.includes("ออนบอร์ด") ||
    lower.includes("onboard") ||
    lower.includes("playbook") ||
    lower.includes("คู่มือ") ||
    lower.includes("สำเร็จ") ||
    lower.includes("ส่งมอบ") ||
    lower.includes("สถาปัตยกรรม") ||
    lower.includes("architecture") ||
    lower.includes("connection pool")
  ) {
    impactScore = 8;
    rationale = "งานระดับ High Impact: ส่งมอบผลงานสถาปัตยกรรม หรือการออนบอร์ดองค์กรสำเร็จตาม KPI";
  }

  return {
    impactScore,
    rationale: `โหมดสำรอง (ไม่มี GEMINI_API_KEY): ${rationale}`,
    milestoneId: first?.milestoneId ?? null,
    kpiId: first?.kpiId ?? null,
    keyHighlight: action.slice(0, 80),
    usedGemini: false,
  };
}

export async function runAgent1(input: {
  projectName: string;
  action: string;
  anchors: AnchorContextItem[];
}): Promise<Agent1Result> {
  if (input.anchors.length === 0) {
    throw new Error(
      "ยังไม่มีเป้าหมายโปรเจกต์ (Objective/Milestone) — ตั้งแผนก่อนให้คะแนน"
    );
  }

  if (!isGeminiConfigured()) {
    return heuristicScore(input.action, input.anchors);
  }

  assertGeminiConfigured();
  const model = getGenAIModelJson();
  const anchorList = input.anchors
    .map(
      (a, i) =>
        `${i + 1}. objective="${a.objectiveName}" milestoneId=${a.milestoneId} milestone="${a.milestoneName}"` +
        (a.kpiId ? ` kpiId=${a.kpiId} kpi="${a.kpiName}"` : " (ไม่มี KPI)")
    )
    .join("\n");

  const prompt = `
คุณคือ Agent 1 (Context Analyzer & Milestone Mapper) ของระบบ ARWEEN
ประเมินบันทึกงานตามผลกระทบจริงต่อ Milestone/KPI ตามหลัก High Impact Action อย่างเป็นกลางและโปร่งใส

หลักการสำคัญ:
1. วัดผลกระทบจริง (Impact-driven): ให้คะแนนตามผลต่องาน เป้าหมาย หรือการปลดล็อกอุปสรรค ห้ามนับจำนวนคำหรือความยาว
2. ความเป็นธรรมต่องานเบื้องหลัง (Fairness to Back-office & Tech): งานเบื้องหลังที่สำคัญ (เช่น ปรับปรุงฐานข้อมูล, สถาปัตยกรรมระบบ, แก้ bug, จัดทำคู่มือปฏิบัติการ, วางระบบความปลอดภัย, ออนบอร์ดลูกค้า) ให้คะแนนสูง (7-10) ได้เท่ากับงานหน้าบ้าน
3. ตรวจจับการปั่นคะแนน (Anti-Gaming): หากเป็นข้อความตอบรับสั้นๆ ไร้สาระ ("รับทราบครับ", "โอเค", "ขอบคุณ") ให้คะแนน 0–2

โปรเจกต์: "${input.projectName}"

ตารางเป้าหมายที่ใช้ได้:
${anchorList}

เกณฑ์คะแนน 0–10:
- 0–2: ตอบรับทั่วไป / ข้อความสแปม / ไม่ช่วยงาน
- 3–5: งานทั่วไป / อัปเดตสถานะประจำวัน
- 6–8: High Impact — งานที่มีผลต่อความคืบหน้าของ Milestone/KPI หรือช่วยแก้ปัญหาให้ทีม
- 9–10: High Impact สูง — ปลดล็อก Critical Blocker ช่วยข้ามสายงาน หรือสร้างความสำเร็จหลัก

บันทึกงาน:
"""
${input.action}
"""

คืน JSON เท่านั้น:
{
  "impactScore": number 0-10,
  "rationale": "เหตุผลภาษาไทย โปร่งใส อ้าง Milestone/KPI และผลกระทบต่องาน",
  "milestoneId": "id จากรายการด้านบน",
  "kpiId": "id หรือ null",
  "keyHighlight": "สรุปผลงานหลักหนึ่งประโยค"
}
`.trim();

  try {
    const response = await model.generateContent(prompt);
    const data = parseJsonFromModelText(response.response.text()) as Record<
      string,
      unknown
    >;
    const milestoneId =
      typeof data.milestoneId === "string" &&
      input.anchors.some((a) => a.milestoneId === data.milestoneId)
        ? data.milestoneId
        : input.anchors[0].milestoneId;
    const kpiId =
      typeof data.kpiId === "string" &&
      input.anchors.some((a) => a.kpiId === data.kpiId)
        ? data.kpiId
        : input.anchors.find((a) => a.milestoneId === milestoneId)?.kpiId ??
          null;

    return {
      impactScore: Number.isFinite(Number(data.impactScore))
        ? Math.min(10, Math.max(0, Math.round(Number(data.impactScore))))
        : 5,
      rationale:
        typeof data.rationale === "string"
          ? data.rationale
          : "ประเมินตามผลต่อเป้าหมายโปรเจกต์",
      milestoneId,
      kpiId,
      keyHighlight:
        typeof data.keyHighlight === "string"
          ? data.keyHighlight
          : input.action.slice(0, 80),
      usedGemini: true,
    };
  } catch (err) {
    const errMsg = (err as Error)?.message || String(err);
    console.warn(
      "[Agent 1] Gemini API unavailable or quota exceeded, falling back to heuristic scoring:",
      errMsg
    );
    const fallback = heuristicScore(input.action, input.anchors);
    const isModelMissing =
      errMsg.includes("no longer available") ||
      errMsg.includes("is not found") ||
      errMsg.includes("404");
    const fallbackPrefix = isModelMissing
      ? "โหมดสำรองชั่วคราว (รุ่นโมเดล Gemini ไม่พร้อมใช้งาน)"
      : "โหมดสำรองชั่วคราว (โควตา AI เต็มหรือเชื่อมต่อไม่ได้)";
    return {
      ...fallback,
      rationale: `${fallbackPrefix}: ${fallback.rationale.replace(/^โหมดสำรอง.*:\s*/, "")}`,
      usedGemini: false,
    };
  }
}
