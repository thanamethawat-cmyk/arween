import { NextRequest, NextResponse } from "next/server";
import { appendFile } from "fs/promises";
import path from "path";

const LOG_FILE = path.join(process.cwd(), "debug-be5c77.log");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const line = JSON.stringify({
      sessionId: "be5c77",
      ...body,
      timestamp: body.timestamp || Date.now(),
    });
    await appendFile(LOG_FILE, line + "\n", "utf8");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "log failed" },
      { status: 500 }
    );
  }
}
