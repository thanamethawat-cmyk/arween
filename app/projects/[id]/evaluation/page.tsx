import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEvaluationData, flagStaleDisputes } from "@/server/evaluate";
import { ProjectNav } from "@/components/project-nav";
import { EvaluationClient } from "@/components/evaluation-client";
import { EvaluationHeader } from "@/components/evaluation/evaluation-header";

export default async function EvaluationPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const { id } = await Promise.resolve(params);
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) notFound();

  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: { projectId: id, userId: session.user.id },
    },
  });
  if (!membership) redirect("/");

  const isLead =
    membership.role === "lead" ||
    session.user.role === "ADMIN" ||
    session.user.role === "LEAD";

  await flagStaleDisputes(id);
  const data = await getEvaluationData(id);

  return (
    <div className="min-h-screen bg-muted/20">
      <EvaluationHeader
        projectId={id}
        projectName={project.name}
        isLead={isLead}
      />

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        <ProjectNav projectId={id} />
        <EvaluationClient
          projectId={id}
          currentUserId={session.user.id}
          isLead={isLead}
          scores={data.scores}
          summaries={data.summaries}
          disputes={data.disputes}
          members={data.members}
          periods={data.periods}
          auditLogs={data.auditLogs}
        />
      </main>
    </div>
  );
}
