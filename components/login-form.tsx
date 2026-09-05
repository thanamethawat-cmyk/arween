"use client";

import LoginFormInner from "@/components/login-form-inner";
import { Suspense } from "react";

export default function LoginForm() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Suspense
        fallback={
          <div className="text-sm text-muted-foreground">กำลังโหลด...</div>
        }
      >
        <LoginFormInner />
      </Suspense>
    </div>
  );
}
