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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import {
  confirmScore,
  createDispute,
  resolveDispute,
  rejectDispute,
} from "@/server/evaluate";
import {
  closeEvaluationPeriod,
  confirmAllPeriodScores,
  confirmContributionShares,
} from "@/server/periods";

type Score = {
  id: string;
  value: number;
  reason: string;
  confirmed: boolean;
  flagged: boolean;
  flagReason: string | null;
  user: { id: string; name: string };
  evidenceEvent: { action: string } | null;
  milestone: { id: string; name: string } | null;
  kpi: { id: string; name: string } | null;
  evaluationPeriodId: string | null;
};

type Summary = {
  id: string;
  content: string;
  periodStart: Date;
  periodEnd: Date;
};

type Dispute = {
  id: string;
  reason: string;
  status: string;
  scoreId: string | null;
  user: { name: string };
};

type Member = {
  user: { id: string; name: string };
};

type Period = {
  id: string;
  periodStart: Date;
  periodEnd: Date;
  status: string;
  shares: {
    id: string;
    ratioPercent: number;
    impactSum: number;
    confirmed: boolean;
    user: { id: string; name: string };
  }[];
};

export function EvaluationClient({
  projectId,
  currentUserId,
  isLead,
  scores,
  summaries,
  disputes,
  periods,
}: {
  projectId: string;
  currentUserId: string;
  isLead: boolean;
  scores: Score[];
  summaries: Summary[];
  disputes: Dispute[];
  members: Member[];
  periods: Period[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const openPeriod = periods.find((p) => p.status === "OPEN");
  const closedPeriods = periods.filter((p) => p.status === "CLOSED");

  async function run(fn: () => Promise<unknown>) {
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
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {openPeriod && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              รอบประเมินปัจจุบัน (เปิดอยู่)
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {formatDate(openPeriod.periodStart)} – {formatDate(openPeriod.periodEnd)}
            </p>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {isLead && (
              <>
                <Button
                  disabled={loading}
                  variant="outline"
                  onClick={() => run(() => confirmAllPeriodScores(openPeriod.id))}
                >
                  ยืนยันคะแนนทั้งหมดในรอบ (ที่ไม่ถูกธง)
                </Button>
                <Button
                  disabled={loading}
                  className="bg-blue-600 text-white"
                  onClick={() => run(() => closeEvaluationPeriod(openPeriod.id))}
                >
                  ปิดรอบและคำนวณสัดส่วน 100%
                </Button>
              </>
            )}
            <p className="text-xs text-muted-foreground w-full">
              ต้องยืนยันคะแนนก่อนปิดรอบ — คะแนนที่ถูกตั้งธงจะไม่นับเข้าสัดส่วน
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Impact Score (Audit Trail)</CardTitle>
          <p className="text-sm text-muted-foreground">
            คะแนนจาก AI เป็นข้อเสนอ — หัวหน้าต้องยืนยันก่อนใช้ประกอบผลตอบแทน
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {scores.length === 0 ? (
            <p className="text-sm text-muted-foreground">ยังไม่มีคะแนน</p>
          ) : (
            scores.map((s) => (
              <div key={s.id} className="rounded-md border p-3 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{s.user.name}</span>
                  <Badge>{s.value}/10</Badge>
                  {s.flagged && <Badge variant="destructive">ตั้งธง</Badge>}
                  {s.confirmed ? (
                    <Badge variant="secondary">ยืนยันแล้ว</Badge>
                  ) : isLead && !s.flagged ? (
                    <Button
                      variant="outline"
                      className="h-7 px-2 text-xs"
                      disabled={loading}
                      onClick={() => run(() => confirmScore(s.id, projectId))}
                    >
                      หัวหน้ายืนยัน
                    </Button>
                  ) : null}
                </div>
                <p className="text-sm">{s.reason}</p>
                {s.milestone && (
                  <p className="text-xs text-muted-foreground">
                    ผูกกับ: {s.milestone.name}
                    {s.kpi ? ` / ${s.kpi.name}` : ""}
                  </p>
                )}
                {s.flagReason && (
                  <p className="text-xs text-amber-700">{s.flagReason}</p>
                )}
                {s.evidenceEvent && (
                  <p className="text-xs text-muted-foreground">
                    หลักฐาน: {s.evidenceEvent.action}
                  </p>
                )}
                {s.user.id === currentUserId && (
                  <form
                    className="space-y-2 border-t pt-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = new FormData(e.currentTarget);
                      run(async () => {
                        await createDispute({
                          projectId,
                          userId: currentUserId,
                          reason: String(form.get("reason")),
                          scoreId: s.id,
                        });
                      });
                      e.currentTarget.reset();
                    }}
                  >
                    <Textarea
                      name="reason"
                      placeholder="ไม่เห็นด้วยกับคะแนนนี้ เพราะ..."
                      required
                      rows={2}
                    />
                    <Button type="submit" size="sm" variant="outline" disabled={loading}>
                      ยื่นโต้แย้ง
                    </Button>
                  </form>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {closedPeriods.map((period) => (
        <Card key={period.id}>
          <CardHeader>
            <CardTitle className="text-base">
              สัดส่วนผลงานรอบที่ปิด — {formatDate(period.periodStart)} ถึง{" "}
              {formatDate(period.periodEnd)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {period.shares.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                ไม่มีคะแนนที่ยืนยันแล้วในรอบนี้ — ยังคำนวณสัดส่วนไม่ได้
              </p>
            ) : (
              <>
                <ul className="space-y-2">
                  {period.shares.map((share) => (
                    <li
                      key={share.id}
                      className="flex items-center justify-between text-sm border rounded px-3 py-2"
                    >
                      <span>{share.user.name}</span>
                      <span className="font-semibold">
                        {share.ratioPercent}%{" "}
                        <span className="text-muted-foreground font-normal">
                          (Impact รวม {share.impactSum})
                        </span>
                        {share.confirmed ? " · ยืนยันแล้ว" : ""}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground">
                  รวม{" "}
                  {period.shares
                    .reduce((s, x) => s + x.ratioPercent, 0)
                    .toFixed(2)}
                  %
                </p>
                {isLead && period.shares.some((s) => !s.confirmed) && (
                  <Button
                    disabled={loading}
                    onClick={() => run(() => confirmContributionShares(period.id))}
                    className="bg-blue-600 text-white"
                  >
                    ยืนยันสัดส่วนรอบนี้
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle>ข้อโต้แย้ง</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {disputes.length === 0 ? (
            <p className="text-sm text-muted-foreground">ไม่มีข้อโต้แย้ง</p>
          ) : (
            disputes.map((d) => (
              <div key={d.id} className="rounded-md border p-3 text-sm space-y-2">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="font-medium">{d.user.name}</span>
                  <Badge variant="outline">{d.status}</Badge>
                </div>
                <p>{d.reason}</p>
                {isLead && d.status === "PENDING" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={loading}
                      onClick={() => run(() => resolveDispute(d.id, projectId))}
                    >
                      รับเรื่อง / ปิดแล้ว
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={loading}
                      onClick={() => run(() => rejectDispute(d.id, projectId))}
                    >
                      ไม่รับ
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>สรุปผลทีม</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {summaries.length === 0 ? (
            <p className="text-sm text-muted-foreground">ยังไม่มีสรุป</p>
          ) : (
            summaries.map((s) => (
              <div key={s.id} className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">
                  {formatDate(s.periodStart)} – {formatDate(s.periodEnd)}
                </p>
                <p className="mt-2 text-sm">{s.content}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
