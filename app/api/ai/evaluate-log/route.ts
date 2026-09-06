import { NextRequest, NextResponse } from "next/server";
import {
  evaluateDailyWorkLog,
  isGeminiConfigured,
  GEMINI_API_KEY_MISSING_MESSAGE,
  translateGeminiApiError,
} from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    if (!isGeminiConfigured()) {
      return NextResponse.json(
        { error: GEMINI_API_KEY_MISSING_MESSAGE },
        { status: 503 }
      );
    }

    const { projectTitle, logContent } = await req.json();

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
