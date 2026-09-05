"use client";

import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { NOTIFICATION_TYPE_LABELS } from "@/types/schemas";
import {
  markNotificationRead,
  seedWeeklyDigest,
  createGamingFlag,
} from "@/server/notify";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: Date;
};

const TYPE_ORDER = ["WEEKLY_DIGEST", "GAMING_FLAG", "DISPUTE_PENDING"];

export function NotificationsClient({
  notifications,
  projectId,
}: {
  notifications: Notification[];
  projectId: string;
}) {
  const router = useRouter();

  const grouped = TYPE_ORDER.map((type) => ({
    type,
    label: NOTIFICATION_TYPE_LABELS[type] ?? type,
    items: notifications.filter((n) => n.type === type),
  }));

  async function handleMarkRead(id: string) {
    await markNotificationRead(id, projectId);
    router.refresh();
  }

  async function handleSeedDigest() {
    await seedWeeklyDigest(projectId);
    router.refresh();
  }

  async function handleGamingFlag() {
    await createGamingFlag(
      projectId,
      'ตัวอย่าง: พบข้อความ "รับทราบครับ" ซ้ำหลายครั้งในวันเดียว'
    );
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={handleSeedDigest}>
          สร้างสรุปงานรายสัปดาห์
        </Button>
        <Button variant="outline" onClick={handleGamingFlag}>
          สร้างสัญญาณปั่นคะแนน (ตัวอย่าง)
        </Button>
      </div>

      {grouped.map(({ type, label, items }) => (
        <Card key={type}>
          <CardHeader>
            <CardTitle className="text-base">{label}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {items.length} รายการ
            </p>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">ยังไม่มีรายการ</p>
            ) : (
              <ul className="space-y-3">
                {items.map((n) => (
                  <li
                    key={n.id}
                    className={`rounded-md border p-3 ${
                      n.read ? "opacity-60" : "border-primary/30"
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="font-medium">{n.title}</span>
                      {!n.read && (
                        <Badge variant="default">ยังไม่ได้อ่าน</Badge>
                      )}
                    </div>
                    <p className="text-sm">{n.body}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatDateTime(n.createdAt)}
                    </p>
                    {!n.read && (
                      <Button
                        variant="ghost"
                        className="mt-2 h-8 px-2 text-xs"
                        onClick={() => handleMarkRead(n.id)}
                      >
                        ทำเครื่องหมายว่าอ่านแล้ว
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
