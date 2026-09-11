import LoginFormInner from "@/components/login-form-inner";
import { Suspense } from "react";
import { isGoogleAuthConfigured } from "@/lib/auth";

export default function LoginPage() {
  const googleEnabled = isGoogleAuthConfigured();

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Suspense
        fallback={
          <div className="text-sm text-muted-foreground">กำลังโหลด...</div>
        }
      >
        <LoginFormInner googleEnabled={googleEnabled} />
      </Suspense>
    </div>
  );
}
