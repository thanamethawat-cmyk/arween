import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listMyProjects } from "@/server/projects";
import { HomeClient } from "@/components/home-client";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const projects = await listMyProjects();

  return (
    <HomeClient
      userName={session.user.name || session.user.email || "ผู้ใช้"}
      userEmail={session.user.email || ""}
      projects={projects.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        status: p.status,
        progressPercent: p.progressPercent,
        memberCount: p.memberCount,
        myRole: p.myRole,
      }))}
    />
  );
}
