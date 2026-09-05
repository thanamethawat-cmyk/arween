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
import { Badge } from "@/components/ui/badge";
import { createProjectInvite } from "@/server/invite";
import { formatDateTime } from "@/lib/utils";

type Invite = {
  id: string;
  token: string;
  email: string;
  role: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  createdAt: Date;
};

export function InviteManager({
  projectId,
  invites: initialInvites,
  canInvite,
}: {
  projectId: string;
  invites: Invite[];
  canInvite: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [lastLink, setLastLink] = useState("");

  if (!canInvite) {
    return null;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const invite = await createProjectInvite({
        projectId,
        email,
      });
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const link = `${origin}/invite/${invite.token}`;
      setLastLink(link);
      setMessage(`สร้างลิงก์เชิญสำหรับ ${invite.email} แล้ว`);
      setEmail("");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "สร้างลิงก์เชิญไม่สำเร็จ"
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyLink(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      setMessage("คัดลอกลิงก์แล้ว");
    } catch {
      setError("คัดลอกไม่สำเร็จ — คัดลอกจากช่องด้านล่างด้วยตนเอง");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>เชิญสมาชิก</CardTitle>
        <p className="text-sm text-muted-foreground">
          ส่งลิงก์ให้พนักงาน แล้วให้เข้าด้วยบัญชี Google องค์กร
          ลิงก์ใช้ได้ 7 วัน และใช้ได้ครั้งเดียว
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleCreate} className="flex flex-col gap-3 sm:flex-row">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="อีเมลบริษัทของพนักงาน"
            required
            className="flex-1"
          />
          <Button type="submit" disabled={loading}>
            {loading ? "กำลังสร้าง..." : "สร้างลิงก์เชิญ"}
          </Button>
        </form>

        {message && (
          <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
            {message}
          </p>
        )}
        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {lastLink && (
          <div className="space-y-2 rounded-md border border-border p-3">
            <p className="text-sm font-medium">ลิงก์ล่าสุด</p>
            <Input readOnly value={lastLink} />
            <Button
              type="button"
              variant="outline"
              onClick={() => copyLink(lastLink)}
            >
              คัดลอกลิงก์
            </Button>
          </div>
        )}

        {initialInvites.length > 0 && (
          <ul className="space-y-2 border-t border-border pt-4">
            {initialInvites.map((invite) => {
              const link =
                typeof window !== "undefined"
                  ? `${window.location.origin}/invite/${invite.token}`
                  : `/invite/${invite.token}`;
              return (
                <li
                  key={invite.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{invite.email}</p>
                    <p className="text-xs text-muted-foreground">
                      หมดอายุ {formatDateTime(invite.expiresAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {invite.acceptedAt ? (
                      <Badge variant="success">เข้าร่วมแล้ว</Badge>
                    ) : invite.expiresAt < new Date() ? (
                      <Badge variant="warning">หมดอายุ</Badge>
                    ) : (
                      <>
                        <Badge variant="secondary">รอตอบรับ</Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-8 px-2 text-xs"
                          onClick={() =>
                            copyLink(
                              `${window.location.origin}/invite/${invite.token}`
                            )
                          }
                        >
                          คัดลอก
                        </Button>
                      </>
                    )}
                  </div>
                  {/* suppress unused for SSR */}
                  <span className="hidden">{link}</span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
