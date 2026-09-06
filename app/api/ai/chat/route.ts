import { NextRequest, NextResponse } from "next/server";
import {
  continueMultiTurnChat,
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

    const { history, message, projectContext } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "ต้องระบุข้อความ" },
        { status: 400 }
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
