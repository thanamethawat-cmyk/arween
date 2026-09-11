import { NextRequest, NextResponse } from "next/server";
import { buildConfirmedSharesCsv } from "@/server/periods";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string; periodId: string }> }
) {
  try {
    const { periodId } = await context.params;
    const result = await buildConfirmedSharesCsv(periodId);
    return new NextResponse(result.csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${result.filename}"`,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "export ไม่สำเร็จ";
    const status = message.includes("เข้าสู่ระบบ")
      ? 401
      : message.includes("สมาชิก")
        ? 403
        : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
