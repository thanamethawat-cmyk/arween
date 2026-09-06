import { NextRequest, NextResponse } from "next/server";
import {
  summarizeProjectStatus,
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

    const { projectTitle, projectDescription, dailyLogs } = await req.json();

    if (!projectTitle) {
      return NextResponse.json(
        { error: "ต้องระบุชื่อโครงการ" },
        { status: 400 }
      );
    }

    const summary = await summarizeProjectStatus(
      projectTitle,
      projectDescription || "",
      dailyLogs || []
    );

    return NextResponse.json(summary);
  } catch (error: unknown) {
    console.error("AI Project Summarizer Error:", error);
    return NextResponse.json(
      { error: translateGeminiApiError(error) },
      { status: 500 }
    );
  }
}
