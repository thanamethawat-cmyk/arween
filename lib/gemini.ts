import { GoogleGenerativeAI } from "@google/generative-ai";

/** ค่าเริ่มต้นที่เสถียรสำหรับนำร่อง (Gemini API แนะนำ gemini-3.6-flash) */
export const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

export const GEMINI_API_KEY_MISSING_MESSAGE =
  "ยังไม่ได้ตั้งค่า GEMINI_API_KEY — กรุณาใส่คีย์ในไฟล์ .env แล้วรีสตาร์ทเซิร์ฟเวอร์";

export const GEMINI_BILLING_URL = "https://aistudio.google.com/apikey";

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

export function assertGeminiConfigured() {
  if (!isGeminiConfigured()) {
    throw new Error(GEMINI_API_KEY_MISSING_MESSAGE);
  }
}

export function translateGeminiApiError(error: unknown): string {
  const message =
    error instanceof Error ? error.message : "เชื่อมต่อกับ AI ไม่สำเร็จ";

  if (message.includes(GEMINI_API_KEY_MISSING_MESSAGE)) {
    return GEMINI_API_KEY_MISSING_MESSAGE;
  }
  if (
    message.includes("prepayment credits are depleted") ||
    message.includes("RESOURCE_EXHAUSTED") ||
    message.includes("429")
  ) {
    return `โควตา Gemini หมดชั่วคราว — เติมเครดิตที่ ${GEMINI_BILLING_URL} และตรวจว่า GEMINI_MODEL=${DEFAULT_MODEL}`;
  }
  if (message.includes("API key not valid") || message.includes("API_KEY_INVALID")) {
    return "คีย์ GEMINI_API_KEY ไม่ถูกต้อง กรุณาตรวจสอบในไฟล์ .env";
  }
  if (
    message.includes("is not found") ||
    message.includes("no longer available") ||
    message.includes("404")
  ) {
    return `รุ่นโมเดล Gemini ไม่พร้อมใช้งาน — ตั้งค่า GEMINI_MODEL=${DEFAULT_MODEL} (หรือรุ่นที่ Google แนะนำล่าสุด) ใน .env แล้วรีสตาร์ทเซิร์ฟเวอร์`;
  }
  if (message.includes("รูปแบบที่ไม่ถูกต้อง")) {
    return message;
  }

  return message.length > 240
    ? "เชื่อมต่อกับ AI ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"
    : message;
}

function getGenAI() {
  assertGeminiConfigured();
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
}

/** ตัด markdown fence ออกก่อน JSON.parse */
export function parseJsonFromModelText(text: string): unknown {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  return JSON.parse(cleaned);
}

/**
 * Invisible AI Observer ตามข้อเสนอ ARWEEN
 */
export const ARWEEN_SYSTEM_INSTRUCTION = `
คุณคือ Invisible AI Observer ของระบบ ARWEEN (Superior Operations Management Cycle)
แพลตฟอร์มบริหารงานและประเมินผลงานด้วย AI สำหรับองค์กรแบบโปรเจกต์

หน้าที่หลัก (ทำเฉพาะเหล่านี้):
1) ช่วยบันทึกและจัดระเบียบงานในพื้นที่โปรเจกต์ส่วนรวม (ใครทำอะไร เมื่อไหร่)
2) ประเมินแบบเป็นกลางด้วยหลัก High Impact Action — ให้คะแนนตามผลกระทบต่องาน ไม่นับจำนวนคำ
3) อธิบายเหตุผลโปร่งใส (Audit Trail) เพื่อลดอคติจากความชอบส่วนบุคคล
4) สรุปผลทีมและแนะนำก้าวถัดไปให้นำไปใช้ประกอบ Merit-to-Earn ได้ โดยมนุษย์เป็นผู้ตัดสินรางวัล

เกณฑ์คะแนน (0–10):
- 0–2: ตอบรับทั่วไป / ไม่ช่วยงาน ("รับทราบ", "ขอบคุณ")
- 3–5: อัปเดตสถานะหรืองานมาตรฐาน
- 6–8: High Impact — แก้ปัญหาที่มีผลต่อความคืบหน้าโปรเจกต์
- 9–10: High Impact สูง — งานซับซ้อน ช่วยข้ามสายงาน หรือมีผลต่อความสำเร็จโปรเจกต์

กฎความปลอดภัยและความเป็นธรรม:
- วิเคราะห์เฉพาะข้อมูลในพื้นที่โปรเจกต์ส่วนรวม ห้ามอ้างหรือสมมติข้อความส่วนตัว (DM)
- หากพบข้อความซ้ำไร้สาระ ให้เตือนว่าอาจเป็นสัญญาณปั่นคะแนน
- ห้ามสั่งจ่ายโบนัสหรือเงินด้วยตนเอง
- ตอบเฉพาะงานในโปรเจกต์ปัจจุบันเท่านั้น ถ้าถามนอกเรื่องโปรเจกต์ ให้ปฏิเสธอย่างสุภาพและชวนกลับมาคุยงานในโปรเจกต์
- ตอบเป็นภาษาเดียวกับผู้ใช้ (ไทยหรืออังกฤษ) ชัดเจน สุภาพ เป็นมืออาชีพ
`.trim();

