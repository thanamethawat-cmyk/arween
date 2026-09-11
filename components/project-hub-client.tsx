"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  createWorkItem,
  updateWorkItem,
  addDocument,
} from "@/server/facilitate";
import { addComment } from "@/server/collect";
import { WORK_ITEM_STATUS_LABELS } from "@/types/schemas";

type WorkItem = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  assigneeId: string | null;
};

type Document = {
  id: string;
  title: string;
  url: string;
};

type Member = {
  userId: string;
  name: string;
};

const GOOGLE_TYPES = [
  { value: "docs", label: "Google Docs", hint: "docs.google.com" },
  { value: "sheets", label: "Google Sheets", hint: "sheets.google.com" },
  { value: "slides", label: "Google Slides", hint: "slides.google.com" },
  { value: "drive", label: "Google Drive", hint: "drive.google.com" },
  { value: "meet", label: "Google Meet", hint: "meet.google.com" },
  { value: "other", label: "ลิงก์อื่น", hint: "https://" },
] as const;

function detectGoogleLabel(url: string): string {
  if (url.includes("docs.google.com")) return "Docs";
  if (url.includes("sheets.google.com")) return "Sheets";
  if (url.includes("slides.google.com")) return "Slides";
  if (url.includes("drive.google.com")) return "Drive";
  if (url.includes("meet.google.com")) return "Meet";
  return "ลิงก์";
}

