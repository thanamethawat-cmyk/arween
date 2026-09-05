import { NextRequest, NextResponse } from "next/server";
import { summarizeProjectStatus } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { projectTitle, projectDescription, dailyLogs } = await req.json();

    if (!projectTitle) {
      return NextResponse.json({ error: "projectTitle is required" }, { status: 400 });
    }

    const summary = await summarizeProjectStatus(
      projectTitle,
      projectDescription || "",
      dailyLogs || []
    );

    return NextResponse.json(summary);
  } catch (error: any) {
    console.error("AI Project Summarizer Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to summarize project" },
      { status: 500 }
    );
  }
}
