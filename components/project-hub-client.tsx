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
import {
  createWorkItem,
  updateWorkItem,
  addDocument,
} from "@/server/facilitate";
import { addComment } from "@/server/collect";
import {
  WORK_ITEM_STATUS_LABELS,
} from "@/types/schemas";

type WorkItem = {
  id: string;
  title: string;
  description: string | null;
  status: string;
};

type Document = {
  id: string;
  title: string;
  url: string;
};

export function ProjectHubClient({
  projectId,
  userId,
  workItems,
  documents,
  evidenceCount,
}: {
  projectId: string;
  userId: string;
  workItems: WorkItem[];
  documents: Document[];
  evidenceCount: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleCreateWork(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    await createWorkItem({
      projectId,
      actorId: userId,
      title: form.get("title") as string,
      description: (form.get("description") as string) || undefined,
    });
    setLoading(false);
    setMessage("สร้างงานและบันทึกหลักฐานแล้ว");
    router.refresh();
    e.currentTarget.reset();
  }

  async function handleStatusChange(workItemId: string, status: WorkItem["status"]) {
    setLoading(true);
    const item = workItems.find((w) => w.id === workItemId);
    if (!item) return;
    await updateWorkItem({
      id: workItemId,
      projectId,
      actorId: userId,
      status: status as "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED",
    });
    setLoading(false);
    router.refresh();
  }

  async function handleAddDocument(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    await addDocument({
      projectId,
      actorId: userId,
      title: form.get("docTitle") as string,
      url: form.get("docUrl") as string,
    });
    setLoading(false);
    router.refresh();
    e.currentTarget.reset();
  }

  async function handleComment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    await addComment({
      projectId,
      actorId: userId,
      content: form.get("comment") as string,
    });
    setLoading(false);
    setMessage("บันทึกความเห็นเป็นหลักฐานแล้ว");
    router.refresh();
    e.currentTarget.reset();
  }

  return (
    <div className="space-y-6">
      {message && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
          {message}
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
            <p className="text-sm text-muted-foreground">รายการ</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">เอกสาร</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{documents.length}</p>
            <p className="text-sm text-muted-foreground">ลิงก์ที่ผูกโปรเจกต์</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>สถานะงาน</CardTitle>
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
                  </div>
                  <div className="flex items-center gap-2">
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
                  </div>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={handleCreateWork} className="space-y-3 border-t pt-4">
            <p className="text-sm font-medium">เพิ่มงานใหม่</p>
            <Input name="title" placeholder="ชื่องาน" required />
            <Textarea name="description" placeholder="รายละเอียด (ไม่บังคับ)" />
            <Button type="submit" disabled={loading}>
              สร้างงาน
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>เอกสารที่รวมไว้</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">ยังไม่มีเอกสาร</p>
          ) : (
            <ul className="space-y-2">
              {documents.map((doc) => (
                <li key={doc.id}>
                  <a
                    href={doc.url}
                    className="text-sm text-primary hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {doc.title}
                  </a>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={handleAddDocument} className="space-y-3 border-t pt-4">
            <p className="text-sm font-medium">เพิ่มลิงก์เอกสาร</p>
            <Input name="docTitle" placeholder="ชื่อเอกสาร" required />
            <Input name="docUrl" type="url" placeholder="https://..." required />
            <Button type="submit" disabled={loading} variant="outline">
              เพิ่มเอกสาร
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>เขียนความเห็นในโปรเจกต์</CardTitle>
          <p className="text-sm text-muted-foreground">
            ความเห็นในพื้นที่ส่วนรวมจะถูกบันทึกเป็นหลักฐาน — ข้อความส่วนตัวไม่รับ
          </p>
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
