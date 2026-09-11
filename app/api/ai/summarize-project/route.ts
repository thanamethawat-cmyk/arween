import { NextRequest, NextResponse } from "next/server";
import {
  summarizeProjectStatus,
  isGeminiConfigured,
  GEMINI_API_KEY_MISSING_MESSAGE,
  translateGeminiApiError,
} from "@/lib/gemini";
import { requireProjectApiAccess } from "@/lib/ai-route-auth";
import { prisma } from "@/lib/prisma";

/**
 * สรุปโปรเจกต์ด้วย Gemini — ต้อง login + สมาชิก
 * ถ้า save=true และเป็น lead จะบันทึกลง TeamSummary
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
    const {
      projectId,
      projectTitle,
      projectDescription,
      dailyLogs,
      save,
      periodStart,
      periodEnd,
    } = body;

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

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true, description: true },
    });
    if (!project) {
      return NextResponse.json({ error: "ไม่พบโปรเจกต์" }, { status: 404 });
    }

    const title = projectTitle || project.name;
    const description = projectDescription || project.description || "";

    const summary = await summarizeProjectStatus(
      title,
      description,
      dailyLogs || []
    );

    if (save) {
      const isLead =
        access.membership?.role === "lead" ||
        access.session.user?.role === "ADMIN" ||
        access.session.user?.role === "LEAD";
      if (!isLead) {
        return NextResponse.json(
          { error: "เฉพาะหัวหน้าโปรเจกต์ที่บันทึกสรุปได้" },
          { status: 403 }
        );
      }

      const start = periodStart ? new Date(periodStart) : new Date();
      const end = periodEnd ? new Date(periodEnd) : new Date();
      const content = [
        summary.executiveSummary,
        "",
        "ข้อเสนอแนะ:",
        ...(summary.recommendations || []).map((r: string) => `- ${r}`),
      ].join("\n");

      await prisma.teamSummary.create({
        data: {
          projectId,
          content,
          periodStart: start,
          periodEnd: end,
        },
      });
    }

    return NextResponse.json(summary);
  } catch (error: unknown) {
    console.error("AI Project Summarizer Error:", error);
    return NextResponse.json(
      { error: translateGeminiApiError(error) },
      { status: 500 }
    );
  }
}
