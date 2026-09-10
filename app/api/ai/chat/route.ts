import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  continueMultiTurnChat,
  isGeminiConfigured,
  GEMINI_API_KEY_MISSING_MESSAGE,
  translateGeminiApiError,
} from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    if (!isGeminiConfigured()) {
      return NextResponse.json(
        { error: GEMINI_API_KEY_MISSING_MESSAGE },
        { status: 503 }
      );
    }

    const { history, message, projectContext, projectId } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "ต้องระบุข้อความ" },
        { status: 400 }
      );
    }

    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json(
        { error: "ต้องระบุโปรเจกต์" },
        { status: 400 }
      );
    }

    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: session.user.id,
        },
      },
    });
    if (!membership) {
      return NextResponse.json(
        { error: "คุณไม่ใช่สมาชิกของโปรเจกต์นี้" },
        { status: 403 }
      );
    }

    const reply = await continueMultiTurnChat(
      history || [],
      message,
      projectContext
    );

    return NextResponse.json({ reply });
  } catch (error: unknown) {
    console.error("AI Chat API Error:", error);
    return NextResponse.json(
      { error: translateGeminiApiError(error) },
      { status: 500 }
    );
  }
}
