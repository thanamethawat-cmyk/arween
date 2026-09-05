import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEvaluationData } from "@/server/evaluate";
import { ProjectNav } from "@/components/project-nav";
import { EvaluationClient } from "@/components/evaluation-client";
import Link from "next/link";

export default async function EvaluationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) notFound();

  const data = await getEvaluationData(id);

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b border-border bg-background">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <Link href="/" className="text-sm text-primary hover:underline">
            ← กลับรายการโปรเจกต์
          </Link>
          <h1 className="mt-2 text-xl font-bold">{project.name}</h1>
          <p className="text-sm text-muted-foreground">
            ประเมินแบบเป็นกลาง — ยังไม่เรียก Gemini ในขั้นนี้
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        <ProjectNav projectId={id} />
        <EvaluationClient
          projectId={id}
          currentUserId={session.user.id}
          scores={data.scores}
          summaries={data.summaries}
          disputes={data.disputes}
          members={data.members}
        />
      </main>
    </div>
  );
}
