import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);
export const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

export const ARWEEN_SYSTEM_INSTRUCTION = `
You are ARWEEN Operations Copilot & Merit Evaluator (ระบบผู้ช่วยบริหารงานอัจฉริยะและประเมินคุณค่างาน).
Your primary objectives are:
1. Daily Operations & Progress Tracking: Help developers/users log daily accomplishments, problem-solving, and blockers. Connect every daily effort directly to the project's overall milestone and success.
2. Multi-turn Collaboration: Act as a helpful, encouraging, and sharp technical operations copilot. Answer questions, offer advice on technical blockers, and help structure their daily tasks.
3. Fair & Transparent Merit Evaluation (Merit-to-Earn):
   - Routine greetings/confirmations ("ok", "thanks"): 1-2 points.
   - Standard daily tasks / minor updates: 3-5 points.
   - Significant deliverables / technical breakthroughs / resolving complex blockers: 6-8 points.
   - Exceptional cross-functional collaboration / architectural impact: 9-10 points.
4. Language: Respond naturally in the language used by the user (primarily Thai or English). Always provide clear, constructive, and transparent reasoning.
`.trim();

export function getGeminiModel(customInstruction?: string) {
  return genAI.getGenerativeModel({
    model: DEFAULT_MODEL,
    systemInstruction: customInstruction || ARWEEN_SYSTEM_INSTRUCTION,
  });
}

export type ChatMessage = {
  role: "user" | "model";
  parts: [{ text: string }];
};

export async function continueMultiTurnChat(
  history: ChatMessage[],
  newMessage: string,
  projectContext?: { title: string; description?: string; currentProgress: number }
) {
  const model = getGeminiModel();
  
  // Format system context if project info provided
  const contextNote = projectContext
    ? `[System Context: Active Project is "${projectContext.title}". Current overall progress: ${projectContext.currentProgress}%. Description: ${projectContext.description || "N/A"}]\n`
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
  progressIncrement: number; // e.g. 5 means +5%
  detectedBlockers: string;
  keyHighlight: string;
};

export async function evaluateDailyWorkLog(
  projectTitle: string,
  logContent: string
): Promise<DailyEvaluationResult> {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" },
  });

  const prompt = `
Analyze the following daily work log for project "${projectTitle}".
Evaluate its impact, merit, and contribution to project progress.
Return a valid JSON object with the following schema:
{
  "meritScore": number between 1 and 10,
  "rationale": "Clear, objective explanation in Thai of why this score was awarded",
  "progressIncrement": estimated integer percentage between 1 and 25 to add to project progress,
  "detectedBlockers": "Brief note of any blockers or challenges mentioned, or 'None'",
  "keyHighlight": "One concise sentence summarizing the main accomplishment"
}

User's Daily Log:
"""
${logContent}
"""
`.trim();

  const response = await model.generateContent(prompt);
  const text = response.response.text();
  try {
    const data = JSON.parse(text);
    return {
      meritScore: Number(data.meritScore) || 5,
      rationale: data.rationale || "บันทึกการทำงานตามมาตรฐาน",
      progressIncrement: Number(data.progressIncrement) || 5,
      detectedBlockers: data.detectedBlockers || "ไม่มี",
      keyHighlight: data.keyHighlight || "อัปเดตงานประจำวัน",
    };
  } catch {
    return {
      meritScore: 5,
      rationale: "บันทึกการทำงานเรียบร้อย",
      progressIncrement: 5,
      detectedBlockers: "ไม่มี",
      keyHighlight: "อัปเดตงานประจำวัน",
    };
  }
}

export async function summarizeProjectStatus(
  projectTitle: string,
  projectDescription: string,
  dailyLogs: Array<{ date: string; summary: string; meritScore: number; blockers?: string }>
): Promise<{ executiveSummary: string; recommendations: string[] }> {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" },
  });

  const prompt = `
Analyze the progress of project "${projectTitle}" (${projectDescription}) based on these recent daily updates:
${JSON.stringify(dailyLogs, null, 2)}

Synthesize this into an executive project summary for stakeholders.
Return a valid JSON object with:
{
  "executiveSummary": "2-3 sentences in Thai summarizing current velocity, recent major milestones achieved, and general momentum",
  "recommendations": ["Actionable recommendation 1", "Actionable recommendation 2"]
}
`.trim();

  const response = await model.generateContent(prompt);
  try {
    return JSON.parse(response.response.text());
  } catch {
    return {
      executiveSummary: "โครงการมีความคืบหน้าอย่างต่อเนื่องตามบันทึกการทำงานประจำวัน",
      recommendations: ["ติดตามงานที่คั่งค้าง", "รักษาความต่อเนื่องในการส่งมอบงาน"],
    };
  }
}