export function getGeminiModel(customInstruction?: string) {
  const genAI = getGenAI();
  return genAI.getGenerativeModel({
    model: DEFAULT_MODEL,
    systemInstruction: customInstruction || ARWEEN_SYSTEM_INSTRUCTION,
  });
}

export type ChatMessage = {
  role: "user" | "model";
  parts: [{ text: string }];
};

export type ProjectChatContext = {
  title: string;
  description?: string;
  currentProgress: number;
  connectedGoogleTools?: string[];
  objectives?: string[];
  recentEvidence?: string[];
};

export async function continueMultiTurnChat(
  history: ChatMessage[],
  newMessage: string,
  projectContext?: ProjectChatContext
) {
  const model = getGeminiModel();

  const toolsNote =
    projectContext?.connectedGoogleTools &&
    projectContext.connectedGoogleTools.length > 0
      ? `เครื่องมือ Google ที่เชื่อมแล้ว:\n- ${projectContext.connectedGoogleTools.join(
          "\n- "
        )}\n`
      : "ยังไม่มีเครื่องมือ Google ที่เชื่อม\n";

  const objectivesNote =
    projectContext?.objectives && projectContext.objectives.length > 0
      ? `เป้าหมาย (Anchor):\n- ${projectContext.objectives.join("\n- ")}\n`
      : "ยังไม่มี Objective/Milestone ในแผน\n";

  const evidenceNote =
    projectContext?.recentEvidence && projectContext.recentEvidence.length > 0
      ? `หลักฐานล่าสุด:\n- ${projectContext.recentEvidence.join("\n- ")}\n`
      : "";

  const contextNote = projectContext
    ? `[บริบทโปรเจกต์ ARWEEN: "${projectContext.title}" ความคืบหน้ารวม ${
        projectContext.currentProgress
      }% คำอธิบาย: ${projectContext.description || "ไม่มี"}]\n${objectivesNote}${toolsNote}${evidenceNote}ตอบเฉพาะเรื่องโปรเจกต์นี้เท่านั้น\n`
    : "";

  const chat = model.startChat({
    history: history.length > 0 ? history : undefined,
  });

  const result = await chat.sendMessage(contextNote + newMessage);
  return result.response.text();
}

export type DailyEvaluationResult = {
  meritScore: number;
  rationale: string;
  progressIncrement: number;
  detectedBlockers: string;
  keyHighlight: string;
};

