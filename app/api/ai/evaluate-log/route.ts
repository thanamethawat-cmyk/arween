import { NextRequest, NextResponse } from "next/server";
import {
  evaluateDailyWorkLog,
  isGeminiConfigured,
  GEMINI_API_KEY_MISSING_MESSAGE,
  translateGeminiApiError,
} from "@/lib/gemini";
import { requireProjectApiAccess } from "@/lib/ai-route-auth";

/**
 * Legacy evaluator — ต้อง login + เป็นสมาชิกโปรเจกต์
 * คะแนนจริงของแพลตฟอร์มใช้ submitDailyLog → Agent 1
 */
export async function POST(req: NextRequest) {
  try {
    if (!isGeminiConfigured()) {
      return NextResponse.json(
        { error: GEMINI_API_KEY_MISSING_MESSAGE },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { projectId, projectTitle, logContent } = body;

    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json(
        { error: "ต้องระบุ projectId" },
        { status: 400 }
      );
    }

    const access = await requireProjectApiAccess(projectId);
    if (!access.ok) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status }
      );
    }

    if (!logContent || typeof logContent !== "string") {
      return NextResponse.json(
        { error: "ต้องระบุเนื้อหาบันทึกงาน" },
        { status: 400 }
      );
    }

    const evaluation = await evaluateDailyWorkLog(
      projectTitle || "Project",
      logContent
    );

    return NextResponse.json(evaluation);
  } catch (error: unknown) {
    console.error("AI Evaluation API Error:", error);
    return NextResponse.json(
      { error: translateGeminiApiError(error) },
      { status: 500 }
    );
  }
}
