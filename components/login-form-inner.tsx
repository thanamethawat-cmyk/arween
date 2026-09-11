"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function errorMessage(code: string | null): string {
  switch (code) {
    case "invite_required":
      return "ต้องได้รับลิงก์เชิญจากหัวหน้าก่อน จึงจะเข้าสู่ระบบด้วย Google ได้";
    case "CredentialsSignin":
      return "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
    case "missing_email":
      return "บัญชี Google ไม่มีอีเมล";
    case "invite_invalid":
      return "ลิงก์เชิญไม่ถูกต้องหรือหมดอายุ";
    default:
      return code ? `เข้าสู่ระบบไม่สำเร็จ (${code})` : "";
  }
}

export default function LoginFormInner({
  googleEnabled = false,
}: {
  googleEnabled?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(
    errorMessage(searchParams.get("error"))
  );

  const handleGoogleSignIn = async () => {
    if (!googleEnabled) {
      setError("ยังไม่ได้ตั้งค่า Google OAuth (GOOGLE_CLIENT_ID / SECRET)");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch {
      setError("เข้าสู่ระบบด้วย Google ไม่สำเร็จ");
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
      if (result?.error) {
        setError(errorMessage(result.error) || "เข้าสู่ระบบไม่สำเร็จ");
        setLoading(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-xl border-border/80 bg-background/95 backdrop-blur">
      <CardHeader className="text-center space-y-2">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-xl shadow-lg shadow-blue-500/30">
          A
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
          ARWEEN
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          แพลตฟอร์มบริหารผลงานแบบ Outcome-Driven
          <br />
          <span className="text-xs text-muted-foreground/80">
            สมาชิกทั่วไปเข้าด้วย Google ผ่านลิงก์เชิญเท่านั้น
          </span>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {googleEnabled ? (
          <Button
            type="button"
            variant="outline"
            className="w-full py-5 font-medium flex items-center justify-center gap-3 border-border hover:bg-muted transition-colors"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            เข้าสู่ระบบด้วย Google
          </Button>
        ) : (
          <p className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground text-center">
            ปุ่ม Google ยังไม่พร้อม — ตั้งค่า GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
            ใน .env (สมาชิกเข้าผ่านลิงก์เชิญเมื่อตั้งค่าแล้ว)
          </p>
        )}

        <div className="relative flex items-center justify-center my-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <span className="relative bg-background px-2 text-xs uppercase text-muted-foreground">
            หรือแอดมิน / บัญชีสาธิต
          </span>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">อีเมล</label>
            <Input
              type="email"
              placeholder="lead@arween.demo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">รหัสผ่าน</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full py-5 bg-blue-600 hover:bg-blue-700 font-semibold text-white shadow"
            disabled={loading}
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบด้วยอีเมล"}
          </Button>
        </form>

        <p className="text-center text-[11px] text-muted-foreground pt-1">
          ระบบไม่เปิดให้สมัครบัญชีสาธารณะ — ขอลิงก์เชิญจากหัวหน้าโปรเจกต์
        </p>
      </CardContent>
    </Card>
  );
}
