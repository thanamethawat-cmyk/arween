import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { getProjectForUser } from "@/server/projects";
import { getNotificationsByProject } from "@/server/notify";
import { ProjectNav } from "@/components/project-nav";
import { NotificationsClient } from "@/components/notifications-client";

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const { id } = await Promise.resolve(params);

  let data;
  try {
    data = await getProjectForUser(id);
  } catch {
    notFound();
  }

  const notifications = await getNotificationsByProject(id);

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b border-border bg-background">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <Link href="/" className="text-sm text-primary hover:underline">
            ← กลับรายการโปรเจกต์
          </Link>
          <h1 className="mt-2 text-xl font-bold">{data.project.name}</h1>
          <p className="text-sm text-muted-foreground">แจ้งเตือน</p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        <ProjectNav projectId={id} />
        <NotificationsClient notifications={notifications} projectId={id} />
      </main>
    </div>
  );
}
