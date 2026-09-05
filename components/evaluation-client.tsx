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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import {
  saveScore,
  confirmScore,
  saveTeamSummary,
  createDispute,
  getScoreTemplateHint,
} from "@/server/evaluate";

type Score = {
  id: string;
  value: number;
  reason: string;
  confirmed: boolean;
  user: { id: string; name: string };
  evidenceEvent: { action: string } | null;
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
  user: { name: string };
};

type Member = {
  user: { id: string; name: string };
};

export function EvaluationClient({
  projectId,
  currentUserId,
  scores,
  summaries,
  disputes,
  members,
}: {
  projectId: string;
  currentUserId: string;
  scores: Score[];
  summaries: Summary[];
  disputes: Dispute[];
  members: Member[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState<{ suggestedValue: number; reason: string } | null>(null);

  async function handleSaveScore(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    await saveScore({
      projectId,
      userId: form.get("userId") as string,
      value: Number(form.get("value")),
      reason: form.get("reason") as string,
    });
    setLoading(false);
    router.refresh();
    e.currentTarget.reset();
  }

  async function handleSaveSummary(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    await saveTeamSummary({
      projectId,
      content: form.get("summary") as string,
      periodStart: weekAgo,
      periodEnd: now,
    });
    setLoading(false);
    router.refresh();
    e.currentTarget.reset();
  }

  async function handleDispute(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    await createDispute({
      projectId,
      userId: currentUserId,
      reason: form.get("disputeReason") as string,
    });
    setLoading(false);
    router.refresh();
    e.currentTarget.reset();
  }

  async function handleGetHint() {
    const action = (
      document.getElementById("hint-action") as HTMLInputElement
    )?.value;
    if (!action) return;
    const result = await getScoreTemplateHint(action);
    setHint(result);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>คะแนนรายคน</CardTitle>
          <p className="text-sm text-muted-foreground">
            0–10 ตามผลกระทบต่องาน พร้อมเหตุผลอ้างหลักฐาน — หัวหน้ายืนยันก่อนใช้
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {scores.length === 0 ? (
            <p className="text-sm text-muted-foreground">ยังไม่มีคะแนน</p>
          ) : (
            <ul className="space-y-3">
              {scores.map((s) => (
                <li key={s.id} className="rounded-md border border-border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{s.user.name}</span>
                    <Badge variant="success">{s.value}/10</Badge>
                    {s.confirmed ? (
                      <Badge variant="secondary">ยืนยันแล้ว</Badge>
                    ) : (
                      <Button
                        variant="outline"
                        className="h-7 px-2 text-xs"
                        onClick={async () => {
                          await confirmScore(s.id, projectId);
                          router.refresh();
                        }}
                      >
                        หัวหน้ายืนยัน
                      </Button>
                    )}
                  </div>
                  <p className="mt-2 text-sm">{s.reason}</p>
                  {s.evidenceEvent && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      หลักฐาน: {s.evidenceEvent.action}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={handleSaveScore} className="space-y-3 border-t pt-4">
            <p className="text-sm font-medium">เพิ่มคะแนน (กรอกด้วยตนเอง)</p>
            <select
              name="userId"
              className="w-full rounded-md border border-border px-3 py-2 text-sm"
              required
            >
              <option value="">เลือกสมาชิก</option>
              {members.map((m) => (
                <option key={m.user.id} value={m.user.id}>
                  {m.user.name}
                </option>
              ))}
            </select>
            <Input
              name="value"
              type="number"
              min={0}
              max={10}
              placeholder="คะแนน 0–10"
              required
            />
            <Textarea name="reason" placeholder="เหตุผล อ้างหลักฐาน" required />
            <Button type="submit" disabled={loading}>
              บันทึกคะแนน
            </Button>
          </form>

          <div className="space-y-2 border-t pt-4">
            <p className="text-sm font-medium">ตัวช่วยจากเกณฑ์ในเอกสาร (ยังไม่เรียก AI)</p>
            <Input id="hint-action" placeholder="พิมพ์ตัวอย่างข้อความงาน..." />
            <Button type="button" variant="outline" onClick={handleGetHint}>
              ดูคำแนะนำคะแนน
            </Button>
            {hint && (
              <p className="rounded-md bg-muted px-3 py-2 text-sm">
                แนะนำ {hint.suggestedValue}/10 — {hint.reason}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>สรุปผลงานทั้งทีม</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {summaries.length === 0 ? (
            <p className="text-sm text-muted-foreground">ยังไม่มีสรุป</p>
          ) : (
            summaries.map((s) => (
              <div key={s.id} className="rounded-md border border-border p-3">
                <p className="text-xs text-muted-foreground">
                  {formatDate(s.periodStart)} – {formatDate(s.periodEnd)}
                </p>
                <p className="mt-2 text-sm">{s.content}</p>
              </div>
            ))
          )}
          <form onSubmit={handleSaveSummary} className="space-y-3 border-t pt-4">
            <Textarea
              name="summary"
              placeholder="สรุปสิ่งที่ทีมทำสำเร็จ ปัญหาที่ค้าง..."
              required
            />
            <Button type="submit" disabled={loading} variant="outline">
              บันทึกสรุปผลทีม
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ข้อโต้แย้งที่ยังไม่ปิด</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {disputes.length === 0 ? (
            <p className="text-sm text-muted-foreground">ไม่มีข้อโต้แย้งค้าง</p>
          ) : (
            <ul className="space-y-2">
              {disputes.map((d) => (
                <li key={d.id} className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm">
                  <span className="font-medium">{d.user.name}:</span> {d.reason}
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={handleDispute} className="space-y-3 border-t pt-4">
            <Textarea
              name="disputeReason"
              placeholder="เหตุผลที่ไม่เห็นด้วยกับคะแนน..."
              required
            />
            <Button type="submit" disabled={loading} variant="outline">
              ยื่นข้อโต้แย้ง
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
