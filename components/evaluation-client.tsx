"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { generateAndSaveTeamSummary } from "@/server/evaluate";
import {
  PeriodSummaryCard,
  type EvaluationPeriodItem,
} from "@/components/evaluation/period-summary-card";
import {
  ScoreTable,
  type ScoreItem,
} from "@/components/evaluation/score-table";
import {
  DisputeList,
  type DisputeItem,
} from "@/components/evaluation/dispute-list";

type Summary = {
  id: string;
  content: string;
  periodStart: Date;
  periodEnd: Date;
};

type Member = {
  user: { id: string; name: string };
};

type AuditLogItem = {
  id: string;
  action: string;
  details: string | null;
  createdAt: Date;
};

export function EvaluationClient({
  projectId,
  currentUserId,
  isLead,
  scores,
  summaries,
  disputes,
  periods,
  auditLogs = [],
}: {
  projectId: string;
  currentUserId: string;
  isLead: boolean;
  scores: ScoreItem[];
  summaries: Summary[];
  disputes: DisputeItem[];
  members: Member[];
  periods: EvaluationPeriodItem[];
  auditLogs?: AuditLogItem[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const openPeriod = periods.find((p) => p.status === "OPEN");
  const closedPeriods = periods.filter((p) => p.status === "CLOSED");

  async function handleAction(fn: () => Promise<unknown>) {
    setLoading(true);
    setError("");
    try {
      await fn();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ดำเนินการไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3.5 text-sm text-red-700 font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* โมดูลที่ 1: การ์ดรอบประเมินและสัดส่วนผลงาน 100% */}
      <PeriodSummaryCard
        projectId={projectId}
        isLead={isLead}
        openPeriod={openPeriod}
        closedPeriods={closedPeriods}
        loading={loading}
        onAction={handleAction}
      />

      {/* โมดูลที่ 2: ตารางคะแนน Impact Score พร้อมการแก้ไขคะแนน ยืนยัน และปลดธง */}
      <ScoreTable
        projectId={projectId}
        currentUserId={currentUserId}
        isLead={isLead}
        scores={scores}
        loading={loading}
        onAction={handleAction}
      />

      {/* โมดูลที่ 3: รายการข้อโต้แย้งคะแนน พร้อมกล่องพิจารณาปรับคะแนน */}
      <DisputeList
        projectId={projectId}
        isLead={isLead}
        disputes={disputes}
        loading={loading}
        onAction={handleAction}
      />

      {/* โมดูลที่ 4: สรุปผลทีมด้วย Gemini AI */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-semibold">
                สรุปผลการดำเนินงานทีม (AI Executive Summary)
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                ประมวลผลหลักฐานการทำงาน 20 รายการล่าสุด และวิเคราะห์ข้อเสนอแนะเชิงกลยุทธ์
              </p>
            </div>
            {isLead && (
              <Button
                disabled={loading}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() =>
                  handleAction(() => generateAndSaveTeamSummary(projectId))
                }
              >
                ✨ สร้างสรุปด้วย Gemini AI
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {summaries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              ยังไม่มีรายงานสรุปผลทีมในขณะนี้
            </p>
          ) : (
            summaries.map((s) => (
              <div
                key={s.id}
                className="rounded-lg border bg-muted/10 p-3.5 space-y-2"
              >
                <div className="flex items-center justify-between text-xs text-muted-foreground border-b pb-1.5">
                  <span>ช่วงเวลาสรุป:</span>
                  <span className="font-medium">
                    {formatDate(s.periodStart)} – {formatDate(s.periodEnd)}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {s.content}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* โมดูลที่ 5: Audit Trail บันทึกประวัติการตัดสินใจและการอนุมัติ */}
      {auditLogs && auditLogs.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  Audit Trail (ประวัติการดำเนินการและการอนุมัติ)
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  บันทึกทุกการตัดสินใจ การแก้ไขคะแนน การปลดธง และการอนุมัติผลตอบแทนเพื่อความโปร่งใสและตรวจสอบย้อนหลังได้ 100%
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                {auditLogs.length} บันทึก
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between border-b pb-2 last:border-0 hover:bg-muted/10 px-1 py-1 rounded transition-colors"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono shrink-0"
                  >
                    {log.action}
                  </Badge>
                  <span className="truncate text-foreground/90">
                    {log.details || "-"}
                  </span>
                </div>
                <span className="text-muted-foreground whitespace-nowrap ml-3 shrink-0">
                  {formatDate(log.createdAt)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
