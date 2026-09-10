"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitDailyLog } from "@/server/daily-log";
import { InviteManager } from "@/components/invite-manager";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ANCHOR_STATUS_LABELS } from "@/types/schemas";
import { formatDateTime } from "@/lib/utils";

type Member = {
  role: string;
  user: { id: string; name: string; email: string };
};

type Objective = {
  id: string;
  name: string;
  weight: number;
  milestones: {
    id: string;
    name: string;
    weight: number;
    status: string;
    kpis: { id: string; name: string; weight: number; status: string }[];
  }[];
};

type Evidence = {
  id: string;
  action: string;
  occurredAt: Date;
  actor: { name: string };
};

type Invite = {
  id: string;
  token: string;
  email: string;
  role: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  createdAt: Date;
};

export function ProjectWorkspaceClient({
  projectId,
  projectName,
  description,
  progressPercent,
  isLead,
  members,
  objectives,
  recentEvidence,
  invites,
}: {
  projectId: string;
  projectName: string;
  description: string | null;
  progressPercent: number;
  isLead: boolean;
  members: Member[];
  objectives: Objective[];
  recentEvidence: Evidence[];
  invites: Invite[];
}) {
  const router = useRouter();
  const [action, setAction] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const result = await submitDailyLog({ projectId, action });
      setAction("");
      setMessage(
        `บันทึกแล้ว — Impact Score ${result.score.value}/10` +
          (result.agent1.usedGemini ? " (Gemini)" : " (โหมดสำรอง)") +
          (result.score.flagged ? " · ถูกตั้งธงตรวจสอบ" : " · รอหัวหน้ายืนยัน")
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{projectName}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm font-semibold">
            <span>ความคืบหน้าจากน้ำหนักแผนงาน</span>
            <span className="text-blue-600">{progressPercent}%</span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full"
              style={{ width: `${Math.min(100, progressPercent)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            คิดจาก Milestone/KPI ที่สถานะสำเร็จแล้ว — ไม่นับจำนวนบันทึกรายวัน
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">สมาชิกทีม</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {members.map((m) => (
              <div
                key={m.user.id}
                className="flex items-center justify-between text-sm border-b border-border/60 py-2"
              >
                <div>
                  <p className="font-medium">{m.user.name}</p>
                  <p className="text-xs text-muted-foreground">{m.user.email}</p>
                </div>
                <Badge variant="outline">
                  {m.role === "lead" ? "หัวหน้า" : "สมาชิก"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <InviteManager projectId={projectId} invites={invites} canInvite={isLead} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <a
          href={`/projects/${projectId}/hub`}
          className="rounded-lg border bg-background px-4 py-3 text-sm hover:border-blue-400 transition-colors"
        >
          <p className="font-semibold">งานและเอกสาร</p>
          <p className="text-xs text-muted-foreground mt-1">
            WorkItem + ลิงก์ Google Workspace
          </p>
        </a>
        <a
          href={`/projects/${projectId}/chat`}
          className="rounded-lg border bg-background px-4 py-3 text-sm hover:border-blue-400 transition-colors"
        >
          <p className="font-semibold">แชท AI</p>
          <p className="text-xs text-muted-foreground mt-1">
            ถาม-ตอบในบริบทโปรเจกต์นี้
          </p>
        </a>
        <a
          href={`/projects/${projectId}/evaluation`}
          className="rounded-lg border bg-background px-4 py-3 text-sm hover:border-blue-400 transition-colors"
        >
          <p className="font-semibold">ประเมินทีม</p>
          <p className="text-xs text-muted-foreground mt-1">
            ยืนยันคะแนน / สัดส่วน 100%
          </p>
        </a>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">บันทึกงานรายวัน</CardTitle>
          <CardDescription>
            AI จะให้ Impact Score ตามผลต่อ Milestone/KPI — หัวหน้าต้องยืนยันก่อนใช้ในสัดส่วน 100%
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Textarea
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="วันนี้ทำอะไรสำเร็จ / ติดปัญหาอะไร / ผูกกับเป้าหมายใด"
              rows={4}
              required
            />
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            {message && (
              <p className="text-sm text-green-700">{message}</p>
            )}
            <Button type="submit" disabled={loading} className="bg-blue-600 text-white">
              {loading ? "กำลังประเมิน..." : "บันทึกและให้ AI ประเมิน"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">แผนเป้าหมายโดยย่อ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {objectives.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              ยังไม่มีแผน — ไปที่แท็บ &quot;แผนเป้าหมาย&quot; เพื่อตั้ง Objective / Milestone / KPI
            </p>
          ) : (
            objectives.map((obj) => (
              <div key={obj.id} className="rounded-lg border p-3 space-y-2">
                <p className="font-medium text-sm">
                  {obj.name}{" "}
                  <span className="text-muted-foreground">(น้ำหนัก {obj.weight})</span>
                </p>
                {obj.milestones.map((ms) => (
                  <div key={ms.id} className="pl-3 text-xs space-y-1">
                    <p>
                      • {ms.name} — {ANCHOR_STATUS_LABELS[ms.status] || ms.status}{" "}
                      (น้ำหนัก {ms.weight})
                    </p>
                    {ms.kpis.map((k) => (
                      <p key={k.id} className="pl-3 text-muted-foreground">
                        KPI: {k.name} — {ANCHOR_STATUS_LABELS[k.status] || k.status}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">หลักฐานล่าสุด</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {recentEvidence.length === 0 ? (
            <p className="text-sm text-muted-foreground">ยังไม่มีบันทึก</p>
          ) : (
            recentEvidence.map((ev) => (
              <div key={ev.id} className="border-b py-2 text-sm">
                <p className="font-medium">{ev.actor.name}</p>
                <p className="text-muted-foreground">{ev.action}</p>
                <p className="text-[11px] text-muted-foreground">
                  {formatDateTime(ev.occurredAt)}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
