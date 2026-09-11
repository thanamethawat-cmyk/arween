"use client";

import { SessionProvider } from "next-auth/react";

/** UX หลักใช้ NextAuth เท่านั้น — ไม่ห่อ Firebase Auth อีกต่อไป */
export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
