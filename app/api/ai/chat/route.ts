import { NextRequest, NextResponse } from "next/server";
import { continueMultiTurnChat } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { history, message, projectContext } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const reply = await continueMultiTurnChat(history || [], message, projectContext);

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("AI Chat API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process chat message" },
      { status: 500 }
    );
  }
}
