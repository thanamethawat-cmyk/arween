import { NextResponse } from "next/server";
import { DEFAULT_MODEL, isGeminiConfigured } from "@/lib/gemini";

/** ตรวจสถานะคีย์/รุ่น — ไม่เรียก Gemini generateContent */
export async function GET() {
  return NextResponse.json({
    configured: isGeminiConfigured(),
    model: DEFAULT_MODEL,
    billingHint: isGeminiConfigured()
      ? null
      : "ตั้ง GEMINI_API_KEY ใน .env — ดู docs/gemini-setup.md",
  });
}