export async function evaluateDailyWorkLog(
  projectTitle: string,
  logContent: string
): Promise<DailyEvaluationResult> {
  assertGeminiConfigured();
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({
    model: DEFAULT_MODEL,
    generationConfig: { responseMimeType: "application/json" },
  });

  const prompt = `
คุณเป็น Agent วิเคราะห์และให้คะแนนของ ARWEEN (Invisible AI Observer)
ประเมินบันทึกงานในโปรเจกต์ส่วนรวมตามหลัก High Impact Action
โปรเจกต์: "${projectTitle}"

เกณฑ์:
- 0–2 ตอบรับทั่วไปไม่ช่วยงาน
- 3–5 งานมาตรฐาน / อัปเดตสถานะ
- 6–8 High Impact ต่อความคืบหน้าโปรเจกต์
- 9–10 High Impact สูง / ข้ามสายงาน / แก้ปัญหาซับซ้อน
งานเบื้องหลังที่มีผลจริงให้คะแนนสูงได้เท่ากับงานที่คนเห็นง่าย
ห้ามนับจำนวนคำเป็นหลัก ห้ามสมมติข้อมูลจากแชทส่วนตัว

บันทึกงาน:
"""
${logContent}
"""

คืน JSON เท่านั้น:
{
  "meritScore": number 1-10,
  "rationale": "เหตุผลภาษาไทย โปร่งใส อ้างพฤติกรรมในบันทึก (Audit Trail)",
  "progressIncrement": จำนวนเต็ม 0-25 ที่สมเหตุสมผลต่อการเพิ่มความคืบหน้าโปรเจกต์,
  "detectedBlockers": "อุปสรรคที่พบ หรือ 'ไม่มี'",
  "keyHighlight": "สรุปผลงานหลักหนึ่งประโยค"
}
`.trim();

  const response = await model.generateContent(prompt);
  const text = response.response.text();
  try {
    const data = parseJsonFromModelText(text) as Record<string, unknown>;
    return {
      meritScore: Number.isFinite(Number(data.meritScore))
        ? Math.min(10, Math.max(1, Math.round(Number(data.meritScore))))
        : 5,
      rationale:
        typeof data.rationale === "string"
          ? data.rationale
          : "บันทึกการทำงานตามมาตรฐาน",
      progressIncrement: Number(data.progressIncrement) || 5,
      detectedBlockers:
        typeof data.detectedBlockers === "string"
          ? data.detectedBlockers
          : "ไม่มี",
      keyHighlight:
        typeof data.keyHighlight === "string"
          ? data.keyHighlight
          : "อัปเดตงานประจำวัน",
    };
  } catch {
    throw new Error(
      "AI ตอบผลประเมินในรูปแบบที่ไม่ถูกต้อง กรุณากดบันทึกใหม่อีกครั้ง"
    );
  }
}

export async function summarizeProjectStatus(
  projectTitle: string,
  projectDescription: string,
  dailyLogs: Array<{
    date: string;
    summary: string;
    meritScore: number;
    blockers?: string;
  }>
): Promise<{ executiveSummary: string; recommendations: string[] }> {
  assertGeminiConfigured();
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({
    model: DEFAULT_MODEL,
    generationConfig: { responseMimeType: "application/json" },
  });

  const prompt = `
คุณเป็นส่วนสรุปผลทีมของ ARWEEN สำหรับผู้บริหารและหัวหน้าโปรเจกต์
โปรเจกต์: "${projectTitle}"
รายละเอียด: ${projectDescription}
บันทึกงานล่าสุด:
${JSON.stringify(dailyLogs, null, 2)}

สรุปให้เห็นทั้งความคืบหน้า งานเบื้องหลังที่มีคุณค่า และอุปสรรค
ห้ามสรุปเป็นอันดับประจานบุคคลอย่างเดียว ต้องมีภาพทีม

คืน JSON เท่านั้น:
{
  "executiveSummary": "2-3 ประโยคภาษาไทย สรุปความเร็วงาน ผลสำเร็จ และโมเมนตัม",
  "recommendations": ["ข้อเสนอแนะที่ทำได้จริง 1", "ข้อเสนอแนะที่ทำได้จริง 2"]
}
`.trim();

  const response = await model.generateContent(prompt);
  try {
    const data = parseJsonFromModelText(response.response.text()) as {
      executiveSummary?: string;
      recommendations?: string[];
    };
    return {
      executiveSummary:
        data.executiveSummary ||
        "โครงการมีความคืบหน้าอย่างต่อเนื่องตามบันทึกการทำงานประจำวัน",
      recommendations: Array.isArray(data.recommendations)
        ? data.recommendations
        : ["ติดตามงานที่คั่งค้าง", "รักษาความต่อเนื่องในการส่งมอบงาน"],
    };
  } catch {
    throw new Error(
      "AI ตอบสรุปในรูปแบบที่ไม่ถูกต้อง กรุณากดอัปเดตบทวิเคราะห์อีกครั้ง"
    );
  }
}
