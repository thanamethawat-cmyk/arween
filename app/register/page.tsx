import { redirect } from "next/navigation";

/** ไม่มีหน้าสมัครสาธารณะ — ต้องใช้ลิงก์เชิญ */
export default function RegisterPage({
  searchParams,
}: {
  searchParams?: { message?: string };
}) {
  const q = new URLSearchParams({
    error: "invite_required",
    ...(searchParams?.message ? { message: searchParams.message } : {}),
  });
  redirect(`/login?${q.toString()}`);
}
