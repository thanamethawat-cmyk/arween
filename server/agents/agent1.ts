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
    lower === "โอเค" ||
    lower === "ok"
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
    lower.includes("ปัญหา")
  ) {
    impactScore = 8;
    rationale = "แก้ไขปัญหาที่มีผลต่อความคืบหน้า Milestone";
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
คุณคือ Agent 1 (Context Analyzer & Milestone Mapper) ของ ARWEEN
ประเมินบันทึกงานตามผลกระทบต่อ Milestone/KPI ไม่นับจำนวนคำ

โปรเจกต์: "${input.projectName}"

ตารางเป้าหมายที่ใช้ได้:
${anchorList}

เกณฑ์คะแนน 0–10:
- 0–2: ตอบรับทั่วไป / ไม่ผูก KPI
- 3–5: งานทั่วไป / อัปเดตสถานะ
- 6–8: มีผลต่อ Milestone/KPI สูง
- 9–10: ปลดล็อก Critical Blocker ของ KPI หลัก

บันทึกงาน:
"""
${input.action}
"""

คืน JSON เท่านั้น:
{
  "impactScore": number 0-10,
  "rationale": "เหตุผลภาษาไทย อ้าง Milestone/KPI",
  "milestoneId": "id จากรายการด้านบน",
  "kpiId": "id หรือ null",
  "keyHighlight": "สรุปสั้นๆ"
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
      impactScore: Math.min(
        10,
        Math.max(0, Math.round(Number(data.impactScore) || 5))
      ),
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
    const { translateGeminiApiError } = await import("@/lib/gemini");
    throw new Error(translateGeminiApiError(err));
  }
}
