"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { translateFirebaseError } from "@/lib/firebase-errors";

export function SignOutButton() {
  const { logout } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setError("");
    setLoading(true);
    try {
      await logout();
      router.push("/login");
    } catch (err: unknown) {
      setError(
        translateFirebaseError(err, "ออกจากระบบไม่สำเร็จ กรุณาลองใหม่")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="outline"
        size="sm"
        onClick={handleSignOut}
        disabled={loading}
      >
        {loading ? "กำลังออก..." : "ออกจากระบบ"}
      </Button>
      {error && (
        <p className="max-w-[220px] text-right text-[11px] text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
