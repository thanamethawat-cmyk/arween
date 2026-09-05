"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { EVIDENCE_SOURCE_LABELS } from "@/types/schemas";
import { tryRecordPrivateMessage } from "@/server/collect";
import { useState } from "react";

type Evidence = {
  id: string;
  action: string;
  source: string;
  occurredAt: Date;
  actor: { id: string; name: string; email: string };
};

export function EvidenceClient({
  evidence,
  projectId,
  userId,
}: {
  evidence: Evidence[];
  projectId: string;
  userId: string;
}) {
  const [testResult, setTestResult] = useState<string | null>(null);

  async function testPrivateBlock() {
    const result = await tryRecordPrivateMessage(projectId, userId);
    setTestResult(result.message);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>บันทึกหลักฐาน ({evidence.length} รายการ)</CardTitle>
          <p className="text-sm text-muted-foreground">
            ใครทำอะไร เมื่อไหร่ — เก็บเฉพาะพื้นที่โปรเจกต์ส่วนรวม
          </p>
        </CardHeader>
        <CardContent>
          {evidence.length === 0 ? (
            <p className="text-sm text-muted-foreground">ยังไม่มีหลักฐาน</p>
          ) : (
            <ul className="space-y-4">
              {evidence.map((item) => (
                <li
                  key={item.id}
                  className="rounded-md border border-border p-4"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="font-medium">{item.actor.name}</span>
                    <Badge variant="secondary">
                      {EVIDENCE_SOURCE_LABELS[item.source] ?? item.source}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatDateTime(item.occurredAt)}
                    </span>
                  </div>
                  <p className="text-sm">{item.action}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">ทดสอบ: ห้ามข้อความส่วนตัว</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            ระบบต้องปฏิเสธข้อความส่วนตัวตั้งแต่ฝั่งเซิร์ฟเวอร์
          </p>
          <Button variant="outline" onClick={testPrivateBlock}>
            ทดสอบการปฏิเสธข้อความส่วนตัว
          </Button>
          {testResult && (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {testResult}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
