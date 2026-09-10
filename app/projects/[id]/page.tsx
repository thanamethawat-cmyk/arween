import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getProjectForUser } from "@/server/projects";
import { listProjectInvites } from "@/server/invite";
import { ProjectNav } from "@/components/project-nav";
import { ProjectWorkspaceClient } from "@/components/project-workspace-client";
import { SignOutButton } from "@/components/sign-out-button";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const resolved = await Promise.resolve(params);
  const { id } = resolved;

  let data;
  try {
    data = await getProjectForUser(id);
  } catch {
    notFound();
  }

  const { project, isLead } = data;
  const invites = isLead ? await listProjectInvites(id) : [];
  const recentEvidence = await prisma.evidenceEvent.findMany({
    where: { projectId: id },
    orderBy: { occurredAt: "desc" },
    take: 10,
    include: { actor: { select: { name: true } } },
  });

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <Link href="/" className="text-sm text-primary hover:underline">
              ← กลับรายการโปรเจกต์
            </Link>
            <h1 className="mt-2 text-xl font-bold">{project.name}</h1>
            <p className="text-sm text-muted-foreground">
              พื้นที่ทีมส่วนรวม — ประเมินตามเป้าหมายโปรเจกต์
            </p>
          </div>
          <SignOutButton />
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        <ProjectNav projectId={id} />
        <ProjectWorkspaceClient
          projectId={id}
          projectName={project.name}
          description={project.description}
          progressPercent={project.progressPercent}
          isLead={isLead}
          members={project.members}
          objectives={project.objectives}
          recentEvidence={recentEvidence}
          invites={invites}
        />
      </main>
    </div>
  );
}
