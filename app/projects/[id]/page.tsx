import { ProjectViewClient } from "@/components/project-view-client";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProjectViewClient projectId={id} />;
}
