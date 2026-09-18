import { Suspense } from "react";
import { getUserProjects } from "./actions";
import { ProjectsClient } from "./_components/ProjectsClient";
import { ProjectsSkeleton } from "./_components/ProjectsSkeleton";

export default function ProjectsPage() {
  return (
    <Suspense fallback={<ProjectsSkeleton />}>
      <ProjectsSection />
    </Suspense>
  );
}

async function ProjectsSection() {
  const projects = await getUserProjects();
  return <ProjectsClient initialProjects={projects} />;
}