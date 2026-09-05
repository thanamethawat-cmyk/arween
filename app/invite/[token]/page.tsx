import Link from "next/link";
import { getInviteByToken } from "@/server/invite";
import { isGoogleAuthConfigured } from "@/lib/auth";
import { formatDateTime } from "@/lib/utils";
import { InviteAcceptClient } from "@/components/invite-accept-client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const ERROR_TEXT: Record<string, string> = {
  email_mismatch:
    "อีเมลจากบัญชี Google ไม่ตรงกับอีเมลในคำเชิญ กรุณาใช้บัญชีที่ถูกเชิญ",
  expired: "ลิงก์เชิญนี้หมดอายุแล้ว",
  accepted: "ลิงก์เชิญนี้ถูกใช้ไปแล้ว",
  not_found: "ไม่พบลิงก์เชิญ",
};

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }> | { token: string };
  searchParams: Promise<{ error?: string }> | { error?: string };
}) {
  const resolvedParams = await Promise.resolve(params);
  const resolvedSearch = await Promise.resolve(searchParams);
  const token = resolvedParams.token;
  const lookup = await getInviteByToken(token);
  const googleEnabled = isGoogleAuthConfigured();
  const errorKey = resolvedSearch.error;
  const errorMessage = errorKey ? ERROR_TEXT[errorKey] ?? errorKey : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>ลิงก์เชิญเข้าโปรเจกต์</CardTitle>
          <p className="text-sm text-muted-foreground">
            ยืนยันตัวตนด้วยบัญชี Google องค์กรเพื่อเข้าร่วมทีม
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorMessage && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </p>
          )}

          {!lookup.ok ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {lookup.reason === "not_found" && "ไม่พบลิงก์เชิญนี้"}
                {lookup.reason === "expired" &&
                  "ลิงก์เชิญหมดอายุแล้ว ขอให้หัวหน้าส่งลิงก์ใหม่"}
                {lookup.reason === "accepted" &&
                  "ลิงก์นี้ถูกใช้ไปแล้ว หากเคยเข้าร่วมแล้ว ให้เข้าสู่ระบบตามปกติ"}
              </p>
              <Link href="/login" className="text-sm text-primary hover:underline">
                ไปหน้าเข้าสู่ระบบ
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border border-border p-4">
                <p className="text-sm text-muted-foreground">โปรเจกต์</p>
                <p className="text-lg font-semibold">{lookup.invite.project.name}</p>
                {lookup.invite.project.description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {lookup.invite.project.description}
                  </p>
                )}
              </div>
              <div className="grid gap-2 text-sm">
                <p>
                  <span className="text-muted-foreground">เชิญอีเมล:</span>{" "}
                  <span className="font-medium">{lookup.invite.email}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">หมดอายุ:</span>{" "}
                  {formatDateTime(lookup.invite.expiresAt)}
                </p>
                <p>
                  <span className="text-muted-foreground">บทบาท:</span>{" "}
                  {lookup.invite.role === "lead" ? "หัวหน้าโปรเจกต์" : "สมาชิก"}
                </p>
              </div>

              <InviteAcceptClient
                token={token}
                projectId={lookup.invite.project.id}
                invitedEmail={lookup.invite.email}
                googleEnabled={googleEnabled}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
