import { NextRequest, NextResponse } from "next/server";
import { evaluateDailyWorkLog } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { projectTitle, logContent } = await req.json();

    if (!logContent || typeof logContent !== "string") {
      return NextResponse.json({ error: "logContent is required" }, { status: 400 });
    }

    const evaluation = await evaluateDailyWorkLog(projectTitle || "Project", logContent);

    return NextResponse.json(evaluation);
  } catch (error: any) {
    console.error("AI Evaluation API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to evaluate daily log" },
      { status: 500 }
    );
  }
}
