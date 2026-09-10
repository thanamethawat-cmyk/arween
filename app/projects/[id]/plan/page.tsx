import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { getProjectForUser } from "@/server/projects";
import { listAnchorPlan } from "@/server/anchor";
import { ProjectNav } from "@/components/project-nav";
import { PlanClient } from "@/components/plan-client";

export default async function PlanPage({
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

  const objectives = await listAnchorPlan(id);

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b border-border bg-background">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <Link href="/" className="text-sm text-primary hover:underline">
            ← กลับรายการโปรเจกต์
          </Link>
          <h1 className="mt-2 text-xl font-bold">{data.project.name}</h1>
          <p className="text-sm text-muted-foreground">
            Anchor Framework — ตัวตั้งหลักของการประเมิน
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        <ProjectNav projectId={id} />
        <PlanClient
          projectId={id}
          isLead={data.isLead}
          objectives={objectives}
          progressPercent={data.project.progressPercent}
        />
      </main>
    </div>
  );
}
