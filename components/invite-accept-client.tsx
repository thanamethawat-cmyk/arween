"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { setInviteCookie } from "@/server/invite-cookie";

export function InviteAcceptClient({
  token,
  projectId,
  invitedEmail,
  googleEnabled,
}: {
  token: string;
  projectId: string;
  invitedEmail: string;
  googleEnabled: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAccept() {
    setLoading(true);
    setError("");
    try {
      await setInviteCookie(token);
      if (!googleEnabled) {
        setError(
          "ยังไม่ได้ตั้งค่า Google OAuth (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET) — ตั้งค่าใน .env แล้วรีสตาร์ทเซิร์ฟเวอร์"
        );
        setLoading(false);
        return;
      }
      await signIn("google", {
        callbackUrl: `/projects/${projectId}`,
      });
    } catch {
      setError("ไม่สามารถเริ่มเข้าสู่ระบบได้ กรุณาลองใหม่");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        กดปุ่มด้านล่าง แล้วเข้าด้วยบัญชี Google ที่ใช้อีเมล{" "}
        <span className="font-medium text-foreground">{invitedEmail}</span>
      </p>
      <Button
        className="w-full"
        disabled={loading}
        onClick={handleAccept}
      >
        {loading ? "กำลังเปิด Google..." : "เข้าด้วยบัญชี Google องค์กร"}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