export function ProjectHubClient({
  projectId,
  userId,
  workItems,
  documents,
  evidenceCount,
  members,
}: {
  projectId: string;
  userId: string;
  workItems: WorkItem[];
  documents: Document[];
  evidenceCount: number;
  members: Member[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [toolType, setToolType] =
    useState<(typeof GOOGLE_TYPES)[number]["value"]>("docs");

  async function run(fn: () => Promise<unknown>, okMessage?: string) {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      await fn();
      if (okMessage) setMessage(okMessage);
      router.refresh();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "ดำเนินการไม่สำเร็จ");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateWork(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const ok = await run(
      () =>
        createWorkItem({
          projectId,
          actorId: userId,
          title: data.get("title") as string,
          description: (data.get("description") as string) || undefined,
          assigneeId: (data.get("assigneeId") as string) || null,
        }),
      "สร้างงานและบันทึกหลักฐานแล้ว"
    );
    if (ok) form.reset();
  }

  async function handleStatusChange(workItemId: string, status: string) {
    await run(() =>
      updateWorkItem({
        id: workItemId,
        projectId,
        actorId: userId,
        status: status as "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED",
      })
    );
  }

  async function handleAssigneeChange(workItemId: string, assigneeId: string) {
    await run(() =>
      updateWorkItem({
        id: workItemId,
        projectId,
        actorId: userId,
        assigneeId: assigneeId || null,
      })
    );
  }

  function memberName(id: string | null) {
    if (!id) return "ยังไม่มอบหมาย";
    return members.find((m) => m.userId === id)?.name || "สมาชิก";
  }

  async function handleAddDocument(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const title = String(data.get("docTitle") || "");
    const url = String(data.get("docUrl") || "");
    const typeLabel = GOOGLE_TYPES.find((t) => t.value === toolType)?.label;
    const ok = await run(
      () =>
        addDocument({
          projectId,
          actorId: userId,
          title: typeLabel && toolType !== "other" ? `[${typeLabel}] ${title}` : title,
          url,
        }),
      "เพิ่มลิงก์เอกสารแล้ว"
    );
    if (ok) form.reset();
  }

  async function handleComment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const ok = await run(
      () =>
        addComment({
          projectId,
          actorId: userId,
          content: data.get("comment") as string,
        }),
      "บันทึกความเห็นเป็นหลักฐานแล้ว"
    );
    if (ok) form.reset();
  }

  return (
    <div className="space-y-6">
      {message && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">หลักฐานทั้งหมด</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{evidenceCount}</p>
            <p className="text-sm text-muted-foreground">รายการในโปรเจกต์นี้</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">งาน</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{workItems.length}</p>
            <p className="text-sm text-muted-foreground">รายการ WorkItem</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">เอกสาร / Google</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{documents.length}</p>
            <p className="text-sm text-muted-foreground">ลิงก์ที่ผูกโปรเจกต์</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>สถานะงาน (WorkItem)</CardTitle>
          <CardDescription>
            งานในพื้นที่ทีมส่วนรวม — การสร้าง/เปลี่ยนสถานะถูกบันทึกเป็นหลักฐาน
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {workItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">ยังไม่มีงาน</p>
          ) : (
            <ul className="space-y-3">
              {workItems.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3"
                >
                  <div>
                    <p className="font-medium">{item.title}</p>
                    {item.description && (
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      ผู้รับผิดชอบ: {memberName(item.assigneeId)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">
                      {WORK_ITEM_STATUS_LABELS[item.status] ?? item.status}
                    </Badge>
                    <select
                      className="rounded border border-border px-2 py-1 text-sm"
                      value={item.status}
                      disabled={loading}
                      onChange={(e) =>
                        handleStatusChange(item.id, e.target.value)
                      }
                    >
                      {Object.entries(WORK_ITEM_STATUS_LABELS).map(
                        ([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        )
                      )}
                    </select>
                    <select
                      className="rounded border border-border px-2 py-1 text-sm"
                      value={item.assigneeId || ""}
                      disabled={loading}
                      onChange={(e) =>
                        handleAssigneeChange(item.id, e.target.value)
                      }
                    >
                      <option value="">ยังไม่มอบหมาย</option>
                      {members.map((m) => (
                        <option key={m.userId} value={m.userId}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={handleCreateWork} className="space-y-3 border-t pt-4">
            <p className="text-sm font-medium">เพิ่มงานใหม่</p>
            <Input name="title" placeholder="ชื่องาน" required />
            <Textarea name="description" placeholder="รายละเอียด (ไม่บังคับ)" />
            <select
              name="assigneeId"
              className="w-full rounded border border-border px-2 py-2 text-sm"
              defaultValue=""
            >
              <option value="">ยังไม่มอบหมาย</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.name}
                </option>
              ))}
            </select>
            <Button type="submit" disabled={loading} className="bg-blue-600 text-white">
              สร้างงาน
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>เอกสารและลิงก์ Google Workspace</CardTitle>
          <CardDescription>
            ผูก Docs / Sheets / Slides / Drive / Meet เข้าโปรเจกต์ทีม (เปิดในแท็บใหม่)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">ยังไม่มีเอกสาร</p>
          ) : (
            <ul className="space-y-2">
              {documents.map((doc) => (
                <li
                  key={doc.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2"
                >
                  <a
                    href={doc.url}
                    className="text-sm text-primary hover:underline font-medium"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {doc.title}
                  </a>
                  <Badge variant="outline">{detectGoogleLabel(doc.url)}</Badge>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={handleAddDocument} className="space-y-3 border-t pt-4">
            <p className="text-sm font-medium">เพิ่มลิงก์เอกสาร</p>
            <select
              className="w-full rounded-md border border-border px-3 py-2 text-sm"
              value={toolType}
              onChange={(e) =>
                setToolType(e.target.value as typeof toolType)
              }
            >
              {GOOGLE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <Input name="docTitle" placeholder="ชื่อเอกสาร / ห้องประชุม" required />
            <Input
              name="docUrl"
              type="url"
              placeholder={
                GOOGLE_TYPES.find((t) => t.value === toolType)?.hint ||
                "https://..."
              }
              required
            />
            <Button type="submit" disabled={loading} variant="outline">
              เพิ่มลิงก์
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>เขียนความเห็นในโปรเจกต์</CardTitle>
          <CardDescription>
            ความเห็นในพื้นที่ส่วนรวมจะถูกบันทึกเป็นหลักฐาน — ข้อความส่วนตัวไม่รับ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleComment} className="space-y-3">
            <Textarea
              name="comment"
              placeholder="เขียนความเห็นหรือรายงานงานที่ทำ..."
              required
            />
            <Button type="submit" disabled={loading}>
              บันทึกความเห็น
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
