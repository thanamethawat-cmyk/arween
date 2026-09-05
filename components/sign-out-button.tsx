"use client";

import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <Button variant="outline" size="sm" onClick={handleSignOut}>
      ออกจากระบบ
    </Button>
  );
}
